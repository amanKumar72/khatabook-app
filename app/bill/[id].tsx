import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  Printer,
  Receipt,
  User,
  Calendar,
  CreditCard,
  FileCheck,
} from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useBillStore } from '../../src/store/useBillStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { Bill, BillItem } from '../../src/types/models';
import { getDatabase } from '../../src/db/database';
import { PdfGenerator } from '../../src/services/pdfGenerator';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);

  const activeBook = useBookStore((s) => s.activeBook);
  const businessProfile = useBookStore((s) => s.businessProfile);
  const { loadBillItems } = useBillStore();

  const [bill, setBill] = useState<Bill | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchBill() {
      if (!id) return;
      try {
        const db = await getDatabase();
        const found = await db.getFirstAsync<Bill>('SELECT * FROM bills WHERE id = ?', [id]);
        if (found) {
          setBill(found);
          const loadedItems = await loadBillItems(found.id);
          setItems(loadedItems);
        }
      } catch (err) {
        console.error('Failed to load bill detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBill();
  }, [id]);

  const handleSharePdf = async () => {
    if (!bill) return;
    try {
      setActionLoading(true);
      await PdfGenerator.generateInvoice(bill, items, {
        name: businessProfile.name || activeBook?.name || 'My Store',
        phone: businessProfile.phone,
        address: businessProfile.address,
        gstin: businessProfile.gstin,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to generate PDF');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!bill) return;
    try {
      setActionLoading(true);
      await PdfGenerator.printInvoice(bill, items, {
        name: businessProfile.name || activeBook?.name || 'My Store',
        phone: businessProfile.phone,
        address: businessProfile.address,
        gstin: businessProfile.gstin,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to print invoice');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading invoice...</Text>
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>Invoice not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Bill #${bill.bill_number}`,
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={handlePrint} disabled={actionLoading}>
                <Printer size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSharePdf} disabled={actionLoading}>
                <Share2 size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Bill Header Badge Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: colors.primaryBg }]}>
              <Receipt size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{bill.bill_type.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.paymentBadge, { backgroundColor: colors.accentBlueBg }]}>
              <CreditCard size={14} color={colors.accentBlue} style={{ marginRight: 4 }} />
              <Text style={[styles.paymentBadgeText, { color: colors.accentBlue }]}>{bill.payment_mode}</Text>
            </View>
          </View>

          <View style={styles.amountBox}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Total Amount</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>₹{bill.total_amount.toFixed(2)}</Text>
          </View>

          <View style={[styles.metaRow, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.metaCol}>
              <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{bill.bill_date}</Text>
            </View>
            <View style={styles.metaCol}>
              <FileCheck size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>Bill #{bill.bill_number}</Text>
            </View>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Details</Text>
          <View style={styles.customerRow}>
            <View style={[styles.customerAvatar, { backgroundColor: colors.primaryBg }]}>
              <User size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.customerName, { color: colors.text }]}>{bill.customer_name || 'Cash Customer'}</Text>
              <Text style={[styles.customerSubtext, { color: colors.textSecondary }]}>
                Payment Mode: <Text style={{ fontWeight: '600', color: colors.text }}>{bill.payment_mode}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Items ({items.length})</Text>
          </View>

          {items.map((item, index) => (
            <View
              key={item.id || index}
              style={[styles.itemRow, { borderBottomColor: colors.borderSubtle }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.item_name}</Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                  {item.quantity} {item.unit} × ₹{item.rate.toFixed(2)}
                  {item.tax_percentage > 0 ? ` (+${item.tax_percentage}% GST)` : ''}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>₹{item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Bill Summary Calculations */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{bill.subtotal.toFixed(2)}</Text>
          </View>

          {bill.tax_total > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total GST</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>₹{bill.tax_total.toFixed(2)}</Text>
            </View>
          )}

          {bill.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                - ₹{bill.discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.grandTotalRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Grand Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.primary }]}>₹{bill.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleSharePdf}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Share2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Share Invoice PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={handlePrint}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            <Printer size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Print Bill</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  amountBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  customerSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
  },
  actionContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  secondaryBtnText: {
    color: '#16a34a',
    fontSize: 15,
    fontWeight: '700',
  },
});

