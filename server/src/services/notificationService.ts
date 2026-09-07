import { v4 as uuidv4 } from 'uuid';
import { run } from '../db/index.js';
import { broadcastToBusiness } from './websocketService.js';

export interface CreateNotificationOptions {
  businessId: string;
  userId?: string | null; // null means all partners in business
  actorName: string;
  title: string;
  message: string;
  type?: 'INFO' | 'FINANCIAL' | 'WARNING' | 'ALERT' | 'UPDATE';
  entityType?: string;
  entityId?: string;
}

export async function createNotification(opts: CreateNotificationOptions): Promise<void> {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await run(
    `INSERT INTO notifications (id, business_id, user_id, actor_name, title, message, type, entity_type, entity_id, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      opts.businessId,
      opts.userId || null,
      opts.actorName,
      opts.title,
      opts.message,
      opts.type || 'INFO',
      opts.entityType || null,
      opts.entityId || null,
      createdAt
    ]
  );

  broadcastToBusiness(opts.businessId, {
    type: 'NEW_NOTIFICATION',
    payload: {
      id,
      title: opts.title,
      message: opts.message,
      actorName: opts.actorName,
      type: opts.type || 'INFO',
      entityType: opts.entityType,
      entityId: opts.entityId,
      createdAt
    }
  });
}
