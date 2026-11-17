import { create } from 'zustand';
import { Bill, BillItem, InventoryItem, BillType, PaymentMode } from '../types/models';
import { getDatabase } from '../db/database';

interface BillState {
  bills: Bill[];
  inventoryItems: InventoryItem[];
  activeBillItems: BillItem[];
  isLoading: boolean;
  loadBills: (bookId: string) => Promise<void>;
  loadInventory: (bookId: string) => Promise<void>;
  createBill: (
    bookId: string,
    customerName: string,
    customerId: string | null,
    billType: BillType,
    billDate: string,
    items: Omit<BillItem, 'id' | 'bill_id'>[],
    discount: number,
    paymentMode: PaymentMode
  ) => Promise<Bill>;
  addInventoryItem: (
    bookId: string,
    name: string,
    unit: string,
    purchasePrice: number,
    salePrice: number,
    stockQuantity: number,
    barcode?: string
  ) => Promise<void>;
  updateStock: (itemId: string, newQuantity: number) => Promise<void>;
  loadBillItems: (billId: string) => Promise<BillItem[]>;
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  inventoryItems: [],
  activeBillItems: [],
  isLoading: true,

  loadBills: async (bookId: string) => {
    try {
      const db = await getDatabase();
      const bills = await db.getAllAsync<Bill>(
        'SELECT * FROM bills WHERE book_id = ? ORDER BY created_at DESC',
        [bookId]
      );
      set({ bills, isLoading: false });
    } catch (e) {
      console.error('Failed to load bills:', e);
      set({ isLoading: false });
    }
  },

  loadInventory: async (bookId: string) => {
    try {
      const db = await getDatabase();
      const inventoryItems = await db.getAllAsync<InventoryItem>(
        'SELECT * FROM inventory_items WHERE book_id = ? ORDER BY name ASC',
        [bookId]
      );
      set({ inventoryItems });
    } catch (e) {
      console.error('Failed to load inventory:', e);
    }
  },

  createBill: async (bookId, customerName, customerId, billType, billDate, items, discount, paymentMode) => {
    const db = await getDatabase();
    const billId = `bill_${Date.now()}`;
    const billNumber = `${Date.now().toString().slice(-6)}`;
    const now = Date.now();

    let subtotal = 0;
    let taxTotal = 0;

    for (const it of items) {
      const itemSubtotal = it.quantity * it.rate;
      const itemTax = (itemSubtotal * it.tax_percentage) / 100;
      subtotal += itemSubtotal;
      taxTotal += itemTax;
    }

    const totalAmount = Math.max(0, subtotal + taxTotal - discount);

    const billRecord: Bill = {
      id: billId,
      book_id: bookId,
      customer_id: customerId,
      customer_name: customerName,
      bill_number: billNumber,
      bill_date: billDate,
      bill_type: billType,
      subtotal,
      tax_total: taxTotal,
      discount,
      total_amount: totalAmount,
      payment_mode: paymentMode,
      created_at: now,
    };

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO bills (id, book_id, customer_id, customer_name, bill_number, bill_date, bill_type, subtotal, tax_total, discount, total_amount, payment_mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          billRecord.id,
          billRecord.book_id,
          billRecord.customer_id || '',
          billRecord.customer_name || '',
          billRecord.bill_number,
          billRecord.bill_date,
          billRecord.bill_type,
          billRecord.subtotal,
          billRecord.tax_total,
          billRecord.discount,
          billRecord.total_amount,
          billRecord.payment_mode,
          billRecord.created_at,
        ]
      );

      for (const it of items) {
        const itemId = `bi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.runAsync(
          'INSERT INTO bill_items (id, bill_id, item_name, quantity, unit, rate, tax_percentage, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [itemId, billId, it.item_name, it.quantity, it.unit, it.rate, it.tax_percentage, it.amount]
        );
      }
    });

    await get().loadBills(bookId);
    return billRecord;
  },

  addInventoryItem: async (bookId, name, unit, purchasePrice, salePrice, stockQuantity, barcode = '') => {
    const db = await getDatabase();
    const id = `item_${Date.now()}`;
    await db.runAsync(
      'INSERT INTO inventory_items (id, book_id, name, barcode, unit, purchase_price, sale_price, stock_quantity, low_stock_threshold, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, bookId, name, barcode, unit, purchasePrice, salePrice, stockQuantity, 5.0, Date.now()]
    );
    await get().loadInventory(bookId);
  },

  updateStock: async (itemId: string, newQuantity: number) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE inventory_items SET stock_quantity = ? WHERE id = ?', [newQuantity, itemId]);
  },

  loadBillItems: async (billId: string) => {
    const db = await getDatabase();
    const items = await db.getAllAsync<BillItem>('SELECT * FROM bill_items WHERE bill_id = ?', [billId]);
    set({ activeBillItems: items });
    return items;
  },
}));

