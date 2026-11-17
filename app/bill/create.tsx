import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Plus, Trash2, Receipt, Package, X, Check, Zap } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useBillStore } from '../../src/store/useBillStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { GST_SLABS } from '../../src/constants/gstSlabs';
import { BillType, PaymentMode, InventoryItem } from '../../src/types/models';
import { PdfGenerator } from '../../src/services/pdfGenerator';

interface LineItemForm {
  item_name: string;
  quantity: string;
  unit: string;
  rate: string;
  tax_percentage: number;
}

export default function CreateBillScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const activeBook = useBookStore((s) => s.activeBook);
  const businessProfile = useBookStore((s) => s.businessProfile);
  const { createBill, inventoryItems, loadInventory } = useBillStore();
  const { t } = useLanguageStore();

  const [isQuickBill, setIsQuickBill] = useState(false);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDescription, setQuickDescription] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [billType, setBillType] = useState<BillType>('NON_GST_BILL');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [discount, setDiscount] = useState('0');

  const [items, setItems] = useState<LineItemForm[]>([
    { item_name: '', quantity: '1', unit: 'PCS', rate: '', tax_percentage: 18 },
  ]);

  const [showStockModal, setShowStockModal] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  useEffect(() => {
    if (activeBook) {
      loadInventory(activeBook.id);
    }
  }, [activeBook]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddItem = () => {
    setItems([
      ...items,
      { item_name: '', quantity: '1', unit: 'PCS', rate: '', tax_percentage: 18 },
    ]);
  };

  const handleSelectFromStock = (stockItem: InventoryItem) => {
    // If first item is empty, replace it; otherwise append
    if (items.length === 1 && !items[0].item_name && !items[0].rate) {
      setItems([
        {
          item_name: stockItem.name,
          quantity: '1',
          unit: stockItem.unit || 'PCS',
          rate: stockItem.sale_price.toString(),
          tax_percentage: 18,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          item_name: stockItem.name,
          quantity: '1',
          unit: stockItem.unit || 'PCS',
          rate: stockItem.sale_price.toString(),
          tax_percentage: 18,
        },
      ]);
    }
    setShowStockModal(false);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setItems([{ item_name: '', quantity: '1', unit: 'PCS', rate: '', tax_percentage: 18 }]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Compute live totals
  let subtotal = 0;
  let taxTotal = 0;

  let computedItems: {
    item_name: string;
    quantity: number;
    unit: string;
    rate: number;
    tax_percentage: number;
    amount: number;
  }[] = [];

  if (isQuickBill) {
    const qAmount = parseFloat(quickAmount) || 0;
    subtotal = qAmount;
    taxTotal = 0;
    computedItems = [
      {
        item_name: quickDescription.trim() || 'General Bill',
        quantity: 1,
        unit: 'PCS',
        rate: qAmount,
        tax_percentage: 0,
        amount: qAmount,
      },
    ];
  } else {
    // Detailed items mode: filter out completely empty rows
    const nonBlankRows = items.filter(
      (it) => it.item_name.trim() !== '' || parseFloat(it.rate) > 0
    );

    const rowsToProcess = nonBlankRows.length > 0 ? nonBlankRows : items;

    computedItems = rowsToProcess.map((it, idx) => {
      const qty = parseFloat(it.quantity) || 1;
      const rate = parseFloat(it.rate) || 0;
      const amt = qty * rate;
      const tax = billType === 'GST_INVOICE' ? (amt * it.tax_percentage) / 100 : 0;
      subtotal += amt;
      taxTotal += tax;
      return {
        item_name: it.item_name.trim() || `Item ${idx + 1}`,
        quantity: qty,
        unit: it.unit.trim() || 'PCS',
        rate,
        tax_percentage: billType === 'GST_INVOICE' ? it.tax_percentage : 0,
        amount: amt,
      };
    });
  }

  const numDiscount = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal + taxTotal - numDiscount);

  const handleSaveAndGenerate = async () => {
    setHasAttemptedSave(true);
    if (!activeBook) return;

    if (isQuickBill) {
      const qAmount = parseFloat(quickAmount);
      if (isNaN(qAmount) || qAmount <= 0) {
        Alert.alert(t('incomplete_items'), 'Please enter a valid bill amount.');
        return;
      }
    } else {
      // Check if user has entered at least one item with a rate
      const validItems = computedItems.filter((it) => it.rate > 0);
      if (validItems.length === 0) {
        Alert.alert(
          t('incomplete_items'),
          'Please enter the rate / price for the item (or switch to Quick Total Bill).'
        );
        return;
      }
      computedItems = validItems;
    }

    try {
      const createdBill = await createBill(
        activeBook.id,
        customerName.trim() || 'Cash Customer',
        null,
        billType,
        todayStr,
        computedItems,
        numDiscount,
        paymentMode
      );

      // Offer immediate PDF generation
      Alert.alert(
        'Invoice Created',
        `Bill #${createdBill.bill_number} for ₹${grandTotal.toFixed(2)} saved successfully!`,
        [
          { text: t('done'), onPress: () => router.back() },
          {
            text: 'Share PDF',
            onPress: async () => {
              const fullItems = computedItems.map((p, idx) => ({
                id: `tmp_${idx}`,
                bill_id: createdBill.id,
                ...p,
              }));
              await PdfGenerator.generateInvoice(createdBill, fullItems, {
                name: businessProfile.name || activeBook.name,
                phone: businessProfile.phone,
                address: businessProfile.address,
                gstin: businessProfile.gstin,
              });
              router.back();
            },
          },
        ]
      );
    } catch (e) {
      console.error('Failed to create bill:', e);
      Alert.alert('Error', 'Failed to save bill locally.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('create_invoice'),
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
        {/* Bill Type Selector */}
        <View style={[styles.typeSelector, { backgroundColor: colors.cardSecondary }]}>
          {(['NON_GST_BILL', 'GST_INVOICE', 'QUOTATION'] as BillType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeBtn,
                billType === type && [styles.typeBtnActive, { backgroundColor: colors.card }],
              ]}
              onPress={() => setBillType(type)}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: colors.textSecondary },
                  billType === type && [styles.typeTextActive, { color: colors.primary }],
                ]}
              >
                {type === 'NON_GST_BILL'
                  ? t('non_gst_bill')
                  : type === 'GST_INVOICE'
                  ? t('gst_invoice')
                  : t('quotation')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Bill / Detailed Items Toggle */}
        <View style={styles.modeToggleRow}>
          <TouchableOpacity
            style={[
              styles.modeToggleBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              !isQuickBill && [styles.modeToggleBtnActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
            ]}
            onPress={() => setIsQuickBill(false)}
          >
            <Receipt
              size={16}
              color={!isQuickBill ? '#ffffff' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeToggleText,
                { color: colors.textSecondary },
                !isQuickBill && styles.modeToggleTextActive,
              ]}
            >
              Detailed Items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeToggleBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              isQuickBill && [styles.modeToggleBtnActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
            ]}
            onPress={() => setIsQuickBill(true)}
          >
            <Zap
              size={16}
              color={isQuickBill ? '#ffffff' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeToggleText,
                { color: colors.textSecondary },
                isQuickBill && styles.modeToggleTextActive,
              ]}
            >
              {t('quick_bill')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Name & Payment Mode */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('customer_name_bill')}</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="e.g. Ramesh Kumar / Walk-in Customer"
          placeholderTextColor={colors.textMuted}
          value={customerName}
          onChangeText={setCustomerName}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('payment_mode')}</Text>
        <View style={styles.payModeRow}>
          {(['CASH', 'UPI', 'CREDIT'] as PaymentMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.payModeBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                paymentMode === mode && [
                  styles.payModeBtnActive,
                  { backgroundColor: colors.primaryBg, borderColor: colors.primary },
                ],
              ]}
              onPress={() => setPaymentMode(mode)}
            >
              <Text
                style={[
                  styles.payModeText,
                  { color: colors.textSecondary },
                  paymentMode === mode && [styles.payModeTextActive, { color: colors.primary }],
                ]}
              >
                {mode === 'CASH' ? t('cash') : mode === 'UPI' ? t('upi') : t('credit')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Bill Direct Amount Input */}
        {isQuickBill ? (
          <View style={[styles.quickBillCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.quickBillHeading, { color: colors.primary }]}>Direct Bill Amount (₹) *</Text>
            <TextInput
              style={[
                styles.quickAmountInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
                hasAttemptedSave && (!quickAmount || parseFloat(quickAmount) <= 0) && styles.inputError,
              ]}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={quickAmount}
              onChangeText={setQuickAmount}
              autoFocus
            />
            {hasAttemptedSave && (!quickAmount || parseFloat(quickAmount) <= 0) && (
              <Text style={styles.errorText}>Please enter the bill amount</Text>
            )}

            <Text style={[styles.label, { marginTop: 12, color: colors.textSecondary }]}>Note / Description (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Grocery Items / Retail Sale"
              placeholderTextColor={colors.textMuted}
              value={quickDescription}
              onChangeText={setQuickDescription}
            />
          </View>
        ) : (
          /* Detailed Line Items */
          <>
            <View style={styles.itemsHeaderRow}>
              <Text style={[styles.itemsHeading, { color: colors.text }]}>{t('items_quantities')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {inventoryItems.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.stockBtn,
                      {
                        backgroundColor: colors.accentBlueBg,
                        borderColor: colors.accentBlue,
                      },
                    ]}
                    onPress={() => setShowStockModal(true)}
                  >
                    <Package size={15} color={colors.accentBlue} style={{ marginRight: 4 }} />
                    <Text style={[styles.stockBtnText, { color: colors.accentBlue }]}>{t('from_stock')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.addItemBtn, { backgroundColor: colors.primaryBg }]}
                  onPress={handleAddItem}
                >
                  <Plus size={16} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.addItemBtnText, { color: colors.primary }]}>{t('add_row')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {items.map((item, idx) => {
              const isRateMissing =
                hasAttemptedSave && (!item.rate || parseFloat(item.rate) <= 0);

              return (
                <View
                  key={idx}
                  style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.itemCardTop}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          marginBottom: 0,
                          backgroundColor: colors.inputBg,
                          borderColor: colors.inputBorder,
                          color: colors.text,
                        },
                      ]}
                      placeholder={`${t('item_name')} ${idx + 1} (e.g. Rice / Goods)`}
                      placeholderTextColor={colors.textMuted}
                      value={item.item_name}
                      onChangeText={(v) => handleUpdateItem(idx, 'item_name', v)}
                    />
                    {items.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(idx)}
                        style={{ padding: 8, marginLeft: 6 }}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.itemRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{t('qty')}</Text>
                      <TextInput
                        style={[
                          styles.smallInput,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor={colors.textMuted}
                        value={item.quantity}
                        onChangeText={(v) => handleUpdateItem(idx, 'quantity', v)}
                      />
                    </View>

                    <View style={{ flex: 1.1, marginRight: 8 }}>
                      <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{t('unit')}</Text>
                      <TextInput
                        style={[
                          styles.smallInput,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                            color: colors.text,
                          },
                        ]}
                        value={item.unit}
                        onChangeText={(v) => handleUpdateItem(idx, 'unit', v)}
                        placeholder="PCS"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    <View style={{ flex: 1.5, marginRight: billType === 'GST_INVOICE' ? 8 : 0 }}>
                      <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{t('rate')} *</Text>
                      <TextInput
                        style={[
                          styles.smallInput,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.inputBorder,
                            color: colors.text,
                          },
                          isRateMissing && styles.inputError,
                        ]}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted}
                        value={item.rate}
                        onChangeText={(v) => handleUpdateItem(idx, 'rate', v)}
                      />
                    </View>

                    {billType === 'GST_INVOICE' && (
                      <View style={{ flex: 1.1 }}>
                        <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{t('gst_pct')}</Text>
                        <TextInput
                          style={[
                            styles.smallInput,
                            {
                              backgroundColor: colors.inputBg,
                              borderColor: colors.inputBorder,
                              color: colors.text,
                            },
                          ]}
                          keyboardType="numeric"
                          placeholder="18"
                          placeholderTextColor={colors.textMuted}
                          value={item.tax_percentage.toString()}
                          onChangeText={(v) =>
                            handleUpdateItem(idx, 'tax_percentage', parseFloat(v) || 0)
                          }
                        />
                      </View>
                    )}
                  </View>
                  {isRateMissing && (
                    <Text style={styles.errorText}>Please enter rate/price</Text>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Calculation Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('subtotal')}</Text>
            <Text style={[styles.summaryVal, { color: colors.text }]}>₹{subtotal.toFixed(2)}</Text>
          </View>

          {billType === 'GST_INVOICE' && taxTotal > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total GST</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>₹{taxTotal.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('discount')}</Text>
            <TextInput
              style={[
                styles.discountInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              keyboardType="numeric"
              value={discount}
              onChangeText={setDiscount}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.primary }]}>{t('grand_total')}</Text>
            <Text style={[styles.grandTotalVal, { color: colors.primary }]}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          onPress={handleSaveAndGenerate}
          activeOpacity={0.8}
        >
          <Receipt size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>{t('save_generate')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Select from Inventory Modal */}
      <Modal visible={showStockModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Item from Stock</Text>
              <TouchableOpacity onPress={() => setShowStockModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={inventoryItems}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.stockItemRow, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => handleSelectFromStock(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stockItemName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.stockItemUnit, { color: colors.textSecondary }]}>
                      Unit: {item.unit} | Stock: {item.stock_quantity}
                    </Text>
                  </View>
                  <Text style={[styles.stockItemPrice, { color: colors.primary }]}>₹{item.sale_price.toFixed(2)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  typeTextActive: {
    color: '#16a34a',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  modeToggleBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  modeToggleTextActive: {
    color: '#ffffff',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 14,
  },
  inputError: {
    borderColor: '#dc2626',
    borderWidth: 1.5,
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  payModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  payModeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  payModeBtnActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  payModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  payModeTextActive: {
    color: '#16a34a',
  },
  quickBillCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickBillHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 8,
  },
  quickAmountInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  stockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  stockBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sublabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  discountInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 90,
    textAlign: 'right',
    fontSize: 14,
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
  },
  grandTotalVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16a34a',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  stockItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  stockItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  stockItemUnit: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  stockItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
});
