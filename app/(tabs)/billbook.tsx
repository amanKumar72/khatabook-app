import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Receipt, Package, Share2, AlertTriangle } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useBillStore } from '../../src/store/useBillStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { Bill, InventoryItem } from '../../src/types/models';
import { PdfGenerator } from '../../src/services/pdfGenerator';

export default function BillBookScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const activeBook = useBookStore((s) => s.activeBook);
  const businessProfile = useBookStore((s) => s.businessProfile);
  const { bills, inventoryItems, loadBills, loadInventory, loadBillItems, isLoading } = useBillStore();

  const [activeTab, setActiveTab] = useState<'bills' | 'inventory'>('bills');

  useEffect(() => {
    if (activeBook) {
      loadBills(activeBook.id);
      loadInventory(activeBook.id);
    }
  }, [activeBook]);

  const handleSharePdf = async (bill: Bill) => {
    try {
      const items = await loadBillItems(bill.id);
      await PdfGenerator.generateInvoice(bill, items, {
        name: businessProfile.name || activeBook?.name || 'My Store',
        phone: businessProfile.phone,
        address: businessProfile.address,
        gstin: businessProfile.gstin,
      });
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    }
  };

  const renderBillItem = ({ item }: { item: Bill }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/bill/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.billNumber, { color: colors.text }]}>Bill #{item.bill_number}</Text>
          <Text style={[styles.billDate, { color: colors.textSecondary }]}>{item.bill_date}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.cardSecondary }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
            {item.bill_type.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.customerName, { color: colors.textSecondary }]}>
          Customer: <Text style={{ fontWeight: '700', color: colors.text }}>{item.customer_name || 'Cash Customer'}</Text>
        </Text>
        <Text style={[styles.billPaymentMode, { color: colors.textSecondary }]}>Payment: {item.payment_mode}</Text>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
        <View>
          <Text style={[styles.billAmount, { color: colors.text }]}>₹{item.total_amount.toFixed(2)}</Text>
          {item.tax_total > 0 && (
            <Text style={[styles.taxSubtext, { color: colors.textSecondary }]}>Includes ₹{item.tax_total.toFixed(2)} GST</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
          onPress={(e) => {
            e.stopPropagation();
            handleSharePdf(item);
          }}
          activeOpacity={0.7}
        >
          <Share2 size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.shareBtnText, { color: colors.primary }]}>PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const isLowStock = item.stock_quantity <= item.low_stock_threshold;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
            {item.barcode ? <Text style={[styles.itemBarcode, { color: colors.textSecondary }]}>Barcode: {item.barcode}</Text> : null}
          </View>
          {isLowStock && (
            <View style={styles.lowStockBadge}>
              <AlertTriangle size={12} color="#dc2626" style={{ marginRight: 4 }} />
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        <View style={[styles.stockDetailsRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.stockCol}>
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Sale Price</Text>
            <Text style={[styles.stockValue, { color: colors.text }]}>₹{item.sale_price.toFixed(2)}</Text>
          </View>
          <View style={styles.stockCol}>
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Purchase Price</Text>
            <Text style={[styles.stockValue, { color: colors.text }]}>₹{item.purchase_price.toFixed(2)}</Text>
          </View>
          <View style={[styles.stockCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Current Stock</Text>
            <Text
              style={[
                styles.stockValue,
                { color: isLowStock ? colors.danger : colors.primary, fontWeight: '800' },
              ]}
            >
              {item.stock_quantity} {item.unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Switcher */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.cardSecondary }]}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'bills' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => setActiveTab('bills')}
        >
          <Receipt
            size={16}
            color={activeTab === 'bills' ? colors.primary : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.segmentText,
              { color: colors.textSecondary },
              activeTab === 'bills' && [styles.segmentTextActive, { color: colors.primary }],
            ]}
          >
            BILLS & INVOICES ({bills.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            activeTab === 'inventory' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => setActiveTab('inventory')}
        >
          <Package
            size={16}
            color={activeTab === 'inventory' ? colors.primary : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.segmentText,
              { color: colors.textSecondary },
              activeTab === 'inventory' && [styles.segmentTextActive, { color: colors.primary }],
            ]}
          >
            STOCK ITEMS ({inventoryItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {activeTab === 'bills' ? (
        <FlatList
          data={bills}
          keyExtractor={(b) => b.id}
          renderItem={renderBillItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                if (activeBook) loadBills(activeBook.id);
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Receipt size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Bills Created Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Create GST invoices or cash bills with auto-calculated tax and share PDF via WhatsApp.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={inventoryItems}
          keyExtractor={(i) => i.id}
          renderItem={renderInventoryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                if (activeBook) loadInventory(activeBook.id);
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Inventory Items Added</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Add items with unit measurements and prices to speed up counter billing.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating CTA */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={() => {
          if (activeTab === 'bills') {
            router.push('/bill/create');
          } else {
            router.push('/inventory/add');
          }
        }}
        activeOpacity={0.85}
      >
        <Plus size={20} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.fabText}>
          {activeTab === 'bills' ? 'CREATE BILL' : 'ADD ITEM'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#16a34a',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  billNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  billDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cardBody: {
    marginVertical: 6,
  },
  customerName: {
    fontSize: 14,
    color: '#334155',
  },
  billPaymentMode: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  taxSubtext: {
    fontSize: 11,
    color: '#64748b',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  shareBtnText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemBarcode: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
  stockDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stockCol: {
    flex: 1,
  },
  stockLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 36,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
