import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query, get, run } from '../db/index.js';
import { logAudit } from '../services/auditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const businessId = (req as AuthenticatedRequest).businessId || 'common';
    const bDir = path.join(uploadsDir, businessId, 'documents');
    if (!fs.existsSync(bDir)) {
      fs.mkdirSync(bDir, { recursive: true });
    }
    cb(null, bDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

const router = Router();

// List documents
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const category = req.query.category as string;

    let sql = `SELECT * FROM documents WHERE business_id = ?`;
    const params: any[] = [businessId];

    if (category && category !== 'ALL') {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY created_at DESC`;
    const docs = await query<any>(sql, params);

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Upload document
router.post('/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const { title, category = 'General', relatedType, relatedId } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }

    const docId = uuidv4();
    const filePath = `/uploads/${businessId}/documents/${req.file.filename}`;
    const now = new Date().toISOString();

    await run(
      `INSERT INTO documents (id, business_id, title, file_name, file_path, file_size, mime_type, category, related_type, related_id, uploaded_by, uploaded_by_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId, businessId, title || req.file.originalname, req.file.originalname, filePath,
        req.file.size, req.file.mimetype, category, relatedType || null, relatedId || null,
        user.id, user.full_name, now
      ]
    );

    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'CREATE',
      entityType: 'BUSINESS',
      entityId: docId,
      entityReference: req.file.originalname,
      reason: `Uploaded business document: ${title || req.file.originalname}`
    });

    res.status(201).json({
      id: docId,
      title: title || req.file.originalname,
      fileName: req.file.originalname,
      filePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      category,
      uploadedByName: user.full_name,
      createdAt: now
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

export default router;
