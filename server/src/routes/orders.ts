import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { broadcastToBusiness } from '../services/websocketService.js';
import { isPartnerSharedProduct, calculateOrderPartnerShare } from '../utils/partnerShare.js';
import { calculateOrderFinancials } from '../utils/financialCalculations.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/orders - List all orders with filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const { search, product, payment_status, is_tshirt, startDate, endDate, limit = '100', offset = '0' } = req.query;

    let sql = `
      SELECT o.*, c.email as customer_email, c.address as customer_address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.business_id = ?
    `;
    const params: any[] = [businessId];

    if (search) {
      sql += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.product_name LIKE ? OR o.notes LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (product) {
      sql += ` AND o.product_name = ?`;
      params.push(product);
    }

    if (payment_status) {
      sql += ` AND o.payment_status = ?`;
      params.push(payment_status);
    }

    if (is_tshirt !== undefined && is_tshirt !== '') {
      sql += ` AND o.is_tshirt = ?`;
      params.push(is_tshirt === '1' || is_tshirt === 'true' ? 1 : 0);
    }

    if (startDate) {
      sql += ` AND o.order_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND o.order_date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const orders = await query(sql, params);
    const enriched = orders.map((o: any) => ({
      ...o,
      partner_share_allocation: calculateOrderPartnerShare(o)
    }));
    res.json(enriched);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/:id - Get order details with items and payments
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const orderId = req.params.id as string;

    const order = await get(
      `SELECT o.*, c.email as customer_email, c.address as customer_address
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ? AND o.business_id = ?`,
      [orderId, businessId]
    );

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const items = await query(`SELECT * FROM order_items WHERE order_id = ?`, [orderId]);
    const payments = await query(`SELECT * FROM payments WHERE order_id = ? ORDER BY date DESC, created_at DESC`, [orderId]);
    const invoice = order.invoice_id
      ? await get(`SELECT * FROM invoices WHERE id = ? AND business_id = ?`, [order.invoice_id, businessId])
      : null;

    res.json({
      ...order,
      partner_share_allocation: calculateOrderPartnerShare(order),
      items,
      payments,
      invoice
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

/**
 * POST /api/orders - Create a new order with automated exact calculations
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const customer_name = req.body.customer_name || req.body.customerName;
    const customer_phone = req.body.customer_phone || req.body.customerPhone;
    const customer_email = req.body.customer_email || req.body.customerEmail;
    const customer_address = req.body.customer_address || req.body.customerAddress;
    const product_id = req.body.product_id || req.body.productId;
    const product_name = req.body.product_name || req.body.productName;
    const quantity = req.body.quantity ?? 1;
    const selling_price = req.body.selling_price ?? req.body.sellingPrice ?? 0;
    const payment_received = req.body.payment_received ?? req.body.paymentReceived ?? 0;
    const product_cost = req.body.product_cost ?? req.body.productCost ?? 0;
    const printing_cost = req.body.printing_cost ?? req.body.printingCost ?? 0;
    const delivery_cost = req.body.delivery_cost ?? req.body.deliveryCost ?? 0;
    const other_cost = req.body.other_cost ?? req.body.otherCost ?? 0;
    const order_date = req.body.order_date || req.body.orderDate;
    const notes = req.body.notes || '';
    const is_tshirt = req.body.is_tshirt !== undefined ? req.body.is_tshirt : (req.body.isTshirt !== undefined ? (req.body.isTshirt ? 1 : 0) : 0);
    const tshirt_size = req.body.tshirt_size || req.body.tshirtSize;
    const tshirt_color = req.body.tshirt_color || req.body.tshirtColor;
    const tshirt_print_type = req.body.tshirt_print_type || req.body.tshirtPrintType;
    const tshirt_front_print = req.body.tshirt_front_print ?? req.body.tshirtFrontPrint ?? 0;
    const tshirt_back_print = req.body.tshirt_back_print ?? req.body.tshirtBackPrint ?? 0;
    const tshirt_sleeve_print = req.body.tshirt_sleeve_print ?? req.body.tshirtSleevePrint ?? 0;
    const tshirt_design_notes = req.body.tshirt_design_notes || req.body.tshirtDesignNotes;

    const tshirt_size_breakdown = req.body.tshirt_size_breakdown || req.body.sizeBreakdown ? (typeof (req.body.tshirt_size_breakdown || req.body.sizeBreakdown) === 'object' ? JSON.stringify(req.body.tshirt_size_breakdown || req.body.sizeBreakdown) : String(req.body.tshirt_size_breakdown || req.body.sizeBreakdown)) : null;
    const print_meters = Math.max(0, Number(req.body.print_meters ?? req.body.printMeters ?? 0));
    const print_rate_per_meter = Math.max(0, Math.round(Number(req.body.print_rate_per_meter ?? req.body.printRatePerMeter ?? 300)));
    const tshirt_rapido_cost = Math.max(0, Math.round(Number(req.body.tshirt_rapido_cost ?? req.body.tshirtRapidoCost ?? 0)));
    const print_rapido_cost = Math.max(0, Math.round(Number(req.body.print_rapido_cost ?? req.body.printRapidoCost ?? 0)));

    const tshirt_neck_type = req.body.tshirt_neck_type || req.body.tshirtNeckType || 'Round Neck';
    const tshirt_fabric = req.body.tshirt_fabric || req.body.tshirtFabric || 'Pure Cotton';
    const tshirt_variants_raw = req.body.tshirt_variants || req.body.tshirtVariants || req.body.variants;
    const tshirt_variants_str = tshirt_variants_raw ? (typeof tshirt_variants_raw === 'object' ? JSON.stringify(tshirt_variants_raw) : String(tshirt_variants_raw)) : null;

    // ID Cards Add-On Fields
    const has_id_cards = req.body.has_id_cards !== undefined ? (req.body.has_id_cards ? 1 : 0) : (req.body.hasIdCards ? 1 : 0);
    const id_card_quantity = Math.max(0, parseInt(req.body.id_card_quantity ?? req.body.idCardQuantity ?? 0, 10));
    const id_card_type = req.body.id_card_type || req.body.idCardType || 'PVC Card + Printed Lanyard';
    const id_card_unit_cost = Math.max(0, Math.round(Number(req.body.id_card_unit_cost ?? req.body.idCardUnitCost ?? 0)));
    const id_card_unit_price = Math.max(0, Math.round(Number(req.body.id_card_unit_price ?? req.body.idCardUnitPrice ?? 0)));
    const id_card_total_cost = Math.max(0, Math.round(Number(req.body.id_card_total_cost ?? req.body.idCardTotalCost ?? (has_id_cards ? id_card_quantity * id_card_unit_cost : 0))));
    const id_card_total_price = Math.max(0, Math.round(Number(req.body.id_card_total_price ?? req.body.idCardTotalPrice ?? (has_id_cards ? id_card_quantity * id_card_unit_price : 0))));

    // Parse variants if provided
    let variants: any[] = [];
    if (Array.isArray(tshirt_variants_raw)) {
      variants = tshirt_variants_raw;
    } else if (typeof tshirt_variants_raw === 'string') {
      try {
        const parsed = JSON.parse(tshirt_variants_raw);
        if (Array.isArray(parsed)) variants = parsed;
      } catch (e) {}
    }

    if (!customer_name || !customer_phone || !product_name) {
      res.status(400).json({ error: 'Customer name, phone, and product name are required' });
      return;
    }

    // Number sanitization
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const sellPrice = Math.max(0, Math.round(Number(selling_price) || 0));
    const payReceived = Math.max(0, Math.round(Number(payment_received) || 0));
    const prodCost = Math.max(0, Math.round(Number(product_cost) || 0));
    
    // Printing cost: if print_meters is provided and > 0, calculate as meters * rate, otherwise use printing_cost
    let printCost = Math.max(0, Math.round(Number(printing_cost) || 0));
    if (print_meters > 0) {
      printCost = Math.round(print_meters * print_rate_per_meter);
    }
    
    const delCost = Math.max(0, Math.round(Number(delivery_cost) || 0));
    const othCost = Math.max(0, Math.round(Number(other_cost) || 0));

    // Centralized Single Source of Truth Financial Calculation
    const financials = calculateOrderFinancials({
      sellingPrice: sellPrice,
      productCost: prodCost + (has_id_cards ? id_card_total_cost : 0),
      printingCost: printCost,
      tshirtRapidoCost: tshirt_rapido_cost,
      printRapidoCost: print_rapido_cost,
      deliveryCost: delCost,
      otherCost: othCost,
      paymentReceived: payReceived
    });

    const total_cost = financials.totalCost;
    const profit = financials.profit;
    const profit_margin = financials.profitMargin;
    const available_amount = financials.availableAmount;
    const payment_pending = financials.paymentPending;
    const payment_status = financials.paymentStatus === 'PAID' ? 'PAID' : (financials.paymentStatus === 'PARTIAL' ? 'PARTIALLY_PAID' : 'PENDING');

    // Find or create customer
    let customer = await get<any>(
      `SELECT * FROM customers WHERE phone = ? AND business_id = ?`,
      [customer_phone.trim(), businessId]
    );

    let customerId: string;
    if (customer) {
      customerId = customer.id;
      // Update customer info if newly provided
      if (customer_email || customer_address) {
        await run(
          `UPDATE customers SET email = COALESCE(?, email), address = COALESCE(?, address) WHERE id = ?`,
          [customer_email || null, customer_address || null, customerId]
        );
      }
    } else {
      customerId = uuidv4();
      const countRes = await get<any>(`SELECT COUNT(*) as count FROM customers WHERE business_id = ?`, [businessId]);
      const customerCode = `CUST-${((countRes?.count || 0) + 1).toString().padStart(4, '0')}`;
      await run(
        `INSERT INTO customers (id, business_id, customer_code, name, phone, email, address, total_orders, total_spent, total_paid, outstanding_balance, total_profit_generated, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, datetime('now'))`,
        [customerId, businessId, customerCode, customer_name.trim(), customer_phone.trim(), customer_email || null, customer_address || null]
      );
    }

    // Generate Order Number
    const orderCountRes = await get<any>(`SELECT COUNT(*) as count FROM orders WHERE business_id = ?`, [businessId]);
    const orderNumber = `ORD-${(1001 + (orderCountRes?.count || 0)).toString()}`;
    const orderId = uuidv4();

    // Generate Invoice Number & ID
    const invCountRes = await get<any>(`SELECT COUNT(*) as count FROM invoices WHERE business_id = ?`, [businessId]);
    const invoiceNumber = `INV-2026-${((invCountRes?.count || 0) + 1).toString().padStart(4, '0')}`;
    const invoiceId = uuidv4();

    const todayStr = order_date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const isTshirtVal = is_tshirt || (product_name.toLowerCase().includes('t-shirt') || product_name.toLowerCase().includes('tshirt')) ? 1 : 0;
    const isPartnerSharedVal = isPartnerSharedProduct(product_name, isTshirtVal, has_id_cards) ? 1 : 0;

    // 1. Insert Order
    await run(
      `INSERT INTO orders (
        id, business_id, order_number, customer_id, customer_name, customer_phone,
        product_id, product_name, quantity, selling_price, payment_received, payment_pending,
        product_cost, printing_cost, delivery_cost, other_cost, total_cost, profit, profit_margin,
        available_amount, payment_status, order_status, order_date, notes, created_by, created_by_name,
        is_tshirt, tshirt_size, tshirt_color, tshirt_size_breakdown, print_meters, print_rate_per_meter,
        tshirt_rapido_cost, print_rapido_cost, tshirt_print_type, tshirt_front_print, tshirt_back_print,
        tshirt_sleeve_print, tshirt_design_notes, tshirt_neck_type, tshirt_fabric, tshirt_variants,
        has_id_cards, id_card_quantity, id_card_type, id_card_unit_cost, id_card_unit_price,
        id_card_total_cost, id_card_total_price, is_partner_shared, invoice_id, invoice_number, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 'COMPLETED', ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        orderId, businessId, orderNumber, customerId, customer_name.trim(), customer_phone.trim(),
        product_id || null, product_name, qty, sellPrice, payReceived, payment_pending,
        prodCost, printCost, delCost, othCost, total_cost, profit, profit_margin,
        available_amount, payment_status, todayStr, notes, partnerId, partnerName,
        isTshirtVal, tshirt_size || null, tshirt_color || null, tshirt_size_breakdown || null, print_meters, print_rate_per_meter,
        tshirt_rapido_cost, print_rapido_cost, tshirt_print_type || null,
        tshirt_front_print ? 1 : 0, tshirt_back_print ? 1 : 0, tshirt_sleeve_print ? 1 : 0,
        tshirt_design_notes || null, tshirt_neck_type, tshirt_fabric, tshirt_variants_str,
        has_id_cards, id_card_quantity, id_card_type, id_card_unit_cost, id_card_unit_price,
        id_card_total_cost, id_card_total_price, isPartnerSharedVal, invoiceId, invoiceNumber, nowIso, nowIso
      ]
    );

    // 2. Generate Invoice
    await run(
      `INSERT INTO invoices (
        id, business_id, invoice_number, order_id, customer_id, customer_name, customer_phone, customer_email, customer_address,
        issue_date, due_date, subtotal, discount, tax_amount, grand_total, amount_paid,
        balance_due, status, payment_method, notes, terms, created_by, created_by_name, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 0, 0, ?, ?,
        ?, ?, 'UPI', ?, 'Thank you for choosing Infinity Customizations! We craft memories with precision.', ?, ?, ?, ?
      )`,
      [
        invoiceId, businessId, invoiceNumber, orderId, customerId, customer_name.trim(), customer_phone.trim(), customer_email || null, customer_address || null,
        todayStr, todayStr, sellPrice, sellPrice, payReceived,
        payment_pending, payment_status, notes, partnerId, partnerName, nowIso, nowIso
      ]
    );

    // 3. Insert Itemized Order Items & Invoice Items (Variants & ID Cards)
    if (variants && variants.length > 0) {
      for (const v of variants) {
        const neck = v.neckType || v.neck_type || tshirt_neck_type || 'Round Neck';
        const fabric = v.fabric || tshirt_fabric || 'Pure Cotton';
        const color = v.color || tshirt_color || 'Standard';
        const vQty = Math.max(1, Number(v.quantity) || 1);
        const vRate = Math.max(0, Number(v.unitSellingPrice ?? v.unit_selling_price ?? v.unit_price) || Math.round(sellPrice / qty));
        const vTotal = vQty * vRate;

        let sizeStr = '';
        if (v.sizes && typeof v.sizes === 'object') {
          const parts = Object.entries(v.sizes)
            .filter(([_, cnt]) => Number(cnt) > 0)
            .map(([sz, cnt]) => `${sz}: ${cnt}`);
          if (parts.length > 0) sizeStr = ` [${parts.join(', ')}]`;
        }
        const itemDesc = `Custom T-Shirt - ${neck}, ${fabric} (${color})${sizeStr}`;

        await run(
          `INSERT INTO order_items (id, order_id, product_name, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), orderId, itemDesc, vQty, vRate, vTotal]
        );
        await run(
          `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), invoiceId, itemDesc, vQty, vRate, vTotal]
        );
      }
    } else {
      const itemDesc = isTshirtVal && tshirt_color
        ? `${product_name} - ${tshirt_neck_type}, ${tshirt_fabric} (${tshirt_color}${tshirt_size_breakdown ? ` [${tshirt_size_breakdown}]` : (tshirt_size ? ` - ${tshirt_size}` : '')})`
        : product_name;
      await run(
        `INSERT INTO order_items (id, order_id, product_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderId, itemDesc, qty, Math.round(sellPrice / qty), sellPrice]
      );
      await run(
        `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), invoiceId, itemDesc, qty, Math.round(sellPrice / qty), sellPrice]
      );
    }

    // Insert ID Cards items if included
    if (has_id_cards && id_card_quantity > 0) {
      const cardDesc = `Custom ID Cards - ${id_card_type || 'PVC Card + Printed Lanyard'}`;
      await run(
        `INSERT INTO order_items (id, order_id, product_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderId, cardDesc, id_card_quantity, id_card_unit_price, id_card_total_price]
      );
      await run(
        `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), invoiceId, cardDesc, id_card_quantity, id_card_unit_price, id_card_total_price]
      );
    }

    // 5. Insert Payment if customer paid
    if (payReceived > 0) {
      const paymentCountRes = await get<any>(`SELECT COUNT(*) as count FROM payments WHERE business_id = ?`, [businessId]);
      const payNumber = `PAY-${(1001 + (paymentCountRes?.count || 0)).toString()}`;
      await run(
        `INSERT INTO payments (
          id, business_id, payment_number, order_id, invoice_id, customer_id, customer_name,
          amount, payment_method, date, notes, recorded_by, recorded_by_name, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, 'UPI', ?, 'Order payment recorded', ?, ?, ?
        )`,
        [uuidv4(), businessId, payNumber, orderId, invoiceId, customerId, customer_name.trim(), payReceived, todayStr, partnerId, partnerName, nowIso]
      );
    }

    // 6. Update Customer stats
    await run(
      `UPDATE customers
       SET total_orders = total_orders + 1,
           total_spent = total_spent + ?,
           total_paid = total_paid + ?,
           outstanding_balance = outstanding_balance + ?,
           total_profit_generated = total_profit_generated + ?
       WHERE id = ?`,
      [sellPrice, payReceived, payment_pending, profit, customerId]
    );

    // 7. Audit Log
    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'CREATE',
      entityType: 'ORDER',
      entityId: orderId,
      entityReference: orderNumber,
      newValue: {
        orderNumber,
        customerName: customer_name,
        productName: product_name,
        quantity: qty,
        sellingPrice: sellPrice,
        totalCost: total_cost,
        profit,
        profitMargin: profit_margin,
        availableAmount: available_amount,
        paymentStatus: payment_status
      },
      reason: 'New order created'
    });

    // 8. WebSocket Broadcast
    broadcastToBusiness(businessId, {
      type: 'ORDER_CREATED',
      payload: {
        orderId,
        orderNumber,
        customerName: customer_name,
        productName: product_name,
        sellingPrice: sellPrice,
        profit,
        createdByName: partnerName,
        createdAt: nowIso
      }
    });

    const createdOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * PUT /api/orders/:id - Update an order with exact recalculations and audit diff
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;
    const orderId = req.params.id as string;

    const existing = await get<any>(`SELECT * FROM orders WHERE id = ? AND business_id = ?`, [orderId, businessId]);
    if (!existing) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const {
      product_name = existing.product_name,
      quantity = existing.quantity,
      selling_price = existing.selling_price,
      payment_received = existing.payment_received,
      product_cost = existing.product_cost,
      printing_cost = existing.printing_cost,
      print_meters = existing.print_meters,
      print_rate_per_meter = existing.print_rate_per_meter,
      tshirt_rapido_cost = existing.tshirt_rapido_cost,
      print_rapido_cost = existing.print_rapido_cost,
      delivery_cost = existing.delivery_cost,
      other_cost = existing.other_cost,
      notes = existing.notes,
      order_date = existing.order_date,
      tshirt_size = existing.tshirt_size,
      tshirt_color = existing.tshirt_color,
      tshirt_size_breakdown = existing.tshirt_size_breakdown,
      tshirt_print_type = existing.tshirt_print_type,
      tshirt_neck_type = existing.tshirt_neck_type,
      tshirt_fabric = existing.tshirt_fabric,
      tshirt_variants = existing.tshirt_variants,
      has_id_cards = existing.has_id_cards,
      id_card_quantity = existing.id_card_quantity,
      id_card_type = existing.id_card_type,
      id_card_unit_cost = existing.id_card_unit_cost,
      id_card_unit_price = existing.id_card_unit_price,
      id_card_total_cost = existing.id_card_total_cost,
      id_card_total_price = existing.id_card_total_price,
      edit_reason = 'Order updated'
    } = req.body;

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const sellPrice = Math.max(0, Math.round(Number(selling_price) || 0));
    const payReceived = Math.max(0, Math.round(Number(payment_received) || 0));
    const prodCost = Math.max(0, Math.round(Number(product_cost) || 0));
    const pMeters = Math.max(0, Number(print_meters || 0));
    const pRate = Math.max(0, Math.round(Number(print_rate_per_meter || 300)));
    let printCost = Math.max(0, Math.round(Number(printing_cost) || 0));
    if (pMeters > 0) {
      printCost = Math.round(pMeters * pRate);
    }
    const tRapido = Math.max(0, Math.round(Number(tshirt_rapido_cost || 0)));
    const pRapido = Math.max(0, Math.round(Number(print_rapido_cost || 0)));
    const delCost = Math.max(0, Math.round(Number(delivery_cost) || 0));
    const othCost = Math.max(0, Math.round(Number(other_cost) || 0));

    const idCardTotalCost = Math.max(0, Math.round(Number(id_card_total_cost || 0)));
    const financials = calculateOrderFinancials({
      sellingPrice: sellPrice,
      productCost: prodCost + (has_id_cards ? idCardTotalCost : 0),
      printingCost: printCost,
      tshirtRapidoCost: tRapido,
      printRapidoCost: pRapido,
      deliveryCost: delCost,
      otherCost: othCost,
      paymentReceived: payReceived
    });

    const total_cost = financials.totalCost;
    const profit = financials.profit;
    const profit_margin = financials.profitMargin;
    const available_amount = financials.availableAmount;
    const payment_pending = financials.paymentPending;
    const payment_status = financials.paymentStatus === 'PAID' ? 'PAID' : (financials.paymentStatus === 'PARTIAL' ? 'PARTIALLY_PAID' : 'PENDING');

    const nowIso = new Date().toISOString();
    const sizeBdownStr = typeof tshirt_size_breakdown === 'object' ? JSON.stringify(tshirt_size_breakdown) : tshirt_size_breakdown;
    const variantsStr = typeof tshirt_variants === 'object' ? JSON.stringify(tshirt_variants) : tshirt_variants;

    await run(
      `UPDATE orders SET
        product_name = ?, quantity = ?, selling_price = ?, payment_received = ?, payment_pending = ?,
        product_cost = ?, printing_cost = ?, print_meters = ?, print_rate_per_meter = ?,
        tshirt_rapido_cost = ?, print_rapido_cost = ?, delivery_cost = ?, other_cost = ?, total_cost = ?,
        profit = ?, profit_margin = ?, available_amount = ?, payment_status = ?, notes = ?,
        order_date = ?, tshirt_size = ?, tshirt_color = ?, tshirt_size_breakdown = ?, tshirt_print_type = ?,
        tshirt_neck_type = ?, tshirt_fabric = ?, tshirt_variants = ?,
        has_id_cards = ?, id_card_quantity = ?, id_card_type = ?, id_card_unit_cost = ?, id_card_unit_price = ?,
        id_card_total_cost = ?, id_card_total_price = ?, updated_at = ?
       WHERE id = ? AND business_id = ?`,
      [
        product_name, qty, sellPrice, payReceived, payment_pending,
        prodCost, printCost, pMeters, pRate,
        tRapido, pRapido, delCost, othCost, total_cost,
        profit, profit_margin, available_amount, payment_status, notes,
        order_date, tshirt_size, tshirt_color, sizeBdownStr, tshirt_print_type,
        tshirt_neck_type, tshirt_fabric, variantsStr,
        has_id_cards ? 1 : 0, id_card_quantity, id_card_type, id_card_unit_cost, id_card_unit_price,
        idCardTotalCost, id_card_total_price, nowIso,
        orderId, businessId
      ]
    );

    // Update customer delta
    const deltaSpent = sellPrice - existing.selling_price;
    const deltaPaid = payReceived - existing.payment_received;
    const deltaProfit = profit - existing.profit;
    const deltaPending = payment_pending - existing.payment_pending;

    await run(
      `UPDATE customers
       SET total_spent = total_spent + ?,
           total_paid = total_paid + ?,
           outstanding_balance = outstanding_balance + ?,
           total_profit_generated = total_profit_generated + ?
       WHERE id = ?`,
      [deltaSpent, deltaPaid, deltaPending, deltaProfit, existing.customer_id]
    );

    // Update invoice if linked
    if (existing.invoice_id) {
      await run(
        `UPDATE invoices SET
          subtotal = ?, grand_total = ?, amount_paid = ?, balance_due = ?, status = ?, updated_at = ?
         WHERE id = ? AND business_id = ?`,
        [sellPrice, sellPrice, payReceived, payment_pending, payment_status, nowIso, existing.invoice_id, businessId]
      );
    }

    // Audit Log
    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'UPDATE',
      entityType: 'ORDER',
      entityId: orderId,
      entityReference: existing.order_number,
      oldValue: {
        sellingPrice: existing.selling_price,
        totalCost: existing.total_cost,
        profit: existing.profit,
        paymentReceived: existing.payment_received
      },
      newValue: {
        sellingPrice: sellPrice,
        totalCost: total_cost,
        profit,
        paymentReceived: payReceived
      },
      reason: edit_reason
    });

    broadcastToBusiness(businessId, {
      type: 'ORDER_UPDATED',
      payload: { orderId, orderNumber: existing.order_number, updatedBy: partnerName }
    });

    const updated = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * POST /api/orders/:id/payments - Record an additional payment for an order
 */
