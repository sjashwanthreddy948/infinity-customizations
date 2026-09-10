import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database | null = null;
const dbFilePath = path.resolve(__dirname, '../../database.sqlite');
const schemaPath = fs.existsSync(path.resolve(__dirname, 'schema.sql'))
  ? path.resolve(__dirname, 'schema.sql')
  : path.resolve(__dirname, '../../src/db/schema.sql');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs({
    // Locate the wasm file relative to node_modules/sql.js/dist
    locateFile: (file) => {
      const wasmPath = path.resolve(__dirname, '../../node_modules/sql.js/dist', file);
      if (fs.existsSync(wasmPath)) {
        return wasmPath;
      }
      return file;
    }
  });

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing database file, creating fresh database', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Ensure schema tables exist
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    try {
      dbInstance.exec(schemaSql);
    } catch (e) {
      console.warn('Schema exec notice:', e);
    }
  }
  
  // Auto-migrate new columns if missing
  const migrations = [
    "ALTER TABLE orders ADD COLUMN tshirt_size_breakdown TEXT",
    "ALTER TABLE orders ADD COLUMN print_meters REAL DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN print_rate_per_meter INTEGER DEFAULT 300",
    "ALTER TABLE orders ADD COLUMN tshirt_rapido_cost INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN print_rapido_cost INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN tshirt_neck_type TEXT DEFAULT 'Round Neck'",
    "ALTER TABLE orders ADD COLUMN tshirt_fabric TEXT DEFAULT 'Pure Cotton'",
    "ALTER TABLE orders ADD COLUMN tshirt_variants TEXT",
    "ALTER TABLE orders ADD COLUMN has_id_cards INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN id_card_quantity INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN id_card_type TEXT",
    "ALTER TABLE orders ADD COLUMN id_card_unit_cost INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN id_card_unit_price INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN id_card_total_cost INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN id_card_total_price INTEGER DEFAULT 0",
    "ALTER TABLE orders ADD COLUMN is_partner_shared INTEGER DEFAULT 1"
  ];
  for (const sql of migrations) {
    try {
      dbInstance.exec(sql);
    } catch (e) {
      // Column already exists
    }
  }

  // Ensure quotations tables exist
  try {
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        quotation_number TEXT NOT NULL,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        customer_address TEXT,
        valid_until TEXT NOT NULL,
        subtotal INTEGER NOT NULL DEFAULT 0,
        discount INTEGER NOT NULL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        tax_amount INTEGER NOT NULL DEFAULT 0,
        grand_total INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'SENT',
        notes TEXT,
        terms TEXT,
        converted_order_id TEXT,
        converted_invoice_id TEXT,
        created_by TEXT NOT NULL,
        created_by_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS quotation_items (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        rate INTEGER NOT NULL DEFAULT 0,
        discount REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        amount INTEGER NOT NULL DEFAULT 0
      );
    `);
  } catch (e) {
    // ignore
  }
  
  saveDb();

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

/**
 * Execute a query returning multiple row objects
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

/**
 * Execute a query returning a single row object
 */
export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : undefined;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query and save changes to disk
 */
export async function run(sql: string, params: any[] = []): Promise<{ changes: number }> {
  const db = await getDb();
  db.run(sql, params);
  const changes = db.getRowsModified();
  saveDb();
  return { changes };
}

/**
 * Execute raw SQL script (e.g. schema migration)
 */
export async function exec(sql: string): Promise<void> {
  const db = await getDb();
  db.exec(sql);
  saveDb();
}
