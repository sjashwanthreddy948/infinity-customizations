import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query } from '../db/index.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { partner, action, entityType, search } = req.query;

    let sql = `SELECT * FROM audit_logs WHERE business_id = ?`;
    const params: any[] = [businessId];

    if (partner && partner !== 'ALL') {
      sql += ` AND (actor_id = ? OR actor_name LIKE ?)`;
      params.push(partner, `%${partner}%`);
    }

    if (action && action !== 'ALL') {
      sql += ` AND action = ?`;
      params.push(action);
    }

    if (entityType && entityType !== 'ALL') {
      sql += ` AND entity_type = ?`;
      params.push(entityType);
    }

    if (search) {
      sql += ` AND (actor_name LIKE ? OR entity_reference LIKE ? OR reason LIKE ? OR entity_type LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT 200`;
    const logs = await query<any>(sql, params);

    res.json(logs.map(log => {
      let parsedOld = null;
      let parsedNew = null;
      try {
        if (log.old_value) parsedOld = JSON.parse(log.old_value);
      } catch {
        parsedOld = log.old_value;
      }
      try {
        if (log.new_value) parsedNew = JSON.parse(log.new_value);
      } catch {
        parsedNew = log.new_value;
      }

      return {
        id: log.id,
        actorId: log.actor_id,
        actorName: log.actor_name,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        entityReference: log.entity_reference,
        oldValue: parsedOld,
        newValue: parsedNew,
        reason: log.reason,
        ipAddress: log.ip_address,
        createdAt: log.created_at
      };
    }));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch partner activity audit logs' });
  }
});

export default router;
