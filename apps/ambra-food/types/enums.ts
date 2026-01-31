/**
 * Enums locais do Mobile
 * Copiados de @nodum/shared para evitar dependências de backend (NestJS)
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_MANAGER = 'PLATFORM_MANAGER',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  MERCHANT_ADMIN = 'MERCHANT_ADMIN',
  OPERATOR_SALES = 'OPERATOR_SALES',
  OPERATOR_CASHIER = 'OPERATOR_CASHIER',
  GUARDIAN = 'GUARDIAN',
  STUDENT = 'STUDENT',
}

export enum TransactionType {
  CASH_IN = 'CASH_IN',
  RECHARGE = 'RECHARGE',
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  WITHDRAWAL = 'WITHDRAWAL',
}

export interface LoginDto {
  email: string;
  password: string;
}