router.post('/:id/payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;
    const orderId = req.params.id as string;

    const order = await get<any>(`SELECT * FROM orders WHERE id = ? AND business_id = ?`, [orderId, businessId]);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const { amount, payment_method = 'UPI', date, notes = '' } = req.body;
    const paymentAmount = Math.max(0, Math.round(Number(amount) || 0));

    if (paymentAmount <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than 0' });
      return;
    }

    const newPaymentReceived = order.payment_received + paymentAmount;
    const newPaymentPending = Math.max(0, order.selling_price - newPaymentReceived);
    const newAvailableAmount = newPaymentReceived - order.total_cost;
    const newStatus = newPaymentReceived >= order.selling_price ? 'PAID' : 'PARTIALLY_PAID';
    const payDate = date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // 1. Insert Payment
    const paymentCountRes = await get<any>(`SELECT COUNT(*) as count FROM payments WHERE business_id = ?`, [businessId]);
    const paymentNumber = `PAY-${(1001 + (paymentCountRes?.count || 0)).toString()}`;
    const paymentId = uuidv4();

    await run(
      `INSERT INTO payments (
        id, business_id, payment_number, order_id, invoice_id, customer_id, customer_name,
        amount, payment_method, date, notes, recorded_by, recorded_by_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId, businessId, paymentNumber, orderId, order.invoice_id || null, order.customer_id,
        order.customer_name, paymentAmount, payment_method, payDate, notes, partnerId, partnerName, nowIso
      ]
    );

    // 2. Update Order
    await run(
      `UPDATE orders SET
        payment_received = ?, payment_pending = ?, available_amount = ?, payment_status = ?, updated_at = ?
       WHERE id = ?`,
      [newPaymentReceived, newPaymentPending, newAvailableAmount, newStatus, nowIso, orderId]
    );

    // 3. Update Invoice
    if (order.invoice_id) {
      await run(
        `UPDATE invoices SET
          amount_paid = ?, balance_due = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        [newPaymentReceived, newPaymentPending, newStatus, nowIso, order.invoice_id]
      );
    }

    // 4. Update Customer aggregates
    await run(
      `UPDATE customers SET
        total_paid = total_paid + ?, outstanding_balance = outstanding_balance - ?
       WHERE id = ?`,
      [paymentAmount, paymentAmount, order.customer_id]
    );

    // 5. Audit Log
    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'PAYMENT',
      entityType: 'ORDER',
      entityId: orderId,
      entityReference: order.order_number,
      newValue: { paymentAmount, totalReceived: newPaymentReceived, pending: newPaymentPending },
      reason: `Customer payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded`
    });

    broadcastToBusiness(businessId, {
      type: 'PAYMENT_RECORDED',
      payload: { orderNumber: order.order_number, amount: paymentAmount, recordedBy: partnerName }
    });

    const updatedOrder = await get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    res.json({ success: true, order: updatedOrder, paymentId });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

