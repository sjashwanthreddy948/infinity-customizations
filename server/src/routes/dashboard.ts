import { Router, Response } from 'express';
import { query, get } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { calculateOrderPartnerShare } from '../utils/partnerShare.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/dashboard/stats - 6 Core Financial Cards, T-Shirt metrics, Chart data, Recent Orders
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const { range = 'all', startDate, endDate } = req.query;

    const now = new Date();
    let dateFilter = '';
    const params: any[] = [businessId];

    if (range === 'today') {
      const today = now.toISOString().split('T')[0];
      dateFilter = ` AND order_date = ?`;
      params.push(today);
    } else if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      dateFilter = ` AND order_date >= ?`;
      params.push(weekAgo);
    } else if (range === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      dateFilter = ` AND order_date >= ?`;
      params.push(monthAgo);
    } else if (range === 'year') {
      const yearStart = `${now.getFullYear()}-01-01`;
      dateFilter = ` AND order_date >= ?`;
      params.push(yearStart);
    } else if (range === 'custom' && startDate && endDate) {
      dateFilter = ` AND order_date >= ? AND order_date <= ?`;
      params.push(startDate, endDate);
    }

    // 1. Overall Business Summary (Revenue, Total Cost, Profit, Available Amount, Total Orders, Pending Payments)
    const overallSql = `
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(selling_price), 0) as total_revenue,
        COALESCE(SUM(product_cost), 0) as total_product_cost,
        COALESCE(SUM(printing_cost), 0) as total_printing_cost,
        COALESCE(SUM(delivery_cost), 0) as total_delivery_cost,
        COALESCE(SUM(other_cost), 0) as total_other_cost,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(SUM(payment_received), 0) as total_payment_received,
        COALESCE(SUM(payment_pending), 0) as total_pending_payments,
        COALESCE(SUM(available_amount), 0) as total_available_amount
      FROM orders
      WHERE business_id = ? AND order_status != 'CANCELLED' ${dateFilter}
    `;
    const summary = await get<any>(overallSql, params);

    // Also get general business expenses in this period
    let expenseFilter = '';
    const expenseParams: any[] = [businessId];
    if (range === 'today') {
      expenseFilter = ` AND date = ?`;
      expenseParams.push(now.toISOString().split('T')[0]);
    } else if (range === 'week') {
      expenseFilter = ` AND date >= ?`;
      expenseParams.push(new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]);
    } else if (range === 'month') {
      expenseFilter = ` AND date >= ?`;
      expenseParams.push(new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]);
    } else if (range === 'year') {
      expenseFilter = ` AND date >= ?`;
      expenseParams.push(`${now.getFullYear()}-01-01`);
    } else if (range === 'custom' && startDate && endDate) {
      expenseFilter = ` AND date >= ? AND date <= ?`;
      expenseParams.push(startDate, endDate);
    }

    const generalExpRes = await get<any>(
      `SELECT COALESCE(SUM(amount), 0) as general_expenses FROM expenses WHERE business_id = ? AND status = 'ACTIVE' ${expenseFilter}`,
      expenseParams
    );
    const generalExpenses = generalExpRes?.general_expenses || 0;

    // 2. T-Shirt Specific Metrics
    const tshirtSql = `
      SELECT
        COUNT(*) as tshirt_orders,
        COALESCE(SUM(quantity), 0) as tshirts_sold,
        COALESCE(SUM(selling_price), 0) as tshirt_revenue,
        COALESCE(SUM(product_cost), 0) as tshirt_product_cost,
        COALESCE(SUM(printing_cost), 0) as tshirt_printing_cost,
        COALESCE(SUM(delivery_cost), 0) as tshirt_delivery_cost,
        COALESCE(SUM(total_cost), 0) as tshirt_total_cost,
        COALESCE(SUM(profit), 0) as tshirt_profit
      FROM orders
      WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED' ${dateFilter}
    `;
    const tshirtSummary = await get<any>(tshirtSql, params);

    // 3. Partner Profit Sharing Calculations (50/50 Shared on T-Shirts, ID Cards & Caps)
    const sharedSql = `
      SELECT
        COUNT(*) as shared_orders,
        COALESCE(SUM(selling_price), 0) as shared_revenue,
        COALESCE(SUM(total_cost), 0) as shared_cost,
        COALESCE(SUM(profit), 0) as shared_profit
      FROM orders
      WHERE business_id = ? AND is_partner_shared = 1 AND order_status != 'CANCELLED' ${dateFilter}
    `;
    const sharedSummary = await get<any>(sharedSql, params);

    const soleSql = `
      SELECT
        COUNT(*) as sole_orders,
        COALESCE(SUM(selling_price), 0) as sole_revenue,
        COALESCE(SUM(total_cost), 0) as sole_cost,
        COALESCE(SUM(profit), 0) as sole_profit
      FROM orders
      WHERE business_id = ? AND is_partner_shared = 0 AND order_status != 'CANCELLED' ${dateFilter}
    `;
    const soleSummary = await get<any>(soleSql, params);

    const sharedProfit = sharedSummary?.shared_profit || 0;
    const soleProfit = soleSummary?.sole_profit || 0;
    const jashwanthSharedPortion = Math.round(sharedProfit / 2);
    const rajshekarSharedPortion = sharedProfit - jashwanthSharedPortion;
    const jashwanthTotalProfit = jashwanthSharedPortion + soleProfit;
    const rajshekarTotalProfit = rajshekarSharedPortion;

    // 4. Revenue vs Cost vs Profit Chart Trend (Grouped by Date or Month)
    const trendSql = `
      SELECT
        order_date as date,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(total_cost), 0) as cost,
        COALESCE(SUM(profit), 0) as profit,
        COALESCE(SUM(payment_received), 0) as collected
      FROM orders
      WHERE business_id = ? AND order_status != 'CANCELLED' ${dateFilter}
      GROUP BY order_date
      ORDER BY order_date ASC
      LIMIT 30
    `;
    const chartTrend = await query<any>(trendSql, params);

    // 5. Product Profit Breakdown (T-Shirts vs Frames vs Mugs vs Others)
    const productBreakdown = await query<any>(
      `SELECT
        product_name,
        COALESCE(SUM(quantity), 0) as quantity_sold,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(total_cost), 0) as cost,
        COALESCE(SUM(profit), 0) as profit,
        MAX(is_partner_shared) as is_partner_shared
       FROM orders
       WHERE business_id = ? AND order_status != 'CANCELLED' ${dateFilter}
       GROUP BY product_name
       ORDER BY profit DESC`,
      params
    );

    // 6. Recent Orders (with Partner Attribution & Partner Share info)
    const recentOrdersRaw = await query<any>(
      `SELECT
        id, order_number, customer_name, customer_phone, product_name,
        quantity, selling_price, total_cost, profit, profit_margin,
        payment_received, payment_pending, available_amount, payment_status,
        order_date, created_by, created_by_name, is_tshirt, tshirt_size, tshirt_color,
        has_id_cards, is_partner_shared, created_at
       FROM orders
       WHERE business_id = ?
       ORDER BY created_at DESC
       LIMIT 8`,
      [businessId]
    );

    const recentOrders = recentOrdersRaw.map((o: any) => ({
      ...o,
      partner_share_allocation: calculateOrderPartnerShare(o)
    }));

    // 7. Business Profile
    const business = await get<any>(`SELECT name, currency_symbol FROM businesses WHERE id = ?`, [businessId]);

    res.json({
      businessName: business?.name || 'Infinity Customizations',
      currencySymbol: business?.currency_symbol || '₹',
      cards: {
        totalRevenue: summary?.total_revenue || 0,
        totalCost: summary?.total_cost || 0,
        totalProfit: summary?.total_profit || 0,
        availableAmount: summary?.total_available_amount || 0,
        totalOrders: summary?.total_orders || 0,
        pendingPayments: summary?.total_pending_payments || 0,
        generalExpenses
      },
      partnerShares: {
        agreementRule: 'Equal 50/50 partnership profit share between Jashwanth Reddy and Rajshekar Reddy for all T-Shirts, ID Cards & Caps orders.',
        sharedOrdersCount: sharedSummary?.shared_orders || 0,
        sharedRevenue: sharedSummary?.shared_revenue || 0,
        sharedCost: sharedSummary?.shared_cost || 0,
        sharedProfit,
        soleOrdersCount: 0,
        soleRevenue: 0,
        soleCost: 0,
        soleProfit: 0,
        jashwanth: {
          name: 'Jashwanth Reddy',
          role: 'Co-Owner & Partner',
          sharedProfit: jashwanthSharedPortion,
          soleProfit: 0,
          totalProfit: jashwanthTotalProfit,
          sharePercentage: 50
        },
        rajshekar: {
          name: 'Rajshekar Reddy',
          role: 'Co-Owner & Partner',
          sharedProfit: rajshekarSharedPortion,
          soleProfit: 0,
          totalProfit: rajshekarTotalProfit,
          sharePercentage: 50
        }
      },
      tshirtOverview: {
        tshirtRevenue: tshirtSummary?.tshirt_revenue || 0,
        tshirtProductCost: tshirtSummary?.tshirt_product_cost || 0,
        tshirtPrintingCost: tshirtSummary?.tshirt_printing_cost || 0,
        tshirtDeliveryCost: tshirtSummary?.tshirt_delivery_cost || 0,
        tshirtTotalCost: tshirtSummary?.tshirt_total_cost || 0,
        tshirtProfit: tshirtSummary?.tshirt_profit || 0,
        tshirtsSold: tshirtSummary?.tshirts_sold || 0,
        tshirtOrders: tshirtSummary?.tshirt_orders || 0
      },
      chartTrend,
      productBreakdown,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
