import { create } from 'zustand';
import { CashbookEntry, CashbookType, PaymentMode } from '../types/models';
import { getDatabase } from '../db/database';

interface CashbookState {
  entries: CashbookEntry[];
  todayIn: number;
  todayOut: number;
  cashInHand: number;
  isLoading: boolean;
  loadCashbook: (bookId: string, selectedDate?: string) => Promise<void>;
  addEntry: (
    bookId: string,
    amount: number,
    type: CashbookType,
    category: string,
    entryDate: string,
    description?: string,
    paymentMode?: PaymentMode
  ) => Promise<void>;
  deleteEntry: (id: string, bookId: string) => Promise<void>;
}

export const useCashbookStore = create<CashbookState>((set, get) => ({
  entries: [],
  todayIn: 0,
  todayOut: 0,
  cashInHand: 0,
  isLoading: true,

  loadCashbook: async (bookId: string, selectedDate?: string) => {
    try {
      const db = await getDatabase();
      const date = selectedDate || new Date().toISOString().split('T')[0];

      // Get entries for selected date
      const entries = await db.getAllAsync<CashbookEntry>(
        'SELECT * FROM cashbook WHERE book_id = ? AND entry_date = ? ORDER BY created_at DESC',
        [bookId, date]
      );

      // Calculate total cash in hand (all-time cash in minus cash out)
      const allEntries = await db.getAllAsync<{ amount: number; type: string }>(
        'SELECT amount, type FROM cashbook WHERE book_id = ?',
        [bookId]
      );

      let totalCash = 0;
      for (const e of allEntries) {
        if (e.type === 'IN') totalCash += e.amount;
        else totalCash -= e.amount;
      }

      let inAmt = 0;
      let outAmt = 0;
      for (const e of entries) {
        if (e.type === 'IN') inAmt += e.amount;
        else outAmt += e.amount;
      }

      set({
        entries,
        todayIn: inAmt,
        todayOut: outAmt,
        cashInHand: totalCash,
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to load cashbook:', e);
      set({ isLoading: false });
    }
  },

  addEntry: async (bookId, amount, type, category, entryDate, description = '', paymentMode = 'CASH') => {
    const db = await getDatabase();
    const id = `cb_${Date.now()}`;
    const now = Date.now();

    await db.runAsync(
      'INSERT INTO cashbook (id, book_id, amount, type, category, entry_date, description, payment_mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, bookId, amount, type, category, entryDate, description, paymentMode, now]
    );

    await get().loadCashbook(bookId, entryDate);
  },

  deleteEntry: async (id: string, bookId: string) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM cashbook WHERE id = ?', [id]);
    await get().loadCashbook(bookId);
  },
}));

