import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/products - Get product catalog with default pricing and costs
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const products = await query(
      `SELECT * FROM products WHERE business_id = ? ORDER BY is_active DESC, name ASC`,
      [businessId]
    );
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * PUT /api/products/:id - Update product defaults
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const productId = req.params.id as string;
    const { default_selling_price, default_product_cost, default_printing_cost } = req.body;

    await run(
      `UPDATE products SET
        default_selling_price = COALESCE(?, default_selling_price),
        default_product_cost = COALESCE(?, default_product_cost),
        default_printing_cost = COALESCE(?, default_printing_cost)
       WHERE id = ? AND business_id = ?`,
      [
        default_selling_price !== undefined ? Math.round(Number(default_selling_price)) : null,
        default_product_cost !== undefined ? Math.round(Number(default_product_cost)) : null,
        default_printing_cost !== undefined ? Math.round(Number(default_printing_cost)) : null,
        productId,
        businessId
      ]
    );

    const updated = await get(`SELECT * FROM products WHERE id = ?`, [productId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating product defaults:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;
