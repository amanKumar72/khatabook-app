# Khatabook Offline: Expo Implementation Guide & Starter Kit

This guide provides the complete setup, directory structure, database schema, and working TypeScript code for building a **100% offline-first Khatabook application** with **Expo (SDK 52+)**, **Expo SQLite**, and a **robust full-data Backup & Restore (Import/Export) engine**.

---

## 1. Quick Start & Expo Setup

Run the following commands in your terminal to initialize and configure the project:

```bash
# 1. Initialize Expo project with Expo Router template
npx create-expo-app@latest khatabook-app --template tabs
cd khatabook-app

# 2. Install Core Local-First & Storage Dependencies
npx expo install expo-sqlite expo-file-system expo-sharing expo-document-picker expo-crypto

# 3. Install Device Capabilities (Biometrics, Camera, Print, Audio)
npx expo install expo-local-authentication expo-camera expo-image-picker expo-print expo-speech

# 4. Install State Management & UI Utilities
npm install zustand react-native-qrcode-svg lucide-react-native react-native-reanimated

# 5. Start the Expo development server
npx expo start
```

---

## 2. Local Database Engine (`src/db/database.ts`)

Create `src/db/database.ts` to manage the SQLite connection, table migrations, and transactional execution:

```typescript
import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync('khatabook_offline.db');

  // Enable WAL (Write-Ahead Logging) and Foreign Key Constraints for speed & integrity
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- 1. Multi-Book Registry
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      currency TEXT NOT NULL DEFAULT 'INR',
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
      balance REAL NOT NULL DEFAULT 0.0,    -- Positive: Receivable, Negative: Payable
      credit_limit REAL DEFAULT 0.0,
      address TEXT,
      gstin TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    -- 3. Core Ledger Transactions
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
      bill_number TEXT NOT NULL,
      bill_date TEXT NOT NULL,
      bill_type TEXT NOT NULL,              -- 'GST_INVOICE', 'NON_GST_BILL'
      subtotal REAL NOT NULL,
      tax_total REAL NOT NULL,
      discount REAL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      payment_mode TEXT NOT NULL,           -- 'CASH', 'UPI', 'CREDIT'
      created_at INTEGER NOT NULL
    );

    -- 5. Bill Line Items
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
      created_at INTEGER NOT NULL
    );

    -- 7. Cashbook (Gala & Daily Petty Cash)
    CREATE TABLE IF NOT EXISTS cashbook (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,                   -- 'IN' (Income) or 'OUT' (Expense)
      category TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL
    );

    -- 8. Staff & Payroll
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY NOT NULL,
      book_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STAFF',   -- 'OWNER', 'BILLING', 'STAFF'
      wage_type TEXT NOT NULL,              -- 'MONTHLY', 'DAILY'
      wage_amount REAL NOT NULL,
      joining_date TEXT NOT NULL
    );

    -- 9. Staff Attendance
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id TEXT PRIMARY KEY NOT NULL,
      staff_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,                 -- 'PRESENT', 'ABSENT', 'HALF_DAY'
      overtime_hours REAL DEFAULT 0.0,
      FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );
  `);

  return dbInstance;
}
```

---

## 3. Full Data Backup & Restore Engine (`src/services/backupEngine.ts`)

This is the core capability requested: **exporting complete user data to a standalone file and restoring it back seamlessly**.

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/database';

export interface BackupArchive {
  app: 'KhatabookOffline';
  version: number;
  exportedAt: string;
  checksum: string;
  tables: {
    books: any[];
    customers: any[];
    transactions: any[];
    bills: any[];
    bill_items: any[];
    inventory_items: any[];
    cashbook: any[];
    staff: any[];
    staff_attendance: any[];
  };
  attachments: { filename: string; base64: string }[];
}

export class BackupEngine {
  /**
   * Export all database records and media attachments into a single backup JSON file
   */
  static async exportCompleteData(): Promise<string> {
    const db = await getDatabase();

    // 1. Extract all table records
    const tables = {
      books: await db.getAllAsync('SELECT * FROM books'),
      customers: await db.getAllAsync('SELECT * FROM customers'),
      transactions: await db.getAllAsync('SELECT * FROM transactions'),
      bills: await db.getAllAsync('SELECT * FROM bills'),
      bill_items: await db.getAllAsync('SELECT * FROM bill_items'),
      inventory_items: await db.getAllAsync('SELECT * FROM inventory_items'),
      cashbook: await db.getAllAsync('SELECT * FROM cashbook'),
      staff: await db.getAllAsync('SELECT * FROM staff'),
      staff_attendance: await db.getAllAsync('SELECT * FROM staff_attendance'),
    };

    // 2. Package attachments from local storage
    const attachments: { filename: string; base64: string }[] = [];
    const attachmentsDir = `${FileSystem.documentDirectory}attachments/`;
    const dirInfo = await FileSystem.getInfoAsync(attachmentsDir);

    if (dirInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(attachmentsDir);
      for (const file of files) {
        const fileContent = await FileSystem.readAsStringAsync(`${attachmentsDir}${file}`, {
          encoding: FileSystem.EncodingType.Base64,
        });
        attachments.push({ filename: file, base64: fileContent });
      }
    }

    // 3. Compute Checksum across tables payload
    const rawDataString = JSON.stringify(tables);
    const checksum = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawDataString);

    const archive: BackupArchive = {
      app: 'KhatabookOffline',
      version: 1,
      exportedAt: new Date().toISOString(),
      checksum,
      tables,
      attachments,
    };

    // 4. Save to cache directory and trigger native Share Sheet
    const filename = `khatabook_backup_${Date.now()}.json`;
    const exportPath = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(exportPath, JSON.stringify(archive, null, 2), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(exportPath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Khatabook Backup',
        UTI: 'public.json',
      });
    }

    return exportPath;
  }

  /**
   * Import a backup file and restore complete data atomically
   */
  static async importCompleteData(): Promise<{ success: boolean; message: string }> {
    // 1. Pick backup file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, message: 'Backup import canceled by user.' };
    }

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 2. Parse & Validate Signature
    let archive: BackupArchive;
    try {
      archive = JSON.parse(content);
    } catch {
      return { success: false, message: 'Invalid backup file format.' };
    }

    if (archive.app !== 'KhatabookOffline' || !archive.tables) {
      return { success: false, message: 'Unrecognized Khatabook backup file.' };
    }

    // 3. Verify Checksum
    const recalculated = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      JSON.stringify(archive.tables)
    );

    if (recalculated !== archive.checksum) {
      return { success: false, message: 'Backup verification failed: checksum mismatch (corrupted file).' };
    }

    // 4. Atomic Database Restoration
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      // Clear existing records
      await db.execAsync(`
        DELETE FROM staff_attendance;
        DELETE FROM staff;
        DELETE FROM cashbook;
        DELETE FROM inventory_items;
        DELETE FROM bill_items;
        DELETE FROM bills;
        DELETE FROM transactions;
        DELETE FROM customers;
        DELETE FROM books;
      `);

      // Bulk Insert Books
      for (const b of archive.tables.books) {
        await db.runAsync(
          'INSERT INTO books (id, name, phone, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [b.id, b.name, b.phone, b.currency, b.created_at, b.updated_at]
        );
      }

      // Bulk Insert Customers
      for (const c of archive.tables.customers) {
        await db.runAsync(
          'INSERT INTO customers (id, book_id, name, phone, party_type, balance, credit_limit, address, gstin, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.book_id, c.name, c.phone, c.party_type, c.balance, c.credit_limit, c.address, c.gstin, c.is_archived, c.created_at, c.updated_at]
        );
      }

      // Bulk Insert Transactions
      for (const t of archive.tables.transactions) {
        await db.runAsync(
          'INSERT INTO transactions (id, book_id, customer_id, amount, type, date, description, attachment_uri, due_date, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [t.id, t.book_id, t.customer_id, t.amount, t.type, t.date, t.description, t.attachment_uri, t.due_date, t.is_deleted, t.created_at, t.updated_at]
        );
      }

      // Bulk Insert Bills & Items
      for (const b of archive.tables.bills) {
        await db.runAsync(
          'INSERT INTO bills (id, book_id, customer_id, bill_number, bill_date, bill_type, subtotal, tax_total, discount, total_amount, payment_mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [b.id, b.book_id, b.customer_id, b.bill_number, b.bill_date, b.bill_type, b.subtotal, b.tax_total, b.discount, b.total_amount, b.payment_mode, b.created_at]
        );
      }
      for (const bi of archive.tables.bill_items) {
        await db.runAsync(
          'INSERT INTO bill_items (id, bill_id, item_name, quantity, unit, rate, tax_percentage, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [bi.id, bi.bill_id, bi.item_name, bi.quantity, bi.unit, bi.rate, bi.tax_percentage, bi.amount]
        );
      }

      // Bulk Insert Cashbook
      for (const cb of archive.tables.cashbook) {
        await db.runAsync(
          'INSERT INTO cashbook (id, book_id, amount, type, category, entry_date, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [cb.id, cb.book_id, cb.amount, cb.type, cb.category, cb.entry_date, cb.description, cb.created_at]
        );
      }

      // Bulk Insert Staff & Attendance
      for (const s of archive.tables.staff) {
        await db.runAsync(
          'INSERT INTO staff (id, book_id, name, phone, role, wage_type, wage_amount, joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [s.id, s.book_id, s.name, s.phone, s.role, s.wage_type, s.wage_amount, s.joining_date]
        );
      }
      for (const sa of archive.tables.staff_attendance) {
        await db.runAsync(
          'INSERT INTO staff_attendance (id, staff_id, date, status, overtime_hours) VALUES (?, ?, ?, ?, ?)',
          [sa.id, sa.staff_id, sa.date, sa.status, sa.overtime_hours]
        );
      }
    });

    // 5. Restore Media Attachments to DocumentDirectory
    if (archive.attachments && archive.attachments.length > 0) {
      const attachmentsDir = `${FileSystem.documentDirectory}attachments/`;
      await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });
      for (const att of archive.attachments) {
        await FileSystem.writeAsStringAsync(`${attachmentsDir}${att.filename}`, att.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    }

    return { success: true, message: 'All books, customers, bills, and transactions successfully restored!' };
  }
}
```

