import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query, run } from '../db/index.js';

const router = Router();

// List notifications
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const userId = req.user!.id;

    const notifs = await query<any>(
      `SELECT * FROM notifications 
       WHERE business_id = ? AND (user_id IS NULL OR user_id = ?)
       ORDER BY created_at DESC LIMIT 50`,
      [businessId, userId]
    );

    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const businessId = req.businessId!;

    await run(
      `UPDATE notifications SET read = 1 WHERE id = ? AND business_id = ?`,
      [id, businessId]
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.put('/mark-all-read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;

    await run(
      `UPDATE notifications SET read = 1 WHERE business_id = ?`,
      [businessId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
