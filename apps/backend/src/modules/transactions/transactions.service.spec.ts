import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FeeCalculatorService } from './fee-calculator.service';

const mockPrismaService = {
  wallet: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  school: {
    findUnique: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
  },
  sysConfig: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrismaService)),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

// Mock AsaasService
import { AsaasService } from '../asaas/asaas.service';

const mockAsaasService = {
  createPixCharge: jest.fn(),
};

describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: AsaasService, useValue: mockAsaasService },
        FeeCalculatorService,
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processRecharge (Split Logic)', () => {
    it('should calculate platformFee (0.00) and netAmount correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const amount = 50.0;
      const initialBalance = new Prisma.Decimal(10.0);

      (mockPrismaService.wallet.findUnique as jest.Mock).mockResolvedValue({
        id: 'wallet-123',
        userId,
        balance: initialBalance,
        version: 1,
      });

      (mockPrismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        schoolId: 'school-123',
        school: { status: 'ACTIVE', plan: { creditCeiling: 0 } },
      });

      (mockPrismaService.school.findUnique as jest.Mock).mockResolvedValue({
        id: 'school-123',
        plan: { creditCeiling: 0 },
        canteens: [{ operatorId: 'operator-123' }],
      });

      (mockPrismaService.transaction.create as jest.Mock).mockImplementation(
        (args) => ({
          id: 'tx-123',
          ...args.data,
        }),
      );

      (mockPrismaService.wallet.update as jest.Mock).mockResolvedValue({
        balance: new Prisma.Decimal(60.0),
      });

      // Act
      await service.processRecharge(userId, amount);

      // Assert
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: new Prisma.Decimal(amount),
            platformFee: new Prisma.Decimal(0),
            netAmount: new Prisma.Decimal(amount),
            type: 'RECHARGE',
          }),
        }),
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.recharge.created',
        expect.objectContaining({
          amount: 50,
          platformFee: 0,
        }),
      );
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      (mockPrismaService.wallet.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.processRecharge('unknown', 100)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
