import { create } from 'zustand';
import { SupportedLanguage, translations } from '../i18n/languages';
import { getDatabase } from '../db/database';

interface LanguageState {
  language: SupportedLanguage;
  isLoading: boolean;
  loadLanguage: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: keyof typeof translations.en) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',
  isLoading: false,

  loadLanguage: async () => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('app_language', ?)",
        ['en']
      );
      set({ language: 'en', isLoading: false });
    } catch {
      set({ language: 'en', isLoading: false });
    }
  },

  setLanguage: async (_lang: SupportedLanguage) => {
    set({ language: 'en' });
  },

  t: (key: keyof typeof translations.en): string => {
    return translations.en[key] || (key as string);
  },
}));