---

## 4. Dynamic UPI QR & Voice Soundbox

### 4.1 UPI QR Code Generator (`src/services/upi.ts`)
```typescript
export interface UpiPaymentParams {
  vpa: string;        // Merchant UPI VPA (e.g., merchant@okaxis)
  name: string;       // Merchant Display Name
  amount?: number;    // Optional pre-filled amount
  note?: string;      // Transaction description
}

export function generateUpiUrl(params: UpiPaymentParams): string {
  const query = new URLSearchParams({
    pa: params.vpa,
    pn: params.name,
    cu: 'INR',
  });

  if (params.amount && params.amount > 0) {
    query.append('am', params.amount.toFixed(2));
  }
  if (params.note) {
    query.append('tn', params.note);
  }

  return `upi://pay?${query.toString()}`;
}
```

### 4.2 Voice Soundbox Simulator (`src/services/soundbox.ts`)
```typescript
import * as Speech from 'expo-speech';

export class SoundboxService {
  /**
   * Announce payment receipt in Indian Hindi/English voice
   */
  static announcePayment(amount: number, language: 'hi' | 'en' = 'hi') {
    const text = language === 'hi'
      ? `खाताबुक पर ${amount} रुपये प्राप्त हुए`
      : `Received ${amount} rupees on Khatabook`;

    Speech.speak(text, {
      language: language === 'hi' ? 'hi-IN' : 'en-IN',
      pitch: 1.0,
      rate: 0.95,
    });
  }
}
```

---

## 5. Security & Biometric App Lock (`src/services/appLock.ts`)

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

export class AppLockService {
  static async authenticate(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return true; // Bypass if device has no biometric credentials set
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Khatabook',
      fallbackLabel: 'Use Device PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }
}
```

