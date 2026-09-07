import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query, get, run } from '../db/index.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// Get all settings & business profile
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;

    const business = await get<any>(
      `SELECT * FROM businesses WHERE id = ?`,
      [businessId]
    );

    const settings = await get<any>(
      `SELECT * FROM settings WHERE business_id = ?`,
      [businessId]
    );

    const partners = await query<any>(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, bm.role, bm.partner_share_percentage, bm.joined_at, bm.status
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id = ?
       ORDER BY bm.joined_at ASC`,
      [businessId]
    );

    const categories = await query<any>(
      `SELECT * FROM expense_categories WHERE business_id = ? ORDER BY is_default DESC, name ASC`,
      [businessId]
    );

    res.json({
      business,
      settings,
      partners,
      categories
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update business profile
router.put('/business', authenticate, requireRole(['OWNER', 'PARTNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const { name, phone, email, address, gstin, type, category } = req.body;

    const existing = await get<any>(`SELECT * FROM businesses WHERE id = ?`, [businessId]);

    await run(
      `UPDATE businesses 
       SET name = ?, phone = ?, email = ?, address = ?, gstin = ?, type = ?, category = ?
       WHERE id = ?`,
      [name || existing.name, phone || existing.phone, email || existing.email, address || existing.address, gstin ?? existing.gstin, type || existing.type, category || existing.category, businessId]
    );

    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'SETTINGS_CHANGE',
      entityType: 'SETTINGS',
      entityId: businessId,
      entityReference: name || existing.name,
      oldValue: existing,
      newValue: { name, phone, email, address, gstin },
      reason: 'Updated business profile information'
    });

    res.json({ message: 'Business profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update business profile' });
  }
});

// Update invoice / financial preferences
router.put('/preferences', authenticate, requireRole(['OWNER', 'PARTNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const { invoicePrefix, expensePrefix, defaultTaxRate, termsAndConditions } = req.body;

    const existing = await get<any>(`SELECT * FROM settings WHERE business_id = ?`, [businessId]);

    await run(
      `UPDATE settings 
       SET invoice_prefix = ?, expense_prefix = ?, default_tax_rate = ?, terms_and_conditions = ?, updated_at = datetime('now')
       WHERE business_id = ?`,
      [
        invoicePrefix || existing.invoice_prefix,
        expensePrefix || existing.expense_prefix,
        defaultTaxRate !== undefined ? Number(defaultTaxRate) : existing.default_tax_rate,
        termsAndConditions || existing.terms_and_conditions,
        businessId
      ]
    );

    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'SETTINGS_CHANGE',
      entityType: 'SETTINGS',
      entityId: businessId,
      entityReference: 'Invoice Preferences',
      reason: 'Updated financial invoice and tax settings'
    });

    res.json({ message: 'Preferences updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Invite / Add Partner
router.post('/partners/invite', authenticate, requireRole(['OWNER', 'PARTNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const { name, email, phone, role = 'PARTNER', partnerSharePercentage = 50, password = 'PartnerPassword@123' } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    let existingUser = await get<any>(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
    let newUserId = existingUser ? existingUser.id : uuidv4();
    const now = new Date().toISOString();

    if (!existingUser) {
      const hash = await bcrypt.hash(password, 10);
      await run(
        `INSERT INTO users (id, email, password_hash, full_name, phone, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)`,
        [newUserId, email.toLowerCase().trim(), hash, name, phone || '', now]
      );
    }

    // Check if already a member
    const existingMember = await get<any>(
      `SELECT id FROM business_members WHERE business_id = ? AND user_id = ?`,
      [businessId, newUserId]
    );

    if (existingMember) {
      res.status(400).json({ error: 'User is already a member of this business' });
      return;
    }

    await run(
      `INSERT INTO business_members (id, business_id, user_id, role, partner_share_percentage, joined_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [uuidv4(), businessId, newUserId, role, partnerSharePercentage, now]
    );

    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'ROLE_CHANGE',
      entityType: 'BUSINESS',
      entityId: newUserId,
      entityReference: `${name} (${role})`,
      reason: `Added new partner ${name} (${email}) with ${partnerSharePercentage}% share`
    });

    res.status(201).json({ message: 'Partner added successfully', userId: newUserId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add partner' });
  }
});

// Complete Data Export & Backup (Section 44)
router.get('/export-backup', authenticate, requireRole(['OWNER', 'PARTNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;

    const business = await get(`SELECT * FROM businesses WHERE id = ?`, [businessId]);
    const customers = await query(`SELECT * FROM customers WHERE business_id = ?`, [businessId]);
    const invoices = await query(`SELECT * FROM invoices WHERE business_id = ?`, [businessId]);
    const expenses = await query(`SELECT * FROM expenses WHERE business_id = ?`, [businessId]);
    const payments = await query(`SELECT * FROM payments WHERE business_id = ?`, [businessId]);
    const transactions = await query(`SELECT * FROM transactions WHERE business_id = ?`, [businessId]);
    const auditLogs = await query(`SELECT * FROM audit_logs WHERE business_id = ?`, [businessId]);

    res.json({
      exportDate: new Date().toISOString(),
      business,
      customers,
      invoices,
      expenses,
      payments,
      transactions,
      auditLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export backup' });
  }
});

export default router;
