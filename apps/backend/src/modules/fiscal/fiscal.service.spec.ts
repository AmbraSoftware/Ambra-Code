import { Test, TestingModule } from '@nestjs/testing';
import { FiscalService, RechargeEvent } from './fiscal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const mockPrismaService = {
  invoice: { create: jest.fn() },
  fiscalPendingItem: { create: jest.fn() }, // [v4.1] Mock
  user: { findUnique: jest.fn() },
};

describe('FiscalService', () => {
  let service: FiscalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FiscalService>(FiscalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleRecharge', () => {
    it('should accumulate fee in FiscalPendingItem (Batch Mode)', async () => {
      // Arrange
      const payload: RechargeEvent = {
        transactionId: 'tx-123',
        walletId: 'wallet-456',
        amount: 50.0,
        platformFee: 5.0,
        userId: 'user-789',
        operatorId: 'op-123', // Required for Batch
      };

      const mockUser = { id: 'user-123', schoolId: 'school-ABC' };

      // Mock User Lookup
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Mock Create
      mockPrismaService.fiscalPendingItem.create.mockResolvedValue({
        id: 'item-1',
        status: 'PENDING',
      });

      // Act
      await service.handleRecharge(payload);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.userId },
        select: { schoolId: true },
      });

      expect(mockPrismaService.fiscalPendingItem.create).toHaveBeenCalledWith({
        data: {
          operatorId: payload.operatorId,
          transactionId: payload.transactionId,
          amount: payload.platformFee,
          status: 'PENDING',
        },
      });

      // Ensure Invoice is NOT created immediately
      expect(mockPrismaService.invoice.create).not.toHaveBeenCalled();
    });
  });
});
