import { create } from 'zustand';
import { Customer, Transaction, PartyType, TransactionType } from '../types/models';
import { getDatabase } from '../db/database';
import { SoundboxService } from '../services/soundbox';
import { useLanguageStore } from './useLanguageStore';

interface KhataState {
  customers: Customer[];
  activeCustomer: Customer | null;
  activeTransactions: Transaction[];
  totalReceivable: number; // Customer debt to merchant (Green)
  totalPayable: number;    // Merchant debt to suppliers (Red)
  isLoading: boolean;
  loadCustomers: (bookId: string) => Promise<void>;
  loadCustomerDetails: (customerId: string) => Promise<void>;
  addCustomer: (
    bookId: string,
    name: string,
    phone: string,
    partyType: PartyType,
    address?: string,
    creditLimit?: number
  ) => Promise<string>;
  updateCustomer: (
    customerId: string,
    name: string,
    phone: string,
    address?: string,
    creditLimit?: number
  ) => Promise<void>;
  addTransaction: (
    bookId: string,
    customerId: string,
    amount: number,
    type: TransactionType,
    date: string,
    description?: string,
    attachmentUri?: string,
    dueDate?: string
  ) => Promise<void>;
  updateTransaction: (
    transactionId: string,
    amount: number,
    type: TransactionType,
    date: string,
    description?: string,
    dueDate?: string
  ) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
}

