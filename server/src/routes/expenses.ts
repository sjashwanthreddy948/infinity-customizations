import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { broadcastToBusiness } from '../services/websocketService.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/expenses - List business expenses with category and date filtering
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const { category, search, startDate, endDate, status = 'ACTIVE' } = req.query;

    let sql = `SELECT * FROM expenses WHERE business_id = ?`;
    const params: any[] = [businessId];

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (description LIKE ? OR expense_number LIKE ? OR notes LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (startDate) {
      sql += ` AND date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY date DESC, created_at DESC`;
    const expenses = await query(sql, params);

    // Summary totals by category
    const categoryTotals = await query<any>(
      `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses
       WHERE business_id = ? AND status = 'ACTIVE'
       GROUP BY category`,
      [businessId]
    );

    const totalAmountRes = await get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE business_id = ? AND status = 'ACTIVE'`,
      [businessId]
    );

    res.json({
      expenses,
      categoryTotals,
      totalAmount: totalAmountRes?.total || 0
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * POST /api/expenses - Add general business expense
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const {
      description,
      category = 'Other',
      amount = 0,
      payment_method = 'UPI',
      date,
      notes = '',
      receipt_url
    } = req.body;

    if (!description || !amount) {
      res.status(400).json({ error: 'Description and amount are required' });
      return;
    }

    const expAmt = Math.max(0, Math.round(Number(amount) || 0));
    const expCountRes = await get<any>(`SELECT COUNT(*) as count FROM expenses WHERE business_id = ?`, [businessId]);
    const expenseNumber = `EXP-${(1001 + (expCountRes?.count || 0)).toString()}`;
    const expenseId = uuidv4();
    const expDate = date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    await run(
      `INSERT INTO expenses (
        id, business_id, expense_number, category, description, amount, payment_method,
        date, notes, receipt_url, created_by, created_by_name, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [
        expenseId, businessId, expenseNumber, category, description.trim(), expAmt, payment_method,
        expDate, notes, receipt_url || null, partnerId, partnerName, nowIso
      ]
    );

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'CREATE',
      entityType: 'EXPENSE',
      entityId: expenseId,
      entityReference: expenseNumber,
      newValue: { expenseNumber, category, description, amount: expAmt },
      reason: 'General business expense recorded'
    });

    broadcastToBusiness(businessId, {
      type: 'EXPENSE_ADDED',
      payload: { expenseId, expenseNumber, description, amount: expAmt, createdBy: partnerName }
    });

    const created = await get(`SELECT * FROM expenses WHERE id = ?`, [expenseId]);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error recording expense:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

/**
 * POST /api/expenses/:id/void - Void an expense with mandatory reason
 */
router.post('/:id/void', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;
    const expenseId = req.params.id as string;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      res.status(400).json({ error: 'A valid cancellation reason is required' });
      return;
    }

    const exp = await get<any>(`SELECT * FROM expenses WHERE id = ? AND business_id = ?`, [expenseId, businessId]);
    if (!exp) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    await run(`UPDATE expenses SET status = 'VOID', void_reason = ? WHERE id = ?`, [reason.trim(), expenseId]);

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'VOID',
      entityType: 'EXPENSE',
      entityId: expenseId,
      entityReference: exp.expense_number,
      reason: reason.trim()
    });

    broadcastToBusiness(businessId, {
      type: 'EXPENSE_VOIDED',
      payload: { expenseNumber: exp.expense_number, voidedBy: partnerName, reason: reason.trim() }
    });

    res.json({ success: true, message: 'Expense voided successfully' });
  } catch (error) {
    console.error('Error voiding expense:', error);
    res.status(500).json({ error: 'Failed to void expense' });
  }
});

export default router;
