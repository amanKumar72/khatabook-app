import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { AppLockService } from '../services/appLock';

interface AuthState {
  isLocked: boolean;
  isLockEnabled: boolean;
  isLoading: boolean;
  checkLockStatus: () => Promise<void>;
  unlock: () => Promise<boolean>;
  setLockEnabled: (enabled: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLocked: false,
  isLockEnabled: false,
  isLoading: true,

  checkLockStatus: async () => {
    try {
      const db = await getDatabase();
      const setting = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['app_lock_enabled']
      );

      const enabled = setting ? setting.value === 'true' : false;
      set({ isLockEnabled: enabled, isLocked: enabled, isLoading: false });

      if (enabled) {
        // Attempt immediate biometric unlock
        const success = await AppLockService.authenticate();
        if (success) {
          set({ isLocked: false });
        }
      }
    } catch (e) {
      console.error('Failed to check lock status:', e);
      set({ isLoading: false });
    }
  },

  unlock: async () => {
    const success = await AppLockService.authenticate();
    if (success) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  setLockEnabled: async (enabled: boolean) => {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'app_lock_enabled',
      enabled ? 'true' : 'false',
    ]);
    set({ isLockEnabled: enabled });
  },
}));