export const useKhataStore = create<KhataState>((set, get) => ({
  customers: [],
  activeCustomer: null,
  activeTransactions: [],
  totalReceivable: 0,
  totalPayable: 0,
  isLoading: true,

  loadCustomers: async (bookId: string) => {
    try {
      const db = await getDatabase();
      const customers = await db.getAllAsync<Customer>(
        'SELECT * FROM customers WHERE book_id = ? AND is_archived = 0 ORDER BY updated_at DESC',
        [bookId]
      );

      let receivable = 0;
      let payable = 0;

      for (const c of customers) {
        if (c.party_type === 1) {
          // Customer: positive balance is receivable
          if (c.balance > 0) receivable += c.balance;
          else if (c.balance < 0) payable += Math.abs(c.balance);
        } else {
          // Supplier: positive balance is payable
          if (c.balance > 0) payable += c.balance;
          else if (c.balance < 0) receivable += Math.abs(c.balance);
        }
      }

      set({
        customers,
        totalReceivable: receivable,
        totalPayable: payable,
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to load customers:', e);
      set({ isLoading: false });
    }
  },

  loadCustomerDetails: async (customerId: string) => {
    try {
      const db = await getDatabase();
      const customer = await db.getFirstAsync<Customer>(
        'SELECT * FROM customers WHERE id = ?',
        [customerId]
      );
      const transactions = await db.getAllAsync<Transaction>(
        'SELECT * FROM transactions WHERE customer_id = ? AND is_deleted = 0 ORDER BY date ASC, created_at ASC',
        [customerId]
      );

      set({ activeCustomer: customer || null, activeTransactions: transactions });
    } catch (e) {
      console.error('Failed to load customer details:', e);
    }
  },

  addCustomer: async (bookId, name, phone, partyType, address = '', creditLimit = 0) => {
    const db = await getDatabase();
    const id = `cust_${Date.now()}`;
    const now = Date.now();

    await db.runAsync(
      'INSERT INTO customers (id, book_id, name, phone, party_type, balance, credit_limit, address, gstin, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, bookId, name, phone, partyType, 0.0, creditLimit, address, '', 0, now, now]
    );

    await get().loadCustomers(bookId);
    return id;
  },

  updateCustomer: async (customerId, name, phone, address = '', creditLimit = 0) => {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      'UPDATE customers SET name = ?, phone = ?, address = ?, credit_limit = ?, updated_at = ? WHERE id = ?',
      [name, phone, address, creditLimit, now, customerId]
    );
    await get().loadCustomerDetails(customerId);
    const cust = await db.getFirstAsync<Customer>('SELECT book_id FROM customers WHERE id = ?', [customerId]);
    if (cust) {
      await get().loadCustomers(cust.book_id);
    }
  },

  addTransaction: async (bookId, customerId, amount, type, date, description = '', attachmentUri = '', dueDate = '') => {
    const db = await getDatabase();
    const id = `tx_${Date.now()}`;
    const now = Date.now();

    const customer = await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (!customer) return;

    // Calculate new balance
    // Type 1: Gave (Debit), Type 2: Got (Credit)
    let balanceDelta = 0;
    if (customer.party_type === 1) {
      // Customer: You gave goods/money (+) -> balance increases. You got payment (-) -> balance decreases
      balanceDelta = type === 1 ? amount : -amount;
    } else {
      // Supplier: You got goods (+) -> payable increases. You gave payment (-) -> payable decreases
      balanceDelta = type === 2 ? amount : -amount;
    }

    const newBalance = customer.balance + balanceDelta;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO transactions (id, book_id, customer_id, amount, type, date, description, attachment_uri, due_date, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, bookId, customerId, amount, type, date, description, attachmentUri, dueDate, 0, now, now]
      );

      await db.runAsync(
        'UPDATE customers SET balance = ?, updated_at = ? WHERE id = ?',
        [newBalance, now, customerId]
      );
    });

    // Voice announcement in selected language
    const lang = useLanguageStore.getState().language;
    SoundboxService.announceEntry(type === 1 ? 'GAVE' : 'GOT', amount, customer.name, lang);

    await get().loadCustomerDetails(customerId);
    await get().loadCustomers(bookId);
  },

  updateTransaction: async (
    transactionId: string,
    amount: number,
    type: TransactionType,
    date: string,
    description: string = '',
    dueDate: string = ''
  ) => {
    const db = await getDatabase();
    const oldTx = await db.getFirstAsync<Transaction>(
      'SELECT * FROM transactions WHERE id = ?',
      [transactionId]
    );
    if (!oldTx) return;

    const customer = await db.getFirstAsync<Customer>(
      'SELECT * FROM customers WHERE id = ?',
      [oldTx.customer_id]
    );
    if (!customer) return;

    // Calculate balance effect delta
    let oldDelta = 0;
    if (customer.party_type === 1) {
      // Customer: You gave (+), You got (-)
      oldDelta = oldTx.type === 1 ? oldTx.amount : -oldTx.amount;
    } else {
      // Supplier: You got (+), You gave (-)
      oldDelta = oldTx.type === 2 ? oldTx.amount : -oldTx.amount;
    }

    let newDelta = 0;
    if (customer.party_type === 1) {
      newDelta = type === 1 ? amount : -amount;
    } else {
      newDelta = type === 2 ? amount : -amount;
    }

    const netChange = newDelta - oldDelta;
    const newBalance = customer.balance + netChange;
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'UPDATE transactions SET amount = ?, type = ?, date = ?, description = ?, due_date = ?, updated_at = ? WHERE id = ?',
        [amount, type, date, description, dueDate, now, transactionId]
      );
      await db.runAsync(
        'UPDATE customers SET balance = ?, updated_at = ? WHERE id = ?',
        [newBalance, now, oldTx.customer_id]
      );
    });

    await get().loadCustomerDetails(oldTx.customer_id);
    await get().loadCustomers(oldTx.book_id);
  },

  deleteTransaction: async (transactionId: string) => {
    const db = await getDatabase();
    const tx = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    if (!tx) return;

    const customer = await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [tx.customer_id]);
    if (!customer) return;

    // Reverse balance
    let reverseDelta = 0;
    if (customer.party_type === 1) {
      reverseDelta = tx.type === 1 ? -tx.amount : tx.amount;
    } else {
      reverseDelta = tx.type === 2 ? -tx.amount : tx.amount;
    }

    const newBalance = customer.balance + reverseDelta;
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      // Soft delete
      await db.runAsync('UPDATE transactions SET is_deleted = 1, updated_at = ? WHERE id = ?', [now, transactionId]);
      await db.runAsync('UPDATE customers SET balance = ?, updated_at = ? WHERE id = ?', [newBalance, now, tx.customer_id]);
    });

    await get().loadCustomerDetails(tx.customer_id);
    await get().loadCustomers(tx.book_id);
  },

  deleteCustomer: async (customerId: string) => {
    const db = await getDatabase();
    const cust = await db.getFirstAsync<Customer>('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (!cust) return;

    // Archive / Soft delete
    await db.runAsync('UPDATE customers SET is_archived = 1, updated_at = ? WHERE id = ?', [Date.now(), customerId]);
    await get().loadCustomers(cust.book_id);
  },
}));

