export type PartyType = 1 | 2; // 1: Customer, 2: Supplier
export type TransactionType = 1 | 2; // 1: You Gave (Debit), 2: You Got (Credit)
export type BillType = 'GST_INVOICE' | 'NON_GST_BILL' | 'QUOTATION';
export type PaymentMode = 'CASH' | 'UPI' | 'CREDIT' | 'BANK';
export type CashbookType = 'IN' | 'OUT';
export type StaffRole = 'OWNER' | 'ADMIN' | 'BILLING' | 'STAFF';
export type WageType = 'MONTHLY' | 'DAILY' | 'HOURLY' | 'PER_PIECE';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export interface Book {
  id: string;
  name: string;
  phone?: string | null;
  currency: string;
  business_category?: string | null;
  created_at: number;
  updated_at: number;
}

export interface Customer {
  id: string;
  book_id: string;
  name: string;
  phone?: string | null;
  party_type: PartyType;
  balance: number; // Positive = Receivable (customer owes merchant), Negative = Payable
  credit_limit?: number | null;
  address?: string | null;
  gstin?: string | null;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

export interface Transaction {
  id: string;
  book_id: string;
  customer_id: string;
  amount: number;
  type: TransactionType;
  date: string;
  description?: string | null;
  attachment_uri?: string | null;
  due_date?: string | null;
  is_deleted: number;
  created_at: number;
  updated_at: number;
}

export interface Bill {
  id: string;
  book_id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  bill_number: string;
  bill_date: string;
  bill_type: BillType;
  subtotal: number;
  tax_total: number;
  discount: number;
  total_amount: number;
  payment_mode: PaymentMode;
  created_at: number;
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  rate: number;
  tax_percentage: number;
  amount: number;
}

export interface InventoryItem {
  id: string;
  book_id: string;
  name: string;
  barcode?: string | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: number;
}

export interface CashbookEntry {
  id: string;
  book_id: string;
  amount: number;
  type: CashbookType;
  category: string;
  entry_date: string;
  description?: string | null;
  payment_mode: PaymentMode;
  created_at: number;
}

export interface Staff {
  id: string;
  book_id: string;
  name: string;
  phone: string;
  role: StaffRole;
  wage_type: WageType;
  wage_amount: number;
  joining_date: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  date: string;
  status: AttendanceStatus;
  overtime_hours: number;
}

export interface BusinessProfile {
  name: string;
  phone: string;
  address: string;
  gstin?: string;
  upi_id?: string;
  category?: string;
}

export interface BackupArchive {
  app: 'KhatabookOffline';
  version: number;
  exportedAt: string;
  checksum: string;
  tables: {
    books: Book[];
    customers: Customer[];
    transactions: Transaction[];
    bills: Bill[];
    bill_items: BillItem[];
    inventory_items: InventoryItem[];
    cashbook: CashbookEntry[];
    staff: Staff[];
    staff_attendance: StaffAttendance[];
  };
  attachments: { filename: string; base64: string }[];
}

