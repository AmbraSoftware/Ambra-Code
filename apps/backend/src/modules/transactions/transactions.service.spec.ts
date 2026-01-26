import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Mock do TransactionSplitter (já testado isoladamente)
import { TransactionSplitter } from './transaction-splitter';

const mockPrismaService = {
  wallet: {
    findUnique: jest.fn(),
    update: jest.fn(),
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
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw BadRequestException if amount is less than 5.00', async () => {
    // Arrange
    const userId = 'user-123';
    const amount = 3.0;

    // Mock wallet existence
    mockPrismaService.wallet.findUnique.mockResolvedValue({
      id: 'wallet-123',
      balance: new Prisma.Decimal(10.0),
      userId: userId,
      version: 1,
    });

    // Act & Assert
    await expect(service.processRecharge(userId, amount)).rejects.toThrow(
      'O valor mínimo para recarga é de R$ 5,00.',
    );
  });

  describe('processRecharge (Split Logic)', () => {
    it('should calculate platformFee (5.00) and netAmount correctly', async () => {
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
            platformFee: new Prisma.Decimal(5.0), // Neutrality 2+3=5
            netAmount: new Prisma.Decimal(47.0), // 50 (Credit) - 3 (School Fee)
            type: 'RECHARGE',
          }),
        }),
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'transaction.recharge.created',
        expect.objectContaining({
          amount: 50,
          platformFee: 5,
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
