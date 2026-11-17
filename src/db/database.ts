import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync('khatabook_offline.db');

  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- 1. Multi-Book Registry
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      currency TEXT NOT NULL DEFAULT 'INR',
      business_category TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 2. Customer & Supplier Master
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      party_type INTEGER NOT NULL DEFAULT 1, -- 1: Customer, 2: Supplier
      balance REAL NOT NULL DEFAULT 0.0,    -- Positive = Receivable, Negative = Payable
      credit_limit REAL DEFAULT 0.0,
      address TEXT,
      gstin TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    -- 3. Core Transactions (Debit / Credit)
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type INTEGER NOT NULL,                -- 1: You Gave (Debit), 2: You Got (Credit)
      date TEXT NOT NULL,
      description TEXT,
      attachment_uri TEXT,
      due_date TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 4. BillBook Invoices
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      bill_number TEXT NOT NULL,
      bill_date TEXT NOT NULL,
      bill_type TEXT NOT NULL,              -- 'GST_INVOICE', 'NON_GST_BILL', 'QUOTATION'
      subtotal REAL NOT NULL,
      tax_total REAL NOT NULL,
      discount REAL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,           -- 'CASH', 'UPI', 'CREDIT'
      created_at INTEGER NOT NULL
    );

    -- 5. Bill Items
    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY NOT NULL,
      bill_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      rate REAL NOT NULL,
      tax_percentage REAL DEFAULT 0.0,
      amount REAL NOT NULL,
      FOREIGN KEY(bill_id) REFERENCES bills(id) ON DELETE CASCADE
    );

    -- 6. Inventory Items
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      name TEXT NOT NULL,
      barcode TEXT,
      unit TEXT NOT NULL,
      purchase_price REAL DEFAULT 0.0,
      sale_price REAL NOT NULL,
      stock_quantity REAL NOT NULL DEFAULT 0.0,
      low_stock_threshold REAL DEFAULT 5.0,
      created_at INTEGER NOT NULL
    );

    -- 7. Cashbook (Gala / Daily Register)
    CREATE TABLE IF NOT EXISTS cashbook (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,                   -- 'IN' or 'OUT'
      category TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      description TEXT,
      payment_mode TEXT DEFAULT 'CASH',
      created_at INTEGER NOT NULL
    );

    -- 8. Staff Directory & Payroll
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STAFF',   -- 'OWNER', 'BILLING', 'STAFF'
      wage_type TEXT NOT NULL,              -- 'MONTHLY', 'DAILY', 'HOURLY', 'PER_PIECE'
      wage_amount REAL NOT NULL,
      joining_date TEXT NOT NULL
    );

    -- 9. Staff Attendance Logs
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id TEXT PRIMARY KEY NOT NULL,
      staff_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,                 -- 'PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'
      overtime_hours REAL DEFAULT 0.0,
      FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    -- 10. Key-Value Settings & Business Profile
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    -- Create Indexes for High Performance
    CREATE INDEX IF NOT EXISTS idx_customers_book ON customers(book_id, party_type);
    CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id, is_deleted);
    CREATE INDEX IF NOT EXISTS idx_cashbook_book ON cashbook(book_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_bills_book ON bills(book_id, bill_date);
  `);

  // Ensure default book exists
  const existingBooks = await dbInstance.getAllAsync<{ id: string }>('SELECT id FROM books LIMIT 1');
  if (existingBooks.length === 0) {
    const defaultBookId = 'book_default_1';
    const now = Date.now();
    await dbInstance.runAsync(
      'INSERT INTO books (id, name, phone, currency, business_category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [defaultBookId, 'My Business', '', 'INR', 'Kirana / General Store', now, now]
    );

    await dbInstance.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['active_book_id', defaultBookId]
    );
  }

  return dbInstance;
}

