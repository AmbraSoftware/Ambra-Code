import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionService } from '../transactions/transactions.service';
import { StockService } from '../stock/stock.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '@nodum/shared';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    product: { findMany: jest.fn() },
    wallet: { findUnique: jest.fn() },
    canteen: { findUnique: jest.fn() },
    order: { create: jest.fn(), update: jest.fn() },
    fiscalPendingItem: { create: jest.fn() },
    productRestriction: { findMany: jest.fn() },
    categoryRestriction: { findMany: jest.fn() },
    nutritionalProfile: { findUnique: jest.fn() },
    school: { findUnique: jest.fn() },
  };

  const mockTransactionService = {
    debitFromWalletForOrderInTransaction: jest
      .fn()
      .mockResolvedValue({ transactionId: 'tx-123' }),
  };
  const mockStockService = {
    reserveProductsInTransaction: jest.fn(),
    confirmSaleInTransaction: jest.fn(),
  };
  const mockAuditService = { logAction: jest.fn() };
  const mockNotificationsGateway = { notifyNewOrder: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: StockService, useValue: mockStockService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (Pre-order)', () => {
    it('should throw BadRequestException for past date', async () => {
      const dto: CreateOrderDto = {
        studentId: 'uuid',
        items: [{ productId: 'p1', quantity: 1 }],
        scheduledFor: new Date('2020-01-01').toISOString(),
      };
      await expect(service.create('buyerId', dto)).rejects.toThrow(
        'A data de agendamento deve ser futura.',
      );
    });

    it('should throw BadRequestException if less than 30 mins advance', async () => {
      const nearFuture = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins
      const dto: CreateOrderDto = {
        studentId: 'uuid',
        items: [{ productId: 'p1', quantity: 1 }],
        scheduledFor: nearFuture,
      };
      await expect(service.create('buyerId', dto)).rejects.toThrow(
        'Reservas devem ser feitas com no mínimo 30 minutos de antecedência.',
      );
    });

    it('should persist scheduledFor if valid', async () => {
      const futureDate = new Date(Date.now() + 60 * 60000); // 1 hour
      const dto: CreateOrderDto = {
        studentId: 'student-123',
        items: [{ productId: 'prod-1', quantity: 1 }],
        scheduledFor: futureDate.toISOString(),
      };

      // Mocks for happy path
      (mockPrismaService.product.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'prod-1',
          price: 10,
          canteenId: 'canteen-1',
          isAvailable: true,
          name: 'Burger',
        },
      ]);
      (mockPrismaService.wallet.findUnique as jest.Mock).mockResolvedValue({
        userId: 'student-123',
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        user: { schoolId: 'school-1' },
        canPurchaseAlone: true,
      });
      (mockPrismaService.canteen.findUnique as jest.Mock).mockResolvedValue({
        type: 'COMMERCIAL',
        openingTime: '00:00',
        closingTime: '23:59',
        operatorId: 'operator-123',
      });
      (mockPrismaService.school.findUnique as jest.Mock).mockResolvedValue({
        id: 'school-1',
        status: 'ACTIVE',
        name: 'Escola Teste',
      });
      (
        mockPrismaService.productRestriction.findMany as jest.Mock
      ).mockResolvedValue([]);
      (
        mockPrismaService.categoryRestriction.findMany as jest.Mock
      ).mockResolvedValue([]);

      const createdOrderMock = {
        id: 'order-1',
        status: 'PENDING' as any,
        schoolId: 'school-1',
        orderHash: 'HASH',
      };
      (mockPrismaService.order.create as jest.Mock).mockResolvedValue(
        createdOrderMock,
      );
      (mockPrismaService.order.update as jest.Mock).mockResolvedValue({
        ...createdOrderMock,
        status: 'PAID' as any,
      });

      // Run
      await service.create('student-123', dto);

      // Verify persistence
      expect(mockPrismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledFor: expect.any(Date),
          }),
        }),
      );
    });
  });
});
