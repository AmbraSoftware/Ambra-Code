import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  action: string;
  entity: string;
}

export const AUDIT_KEY = 'audit_metadata';
export const Audit = (action: string, entity: string) =>
  SetMetadata(AUDIT_KEY, { action, entity });