---

## 6. HTML to PDF Invoice Generator (`src/services/pdfGenerator.ts`)

```typescript
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function generateAndShareInvoicePdf(invoice: any, items: any[], business: any) {
  const itemsHtml = items.map((item, idx) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.item_name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity} ${item.unit}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${item.rate}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.tax_percentage}%</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.amount}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2e7d32; padding-bottom: 10px; }
          .title { font-size: 24px; font-weight: bold; color: #2e7d32; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f5f5f5; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
          .total-box { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${business.name}</div>
            <div>Phone: ${business.phone || 'N/A'}</div>
          </div>
          <div style="text-align: right;">
            <div><strong>INVOICE</strong></div>
            <div>No: ${invoice.bill_number}</div>
            <div>Date: ${invoice.bill_date}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>GST</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total-box">
          <div>Total Tax: ₹${invoice.tax_total}</div>
          <div>Grand Total: ₹${invoice.total_amount}</div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}
```

---

## 7. Verification & Launch Checklist

1. [x] **Local Database Initialized:** Run `getDatabase()` on startup and verify SQLite table creation.
2. [x] **Export Data Test:** Add sample customers and transactions, trigger `BackupEngine.exportCompleteData()`, and save file to local device.
3. [x] **Restore Integrity Test:** Clear app cache, call `BackupEngine.importCompleteData()`, select the exported file, and verify all balances and entries reappear accurately.
4. [x] **UPI QR Test:** Enter UPI VPA, scan with GPay/PhonePe, and test payment string accuracy.
5. [x] **Thermal Print / PDF Test:** Generate test bill and verify PDF sharing in WhatsApp.

