import { Router, Response } from 'express';
import { query, get } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/tshirts/analytics - Complete T-Shirt metrics, size & color distributions, and top orders
 */
router.get('/analytics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;

    // 1. Overall T-Shirt Totals
    const summary = await get<any>(
      `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(quantity), 0) as total_tshirts_sold,
        COALESCE(SUM(selling_price), 0) as total_revenue,
        COALESCE(SUM(product_cost), 0) as total_product_cost,
        COALESCE(SUM(printing_cost), 0) as total_printing_cost,
        COALESCE(SUM(delivery_cost), 0) as total_delivery_cost,
        COALESCE(SUM(other_cost), 0) as total_other_cost,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(profit), 0) as total_profit
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED'`,
      [businessId]
    );

    const totalSold = summary?.total_tshirts_sold || 0;
    const totalProfit = summary?.total_profit || 0;
    const avgProfitPerTshirt = totalSold > 0 ? Math.round(totalProfit / totalSold) : 0;
    const profitMargin = (summary?.total_revenue || 0) > 0
      ? Math.round((totalProfit / summary.total_revenue) * 10000) / 100
      : 0;

    // 2. Sales by Size (S, M, L, XL, XXL)
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const sizeBreakdownRaw = await query<any>(
      `SELECT
        tshirt_size,
        COALESCE(SUM(quantity), 0) as count,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(profit), 0) as profit
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED' AND tshirt_size IS NOT NULL
       GROUP BY tshirt_size`,
      [businessId]
    );

    const sizeMap: Record<string, { count: number; revenue: number; profit: number }> = {};
    for (const r of sizeBreakdownRaw) {
      if (r.tshirt_size) {
        sizeMap[r.tshirt_size.toUpperCase()] = {
          count: r.count,
          revenue: r.revenue,
          profit: r.profit
        };
      }
    }

    const salesBySize = sizes.map((s) => ({
      size: s,
      count: sizeMap[s]?.count || 0,
      revenue: sizeMap[s]?.revenue || 0,
      profit: sizeMap[s]?.profit || 0
    }));

    // 3. Sales by Color
    const salesByColor = await query<any>(
      `SELECT
        COALESCE(tshirt_color, 'Custom') as color,
        COALESCE(SUM(quantity), 0) as count,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(profit), 0) as profit
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED'
       GROUP BY tshirt_color
       ORDER BY count DESC`,
      [businessId]
    );

    // 4. Sales by Print Type
    const salesByPrintType = await query<any>(
      `SELECT
        COALESCE(tshirt_print_type, 'Standard Print') as print_type,
        COALESCE(SUM(quantity), 0) as count,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(profit), 0) as profit
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED'
       GROUP BY tshirt_print_type
       ORDER BY count DESC`,
      [businessId]
    );

    // 5. Monthly Trend
    const salesByMonth = await query<any>(
      `SELECT
        strftime('%Y-%m', order_date) as month,
        COALESCE(SUM(quantity), 0) as count,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(total_cost), 0) as cost,
        COALESCE(SUM(profit), 0) as profit
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED'
       GROUP BY strftime('%Y-%m', order_date)
       ORDER BY month ASC`,
      [businessId]
    );

    // 6. Sales by Neck Type (Round Neck vs Collar)
    const salesByNeckType = await query<any>(
      `SELECT
        COALESCE(tshirt_neck_type, 'Round Neck') as neck_type,
        COALESCE(SUM(quantity), 0) as count,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(profit), 0) as profit
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED'
       GROUP BY tshirt_neck_type
       ORDER BY count DESC`,
      [businessId]
    );

    // 7. Sales by Fabric (Pure Cotton, Cotton, Poly Cotton, Nano Curve)
    const salesByFabric = await query<any>(
      `SELECT
        COALESCE(tshirt_fabric, 'Pure Cotton') as fabric,
        COALESCE(SUM(quantity), 0) as count,
        COALESCE(SUM(selling_price), 0) as revenue,
        COALESCE(SUM(profit), 0) as profit
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED'
       GROUP BY tshirt_fabric
       ORDER BY count DESC`,
      [businessId]
    );

    // 8. ID Cards Add-On Summary
    const idCardsSummary = await get<any>(
      `SELECT
        COUNT(*) as orders_with_id_cards,
        COALESCE(SUM(id_card_quantity), 0) as total_id_cards_sold,
        COALESCE(SUM(id_card_total_price), 0) as id_card_revenue,
        COALESCE(SUM(id_card_total_cost), 0) as id_card_cost,
        COALESCE(SUM(id_card_total_price - id_card_total_cost), 0) as id_card_profit
       FROM orders
       WHERE business_id = ? AND has_id_cards = 1 AND order_status != 'CANCELLED'`,
      [businessId]
    );

    // 9. Top Performing T-Shirt Orders
    const topOrders = await query<any>(
      `SELECT
        id, order_number, customer_name, quantity, tshirt_size, tshirt_color,
        tshirt_print_type, tshirt_neck_type, tshirt_fabric, has_id_cards, id_card_quantity,
        selling_price, total_cost, profit, profit_margin,
        order_date, created_by_name
       FROM orders
       WHERE business_id = ? AND is_tshirt = 1 AND order_status != 'CANCELLED'
       ORDER BY profit DESC
       LIMIT 10`,
      [businessId]
    );

    res.json({
      summary: {
        totalOrders: summary?.total_orders || 0,
        totalTshirtsSold: totalSold,
        totalRevenue: summary?.total_revenue || 0,
        totalProductCost: summary?.total_product_cost || 0,
        totalPrintingCost: summary?.total_printing_cost || 0,
        totalDeliveryCost: summary?.total_delivery_cost || 0,
        totalOtherCost: summary?.total_other_cost || 0,
        totalCost: summary?.total_cost || 0,
        totalProfit: totalProfit,
        profitMargin,
        avgProfitPerTshirt
      },
      salesBySize,
      salesByColor,
      salesByPrintType,
      salesByMonth,
      salesByNeckType,
      salesByFabric,
      idCardsSummary: {
        ordersCount: idCardsSummary?.orders_with_id_cards || 0,
        totalSold: idCardsSummary?.total_id_cards_sold || 0,
        revenue: idCardsSummary?.id_card_revenue || 0,
        cost: idCardsSummary?.id_card_cost || 0,
        profit: idCardsSummary?.id_card_profit || 0
      },
      topOrders
    });
  } catch (error) {
    console.error('Error fetching t-shirt analytics:', error);
    res.status(500).json({ error: 'Failed to fetch t-shirt analytics' });
  }
});

export default router;
