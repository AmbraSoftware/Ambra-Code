/**
 * @file src/types/index.ts
 * @fileoverview Global TypeScript interfaces for Nodum Console data entities.
 * @description This file centralizes the data structures used throughout the application
 *              to ensure type safety and data consistency.
 */

// UserRole enum - duplicated from @prisma/client for frontend use
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MERCHANT_ADMIN = 'MERCHANT_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  OPERATOR_SALES = 'OPERATOR_SALES',
  STUDENT = 'STUDENT',
  GUARDIAN = 'GUARDIAN',
}

export interface System {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'Ativo' | 'Inativo' | 'ACTIVE';
  created_at: string;
  schoolCount?: number;
  deletedAt?: string | null;
}

export interface School {
  id: string;
  name: string;
  cnpj: string;
  slug: string;
  status: 'Ativo' | 'Inativo' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CANCELED';
  systemName?: string;
  planId?: string;
  planName?: string;
  governmentName?: string;
  userCount?: number;
  taxId?: string;
  customDomain?: string;
  active?: boolean;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface Municipality {
  id: string;
  name: string;
  slug: string;
  taxId: string;
  status: 'Active' | 'Inactive';
  systemName?: string;
  planName?: string;
  createdAt?: string;
}

export interface Operator {
  id: string;
  name: string;
  taxId: string;
  cpfCnpj?: string; // Alias for taxId or specific field
  asaasId?: string;
  asaasWalletId?: string;
  walletId?: string; // Alias for asaasWalletId
  canteenCount?: number;
  status: 'Ativo' | 'Inativo';
  createdAt?: string;
  deletedAt?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  document?: string;
  role: string;
  status: 'Ativo' | 'Inativo';
  schoolName?: string;
  createdAt?: string;
  lastLoginAt?: string;
  deletedAt?: string | null;
}

export interface Plan {
  id: string;
  name: string;
  price: string | number;
  code?: string;
  description?: string;
  whiteLabel?: boolean;
  maxStudents?: number;
  status: 'Ativo' | 'Inativo' | 'ACTIVE';
  deletedAt?: string | null;
}

export interface CreateSchoolInput {
  systemId: string;
  name: string;
  taxId: string;
  slug: string;
  planId: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface Campaign {
  id: string;
  title: string;
  date: string;
  status: 'Enviado' | 'Agendado' | 'Rascunho' | 'INACTIVE';
}

export interface OperationalCost {
  id: string;
  category: string;
  provider: string;
  cost: string;
  status: 'Pago' | 'Pendente';
  lastInvoice: string;
}

export interface FiscalDocument {
  id: string;
  tenant: string;
  value: string;
  issueDate: string;
  status: 'Emitida' | 'Processando' | 'Cancelada';
}
