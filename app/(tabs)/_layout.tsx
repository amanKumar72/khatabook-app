import { Tabs } from 'expo-router';
import { BookOpen, Receipt, Banknote, QrCode, Menu } from 'lucide-react-native';
import { useThemeStore } from '../../src/store/useThemeStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';

export default function TabLayout() {
  const colors = useThemeStore((s) => s.colors);
  const t = useLanguageStore((s) => s.t);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_khata'),
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 22} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="billbook"
        options={{
          title: t('tab_billbook'),
          tabBarIcon: ({ color, size }) => <Receipt size={size || 22} color={color} />,
          headerTitle: 'BillBook & Inventory',
        }}
      />
      <Tabs.Screen
        name="cashbook"
        options={{
          title: t('tab_cashbook'),
          tabBarIcon: ({ color, size }) => <Banknote size={size || 22} color={color} />,
          headerTitle: 'Daily Cashbook (Galla)',
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: t('tab_payments'),
          tabBarIcon: ({ color, size }) => <QrCode size={size || 22} color={color} />,
          headerTitle: 'UPI QR & Collections',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tab_more'),
          tabBarIcon: ({ color, size }) => <Menu size={size || 22} color={color} />,
          headerTitle: 'Business Suite & Settings',
        }}
      />
    </Tabs>
  );
}
