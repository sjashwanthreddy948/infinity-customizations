import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthenticatedUser } from '../types/index.js';
import { get } from '../db/index.js';

export { AuthenticatedRequest, AuthenticatedUser };
export const JWT_SECRET = process.env.JWT_SECRET || 'partnerledger-super-secure-production-secret-2026';

export const authenticateToken = authenticate;
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
    
    // Verify user and membership exist in DB
    const member = await get<{
      id: string;
      business_id: string;
      role: 'OWNER' | 'PARTNER' | 'ACCOUNTANT' | 'STAFF';
      email: string;
      full_name: string;
      business_name: string;
    }>(
      `SELECT bm.id, bm.business_id, bm.role, u.id as user_id, u.email, u.full_name, b.name as business_name
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       JOIN businesses b ON b.id = bm.business_id
       WHERE bm.user_id = ? AND bm.business_id = ? AND bm.status = 'ACTIVE'`,
      [decoded.userId, decoded.businessId]
    );

    if (!member) {
      res.status(401).json({ error: 'Unauthorized: Active membership not found' });
      return;
    }

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: member.email,
      full_name: member.full_name,
      fullName: member.full_name,
      role: member.role,
      business_id: member.business_id,
      business_name: member.business_name
    };
    req.businessId = member.business_id;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
  }
}

export function requireRole(allowedRoles: ('OWNER' | 'PARTNER' | 'ACCOUNTANT' | 'STAFF')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Forbidden: Access restricted to roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}` 
      });
      return;
    }

    next();
  };
}
