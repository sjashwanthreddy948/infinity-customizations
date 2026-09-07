import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, run, query, get } from './index.js';

export async function seedDemoData(): Promise<{ businessId: string; partner1Email: string; partner2Email: string }> {
  await getDb();

  // Check if business already exists; if so, clear its data
  const existing = await get<any>(`SELECT id FROM businesses WHERE name = 'Infinity Customizations'`);
  if (existing) {
    const bId = existing.id;
    await run(`DELETE FROM audit_logs WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM payments WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM expenses WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = ?)`, [bId]);
    await run(`DELETE FROM invoices WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE business_id = ?)`, [bId]);
    await run(`DELETE FROM orders WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM products WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM customers WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM business_members WHERE business_id = ?`, [bId]);
    await run(`DELETE FROM businesses WHERE id = ?`, [bId]);
  }

  const businessId = uuidv4();
  const partner1Id = uuidv4();
  const partner2Id = uuidv4();
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const now = new Date();

  // 1. Create Business
  await run(
    `INSERT INTO businesses (id, name, type, email, phone, currency, currency_symbol, address, gstin, created_at)
     VALUES (?, 'Infinity Customizations', 'Partnership', 'hello@infinitycustomizations.com', '+91 98765 43210', 'INR', '₹', 'Plot 42, Designer Hub, Jubilee Hills, Hyderabad, Telangana 500033', '36AAACI1234F1Z5', ?)`,
    [businessId, new Date(now.getTime() - 120 * 86400000).toISOString()]
  );

  // 2. Create Users (Partner 1 & Partner 2)
  const u1 = await get<any>(`SELECT id FROM users WHERE email = 'jashwanth@infinitycustomizations.com'`);
  const actualP1Id = u1 ? u1.id : partner1Id;
  if (!u1) {
    await run(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, status, created_at)
       VALUES (?, 'jashwanth@infinitycustomizations.com', ?, 'Jashwanth Reddy', '+91 98765 00001', 'OWNER', 'ACTIVE', ?)`,
      [actualP1Id, passwordHash, new Date(now.getTime() - 120 * 86400000).toISOString()]
    );
  }

  const u2 = await get<any>(`SELECT id FROM users WHERE email = 'rajshekar@infinitycustomizations.com' OR email = 'alex@infinitycustomizations.com'`);
  const actualP2Id = u2 ? u2.id : partner2Id;
  if (!u2) {
    await run(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, status, created_at)
       VALUES (?, 'rajshekar@infinitycustomizations.com', ?, 'Rajshekar Reddy', '+91 98765 00002', 'PARTNER', 'ACTIVE', ?)`,
      [actualP2Id, passwordHash, new Date(now.getTime() - 120 * 86400000).toISOString()]
    );
  } else {
    await run(
      `UPDATE users SET full_name = 'Rajshekar Reddy', email = 'rajshekar@infinitycustomizations.com' WHERE id = ?`,
      [actualP2Id]
    );
  }

  // 3. Add to Business Members
  await run(
    `INSERT INTO business_members (id, business_id, user_id, role, partner_share_percentage, joined_at, status)
     VALUES (?, ?, ?, 'OWNER', 50.0, ?, 'ACTIVE')`,
    [uuidv4(), businessId, actualP1Id, new Date(now.getTime() - 120 * 86400000).toISOString()]
  );

  await run(
    `INSERT INTO business_members (id, business_id, user_id, role, partner_share_percentage, joined_at, status)
     VALUES (?, ?, ?, 'PARTNER', 50.0, ?, 'ACTIVE')`,
    [uuidv4(), businessId, actualP2Id, new Date(now.getTime() - 120 * 86400000).toISOString()]
  );

  // 4. Create Product Catalog with Defaults
  const productData = [
    { name: 'Custom Printed T-Shirt', category: 'Apparel', selling: 999, productCost: 350, printingCost: 200 },
    { name: 'Photo Frame', category: 'Frames & Decor', selling: 799, productCost: 250, printingCost: 150 },
    { name: 'Bouquet', category: 'Gifts & Flowers', selling: 1299, productCost: 500, printingCost: 100 },
    { name: 'Custom Mug', category: 'Drinkware', selling: 399, productCost: 100, printingCost: 80 },
    { name: 'Custom Cap', category: 'Apparel', selling: 499, productCost: 150, printingCost: 120 },
    { name: 'Personalized Album', category: 'Print & Albums', selling: 1899, productCost: 600, printingCost: 400 },
    { name: 'Polaroid Prints (Pack of 20)', category: 'Print & Albums', selling: 499, productCost: 100, printingCost: 100 },
    { name: 'Customized Calendar', category: 'Stationery', selling: 699, productCost: 180, printingCost: 150 },
    { name: 'Fridge Magnets (Set of 4)', category: 'Decor', selling: 299, productCost: 60, printingCost: 50 },
    { name: 'Customized Gift Hamper', category: 'Gifts & Flowers', selling: 1499, productCost: 500, printingCost: 250 },
    { name: 'Photo Restoration', category: 'Digital Services', selling: 899, productCost: 50, printingCost: 200 },
    { name: 'Other Customized Products', category: 'Custom', selling: 999, productCost: 300, printingCost: 200 }
  ];

  const productMap: Record<string, string> = {};
  for (const p of productData) {
    const pId = uuidv4();
    productMap[p.name] = pId;
    await run(
      `INSERT INTO products (id, business_id, name, category, default_selling_price, default_product_cost, default_printing_cost, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [pId, businessId, p.name, p.category, p.selling, p.productCost, p.printingCost, new Date(now.getTime() - 100 * 86400000).toISOString()]
    );
  }

  // 5. Create Customers
  const customerList = [
    { name: 'Rahul Sharma', phone: '+91 98490 11223', email: 'rahul.sharma@example.com', address: 'Flat 402, Banjara Hills, Hyderabad' },
    { name: 'Priya Patel', phone: '+91 98490 22334', email: 'priya.patel@example.com', address: 'Villa 18, Gachibowli, Hyderabad' },
    { name: 'Vikram Malhotra', phone: '+91 98490 33445', email: 'vikram.m@example.com', address: 'Plot 12, Madhapur, Hyderabad' },
    { name: 'Ananya Rao', phone: '+91 98490 44556', email: 'ananya.rao@example.com', address: 'Road No. 10, Jubilee Hills, Hyderabad' },
    { name: 'Sneha Gupta', phone: '+91 98490 55667', email: 'sneha.g@example.com', address: 'Apt 3B, Kondapur, Hyderabad' },
    { name: 'Karthik Iyer', phone: '+91 98490 66778', email: 'karthik.i@example.com', address: 'Cyber Towers Lane, Hitec City, Hyderabad' },
    { name: 'Neha Reddy', phone: '+91 98490 77889', email: 'neha.reddy@example.com', address: 'Prakash Nagar, Begumpet, Hyderabad' },
    { name: 'Arjun Nair', phone: '+91 98490 88990', email: 'arjun.nair@example.com', address: 'Phase 2, KPHB Colony, Kukatpally, Hyderabad' },
    { name: 'Divya Krishnan', phone: '+91 98490 99001', email: 'divya.k@example.com', address: 'Sindhi Colony, Secunderabad' },
    { name: 'Rohan Verma', phone: '+91 98490 00112', email: 'rohan.v@example.com', address: 'Puppalaguda, Manikonda, Hyderabad' },
    { name: 'Pooja Sundaram', phone: '+91 98491 11223', email: 'pooja.s@example.com', address: 'Kavuri Hills, Madhapur, Hyderabad' },
    { name: 'Sameer Joshi', phone: '+91 98491 22334', email: 'sameer.j@example.com', address: 'Raj Bhavan Road, Somajiguda, Hyderabad' }
  ];

  const customerMap: Record<string, { id: string; name: string; phone: string }> = {};
  for (let i = 0; i < customerList.length; i++) {
    const c = customerList[i];
    const cId = uuidv4();
    customerMap[c.name] = { id: cId, name: c.name, phone: c.phone };
    await run(
      `INSERT INTO customers (id, business_id, customer_code, name, phone, email, address, total_orders, total_spent, total_paid, outstanding_balance, total_profit_generated, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 'ACTIVE', ?)`,
      [cId, businessId, `CUST-${(i + 1).toString().padStart(4, '0')}`, c.name, c.phone, c.email, c.address, new Date(now.getTime() - 90 * 86400000).toISOString()]
    );
  }

  // 6. Create 25 Realistic Orders
  // Mix of T-Shirts (primary product) and other customized merchandise
  const rawOrders = [
    {
      customer: 'Rahul Sharma',
      product: 'Custom Printed T-Shirt',
      quantity: 2,
      sellingPrice: 2500,
      paymentReceived: 2500,
      productCost: 900,
      printingCost: 400,
      deliveryCost: 120,
      otherCost: 30,
      isTshirt: 1,
      size: 'XL',
      color: 'Black',
      printType: 'Front Print',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Oversized aesthetic fit with minimalist typography chest print',
      daysAgo: 2,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Priya Patel',
      product: 'Custom Printed T-Shirt',
      quantity: 4,
      sellingPrice: 4800,
      paymentReceived: 4800,
      productCost: 1600,
      printingCost: 1000,
      deliveryCost: 150,
      otherCost: 50,
      isTshirt: 1,
      size: 'M',
      color: 'White',
      printType: 'Front & Back',
      frontPrint: 1,
      backPrint: 1,
      sleevePrint: 0,
      notes: 'College event club logo front and member roster back print',
      daysAgo: 3,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Vikram Malhotra',
      product: 'Photo Frame',
      quantity: 1,
      sellingPrice: 1800,
      paymentReceived: 1800,
      productCost: 550,
      printingCost: 350,
      deliveryCost: 100,
      otherCost: 20,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: '12x18 inch wooden matte finish frame with photo collage',
      daysAgo: 4,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Ananya Rao',
      product: 'Custom Mug',
      quantity: 2,
      sellingPrice: 850,
      paymentReceived: 850,
      productCost: 200,
      printingCost: 160,
      deliveryCost: 90,
      otherCost: 20,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Two ceramic magic color changing mugs for couple anniversary',
      daysAgo: 5,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Sneha Gupta',
      product: 'Custom Printed T-Shirt',
      quantity: 1,
      sellingPrice: 1299,
      paymentReceived: 1299,
      productCost: 380,
      printingCost: 220,
      deliveryCost: 80,
      otherCost: 20,
      isTshirt: 1,
      size: 'S',
      color: 'Navy',
      printType: 'Front Print',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Anime graphic aesthetic print on premium Supima cotton',
      daysAgo: 6,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Karthik Iyer',
      product: 'Custom Printed T-Shirt',
      quantity: 5,
      sellingPrice: 5500,
      paymentReceived: 3500, // Partially paid
      productCost: 1850,
      printingCost: 1150,
      deliveryCost: 140,
      otherCost: 60,
      isTshirt: 1,
      size: 'L',
      color: 'Black',
      printType: 'Front & Sleeve',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 1,
      notes: 'Startup team batch t-shirts with brand sleeve badge',
      daysAgo: 7,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Neha Reddy',
      product: 'Bouquet',
      quantity: 1,
      sellingPrice: 2200,
      paymentReceived: 2200,
      productCost: 800,
      printingCost: 150,
      deliveryCost: 180,
      otherCost: 50,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Fresh red roses bouquet with customized polaroid mini clips',
      daysAgo: 8,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Arjun Nair',
      product: 'Custom Printed T-Shirt',
      quantity: 3,
      sellingPrice: 3600,
      paymentReceived: 3600,
      productCost: 1100,
      printingCost: 750,
      deliveryCost: 120,
      otherCost: 40,
      isTshirt: 1,
      size: 'XXL',
      color: 'Maroon',
      printType: 'Custom Design',
      frontPrint: 1,
      backPrint: 1,
      sleevePrint: 1,
      notes: 'Gym fitness apparel print on heavy GSM fabric',
      daysAgo: 9,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Divya Krishnan',
      product: 'Polaroid Prints (Pack of 20)',
      quantity: 1,
      sellingPrice: 599,
      paymentReceived: 599,
      productCost: 110,
      printingCost: 110,
      deliveryCost: 80,
      otherCost: 10,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: '20 gloss polaroids with customized quotes at bottom',
      daysAgo: 10,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Rohan Verma',
      product: 'Custom Printed T-Shirt',
      quantity: 3,
      sellingPrice: 3500,
      paymentReceived: 2000, // Partially paid
      productCost: 1150,
      printingCost: 700,
      deliveryCost: 110,
      otherCost: 40,
      isTshirt: 1,
      size: 'M',
      color: 'Heather Grey',
      printType: 'Front Print',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Music band tour merch reproduction',
      daysAgo: 11,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Pooja Sundaram',
      product: 'Personalized Album',
      quantity: 1,
      sellingPrice: 2400,
      paymentReceived: 0, // Pending
      productCost: 750,
      printingCost: 550,
      deliveryCost: 100,
      otherCost: 30,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Hardcover photobook album 30 pages with golden emboss',
      daysAgo: 12,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Sameer Joshi',
      product: 'Custom Printed T-Shirt',
      quantity: 2,
      sellingPrice: 2200,
      paymentReceived: 2200,
      productCost: 750,
      printingCost: 450,
      deliveryCost: 90,
      otherCost: 25,
      isTshirt: 1,
      size: 'XL',
      color: 'White',
      printType: 'Front Print',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Minimalist typography quote on front',
      daysAgo: 13,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Rahul Sharma',
      product: 'Customized Calendar',
      quantity: 2,
      sellingPrice: 1400,
      paymentReceived: 1400,
      productCost: 380,
      printingCost: 320,
      deliveryCost: 90,
      otherCost: 30,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Desk calendars with custom family photographs for 2027',
      daysAgo: 15,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Priya Patel',
      product: 'Fridge Magnets (Set of 4)',
      quantity: 2,
      sellingPrice: 650,
      paymentReceived: 650,
      productCost: 130,
      printingCost: 110,
      deliveryCost: 80,
      otherCost: 15,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Travel memory photo magnets gloss acrylic',
      daysAgo: 17,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Vikram Malhotra',
      product: 'Custom Printed T-Shirt',
      quantity: 2,
      sellingPrice: 2400,
      paymentReceived: 2400,
      productCost: 750,
      printingCost: 450,
      deliveryCost: 100,
      otherCost: 30,
      isTshirt: 1,
      size: 'L',
      color: 'Navy',
      printType: 'Back Print',
      frontPrint: 0,
      backPrint: 1,
      sleevePrint: 0,
      notes: 'Large back graphic illustration with distressed vintage effect',
      daysAgo: 19,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Ananya Rao',
      product: 'Photo Restoration',
      quantity: 1,
      sellingPrice: 1100,
      paymentReceived: 1100,
      productCost: 60,
      printingCost: 220,
      deliveryCost: 80,
      otherCost: 20,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Restored 1970s vintage family portrait printed on archival paper',
      daysAgo: 21,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Sneha Gupta',
      product: 'Custom Printed T-Shirt',
      quantity: 3,
      sellingPrice: 3400,
      paymentReceived: 3400,
      productCost: 1100,
      printingCost: 680,
      deliveryCost: 120,
      otherCost: 40,
      isTshirt: 1,
      size: 'S',
      color: 'Black',
      printType: 'Front Print',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Girls squad trip matching customized t-shirts',
      daysAgo: 23,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Karthik Iyer',
      product: 'Custom Cap',
      quantity: 3,
      sellingPrice: 1550,
      paymentReceived: 1550,
      productCost: 480,
      printingCost: 360,
      deliveryCost: 100,
      otherCost: 30,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Embroidered brand logo trucker caps',
      daysAgo: 25,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Neha Reddy',
      product: 'Custom Printed T-Shirt',
      quantity: 2,
      sellingPrice: 2600,
      paymentReceived: 2600,
      productCost: 800,
      printingCost: 480,
      deliveryCost: 100,
      otherCost: 30,
      isTshirt: 1,
      size: 'M',
      color: 'Maroon',
      printType: 'Front & Back',
      frontPrint: 1,
      backPrint: 1,
      sleevePrint: 0,
      notes: 'Couple t-shirt combo with custom illustrations',
      daysAgo: 27,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Arjun Nair',
      product: 'Customized Gift Hamper',
      quantity: 1,
      sellingPrice: 1999,
      paymentReceived: 1999,
      productCost: 650,
      printingCost: 320,
      deliveryCost: 140,
      otherCost: 40,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Hamper containing customized mug, diary, keychain and chocolate box',
      daysAgo: 29,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Divya Krishnan',
      product: 'Custom Printed T-Shirt',
      quantity: 1,
      sellingPrice: 1199,
      paymentReceived: 1199,
      productCost: 360,
      printingCost: 210,
      deliveryCost: 80,
      otherCost: 20,
      isTshirt: 1,
      size: 'L',
      color: 'White',
      printType: 'Front Print',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Minimal line art portrait print',
      daysAgo: 31,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Rohan Verma',
      product: 'Photo Frame',
      quantity: 2,
      sellingPrice: 1600,
      paymentReceived: 1600,
      productCost: 500,
      printingCost: 300,
      deliveryCost: 90,
      otherCost: 25,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Dual black gallery frames with high contrast street photos',
      daysAgo: 33,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Pooja Sundaram',
      product: 'Custom Printed T-Shirt',
      quantity: 2,
      sellingPrice: 2350,
      paymentReceived: 2350,
      productCost: 750,
      printingCost: 440,
      deliveryCost: 90,
      otherCost: 25,
      isTshirt: 1,
      size: 'S',
      color: 'Navy',
      printType: 'Front Print',
      frontPrint: 1,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'College alumni commemorative design',
      daysAgo: 35,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    },
    {
      customer: 'Sameer Joshi',
      product: 'Custom Mug',
      quantity: 4,
      sellingPrice: 1600,
      paymentReceived: 1600,
      productCost: 400,
      printingCost: 320,
      deliveryCost: 110,
      otherCost: 30,
      isTshirt: 0,
      size: null,
      color: null,
      printType: null,
      frontPrint: 0,
      backPrint: 0,
      sleevePrint: 0,
      notes: 'Set of 4 branded coffee mugs for consulting firm desk',
      daysAgo: 38,
      partner: 'Rajshekar Reddy',
      partnerId: actualP2Id
    },
    {
      customer: 'Rahul Sharma',
      product: 'Custom Printed T-Shirt',
      quantity: 3,
      sellingPrice: 3600,
      paymentReceived: 3600,
      productCost: 1150,
      printingCost: 720,
      deliveryCost: 120,
      otherCost: 40,
      isTshirt: 1,
      size: 'XL',
      color: 'Black',
      printType: 'Custom Design',
      frontPrint: 1,
      backPrint: 1,
      sleevePrint: 1,
      notes: 'Premium gold foil print accents on black heavy cotton',
      daysAgo: 40,
      partner: 'Jashwanth Reddy',
      partnerId: actualP1Id
    }
  ];

  for (let i = 0; i < rawOrders.length; i++) {
    const o = rawOrders[i];
    const orderId = uuidv4();
    const orderNumber = `ORD-${(1001 + i).toString()}`;
    const invoiceNumber = `INV-2026-${(i + 1).toString().padStart(4, '0')}`;
    const invoiceId = uuidv4();
    const cust = customerMap[o.customer] || { id: uuidv4(), name: o.customer, phone: '+91 98765 00000' };

    // Precise formula calculations
    const totalCost = o.productCost + o.printingCost + o.deliveryCost + o.otherCost;
    const profit = o.sellingPrice - totalCost;
    const profitMargin = Math.round((profit / o.sellingPrice) * 10000) / 100; // e.g. 42.00
    const availableAmount = o.paymentReceived - totalCost;
    const paymentPending = o.sellingPrice - o.paymentReceived;

    let paymentStatus = 'PAID';
    if (o.paymentReceived === 0) {
      paymentStatus = 'PENDING';
    } else if (o.paymentReceived < o.sellingPrice) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    const orderDate = new Date(now.getTime() - o.daysAgo * 86400000).toISOString().split('T')[0];
    const createdAt = new Date(now.getTime() - o.daysAgo * 86400000 + 3600000).toISOString();

    // Insert Order
    await run(
      `INSERT INTO orders (
        id, business_id, order_number, customer_id, customer_name, customer_phone,
        product_id, product_name, quantity, selling_price, payment_received, payment_pending,
        product_cost, printing_cost, delivery_cost, other_cost, total_cost, profit, profit_margin,
        available_amount, payment_status, order_status, order_date, notes, created_by, created_by_name,
        is_tshirt, tshirt_size, tshirt_color, tshirt_print_type, tshirt_front_print, tshirt_back_print,
        tshirt_sleeve_print, tshirt_design_notes, invoice_id, invoice_number, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 'COMPLETED', ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )`,
      [
        orderId, businessId, orderNumber, cust.id, o.customer, cust.phone,
        productMap[o.product] || null, o.product, o.quantity, o.sellingPrice, o.paymentReceived, paymentPending,
        o.productCost, o.printingCost, o.deliveryCost, o.otherCost, totalCost, profit, profitMargin,
        availableAmount, paymentStatus, orderDate, o.notes, o.partnerId, o.partner,
        o.isTshirt, o.size, o.color, o.printType, o.frontPrint, o.backPrint,
        o.sleevePrint, o.notes, invoiceId, invoiceNumber, createdAt, createdAt
      ]
    );

    // Insert Order Item
    await run(
      `INSERT INTO order_items (id, order_id, product_name, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), orderId, o.product, o.quantity, Math.round(o.sellingPrice / o.quantity), o.sellingPrice]
    );

    // Insert Invoice
    await run(
      `INSERT INTO invoices (
        id, business_id, invoice_number, order_id, customer_id, customer_name, customer_phone,
        issue_date, due_date, subtotal, discount, tax_amount, grand_total, amount_paid,
        balance_due, status, payment_method, notes, terms, created_by, created_by_name, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 0, 0, ?, ?,
        ?, ?, 'UPI', ?, 'Thank you for your order with Infinity Customizations! We craft memories with precision.', ?, ?, ?, ?
      )`,
      [
        invoiceId, businessId, invoiceNumber, orderId, cust.id, o.customer, cust.phone,
        orderDate, orderDate, o.sellingPrice, o.sellingPrice, o.paymentReceived,
        paymentPending, paymentStatus, o.notes, o.partnerId, o.partner, createdAt, createdAt
      ]
    );

    // Insert Invoice Item
    await run(
      `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), invoiceId,
        o.isTshirt ? `${o.product} (${o.color} - Size ${o.size}, ${o.printType})` : o.product,
        o.quantity, Math.round(o.sellingPrice / o.quantity), o.sellingPrice
      ]
    );

    // Insert Payment if customer paid
    if (o.paymentReceived > 0) {
      await run(
        `INSERT INTO payments (
          id, business_id, payment_number, order_id, invoice_id, customer_id, customer_name,
          amount, payment_method, date, notes, recorded_by, recorded_by_name, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, 'UPI', ?, 'Customer advance / full payment via UPI QR', ?, ?, ?
        )`,
        [
          uuidv4(), businessId, `PAY-${(1001 + i).toString()}`, orderId, invoiceId, cust.id, o.customer,
          o.paymentReceived, orderDate, o.partnerId, o.partner, createdAt
        ]
      );
    }

    // Update Customer Aggregates
    await run(
      `UPDATE customers
       SET total_orders = total_orders + 1,
           total_spent = total_spent + ?,
           total_paid = total_paid + ?,
           outstanding_balance = outstanding_balance + ?,
           total_profit_generated = total_profit_generated + ?
       WHERE id = ?`,
      [o.sellingPrice, o.paymentReceived, paymentPending, profit, cust.id]
    );

    // Add audit log for order creation
    await run(
      `INSERT INTO audit_logs (id, business_id, actor_id, actor_name, action, entity_type, entity_id, new_value, reason, created_at)
       VALUES (?, ?, ?, ?, 'CREATE', 'order', ?, ?, 'Order registered by partner', ?)`,
      [
        uuidv4(), businessId, o.partnerId, o.partner, orderId,
        JSON.stringify({ orderNumber, customer: o.customer, product: o.product, sellingPrice: o.sellingPrice, profit }),
        createdAt
      ]
    );
  }

  // 7. Create General Business Expenses
  const generalExpenses = [
    { desc: 'DTF Bulk Textile Inks (CMYK + White 1L bottles)', category: 'Materials', amount: 12500, daysAgo: 5, partner: 'Jashwanth Reddy', pId: actualP1Id },
    { desc: '100% Bio-Wash Combed Cotton Blank T-Shirts (50 pcs)', category: 'Materials', amount: 14000, daysAgo: 10, partner: 'Rajshekar Reddy', pId: actualP2Id },
    { desc: 'Infinity Branded Corrugated Boxes & Tape (200 units)', category: 'Packaging', amount: 4200, daysAgo: 14, partner: 'Jashwanth Reddy', pId: actualP1Id },
    { desc: 'Workshop Studio Electric Bill (Heat press & curing oven)', category: 'Electricity', amount: 3850, daysAgo: 18, partner: 'Rajshekar Reddy', pId: actualP2Id },
    { desc: 'Studio & Workshop Monthly Commercial Rent', category: 'Rent', amount: 18000, daysAgo: 22, partner: 'Jashwanth Reddy', pId: actualP1Id },
    { desc: 'Rapido Business Delivery Partner Monthly Pass', category: 'Rapido', amount: 2500, daysAgo: 26, partner: 'Rajshekar Reddy', pId: actualP2Id },
    { desc: 'Meta & Instagram Sponsored Post Campaigns for T-Shirts', category: 'Marketing', amount: 4500, daysAgo: 30, partner: 'Jashwanth Reddy', pId: actualP1Id },
    { desc: 'Epson PET Heat Transfer Film Rolls (100 meters)', category: 'Printing', amount: 3600, daysAgo: 34, partner: 'Rajshekar Reddy', pId: actualP2Id }
  ];

  for (let j = 0; j < generalExpenses.length; j++) {
    const e = generalExpenses[j];
    const expId = uuidv4();
    const expDate = new Date(now.getTime() - e.daysAgo * 86400000).toISOString().split('T')[0];
    const createdAt = new Date(now.getTime() - e.daysAgo * 86400000 + 7200000).toISOString();

    await run(
      `INSERT INTO expenses (
        id, business_id, expense_number, category, description, amount, payment_method,
        date, notes, created_by, created_by_name, status, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 'UPI',
        ?, 'Operating expense verified by partners', ?, ?, 'ACTIVE', ?
      )`,
      [
        expId, businessId, `EXP-${(1001 + j).toString()}`, e.category, e.desc, e.amount,
        expDate, e.pId, e.partner, createdAt
      ]
    );

    await run(
      `INSERT INTO audit_logs (id, business_id, actor_id, actor_name, action, entity_type, entity_id, new_value, reason, created_at)
       VALUES (?, ?, ?, ?, 'CREATE', 'expense', ?, ?, 'Business expense logged', ?)`,
      [
        uuidv4(), businessId, e.pId, e.partner, expId,
        JSON.stringify({ category: e.category, description: e.desc, amount: e.amount }),
        createdAt
      ]
    );
  }

  console.log('✅ Infinity Customizations demo data successfully seeded!');
  return {
    businessId,
    partner1Email: 'jashwanth@infinitycustomizations.com',
    partner2Email: 'alex@infinitycustomizations.com'
  };
}

// If run directly via command line
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDemoData()
    .then((res) => {
      console.log('Seeded Business ID:', res.businessId);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to seed demo data:', err);
      process.exit(1);
    });
}
