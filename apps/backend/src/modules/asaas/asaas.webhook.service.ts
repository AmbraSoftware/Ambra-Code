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
          this.logger.warn(`Payment Overdue: ${event.payment.id}`);
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

    if (!externalReference) {
      this.logger.warn(
        `Payment ${payment.id} has no externalReference. Cannot link to User easily.`,
      );
      return;
    }

    const paymentId = payment.id;

    // Check internal idempotency
    const existingTx = await this.prisma.transaction.findFirst({
      where: { providerId: paymentId },
      select: { id: true },
    });

    if (existingTx) {
      return;
    }

    const pendingId = String(externalReference);

    await this.prisma.$transaction(
      async (tx) => {
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
            grossAmount: pending.grossAmount ?? pending.amount.plus(pending.platformFee),
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
