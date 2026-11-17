import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { AppLockService } from '../services/appLock';

interface AuthState {
  isLocked: boolean;
  isLockEnabled: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  checkLockStatus: () => Promise<void>;
  unlock: () => Promise<boolean>;
  setLockEnabled: (enabled: boolean) => Promise<void>;
  lockApp: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLocked: false,
  isLockEnabled: false,
  isLoading: true,
  isAuthenticating: false,

  checkLockStatus: async () => {
    try {
      const db = await getDatabase();
      const setting = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['app_lock_enabled']
      );

      const enabled = setting ? setting.value === 'true' : false;
      set({ isLockEnabled: enabled, isLocked: enabled, isLoading: false });
    } catch (e) {
      console.error('Failed to check lock status:', e);
      set({ isLoading: false });
    }
  },

  unlock: async () => {
    const { isAuthenticating } = get();
    if (isAuthenticating) return false;

    set({ isAuthenticating: true });
    try {
      const result = await AppLockService.authenticate('Unlock Khatabook');
      if (result.success) {
        set({ isLocked: false, isAuthenticating: false });
        return true;
      }
      set({ isAuthenticating: false });
      return false;
    } catch (e) {
      console.error('Unlock error:', e);
      set({ isAuthenticating: false });
      return false;
    }
  },

  lockApp: () => {
    const { isLockEnabled } = get();
    if (isLockEnabled) {
      set({ isLocked: true });
    }
  },

  setLockEnabled: async (enabled: boolean) => {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      'app_lock_enabled',
      enabled ? 'true' : 'false',
    ]);
    set({ isLockEnabled: enabled, isLocked: false });
  },
}));
