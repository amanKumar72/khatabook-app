import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShieldAlert, Lock, Unlock } from 'lucide-react-native';
import { getDatabase } from '../src/db/database';
import { useBookStore } from '../src/store/useBookStore';
import { useAuthStore } from '../src/store/useAuthStore';
import { useLanguageStore } from '../src/store/useLanguageStore';
import { useThemeStore } from '../src/store/useThemeStore';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const loadBooks = useBookStore((s) => s.loadBooks);
  const { isLocked, isLockEnabled, checkLockStatus, unlock } = useAuthStore();
  const loadLanguage = useLanguageStore((s) => s.loadLanguage);
  const { colors, isDark, loadTheme } = useThemeStore();

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await loadBooks();
        await loadLanguage();
        await loadTheme();
        await checkLockStatus();
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setDbReady(true);
      }
    }
    init();
  }, []);

  if (!dbReady) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Initializing Khatabook Offline...
        </Text>
      </View>
    );
  }

  if (isLockEnabled && isLocked) {
    return (
      <SafeAreaProvider>
        <View style={[styles.lockContainer, { backgroundColor: colors.background }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <View style={[styles.lockIconBox, { backgroundColor: colors.primaryBg }]}>
            <Lock size={48} color={colors.primary} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.text }]}>Khatabook is Locked</Text>
          <Text style={[styles.lockSubtitle, { color: colors.textSecondary }]}>
            Your business accounts are protected
          </Text>
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: colors.primary }]}
            onPress={() => unlock()}
            activeOpacity={0.8}
          >
            <Unlock size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.unlockButtonText}>Unlock with Biometrics / PIN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen
          name="customer/[id]"
          options={{ title: 'Customer Ledger', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="customer/add"
          options={{ title: 'Add Party', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="customer/transaction"
          options={{ title: 'Add Entry', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="bill/create"
          options={{ title: 'Create Invoice', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="bill/[id]"
          options={{ title: 'Invoice Details', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="inventory/add"
          options={{ title: 'Add Item to Stock', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="staff/index"
          options={{ title: 'Staff & Attendance', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="backup/index"
          options={{ title: 'Backup & Restore Hub', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen
          name="business-card"
          options={{ title: 'Digital Business Card', headerBackTitle: 'Back', headerBackButtonDisplayMode: 'minimal' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  lockIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  unlockButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
