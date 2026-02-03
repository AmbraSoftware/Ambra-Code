import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionService } from '../transactions/transactions.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class AsaasWebhookService {
  private readonly logger = new Logger(AsaasWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionService,
    private readonly notificationsService: NotificationService,
  ) {}

  /**
   * [v4.4] Asaas 2026 Date Parser
   * Handles transition from 'dd/MM/yyyy' to 'yyyy-MM-dd' (ISO).
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      // 1. Try ISO (yyyy-MM-dd)
      if (dateStr.includes('-')) {
        return new Date(dateStr);
      }
      // 2. Try BR (dd/MM/yyyy)
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return new Date(dateStr); // Fallback
    } catch (e) {
      return null;
    }
  }

  async handleWebhook(event: any) {
    const eventId = event.id;
    const eventType = event.event;
    const accountObject = event.account; // [v4.4] Asaas 2026 Native Subaccount ID

    // 1. Idempotency Check
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      if (existingEvent.status === 'PROCESSED') {
        // noise reduction
        return { status: 'IGNORED', reason: 'Already processed' };
      }
    } else {
      await this.prisma.webhookEvent.create({
        data: {
          eventId,
          eventType,
          payload: event,
          status: 'PENDING',
        },
      });
    }

    this.logger.log(`Processing Asaas Event: ${eventType} (${eventId})`);
    // Context Resolution: Which Account is this event about?
    const originAccountId = accountObject?.id || null;

    try {
      switch (eventType) {
        // [NOISE FILTER]
        case 'PAYMENT_CREATED':
        case 'PAYMENT_UPDATED':
        case 'PAYMENT_VIEWED':
          return { status: 'IGNORED', reason: 'High Volume / Low Value' };

        // [CRITICAL] Payment Processing
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          await this.handlePaymentReceived(event.payment);
          break;

        case 'PAYMENT_OVERDUE':
          if (event.payment?.subscription) {
            await this.handleSubscriptionPaymentFailed(event.payment);
          } else {
            this.logger.warn(`Payment Overdue: ${event.payment.id}`);
          }
          break;

        // [CRITICAL] Split & Financials
        case 'TRANSFER_CONFIRMED':
          await this.handleTransferConfirmed(event.transfer);
          break;

        // [CRITICAL] Risk & Compliance
        case 'ACCOUNT_STATUS_CHANGED':
          // Pass the Origin Account ID to identify who to suspend
          await this.handleAccountStatusChanged(
            event.accountStatus,
            originAccountId,
          );
          break;

        // [v4.5] Annual Data Confirmation (Bacen)
        case 'ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED':
          await this.handleCommercialInfoExpired(event, originAccountId);
          break;

        // [CRITICAL] SaaS Subscription
        case 'SUBSCRIPTION_CREATED':
        case 'SUBSCRIPTION_UPDATED':
        case 'SUBSCRIPTION_DELETED':
          await this.handleSubscriptionEvent(eventType, event.subscription);
          break;

        default:
          this.logger.log(`Event type ${eventType} ignored.`);
      }

      // Mark as Processed
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to process event ${eventId}`, error);
      await this.prisma.webhookEvent.update({
        where: { eventId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  private async handlePaymentReceived(payment: any) {
    const externalReference = payment.externalReference;
    const paymentId = payment.id;

    // CASE 1: Subscription Payment (B2C Premium)
    if (payment.subscription) {
      await this.handleSubscriptionPaymentConfirmed(payment);
      return;
    }

    // CASE 2: Regular Wallet Recharge
    if (!externalReference) {
      this.logger.warn(
        `Payment ${payment.id} has no externalReference. Cannot link to User easily.`,
      );
      return;
    }

    const pendingId = String(externalReference);

    await this.prisma.$transaction(
      async (tx) => {
        // FIX: Idempotency check MOVED INSIDE transaction
        const existingTx = await tx.transaction.findFirst({
          where: { providerId: paymentId },
          select: { id: true, status: true },
        });

        if (existingTx && existingTx.status === 'COMPLETED') {
          this.logger.log(`Payment ${paymentId} already processed. Skipping.`);
          return;
        }

        const pending = await tx.transaction.findFirst({
          where: { id: pendingId, status: 'PENDING', type: 'RECHARGE' },
          include: { wallet: true },
        });

        if (!pending) {
          this.logger.warn(
            `Payment ${paymentId} has externalReference=${pendingId} but no PENDING transaction was found.`,
          );
          return;
        }

        const updatedWallet = await tx.wallet.update({
          where: { id: pending.walletId },
          data: { balance: { increment: pending.amount } },
        });

        await tx.transaction.update({
          where: { id: pending.id },
          data: {
            status: 'COMPLETED',
            providerId: paymentId,
            grossAmount:
              pending.grossAmount ?? pending.amount.plus(pending.platformFee),
            metadata: {
              asaasPaymentId: paymentId,
              splitRule: {
                payer: 'CUSTOMER',
                fee: Number(pending.platformFee),
              },
            },
            runningBalance: updatedWallet.balance,
          },
        });

        // Notify
        try {
          await this.notificationsService.notifyPaymentReceived(
            pending.wallet.userId,
            Number(pending.amount),
          );
        } catch (e) {
          this.logger.error(
            `Failed to notify user ${pending.wallet.userId}`,
            e,
          );
        }
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * [B2C Premium] Handle Subscription Payment Confirmation
   * Activates Premium status and sets SOS Merenda overdraftLimit
   * 
   * FIX v4.0.4: Idempotency check moved inside transaction
   */
  private async handleSubscriptionPaymentConfirmed(payment: any) {
    const subscriptionId = payment.subscription;
    const paymentId = payment.id;

    this.logger.log(
      `Processing subscription payment: ${paymentId} for subscription: ${subscriptionId}`,
    );

    const SOS_MERENDA_LIMIT = 10.0; // R$ 10,00 - configurable

    await this.prisma.$transaction(async (tx) => {
      // FIX: Idempotency check inside transaction
      const existingTx = await tx.transaction.findFirst({
        where: { providerId: paymentId, status: 'COMPLETED' },
        select: { id: true },
      });

      if (existingTx) {
        this.logger.log(`Subscription payment ${paymentId} already processed. Skipping.`);
        return;
      }

      // Find the pending subscription transaction
      const pendingTx = await tx.transaction.findFirst({
        where: {
          providerId: subscriptionId,
          status: 'PENDING',
          type: 'RECHARGE',
        },
        include: { wallet: true },
      });

      if (!pendingTx) {
        this.logger.warn(
          `No pending subscription transaction found for subscription ${subscriptionId}`,
        );
        return;
      }

      const userId = pendingTx.userId;
      if (!userId) {
        this.logger.warn(`No userId found for transaction ${pendingTx.id}`);
        return;
      }

      // 1. Update transaction to COMPLETED
      await tx.transaction.update({
        where: { id: pendingTx.id },
        data: {
          status: 'COMPLETED',
          providerId: paymentId,
          metadata: {
            ...((pendingTx.metadata as object) || {}),
            asaasPaymentId: paymentId,
            subscriptionId: subscriptionId,
            paymentDate: new Date().toISOString(),
          },
        },
      });

      // 2. Activate Premium subscription
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: new Date(
            new Date().setMonth(new Date().getMonth() + 1),
          ), // +1 month
        },
      });

      // 3. Activate SOS Merenda (set overdraftLimit)
      await tx.wallet.update({
        where: { userId: userId },
        data: {
          overdraftLimit: SOS_MERENDA_LIMIT,
          isDebtBlocked: false, // Allow overdraft usage
        },
      });

      // Notify user via existing method (outside transaction for non-critical)
      try {
        await this.notificationsService.notifyPaymentReceived(
          userId,
          Number(pendingTx.amount),
        );
      } catch (e) {
        this.logger.error(`Failed to notify user ${userId}`, e);
      }
    });

    this.logger.log(
      `✅ Premium activated. SOS Merenda enabled (R$ ${SOS_MERENDA_LIMIT}).`,
    );
  }

  /**
   * [B2C Premium] Handle Subscription Payment Failure/Overdue
   * Deactivates Premium and resets overdraftLimit (SOS Merenda)
   * 
   * FIX v4.0.4: Idempotency check added to prevent duplicate processing
   */
  private async handleSubscriptionPaymentFailed(payment: any) {
    const subscriptionId = payment.subscription;
    const paymentId = payment.id;

    this.logger.warn(
      `Subscription payment failed: ${paymentId} for subscription: ${subscriptionId}`,
    );

    await this.prisma.$transaction(async (tx) => {
      // FIX: Check if already processed
      const existingTx = await tx.transaction.findFirst({
        where: { providerId: paymentId },
        select: { id: true, status: true },
      });

      if (existingTx && existingTx.status === 'FAILED') {
        this.logger.log(`Subscription failure ${paymentId} already processed. Skipping.`);
        return;
      }

      // Find the subscription transaction
      const txRecord = await tx.transaction.findFirst({
        where: {
          providerId: subscriptionId,
          type: 'RECHARGE',
        },
        include: { wallet: true },
      });

      if (!txRecord || !txRecord.userId) {
        this.logger.warn(
          `No subscription transaction found for subscription ${subscriptionId}`,
        );
        return;
      }

      const userId = txRecord.userId;

      // 1. Update transaction to FAILED
      await tx.transaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...((txRecord.metadata as object) || {}),
            asaasPaymentId: paymentId,
            failureDate: new Date().toISOString(),
            failureReason: payment.failureReason || 'PAYMENT_OVERDUE',
          },
        },
      });

      // 2. Deactivate Premium subscription
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'SUSPENDED',
        },
      });

      // 3. Deactivate SOS Merenda (reset overdraftLimit)
      await tx.wallet.update({
        where: { userId: userId },
        data: {
          overdraftLimit: 0,
          isDebtBlocked: true, // Block new purchases if negative
        },
      });
    });

    this.logger.log(
      `⚠️ Premium suspended. SOS Merenda disabled (overdraftLimit=0).`,
    );
  }

  private async handleTransferConfirmed(transfer: any) {
    this.logger.log(
      `Transfer Confirmed: R$ ${transfer.value} (Type: ${transfer.type})`,
    );
    // Future: Reconciliate with Ledger
  }

  private async handleAccountStatusChanged(
    statusData: any,
    originAccountId: string | null,
  ) {
    // "commercialInfo": "APPROVED" | "DENIED" | "AWAITING_APPROVAL"
    const commercialStatus = statusData.commercialInfo;
    this.logger.log(
      `Account Status Changed: Commercial=${commercialStatus} (Account: ${originAccountId})`,
    );

    if (commercialStatus === 'DENIED') {
      this.logger.error(
        `CRITICAL: Asaas Account Denied (KYC). Suspending Entity.`,
      );

      if (!originAccountId) {
        this.logger.error(
          'Cannot suspend entity: Origin Account ID missing in webhook.',
        );
        return;
      }

      // 1. Try finding Operator
      const operator = await this.prisma.operator.findUnique({
        where: { asaasId: originAccountId },
      });
      if (operator) {
        this.logger.log(`Suspending Operator: ${operator.name}`);
        // Assuming Operator has status logic via linked Canteens or just flag?
        // Operator doesn't have a direct 'status' field in schema v4.0.1 (it has Canteens).
        // But we can audit log it or de-activate canteens.
        // Or maybe create a generic 'SUSPENDED' state if possible.
        // Let's Log a Critical Audit for now as Schema might need 'status' on Operator.
        // Wait, Canteen has status.
        await this.prisma.canteen.updateMany({
          where: { operatorId: operator.id },
          data: { status: 'SUSPENDED' },
        });
        return;
      }

      // 2. Try finding School
      const school = await this.prisma.school.findFirst({
        where: { asaasCustomerId: originAccountId },
      });
      // Warning: asaasCustomerId is for PAYING. asaasId (if added) would be for RECEIVING.
      // School model has `asaasWalletId` and `asaasApiKey`. Does it have `asaasId` (subaccount)?
      // Schema scan: `asaasCustomerId` (payer), `asaasWalletId`, `asaasApiKey`.
      // User 'School' creation logic implies it creates a subaccount?
      // If School acts as a subaccount, it should typically have an Account ID stored.
      // If School is just a Payer, then ACCOUNT_STATUS_CHANGED (KYC) might not apply the same way,
      // unless the School IS the subaccount (e.g. for tuition).
      // Let's look for match in 'asaasWalletId' or equivalent if stored.
      // But relying on finding by ID is safest.

      // IF we can't find it, we log CRITICAL.
      this.logger.error(
        `Could not find Operator or School linked to Asaas Account ${originAccountId}`,
      );
    }
  }

  /**
   * [v4.5] Handle Data Expiration (Bacen Requirement)
   */
  private async handleCommercialInfoExpired(
    event: any,
    originAccountId: string | null,
  ) {
    this.logger.warn(
      `[COMPLIANCE] Annual Data Confirmation EXPIRED for Account ${originAccountId}`,
    );

    if (!originAccountId) return;

    // Find Operator
    const operator = await this.prisma.operator.findUnique({
      where: { asaasId: originAccountId },
    });
    if (operator) {
      await this.prisma.operator.update({
        where: { id: operator.id },
        data: {
          isDataExpired: true,
          // If event provides the scheduledDate, we could update it, but usually it's "now"
          dataExpirationDate: new Date(),
        },
      });

      // Notify Admins or Trigger Email
      this.logger.log(`Operator ${operator.name} flagged as DATA_EXPIRED.`);
      // Future: NotificationService.notifyComplianceAlert(...)
    }
  }

  private async handleSubscriptionEvent(type: string, subscription: any) {
    this.logger.log(
      `Subscription Event ${type}: ${subscription.id} (${subscription.status})`,
    );

    // [v4.4] Date Parsing Fix
    const nextDueDate = this.parseDate(subscription.nextDueDate);

    const school = await this.prisma.school.findFirst({
      where: { subscriptionId: subscription.id },
    });

    if (school) {
      if (
        subscription.status === 'OVERDUE' ||
        subscription.status === 'EXPIRED'
      ) {
        this.logger.warn(
          `School ${school.name} subscription is troubled: ${subscription.status}. Next due: ${nextDueDate}`,
        );
        await this.prisma.school.update({
          where: { id: school.id },
          data: { status: 'SUSPENDED' },
        });
      } else if (
        subscription.status === 'ACTIVE' &&
        school.status === 'SUSPENDED'
      ) {
        await this.prisma.school.update({
          where: { id: school.id },
          data: { status: 'ACTIVE' },
        });
      }
    }
  }
}
