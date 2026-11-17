import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { User, Phone, MapPin, IndianRupee } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useKhataStore } from '../../src/store/useKhataStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { PartyType } from '../../src/types/models';

export default function AddCustomerScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const params = useLocalSearchParams<{ type?: string }>();
  const activeBook = useBookStore((s) => s.activeBook);
  const addCustomer = useKhataStore((s) => s.addCustomer);
  const { t } = useLanguageStore();

  const initialType: PartyType = params.type === '2' ? 2 : 1;
  const [partyType, setPartyType] = useState<PartyType>(initialType);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }
    if (!activeBook) return;

    const numCredit = parseFloat(creditLimit) || 0;
    const customerId = await addCustomer(
      activeBook.id,
      name.trim(),
      phone.trim(),
      partyType,
      address.trim(),
      numCredit
    );

    router.replace(`/customer/${customerId}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: partyType === 1 ? t('add_customer') : t('add_supplier'),
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Type Selector */}
        <View style={[styles.typeSelector, { backgroundColor: colors.cardSecondary }]}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              partyType === 1 && [styles.typeBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setPartyType(1)}
          >
            <Text
              style={[
                styles.typeText,
                { color: colors.textSecondary },
                partyType === 1 && styles.typeTextActive,
              ]}
            >
              CUSTOMER
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              partyType === 2 && [styles.typeBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setPartyType(2)}
          >
            <Text
              style={[
                styles.typeText,
                { color: colors.textSecondary },
                partyType === 2 && styles.typeTextActive,
              ]}
            >
              SUPPLIER
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {partyType === 1 ? 'Customer Name' : 'Supplier Name'} *
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <User size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. Ramesh Kumar"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <Phone size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. 9876543210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Shop / Billing Address (Optional)</Text>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <MapPin size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. Main Market, Shop #12"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {partyType === 1 ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Credit Limit Ceiling (Optional)</Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <IndianRupee size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. 10000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={creditLimit}
                onChangeText={setCreditLimit}
              />
            </View>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {t('save')} {partyType === 1 ? 'CUSTOMER' : 'SUPPLIER'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#16a34a',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
    elevation: 2,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

