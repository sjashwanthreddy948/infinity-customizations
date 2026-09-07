import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query, get, run } from '../db/index.js';
import { logAudit } from '../services/auditService.js';
import { recordFinancialTransaction } from '../services/transactionService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

// Get all cash & bank accounts with balances
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;

    const accounts = await query<any>(
      `SELECT * FROM cash_accounts WHERE business_id = ? ORDER BY is_default DESC, account_type ASC`,
      [businessId]
    );

    // Recent account movements
    const transactions = await query<any>(
      `SELECT t.*, a.account_name, a.account_type, b.account_name as to_account_name
       FROM transactions t
       LEFT JOIN cash_accounts a ON a.id = t.account_id
       LEFT JOIN cash_accounts b ON b.id = t.to_account_id
       WHERE t.business_id = ?
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT 50`,
      [businessId]
    );

    let totalLiquid = 0;
    let cashTotal = 0;
    let bankTotal = 0;
    let upiTotal = 0;

    const formattedAccounts = accounts.map(a => {
      totalLiquid += a.current_balance;
      if (a.account_type === 'CASH') cashTotal += a.current_balance;
      else if (a.account_type === 'BANK') bankTotal += a.current_balance;
      else if (a.account_type === 'UPI') upiTotal += a.current_balance;

      return {
        ...a,
        initial_balance: Math.round(a.initial_balance / 100),
        current_balance: Math.round(a.current_balance / 100)
      };
    });

    res.json({
      summary: {
        totalLiquid: Math.round(totalLiquid / 100),
        cashTotal: Math.round(cashTotal / 100),
        bankTotal: Math.round(bankTotal / 100),
        upiTotal: Math.round(upiTotal / 100)
      },
      accounts: formattedAccounts,
      transactions: transactions.map(t => ({
        ...t,
        amount: Math.round(t.amount / 100)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cash & bank data' });
  }
});

// Add new bank or cash account
router.post('/accounts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const { accountName, accountType, accountNumber, bankName, ifscCode, initialBalance = 0 } = req.body;

    if (!accountName || !accountType) {
      res.status(400).json({ error: 'Account name and type are required' });
      return;
    }

    const initPaise = Math.round(Number(initialBalance) * 100);
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      `INSERT INTO cash_accounts (id, business_id, account_name, account_type, account_number, bank_name, ifsc_code, initial_balance, current_balance, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, businessId, accountName, accountType, accountNumber || null, bankName || null, ifscCode || null, initPaise, initPaise, now]
    );

    if (initPaise > 0) {
      await recordFinancialTransaction({
        businessId,
        type: 'DEPOSIT',
        category: 'Opening Balance',
        description: `Opening balance for ${accountName}`,
        amount: initPaise,
        paymentMethod: accountType === 'CASH' ? 'Cash' : 'Bank Transfer',
        accountId: id,
        referenceType: 'MANUAL',
        actorId: user.id,
        actorName: user.full_name
      });
    }

    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'CREATE',
      entityType: 'BANK_ACCOUNT',
      entityId: id,
      entityReference: accountName,
      reason: `Added new ${accountType} account: ${accountName}`
    });

    res.status(201).json({ id, accountName, accountType });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Record transfer between accounts (e.g. Cash Deposit to Bank, or Bank Transfer to UPI)
router.post('/transfer', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const { fromAccountId, toAccountId, amount, description = 'Inter-account transfer', date } = req.body;

    const amountPaise = Math.round(Number(amount) * 100);
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || !amountPaise || amountPaise <= 0) {
      res.status(400).json({ error: 'Valid from account, to account, and amount are required' });
      return;
    }

    const fromAcc = await get<any>(`SELECT * FROM cash_accounts WHERE id = ? AND business_id = ?`, [fromAccountId, businessId]);
    const toAcc = await get<any>(`SELECT * FROM cash_accounts WHERE id = ? AND business_id = ?`, [toAccountId, businessId]);

    if (!fromAcc || !toAcc) {
      res.status(404).json({ error: 'Source or destination account not found' });
      return;
    }

    if (fromAcc.current_balance < amountPaise) {
      res.status(400).json({
        error: `Insufficient balance in ${fromAcc.account_name}. Available: ₹${(fromAcc.current_balance / 100).toLocaleString('en-IN')}`
      });
      return;
    }

    await recordFinancialTransaction({
      businessId,
      type: 'TRANSFER',
      category: 'Account Transfer',
      description: `${description} (${fromAcc.account_name} -> ${toAcc.account_name})`,
      amount: amountPaise,
      paymentMethod: 'Internal Transfer',
      accountId: fromAccountId,
      toAccountId: toAccountId,
      referenceType: 'MANUAL',
      actorId: user.id,
      actorName: user.full_name,
      date: date || new Date().toISOString().split('T')[0]
    });

    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'UPDATE',
      entityType: 'BANK_ACCOUNT',
      entityId: fromAccountId,
      entityReference: `${fromAcc.account_name} to ${toAcc.account_name}`,
      reason: `Transferred ₹${(amountPaise / 100).toLocaleString('en-IN')} from ${fromAcc.account_name} to ${toAcc.account_name}`
    });

    await createNotification({
      businessId,
      actorName: user.full_name,
      title: 'Fund Transfer Recorded',
      message: `${user.full_name} transferred ₹${(amountPaise / 100).toLocaleString('en-IN')} from ${fromAcc.account_name} to ${toAcc.account_name}`,
      type: 'FINANCIAL',
      entityType: 'BANK_ACCOUNT',
      entityId: toAccountId
    });

    res.json({ message: 'Transfer completed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record transfer' });
  }
});

// Record direct Deposit or Withdrawal
router.post('/record-entry', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const { accountId, type, amount, category, description, date } = req.body;

    const amountPaise = Math.round(Number(amount) * 100);
    if (!accountId || !type || !['DEPOSIT', 'WITHDRAWAL'].includes(type) || !amountPaise || amountPaise <= 0) {
      res.status(400).json({ error: 'Valid account, entry type (DEPOSIT or WITHDRAWAL), and amount required' });
      return;
    }

    const acc = await get<any>(`SELECT * FROM cash_accounts WHERE id = ? AND business_id = ?`, [accountId, businessId]);
    if (!acc) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    if (type === 'WITHDRAWAL' && acc.current_balance < amountPaise) {
      res.status(400).json({
        error: `Insufficient balance in ${acc.account_name}. Available: ₹${(acc.current_balance / 100).toLocaleString('en-IN')}`
      });
      return;
    }

    await recordFinancialTransaction({
      businessId,
      type: type as any,
      category: category || (type === 'DEPOSIT' ? 'Cash Received' : 'Cash Spent'),
      description: description || `${type} for ${acc.account_name}`,
      amount: amountPaise,
      paymentMethod: acc.account_type === 'CASH' ? 'Cash' : 'Bank Transfer',
      accountId,
      referenceType: 'MANUAL',
      actorId: user.id,
      actorName: user.full_name,
      date: date || new Date().toISOString().split('T')[0]
    });

    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'UPDATE',
      entityType: 'BANK_ACCOUNT',
      entityId: accountId,
      entityReference: acc.account_name,
      reason: `${type === 'DEPOSIT' ? 'Deposited' : 'Withdrew'} ₹${(amountPaise / 100).toLocaleString('en-IN')} in ${acc.account_name}: ${description}`
    });

    res.json({ message: `${type} recorded successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record entry' });
  }
});

export default router;
