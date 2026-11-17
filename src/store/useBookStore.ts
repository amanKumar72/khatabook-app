import { create } from 'zustand';
import { Book, BusinessProfile } from '../types/models';
import { getDatabase } from '../db/database';

interface BookState {
  books: Book[];
  activeBook: Book | null;
  businessProfile: BusinessProfile;
  isLoading: boolean;
  loadBooks: () => Promise<void>;
  setActiveBook: (bookId: string) => Promise<void>;
  createBook: (name: string, category?: string) => Promise<string>;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => Promise<void>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  activeBook: null,
  businessProfile: {
    name: 'My Business',
    phone: '',
    address: '',
    gstin: '',
    upi_id: '',
    category: 'Kirana / General Store',
  },
  isLoading: true,

  loadBooks: async () => {
    try {
      const db = await getDatabase();
      const books = await db.getAllAsync<Book>('SELECT * FROM books ORDER BY created_at ASC');
      
      // Load active book ID from settings
      const setting = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['active_book_id']
      );

      const activeId = setting ? setting.value : books[0]?.id;
      const activeBook = books.find((b) => b.id === activeId) || books[0] || null;

      // Load profile
      const profileSetting = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['business_profile']
      );
      let profile: BusinessProfile = get().businessProfile;
      if (profileSetting) {
        try {
          profile = JSON.parse(profileSetting.value);
        } catch {}
      } else if (activeBook) {
        profile = {
          ...profile,
          name: activeBook.name,
          phone: activeBook.phone || '',
          category: activeBook.business_category || profile.category,
        };
      }

      set({ books, activeBook, businessProfile: profile, isLoading: false });
    } catch (e) {
      console.error('Failed to load books:', e);
      set({ isLoading: false });
    }
  },

  setActiveBook: async (bookId: string) => {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'active_book_id',
      bookId,
    ]);
    const active = get().books.find((b) => b.id === bookId) || null;
    set({ activeBook: active });
  },

  createBook: async (name: string, category = 'Kirana / General Store') => {
    const db = await getDatabase();
    const id = `book_${Date.now()}`;
    const now = Date.now();
    await db.runAsync(
      'INSERT INTO books (id, name, phone, currency, business_category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, '', 'INR', category, now, now]
    );

    await get().loadBooks();
    await get().setActiveBook(id);
    return id;
  },

  updateBusinessProfile: async (updates: Partial<BusinessProfile>) => {
    const db = await getDatabase();
    const updated = { ...get().businessProfile, ...updates };
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'business_profile',
      JSON.stringify(updated),
    ]);

    // Also update current active book name if updated
    if (updates.name && get().activeBook) {
      await db.runAsync('UPDATE books SET name = ?, updated_at = ? WHERE id = ?', [
        updates.name,
        Date.now(),
        get().activeBook!.id,
      ]);
    }

    set({ businessProfile: updated });
    await get().loadBooks();
  },
}));

