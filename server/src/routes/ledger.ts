import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query } from '../db/index.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { partner, type, method, startDate, endDate, search } = req.query;

    let sql = `SELECT * FROM transactions WHERE business_id = ?`;
    const params: any[] = [businessId];

    if (partner && partner !== 'ALL') {
      sql += ` AND (actor_id = ? OR actor_name LIKE ?)`;
      params.push(partner, `%${partner}%`);
    }

    if (type && type !== 'ALL') {
      sql += ` AND type = ?`;
      params.push(type);
    }

    if (method && method !== 'ALL') {
      sql += ` AND payment_method = ?`;
      params.push(method);
    }

    if (startDate && endDate) {
      sql += ` AND date >= ? AND date <= ?`;
      params.push(startDate, endDate);
    }

    if (search) {
      sql += ` AND (description LIKE ? OR transaction_number LIKE ? OR category LIKE ? OR actor_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY date DESC, created_at DESC LIMIT 200`;
    const transactions = await query<any>(sql, params);

    res.json(transactions.map(t => {
      const isIncome = ['INCOME', 'DEPOSIT'].includes(t.type);
      const isExpense = ['EXPENSE', 'WITHDRAWAL'].includes(t.type);
      return {
        id: t.id,
        transactionNumber: t.transaction_number,
        date: t.date,
        type: t.type,
        category: t.category,
        description: t.description,
        partner: t.actor_name,
        actorId: t.actor_id,
        paymentMethod: t.payment_method,
        status: t.status,
        income: isIncome ? Math.round(t.amount / 100) : null,
        expense: isExpense ? Math.round(t.amount / 100) : null,
        amount: Math.round(t.amount / 100),
        referenceType: t.reference_type,
        referenceId: t.reference_id,
        createdAt: t.created_at
      };
    }));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch transaction ledger' });
  }
});

export default router;
