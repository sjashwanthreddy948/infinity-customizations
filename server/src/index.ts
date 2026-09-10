import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, get } from './db/index.js';
import { seedDemoData } from './db/seed.js';
import { initWebSocketServer } from './services/websocketService.js';

// Route imports
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import tshirtsRoutes from './routes/tshirts.js';
import aiRoutes from './routes/ai.js';
import dashboardRoutes from './routes/dashboard.js';
import customersRoutes from './routes/customers.js';
import invoicesRoutes from './routes/invoices.js';
import expensesRoutes from './routes/expenses.js';
import reportsRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import productsRoutes from './routes/products.js';
import activityRoutes from './routes/activity.js';
import profitLossRoutes from './routes/profitLoss.js';
import settingsRoutes from './routes/settings.js';
import cashBankRoutes from './routes/cashBank.js';
import paymentsRoutes from './routes/payments.js';
import ledgerRoutes from './routes/ledger.js';
import notificationsRoutes from './routes/notifications.js';
import documentsRoutes from './routes/documents.js';
import salesRoutes from './routes/sales.js';
import quotationsRoutes from './routes/quotations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Security & Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tshirts', tshirtsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/profit-loss', profitLossRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cash-bank', cashBankRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/quotations', quotationsRoutes);

// Demo seed / reset endpoint
app.post('/api/demo/seed', async (req, res) => {
  try {
    const result = await seedDemoData();
    res.json({
      message: 'Infinity Customizations demo database seeded successfully.',
      ...result
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'INFINITY CUSTOMIZATIONS API', timestamp: new Date().toISOString() });
});

// Serve frontend static build in production
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Infinity Customizations API</title></head>
        <body style="font-family: sans-serif; padding: 40px; background: #082A5E; color: #ffffff;">
          <h1>Infinity Customizations Backend Running</h1>
          <p>The backend API is running on port ${process.env.PORT || 4000}. Run <code>npm run dev</code> in <code>client</code> to view the frontend.</p>
        </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await getDb();

    // Auto seed if business doesn't exist
    const existing = await get(`SELECT id FROM businesses WHERE name = 'Infinity Customizations'`);
    if (!existing) {
      console.log('Seeding initial demo data for Infinity Customizations...');
      await seedDemoData();
    }

    const portNumber = Number(PORT);
    server.listen(portNumber, '0.0.0.0', () => {
      console.log(`🚀 Infinity Customizations server listening on http://0.0.0.0:${portNumber}`);
      console.log(`⚡ WebSocket live sync available at ws://0.0.0.0:${portNumber}/ws`);
    });
  } catch (error) {
    console.error('Fatal server startup error:', error);
    process.exit(1);
  }
}

start();
