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
import { useRouter, Stack } from 'expo-router';
import { Package, Barcode, IndianRupee } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useBillStore } from '../../src/store/useBillStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { INVENTORY_UNITS } from '../../src/constants/inventoryUnits';

export default function AddInventoryItemScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const activeBook = useBookStore((s) => s.activeBook);
  const addInventoryItem = useBillStore((s) => s.addInventoryItem);

  const [name, setName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('PCS');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [barcode, setBarcode] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter item name.');
      return;
    }
    const sale = parseFloat(salePrice);
    if (isNaN(sale) || sale <= 0) {
      Alert.alert('Required', 'Please enter a valid selling price.');
      return;
    }
    if (!activeBook) return;

    await addInventoryItem(
      activeBook.id,
      name.trim(),
      selectedUnit,
      parseFloat(purchasePrice) || 0,
      sale,
      parseFloat(stockQuantity) || 0,
      barcode.trim()
    );

    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Item to Stock',
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
        <Text style={[styles.label, { color: colors.textSecondary }]}>Item Name *</Text>
        <View
          style={[
            styles.inputBox,
            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
          ]}
        >
          <Package size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. Fortune Sunflower Oil 1L"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Unit Measurement</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
          {INVENTORY_UNITS.slice(0, 10).map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[
                styles.unitChip,
                { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                selectedUnit === u.id && [
                  styles.unitChipActive,
                  { backgroundColor: colors.primaryBg, borderColor: colors.primary },
                ],
              ]}
              onPress={() => setSelectedUnit(u.id)}
            >
              <Text
                style={[
                  styles.unitChipText,
                  { color: colors.textSecondary },
                  selectedUnit === u.id && [styles.unitChipTextActive, { color: colors.primary }],
                ]}
              >
                {u.name} ({u.symbol})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Sale Price (₹) *</Text>
            <View
              style={[
                styles.inputBox,
                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
              ]}
            >
              <IndianRupee size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={salePrice}
                onChangeText={setSalePrice}
              />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Purchase Price (₹)</Text>
            <View
              style={[
                styles.inputBox,
                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
              ]}
            >
              <IndianRupee size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Initial Stock Quantity</Text>
        <TextInput
          style={[
            styles.inputBox,
            styles.input,
            {
              paddingHorizontal: 12,
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={stockQuantity}
          onChangeText={setStockQuantity}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Barcode / SKU Code (Optional)</Text>
        <View
          style={[
            styles.inputBox,
            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
          ]}
        >
          <Barcode size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. 8901030383852"
            placeholderTextColor={colors.textMuted}
            value={barcode}
            onChangeText={setBarcode}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>ADD TO INVENTORY</Text>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 12,
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
  unitScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  unitChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unitChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  unitChipTextActive: {
    color: '#16a34a',
  },
  row: {
    flexDirection: 'row',
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

