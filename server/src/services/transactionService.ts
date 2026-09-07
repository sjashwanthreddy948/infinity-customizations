import { v4 as uuidv4 } from 'uuid';
import { run, query, get } from '../db/index.js';
import { broadcastToBusiness } from './websocketService.js';

export interface CreateTransactionOptions {
  businessId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT';
  category: string;
  description: string;
  amount: number; // in paise
  paymentMethod: string;
  accountId?: string;
  toAccountId?: string;
  referenceType?: 'INVOICE' | 'SALE' | 'EXPENSE' | 'PAYMENT' | 'MANUAL';
  referenceId?: string;
  actorId: string;
  actorName: string;
  date?: string;
}

export async function recordFinancialTransaction(opts: CreateTransactionOptions): Promise<string> {
  const id = uuidv4();
  const txNumber = `TX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const date = opts.date || new Date().toISOString().split('T')[0];
  const createdAt = new Date().toISOString();

  await run(
    `INSERT INTO transactions (
      id, business_id, transaction_number, date, type, category, description,
      amount, payment_method, account_id, to_account_id, reference_type,
      reference_id, actor_id, actor_name, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)`,
    [
      id,
      opts.businessId,
      txNumber,
      date,
      opts.type,
      opts.category,
      opts.description,
      opts.amount,
      opts.paymentMethod,
      opts.accountId || null,
      opts.toAccountId || null,
      opts.referenceType || null,
      opts.referenceId || null,
      opts.actorId,
      opts.actorName,
      createdAt
    ]
  );

  // Update derived cash/bank account balance if accountId is specified
  if (opts.accountId) {
    if (opts.type === 'INCOME' || opts.type === 'DEPOSIT') {
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = ? AND business_id = ?`,
        [opts.amount, opts.accountId, opts.businessId]
      );
    } else if (opts.type === 'EXPENSE' || opts.type === 'WITHDRAWAL') {
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = ? AND business_id = ?`,
        [opts.amount, opts.accountId, opts.businessId]
      );
    } else if (opts.type === 'TRANSFER' && opts.toAccountId) {
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = ? AND business_id = ?`,
        [opts.amount, opts.accountId, opts.businessId]
      );
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = ? AND business_id = ?`,
        [opts.amount, opts.toAccountId, opts.businessId]
      );
    }
  }

  // Broadcast realtime update to both partners
  broadcastToBusiness(opts.businessId, {
    type: 'TRANSACTION_RECORDED',
    payload: {
      id,
      txNumber,
      type: opts.type,
      amount: opts.amount,
      actorName: opts.actorName,
      createdAt
    }
  });

  return id;
}

/**
 * Void/Reverse an existing transaction
 */
export async function voidTransaction(
  businessId: string, 
  transactionId: string, 
  actorId: string, 
  actorName: string, 
  reason: string
): Promise<void> {
  const tx = await get<any>(
    `SELECT * FROM transactions WHERE id = ? AND business_id = ?`,
    [transactionId, businessId]
  );

  if (!tx || tx.status !== 'COMPLETED') {
    throw new Error('Transaction not found or already voided');
  }

  // Reverse account balances if applicable
  if (tx.account_id) {
    if (tx.type === 'INCOME' || tx.type === 'DEPOSIT') {
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = ? AND business_id = ?`,
        [tx.amount, tx.account_id, businessId]
      );
    } else if (tx.type === 'EXPENSE' || tx.type === 'WITHDRAWAL') {
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = ? AND business_id = ?`,
        [tx.amount, tx.account_id, businessId]
      );
    } else if (tx.type === 'TRANSFER' && tx.to_account_id) {
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance + ? WHERE id = ? AND business_id = ?`,
        [tx.amount, tx.account_id, businessId]
      );
      await run(
        `UPDATE cash_accounts SET current_balance = current_balance - ? WHERE id = ? AND business_id = ?`,
        [tx.amount, tx.to_account_id, businessId]
      );
    }
  }

  // Mark status as VOID
  await run(
    `UPDATE transactions SET status = 'VOID' WHERE id = ? AND business_id = ?`,
    [transactionId, businessId]
  );

  // Broadcast
  broadcastToBusiness(businessId, {
    type: 'TRANSACTION_VOIDED',
    payload: { transactionId, actorName, reason }
  });
}
