import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, Calendar, X } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useCashbookStore } from '../../src/store/useCashbookStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { CashbookEntry, CashbookType } from '../../src/types/models';
import { CASHBOOK_CATEGORIES } from '../../src/constants/categories';

export default function CashbookScreen() {
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  const activeBook = useBookStore((s) => s.activeBook);
  const { entries, todayIn, todayOut, cashInHand, loadCashbook, addEntry, deleteEntry, isLoading } =
    useCashbookStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<CashbookType>('IN');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (activeBook) {
      loadCashbook(activeBook.id, todayStr);
    }
  }, [activeBook]);

  const openAddModal = (type: CashbookType) => {
    setModalType(type);
    setCategory(type === 'IN' ? CASHBOOK_CATEGORIES.IN[0] : CASHBOOK_CATEGORIES.OUT[0]);
    setAmount('');
    setDescription('');
    setModalVisible(true);
  };

  const handleSaveEntry = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !activeBook) return;

    await addEntry(activeBook.id, numAmount, modalType, category, todayStr, description, 'CASH');
    setModalVisible(false);
  };

  const renderEntry = ({ item }: { item: CashbookEntry }) => {
    const isIn = item.type === 'IN';
    return (
      <View style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View
          style={[
            styles.entryIconBox,
            { backgroundColor: isIn ? colors.primaryBg : colors.dangerBg },
          ]}
        >
          {isIn ? (
            <ArrowDownLeft size={20} color={colors.primary} />
          ) : (
            <ArrowUpRight size={20} color={colors.danger} />
          )}
        </View>

        <View style={styles.entryInfo}>
          <Text style={[styles.entryCategory, { color: colors.text }]}>{item.category}</Text>
          {item.description ? (
            <Text style={[styles.entryDesc, { color: colors.textSecondary }]}>{item.description}</Text>
          ) : null}
          <Text style={[styles.entryDate, { color: colors.textMuted }]}>{item.entry_date}</Text>
        </View>

        <View style={styles.entryAmountCol}>
          <Text
            style={[
              styles.entryAmount,
              { color: isIn ? colors.primary : colors.danger },
            ]}
          >
            {isIn ? '+' : '-'} ₹{item.amount.toFixed(2)}
          </Text>
          <TouchableOpacity
            onPress={() => activeBook && deleteEntry(item.id, activeBook.id)}
            style={{ marginTop: 4, padding: 4 }}
          >
            <Trash2 size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Galla Balance Card */}
      <View style={[styles.gallaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.gallaLabel, { color: colors.textSecondary }]}>Current Cash In Hand (Galla)</Text>
        <Text
          style={[
            styles.gallaAmount,
            { color: cashInHand >= 0 ? colors.primary : colors.danger },
          ]}
        >
          ₹{cashInHand.toFixed(2)}
        </Text>
        <Text style={[styles.gallaSub, { color: colors.textMuted }]}>Calculated from all offline cash entries</Text>
      </View>

      {/* Today's In/Out Summary */}
      <View style={styles.todaySummaryRow}>
        <View
          style={[
            styles.summaryPill,
            {
              backgroundColor: colors.primaryBg,
              borderColor: isDark ? colors.border : '#bbf7d0',
            },
          ]}
        >
          <View style={styles.pillHeader}>
            <ArrowDownLeft size={14} color={colors.primary} />
            <Text style={[styles.pillLabel, { color: colors.primary }]}>Today's In</Text>
          </View>
          <Text style={[styles.pillAmount, { color: colors.primary }]}>+ ₹{todayIn.toFixed(2)}</Text>
        </View>

        <View
          style={[
            styles.summaryPill,
            {
              backgroundColor: colors.dangerBg,
              borderColor: isDark ? colors.border : '#fecaca',
            },
          ]}
        >
          <View style={styles.pillHeader}>
            <ArrowUpRight size={14} color={colors.danger} />
            <Text style={[styles.pillLabel, { color: colors.danger }]}>Today's Out</Text>
          </View>
          <Text style={[styles.pillAmount, { color: colors.danger }]}>- ₹{todayOut.toFixed(2)}</Text>
        </View>
      </View>

      {/* Entries List */}
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              if (activeBook) loadCashbook(activeBook.id, todayStr);
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Cash Entries Today</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap Cash In or Cash Out below to log your daily store transactions.
            </Text>
          </View>
        }
      />

      {/* Bottom Dual Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => openAddModal('IN')}
          activeOpacity={0.85}
        >
          <ArrowDownLeft size={20} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>CASH IN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.danger }]}
          onPress={() => openAddModal('OUT')}
          activeOpacity={0.85}
        >
          <ArrowUpRight size={20} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnText}>CASH OUT</Text>
        </TouchableOpacity>
      </View>

      {/* Add Cash Entry Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: modalType === 'IN' ? colors.primary : colors.danger },
                ]}
              >
                {modalType === 'IN' ? 'Cash In (Income / Sale)' : 'Cash Out (Expense / Payment)'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (₹)</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {(modalType === 'IN' ? CASHBOOK_CATEGORIES.IN : CASHBOOK_CATEGORIES.OUT).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: colors.cardSecondary,
                      borderColor: colors.border,
                    },
                    category === cat && [
                      styles.categoryChipActive,
                      {
                        backgroundColor: colors.primaryBg,
                        borderColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: colors.textSecondary },
                      category === cat && [styles.categoryChipTextActive, { color: colors.primary }],
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Note / Description (Optional)</Text>
            <TextInput
              style={[
                styles.descInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Morning vegetable stock purchase"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.textMuted}
            />

            <TouchableOpacity
              style={[
                styles.saveModalBtn,
                { backgroundColor: modalType === 'IN' ? colors.primary : colors.danger },
              ]}
              onPress={handleSaveEntry}
            >
              <Text style={styles.saveModalBtnText}>SAVE ENTRY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  gallaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  gallaLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  gallaAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  gallaSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  todaySummaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    gap: 10,
  },
  summaryPill: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  pillAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  entryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  entryDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  entryDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
  },
  entryAmountCol: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: '800',
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
    paddingHorizontal: 40,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 10,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  categoryChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#16a34a',
  },
  descInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 20,
  },
  saveModalBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveModalBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
