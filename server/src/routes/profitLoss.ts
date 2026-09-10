import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query, get } from '../db/index.js';

const router = Router();

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const { startDate, endDate, period = 'month' } = req.query;

    let dateFilter = '';
    const dateParams: any[] = [businessId];

    if (startDate && endDate) {
      dateFilter = ` AND date >= ? AND date <= ?`;
      dateParams.push(startDate, endDate);
    } else {
      const now = new Date();
      if (period === 'month') {
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        dateFilter = ` AND date >= ?`;
        dateParams.push(monthStart);
      } else if (period === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const qStartMonth = String(currentQuarter * 3 + 1).padStart(2, '0');
        const qStart = `${now.getFullYear()}-${qStartMonth}-01`;
        dateFilter = ` AND date >= ?`;
        dateParams.push(qStart);
      } else if (period === 'year') {
        const yearStart = `${now.getFullYear()}-01-01`;
        dateFilter = ` AND date >= ?`;
        dateParams.push(yearStart);
      }
    }

    // Filter for orders table (uses order_date)
    let orderDateFilter = '';
    const orderParams: any[] = [businessId];
    if (startDate && endDate) {
      orderDateFilter = ` AND order_date >= ? AND order_date <= ?`;
      orderParams.push(startDate, endDate);
    } else {
      const now = new Date();
      if (period === 'month') {
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        orderDateFilter = ` AND order_date >= ?`;
        orderParams.push(monthStart);
      } else if (period === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const qStartMonth = String(currentQuarter * 3 + 1).padStart(2, '0');
        const qStart = `${now.getFullYear()}-${qStartMonth}-01`;
        orderDateFilter = ` AND order_date >= ?`;
        orderParams.push(qStart);
      } else if (period === 'year') {
        const yearStart = `${now.getFullYear()}-01-01`;
        orderDateFilter = ` AND order_date >= ?`;
        orderParams.push(yearStart);
      }
    }

    // 1. Revenue: Customer Sales Orders
    const salesStats = await get<{ revenue: number; cost: number; profit: number }>(
      `SELECT COALESCE(SUM(selling_price), 0) as revenue, COALESCE(SUM(total_cost), 0) as cost, COALESCE(SUM(profit), 0) as profit
       FROM orders
       WHERE business_id = ? AND order_status != 'CANCELLED' ${orderDateFilter}`,
      orderParams
    );

    // Payments directly received
    const paymentsTotal = await get<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE business_id = ? ${dateFilter}`,
      dateParams
    );

    const totalSalesRevenue = salesStats?.revenue || 0;
    const directCost = salesStats?.cost || 0;

    // 2. Operating Expenses from expenses table
    const categoryExpenses = await query<any>(
      `SELECT category, COALESCE(SUM(amount), 0) as total 
       FROM expenses 
       WHERE business_id = ? AND status = 'ACTIVE' ${dateFilter}
       GROUP BY category 
       ORDER BY total DESC`,
      dateParams
    );

    let totalExpenses = 0;
    const formattedCategories = categoryExpenses.map(c => {
      totalExpenses += c.total;
      return {
        category: c.category,
        amount: Math.round(c.total)
      };
    });

    const netProfit = (salesStats?.profit || 0) - totalExpenses;
    const profitMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;

    // 3. Category-specific Order Performance for Partner Allocation
    const sharedOrderStats = await get<any>(
      `SELECT COALESCE(SUM(profit), 0) as profit, COALESCE(SUM(selling_price), 0) as revenue 
       FROM orders 
       WHERE business_id = ? AND is_partner_shared = 1 AND order_status != 'CANCELLED' ${orderDateFilter}`,
      orderParams
    );

    const soleOrderStats = await get<any>(
      `SELECT COALESCE(SUM(profit), 0) as profit, COALESCE(SUM(selling_price), 0) as revenue 
       FROM orders 
       WHERE business_id = ? AND is_partner_shared = 0 AND order_status != 'CANCELLED' ${orderDateFilter}`,
      orderParams
    );

    const sharedNet = sharedOrderStats?.profit || 0;
    const soleNet = soleOrderStats?.profit || 0;
    const jashwanthShared = Math.round(sharedNet / 2);
    const rajshekarShared = sharedNet - jashwanthShared;
    const jashwanthTotal = jashwanthShared + soleNet;
    const rajshekarTotal = rajshekarShared;

    res.json({
      period: {
        type: period,
        startDate: startDate || null,
        endDate: endDate || null
      },
      revenue: {
        salesRevenue: totalSalesRevenue,
        paymentsReceived: paymentsTotal?.total || 0,
        otherIncome: 0,
        totalRevenue: totalSalesRevenue
      },
      expenses: {
        categories: formattedCategories,
        directOrderCosts: directCost,
        totalExpenses: totalExpenses
      },
      netProfit,
      profitMargin: parseFloat(profitMargin.toFixed(1)),
      partnerAllocation: {
        agreement: 'Equal 50/50 partnership profit share between Jashwanth Reddy and Rajshekar Reddy for all T-Shirts, ID Cards & Caps orders.',
        sharedCategoryProfit: netProfit,
        sharedCategoryRevenue: totalSalesRevenue,
        soleCategoryProfit: 0,
        soleCategoryRevenue: 0,
        jashwanth: {
          name: 'Jashwanth Reddy',
          role: 'Co-Owner & Partner',
          sharedProfit: Math.round(netProfit / 2),
          soleProfit: 0,
          totalProfit: Math.round(netProfit / 2)
        },
        rajshekar: {
          name: 'Rajshekar Reddy',
          role: 'Co-Owner & Partner',
          sharedProfit: netProfit - Math.round(netProfit / 2),
          soleProfit: 0,
          totalProfit: netProfit - Math.round(netProfit / 2)
        }
      }
    });
  } catch (err: any) {
    console.error('ProfitLoss route error:', err);
    res.status(500).json({ error: 'Failed to generate profit and loss statement', details: err?.message });
  }
});

export default router;
