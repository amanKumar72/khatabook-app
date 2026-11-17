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

      let profile: BusinessProfile = {
        name: activeBook?.name || 'My Business',
        phone: activeBook?.phone || '',
        address: '',
        gstin: '',
        upi_id: '',
        category: activeBook?.business_category || 'Kirana / General Store',
      };

      if (activeBook) {
        // Load book-specific profile if saved
        const bookProfileSetting = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM settings WHERE key = ?',
          [`business_profile_${activeBook.id}`]
        );
        if (bookProfileSetting) {
          try {
            const parsed = JSON.parse(bookProfileSetting.value);
            profile = {
              ...profile,
              ...parsed,
              name: activeBook.name,
              category: activeBook.business_category || parsed.category || profile.category,
            };
          } catch {}
        }
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
    const books = get().books;
    const active = books.find((b) => b.id === bookId) || null;

    if (!active) {
      set({ activeBook: null });
      return;
    }

    // Load book-specific profile
    const bookProfileSetting = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [`business_profile_${active.id}`]
    );

    let profile: BusinessProfile = {
      name: active.name,
      phone: active.phone || '',
      address: '',
      gstin: '',
      upi_id: '',
      category: active.business_category || 'Kirana / General Store',
    };

    if (bookProfileSetting) {
      try {
        const parsed = JSON.parse(bookProfileSetting.value);
        profile = {
          ...profile,
          ...parsed,
          name: active.name,
          category: active.business_category || parsed.category || profile.category,
        };
      } catch {}
    }

    set({ activeBook: active, businessProfile: profile });
  },

  createBook: async (name: string, category = 'Kirana / General Store') => {
    const db = await getDatabase();
    const id = `book_${Date.now()}`;
    const now = Date.now();
    await db.runAsync(
      'INSERT INTO books (id, name, phone, currency, business_category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, '', 'INR', category, now, now]
    );

    const initialProfile: BusinessProfile = {
      name,
      phone: '',
      address: '',
      gstin: '',
      upi_id: '',
      category,
    };
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      `business_profile_${id}`,
      JSON.stringify(initialProfile),
    ]);

    await get().loadBooks();
    await get().setActiveBook(id);
    return id;
  },

  updateBusinessProfile: async (updates: Partial<BusinessProfile>) => {
    const db = await getDatabase();
    const active = get().activeBook;
    const updated = { ...get().businessProfile, ...updates };

    if (active) {
      const newName = updates.name !== undefined ? updates.name.trim() : active.name;
      const newCategory = updates.category !== undefined ? updates.category.trim() : (active.business_category || 'Kirana / General Store');
      const newPhone = updates.phone !== undefined ? updates.phone.trim() : (active.phone || '');

      updated.name = newName;
      updated.category = newCategory;

      await db.runAsync(
        'UPDATE books SET name = ?, business_category = ?, phone = ?, updated_at = ? WHERE id = ?',
        [newName, newCategory, newPhone, Date.now(), active.id]
      );

      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        `business_profile_${active.id}`,
        JSON.stringify(updated),
      ]);

      const updatedBooks = get().books.map((b) =>
        b.id === active.id
          ? { ...b, name: newName, business_category: newCategory, phone: newPhone }
          : b
      );
      const updatedActive = updatedBooks.find((b) => b.id === active.id) || null;

      set({ books: updatedBooks, activeBook: updatedActive, businessProfile: updated });
    } else {
      await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'business_profile',
        JSON.stringify(updated),
      ]);
      set({ businessProfile: updated });
    }
  },
}));
