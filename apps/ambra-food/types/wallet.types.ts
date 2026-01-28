import { TransactionType } from './enums';

/**
 * Carteira do usuário (GUARDIAN ou STUDENT)
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  creditLimit: number;
  negativeSince: Date | null;
  isDebtBlocked: boolean;
  dailySpendLimit: number;
  canPurchaseAlone: boolean;
  canRechargeAlone: boolean;
  allowedDays: number[]; // [1,2,3,4,5] - dias da semana
  updatedAt: Date;
}

/**
 * Transação da carteira
 */
export interface Transaction {
  id: string;
  walletId: string;
  userId: string | null;
  operatorId: string | null;
  amount: number;
  platformFee: number;
  netAmount: number;
  runningBalance: number;
  type: TransactionType;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string | null;
  providerId: string | null;
  orderId: string | null;
  createdAt: Date;
}
