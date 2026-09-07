import { v4 as uuidv4 } from 'uuid';
import { run, query } from '../db/index.js';
import { broadcastToBusiness } from '../services/websocketService.js';

export interface AuditEntryOptions {
  businessId: string;
  actorId: string;
  actorName: string;
  action: 'CREATE' | 'UPDATE' | 'VOID' | 'REVERSE' | 'PAYMENT' | 'LOGIN' | 'LOGOUT' | 'ROLE_CHANGE' | 'SETTINGS_CHANGE';
  entityType: 'ORDER' | 'INVOICE' | 'EXPENSE' | 'PAYMENT' | 'SALE' | 'CUSTOMER' | 'BANK_ACCOUNT' | 'SETTINGS' | 'BUSINESS';
  entityId: string;
  entityReference?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
}

/**
 * Append-only immutable audit logging engine
 */
export async function logAudit(options: AuditEntryOptions): Promise<void> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const oldValueStr = options.oldValue !== undefined ? (typeof options.oldValue === 'string' ? options.oldValue : JSON.stringify(options.oldValue)) : null;
  const newValueStr = options.newValue !== undefined ? (typeof options.newValue === 'string' ? options.newValue : JSON.stringify(options.newValue)) : null;

  await run(
    `INSERT INTO audit_logs (id, business_id, actor_id, actor_name, action, entity_type, entity_id, entity_reference, old_value, new_value, reason, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      options.businessId,
      options.actorId,
      options.actorName,
      options.action,
      options.entityType,
      options.entityId,
      options.entityReference || null,
      oldValueStr,
      newValueStr,
      options.reason || null,
      options.ipAddress || null,
      createdAt
    ]
  );

  // Broadcast real-time audit event to all connected partners in the same business
  broadcastToBusiness(options.businessId, {
    type: 'AUDIT_LOG_ADDED',
    payload: {
      id,
      actorName: options.actorName,
      action: options.action,
      entityType: options.entityType,
      entityReference: options.entityReference,
      reason: options.reason,
      createdAt
    }
  });
}