/**
 * POST /api/orders/:id/void - Cancel/Void an order with mandatory reason
 */
router.post('/:id/void', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;
    const orderId = req.params.id as string;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      res.status(400).json({ error: 'A valid cancellation reason is required' });
      return;
    }

    const order = await get<any>(`SELECT * FROM orders WHERE id = ? AND business_id = ?`, [orderId, businessId]);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.order_status === 'CANCELLED') {
      res.status(400).json({ error: 'Order is already cancelled' });
      return;
    }

    const nowIso = new Date().toISOString();

    await run(
      `UPDATE orders SET order_status = 'CANCELLED', void_reason = ?, updated_at = ? WHERE id = ?`,
      [reason.trim(), nowIso, orderId]
    );

    if (order.invoice_id) {
      await run(
        `UPDATE invoices SET status = 'CANCELLED', void_reason = ?, updated_at = ? WHERE id = ?`,
        [reason.trim(), nowIso, order.invoice_id]
      );
    }

    // Reverse customer stats
    await run(
      `UPDATE customers SET
        total_orders = MAX(0, total_orders - 1),
        total_spent = MAX(0, total_spent - ?),
        total_paid = MAX(0, total_paid - ?),
        outstanding_balance = MAX(0, outstanding_balance - ?),
        total_profit_generated = MAX(0, total_profit_generated - ?)
       WHERE id = ?`,
      [order.selling_price, order.payment_received, order.payment_pending, order.profit, order.customer_id]
    );

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'VOID',
      entityType: 'ORDER',
      entityId: orderId,
      entityReference: order.order_number,
      reason: reason.trim()
    });

    broadcastToBusiness(businessId, {
      type: 'ORDER_CANCELLED',
      payload: { orderNumber: order.order_number, cancelledBy: partnerName, reason: reason.trim() }
    });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
