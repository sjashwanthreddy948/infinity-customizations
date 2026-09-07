import { Router, Response } from 'express';
import { query, get } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/reports/financial - Comprehensive profit & loss report separating T-Shirts, Other Products, and Overall Profit
 */
router.get('/financial', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const { period = 'monthly', startDate, endDate } = req.query;

    let dateFilter = '';
    const params: any[] = [businessId];
    const now = new Date();

    if (period === 'daily') {
      const today = now.toISOString().split('T')[0];
      dateFilter = ` AND order_date = ?`;
      params.push(today);
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      dateFilter = ` AND order_date >= ?`;
      params.push(weekAgo);
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      dateFilter = ` AND order_date >= ?`;
      params.push(monthAgo);
    } else if (period === 'yearly') {
      const yearStart = `${now.getFullYear()}-01-01`;
      dateFilter = ` AND order_date >= ?`;
      params.push(yearStart);
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = ` AND order_date >= ? AND order_date <= ?`;
      params.push(startDate, endDate);
    }

    // 1. T-Shirt Profit Breakdown
    const tshirtSql = `
      SELECT
        COUNT(*) as orders_count,
        COALESCE(SUM(quantity), 0) as items_sold,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(product_cost), 0) as product_cost,
        COALESCE(SUM(printing_cost), 0) as printing_cost,
        COALESCE(SUM(delivery_cost), 0) as delivery_cost,
        COALESCE(SUM(other_cost), 0) as other_cost,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(profit), 0) as profit
      FROM orders
      WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED' ${dateFilter}
    `;
    const tshirt = await get<any>(tshirtSql, params);

    // 2. Other Products Profit Breakdown
    const otherSql = `
      SELECT
        COUNT(*) as orders_count,
        COALESCE(SUM(quantity), 0) as items_sold,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(product_cost), 0) as product_cost,
        COALESCE(SUM(printing_cost), 0) as printing_cost,
        COALESCE(SUM(delivery_cost), 0) as delivery_cost,
        COALESCE(SUM(other_cost), 0) as other_cost,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(profit), 0) as profit
      FROM orders
      WHERE business_id = ? AND is_tshirt = 0 AND order_status != 'CANCELLED' ${dateFilter}
    `;
    const other = await get<any>(otherSql, params);

    // 3. Overall Orders Summary
    const overallSql = `
      SELECT
        COUNT(*) as orders_count,
        COALESCE(SUM(quantity), 0) as items_sold,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(product_cost), 0) as product_cost,
        COALESCE(SUM(printing_cost), 0) as printing_cost,
        COALESCE(SUM(delivery_cost), 0) as delivery_cost,
        COALESCE(SUM(other_cost), 0) as other_cost,
        COALESCE(SUM(total_cost), 0) as order_total_cost,
        COALESCE(SUM(profit), 0) as gross_order_profit
      FROM orders
      WHERE business_id = ? AND order_status != 'CANCELLED' ${dateFilter}
    `;
    const overall = await get<any>(overallSql, params);

    // 4. General Expenses for the same period
    let expenseFilter = '';
    const expParams: any[] = [businessId];
    if (period === 'daily') {
      expenseFilter = ` AND date = ?`;
      expParams.push(now.toISOString().split('T')[0]);
    } else if (period === 'weekly') {
      expenseFilter = ` AND date >= ?`;
      expParams.push(new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]);
    } else if (period === 'monthly') {
      expenseFilter = ` AND date >= ?`;
      expParams.push(new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]);
    } else if (period === 'yearly') {
      expenseFilter = ` AND date >= ?`;
      expParams.push(`${now.getFullYear()}-01-01`);
    } else if (period === 'custom' && startDate && endDate) {
      expenseFilter = ` AND date >= ? AND date <= ?`;
      expParams.push(startDate, endDate);
    }

    const expRes = await get<any>(
      `SELECT COALESCE(SUM(amount), 0) as general_expenses FROM expenses WHERE business_id = ? AND status = 'ACTIVE' ${expenseFilter}`,
      expParams
    );
    const generalExpenses = expRes?.general_expenses || 0;

    const netBusinessProfit = (overall?.gross_order_profit || 0) - generalExpenses;

    // 5. Itemized Breakdown by Product
    const itemized = await query<any>(
      `SELECT
        product_name,
        is_tshirt,
        COUNT(*) as orders_count,
        COALESCE(SUM(quantity), 0) as items_sold,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(profit), 0) as profit,
        CASE WHEN SUM(selling_price) > 0 THEN ROUND((SUM(profit) * 100.0) / SUM(selling_price), 2) ELSE 0 END as margin_pct
       FROM orders
       WHERE business_id = ? AND order_status != 'CANCELLED' ${dateFilter}
       GROUP BY product_name, is_tshirt
       ORDER BY profit DESC`,
      params
    );

    res.json({
      period,
      tshirtProfit: {
        ordersCount: tshirt?.orders_count || 0,
        itemsSold: tshirt?.items_sold || 0,
        revenue: tshirt?.revenue || 0,
        productCost: tshirt?.product_cost || 0,
        printingCost: tshirt?.printing_cost || 0,
        deliveryCost: tshirt?.delivery_cost || 0,
        otherCost: tshirt?.other_cost || 0,
        totalCost: tshirt?.total_cost || 0,
        profit: tshirt?.profit || 0,
        margin: (tshirt?.revenue || 0) > 0 ? Math.round(((tshirt?.profit || 0) / tshirt.revenue) * 10000) / 100 : 0
      },
      otherProductProfit: {
        ordersCount: other?.orders_count || 0,
        itemsSold: other?.items_sold || 0,
        revenue: other?.revenue || 0,
        productCost: other?.product_cost || 0,
        printingCost: other?.printing_cost || 0,
        deliveryCost: other?.delivery_cost || 0,
        otherCost: other?.other_cost || 0,
        totalCost: other?.total_cost || 0,
        profit: other?.profit || 0,
        margin: (other?.revenue || 0) > 0 ? Math.round(((other?.profit || 0) / other.revenue) * 10000) / 100 : 0
      },
      overall: {
        totalRevenue: overall?.revenue || 0,
        totalProductCost: overall?.product_cost || 0,
        totalPrintingCost: overall?.printing_cost || 0,
        totalDeliveryCost: overall?.delivery_cost || 0,
        totalOtherCost: overall?.other_cost || 0,
        orderTotalCost: overall?.order_total_cost || 0,
        grossOrderProfit: overall?.gross_order_profit || 0,
        generalExpenses,
        netBusinessProfit,
        netMargin: (overall?.revenue || 0) > 0 ? Math.round((netBusinessProfit / overall.revenue) * 10000) / 100 : 0
      },
      itemized
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
});

export default router;
