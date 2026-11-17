import { create } from 'zustand';
import { Appearance } from 'react-native';
import { ThemeMode, ThemeColors, lightColors, darkColors } from '../constants/theme';
import { getDatabase } from '../db/database';

interface ThemeState {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  loadTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

function computeIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return Appearance.getColorScheme() === 'dark';
}

export const useThemeStore = create<ThemeState>((set, get) => {
  // Listen for system appearance changes
  Appearance.addChangeListener(() => {
    const { themeMode } = get();
    if (themeMode === 'system') {
      const isDark = computeIsDark('system');
      set({ isDark, colors: isDark ? darkColors : lightColors });
    }
  });

  return {
    themeMode: 'system',
    isDark: computeIsDark('system'),
    colors: computeIsDark('system') ? darkColors : lightColors,

    loadTheme: async () => {
      try {
        const db = await getDatabase();
        const row = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM settings WHERE key = 'app_theme'"
        );
        const mode = (row?.value as ThemeMode) || 'system';
        const isDark = computeIsDark(mode);
        set({
          themeMode: mode,
          isDark,
          colors: isDark ? darkColors : lightColors,
        });
      } catch (e) {
        console.error('Failed to load theme setting:', e);
      }
    },

    setThemeMode: async (mode: ThemeMode) => {
      try {
        const db = await getDatabase();
        await db.runAsync(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('app_theme', ?)",
          [mode]
        );
        const isDark = computeIsDark(mode);
        set({
          themeMode: mode,
          isDark,
          colors: isDark ? darkColors : lightColors,
        });
      } catch (e) {
        console.error('Failed to save theme setting:', e);
        const isDark = computeIsDark(mode);
        set({
          themeMode: mode,
          isDark,
          colors: isDark ? darkColors : lightColors,
        });
      }
    },
  };
});

