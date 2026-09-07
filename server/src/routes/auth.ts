import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { run, get, query } from '../db/index.js';
import { JWT_SECRET, authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { seedDemoData } from '../db/seed.js';

const router = Router();

/**
 * POST /api/auth/login - User login with email and password
 */
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await get<any>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND status = 'ACTIVE'`,
      [email.trim()]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Get business membership
    const membership = await get<any>(
      `SELECT bm.*, b.name as business_name, b.currency, b.currency_symbol, b.phone as business_phone, b.address as business_address, b.gstin
       FROM business_members bm
       JOIN businesses b ON bm.business_id = b.id
       WHERE bm.user_id = ? AND bm.status = 'ACTIVE'
       LIMIT 1`,
      [user.id]
    );

    if (!membership) {
      res.status(403).json({ error: 'No active business membership found for this account' });
      return;
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      businessId: membership.business_id,
      role: membership.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Optional audit log for login
    try {
      await logAudit({
        businessId: membership.business_id,
        actorId: user.id,
        actorName: user.full_name,
        action: 'LOGIN',
        entityType: 'BUSINESS',
        entityId: membership.business_id,
        reason: 'Partner logged in'
      });
    } catch (e) {
      // Ignore audit fail on login
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        role: membership.role
      },
      business: {
        id: membership.business_id,
        name: membership.business_name,
        currency: membership.currency,
        currencySymbol: membership.currency_symbol,
        address: membership.business_address,
        gstin: membership.gstin
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me - Current session information
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const businessId = req.businessId!;

    const user = await get<any>(`SELECT id, email, full_name, phone, role, status FROM users WHERE id = ?`, [userId]);
    const business = await get<any>(`SELECT id, name, currency, currency_symbol, email, phone, address, gstin FROM businesses WHERE id = ?`, [businessId]);
    const membership = await get<any>(`SELECT role, partner_share_percentage, joined_at FROM business_members WHERE user_id = ? AND business_id = ?`, [userId, businessId]);

    // Also get partner details for this business
    const partners = await query<any>(
      `SELECT u.id, u.email, u.full_name, u.phone, bm.role, bm.partner_share_percentage
       FROM business_members bm
       JOIN users u ON bm.user_id = u.id
       WHERE bm.business_id = ?`,
      [businessId]
    );

    res.json({
      user: {
        ...user,
        role: membership?.role || user.role,
        share: membership?.partner_share_percentage || 50
      },
      business,
      partners
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * POST /api/auth/demo-switch - Switch instantly between Partner 1 and Partner 2
 */
router.post('/demo-switch', async (req, res): Promise<void> => {
  try {
    const partnerVal = req.body.partner ?? req.body.partnerNumber ?? 1;
    const isPartner2 = partnerVal === 2 || partnerVal === '2' || String(partnerVal).includes('2') || (req.body.email && (req.body.email.includes('alex') || req.body.email.includes('raj')));
    let targetEmail = isPartner2 ? 'rajshekar@infinitycustomizations.com' : 'jashwanth@infinitycustomizations.com';

    let user = await get<any>(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [targetEmail]);

    if (!user && isPartner2) {
      // Check if user still has legacy email alex@...
      user = await get<any>(`SELECT * FROM users WHERE LOWER(email) = 'alex@infinitycustomizations.com'`);
      if (user) {
        await run(`UPDATE users SET full_name = 'Rajshekar Reddy', email = 'rajshekar@infinitycustomizations.com' WHERE id = ?`, [user.id]);
        user.full_name = 'Rajshekar Reddy';
        user.email = 'rajshekar@infinitycustomizations.com';
      }
    }

    if (!user) {
      // Re-seed if missing
      await seedDemoData();
      user = await get<any>(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [targetEmail]);
    }

    const membership = await get<any>(
      `SELECT bm.*, b.name as business_name, b.currency, b.currency_symbol, b.phone as business_phone, b.address as business_address, b.gstin
       FROM business_members bm
       JOIN businesses b ON bm.business_id = b.id
       WHERE bm.user_id = ?
       LIMIT 1`,
      [user.id]
    );

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
        businessId: membership.business_id,
        role: membership.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: membership.role
      },
      business: {
        id: membership.business_id,
        name: membership.business_name,
        currencySymbol: membership.currency_symbol
      }
    });
  } catch (error) {
    console.error('Error switching demo partner:', error);
    res.status(500).json({ error: 'Failed to switch partner' });
  }
});

/**
 * POST /api/auth/seed - Re-seed demo database on demand
 */
router.post('/seed', async (req, res): Promise<void> => {
  try {
    const result = await seedDemoData();
    res.json({ success: true, message: 'Demo data seeded successfully', result });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

export default router;
