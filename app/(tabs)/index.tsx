import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Phone,
  FileText,
  Filter,
  BookOpen,
  Check,
  Plus,
  Store,
  X,
} from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useKhataStore } from '../../src/store/useKhataStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { Customer, PartyType } from '../../src/types/models';

export default function KhataHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { books, activeBook, businessProfile, setActiveBook, createBook } = useBookStore();
  const { customers, totalReceivable, totalPayable, loadCustomers, isLoading } = useKhataStore();
  const { t } = useLanguageStore();
  const { colors, isDark } = useThemeStore();

  const [selectedPartyType, setSelectedPartyType] = useState<PartyType>(1); // 1 = Customer, 2 = Supplier
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPending, setFilterPending] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [isCreatingBook, setIsCreatingBook] = useState(false);

  useEffect(() => {
    if (activeBook) {
      loadCustomers(activeBook.id);
    }
  }, [activeBook]);

  const filteredCustomers = customers.filter((c) => {
    if (c.party_type !== selectedPartyType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = (c.phone || '').includes(q);
      if (!matchName && !matchPhone) return false;
    }
    if (filterPending) {
      return Math.abs(c.balance) > 0;
    }
    return true;
  });

  const renderPartyItem = ({ item }: { item: Customer }) => {
    const isReceivable = item.party_type === 1 ? item.balance >= 0 : item.balance <= 0;
    const balanceAbs = Math.abs(item.balance);

    return (
      <TouchableOpacity
        style={[styles.partyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/customer/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.partyAvatar, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.partyAvatarText, { color: colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.partyInfo}>
          <Text style={[styles.partyName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.partyPhoneRow}>
            {item.phone ? (
              <>
                <Phone size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.partyPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
              </>
            ) : (
              <Text style={[styles.partyPhone, { color: colors.textMuted }]}>No phone</Text>
            )}
          </View>
        </View>

        <View style={styles.partyBalanceContainer}>
          <Text
            style={[
              styles.partyBalanceAmount,
              { color: isReceivable ? colors.primary : colors.danger },
            ]}
          >
            ₹{balanceAbs.toFixed(2)}
          </Text>
          <Text style={[styles.partyBalanceLabel, { color: colors.textSecondary }]}>
            {item.balance === 0
              ? 'Settled'
              : item.party_type === 1
              ? item.balance > 0
                ? "You'll Get"
                : "You'll Give"
              : item.balance > 0
              ? "You'll Give"
              : "You'll Get"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerBizName, { color: colors.text }]}>
            {activeBook?.name || businessProfile.name || 'Khatabook'}
          </Text>
          <Text style={[styles.headerCategory, { color: colors.textSecondary }]}>
            {activeBook?.business_category || businessProfile.category || 'Retail Store'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.moreHeaderBtn,
            { backgroundColor: colors.cardSecondary, borderColor: colors.border },
          ]}
          onPress={() => setBookModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.moreHeaderBtnText, { color: colors.primary }]}>Book Switch</Text>
          <ChevronDown size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryCol}>
          <View style={styles.summaryHeaderRow}>
            <ArrowDownLeft size={16} color={colors.primary} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('to_collect')}</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>
            ₹{totalReceivable.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryCol}>
          <View style={styles.summaryHeaderRow}>
            <ArrowUpRight size={16} color={colors.danger} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('to_pay')}</Text>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.danger }]}>
            ₹{totalPayable.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Segmented Control (Customers vs Suppliers) */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.cardSecondary }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, selectedPartyType === 1 && [styles.segmentBtnActive, { backgroundColor: colors.card }]]}
          onPress={() => setSelectedPartyType(1)}
        >
          <Text
            style={[styles.segmentText, { color: colors.textSecondary }, selectedPartyType === 1 && { color: colors.primary, fontWeight: '700' }]}
          >
            {t('customers').toUpperCase()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, selectedPartyType === 2 && [styles.segmentBtnActive, { backgroundColor: colors.card }]]}
          onPress={() => setSelectedPartyType(2)}
        >
          <Text
            style={[styles.segmentText, { color: colors.textSecondary }, selectedPartyType === 2 && { color: colors.primary, fontWeight: '700' }]}
          >
            {t('suppliers').toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={`Search ${selectedPartyType === 1 ? 'Customer' : 'Supplier'}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.border }, filterPending && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setFilterPending(!filterPending)}
        >
          <Filter size={16} color={filterPending ? '#ffffff' : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderPartyItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              if (activeBook) loadCustomers(activeBook.id);
            }}
            colors={['#16a34a']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No {selectedPartyType === 1 ? 'Customers' : 'Suppliers'} found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add your first {selectedPartyType === 1 ? 'customer' : 'supplier'} to record Gave / Got entries offline.
            </Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/customer/add?type=${selectedPartyType}`)}
        activeOpacity={0.85}
      >
        <UserPlus size={20} color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>
          {selectedPartyType === 1 ? t('add_customer').toUpperCase() : t('add_supplier').toUpperCase()}
        </Text>
      </TouchableOpacity>

      {/* Switch Book Modal */}
      <Modal visible={bookModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BookOpen size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Switch Business Book</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setBookModalVisible(false);
                  setIsCreatingBook(false);
                }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Select an active ledger or create another book for branches or personal accounts.
            </Text>

            {books.map((b) => {
              const isActive = b.id === activeBook?.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.bookItemRow,
                    {
                      backgroundColor: isActive ? colors.primaryBg : colors.cardSecondary,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={async () => {
                    await setActiveBook(b.id);
                    setBookModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.bookIconCircle,
                      { backgroundColor: isActive ? colors.primary : colors.border },
                    ]}
                  >
                    <Store size={16} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={[
                        styles.bookItemName,
                        { color: isActive ? colors.primary : colors.text },
                      ]}
                    >
                      {b.name}
                    </Text>
                    <Text style={[styles.bookItemSub, { color: colors.textSecondary }]}>
                      {b.business_category || 'Retail Store'}
                    </Text>
                  </View>
                  {isActive && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}

            {isCreatingBook ? (
              <View
                style={[
                  styles.createBookBox,
                  { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[
                    styles.createBookInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Enter new book name (e.g. Branch 2)"
                  placeholderTextColor={colors.textMuted}
                  value={newBookName}
                  onChangeText={setNewBookName}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[
                      styles.cancelCreateBtn,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      setIsCreatingBook(false);
                      setNewBookName('');
                    }}
                  >
                    <Text style={[styles.cancelCreateBtnText, { color: colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmCreateBtn, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                      if (newBookName.trim()) {
                        await createBook(newBookName.trim());
                        setNewBookName('');
                        setIsCreatingBook(false);
                        setBookModalVisible(false);
                      }
                    }}
                  >
                    <Text style={styles.confirmCreateBtnText}>Add Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addBookRowBtn,
                  { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                ]}
                onPress={() => setIsCreatingBook(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.addBookRowBtnText, { color: colors.primary }]}>
                  Create Another Book
                </Text>
              </TouchableOpacity>
            )}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBizName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerCategory: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  moreHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  moreHeaderBtnText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filterBtn: {
    width: 42,
    height: 42,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  partyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partyAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  partyPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyPhone: {
    fontSize: 12,
    color: '#64748b',
  },
  partyBalanceContainer: {
    alignItems: 'flex-end',
  },
  partyBalanceAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  partyBalanceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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
    letterSpacing: 0.5,
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
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  bookItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  bookIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  bookItemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addBookRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addBookRowBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  createBookBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  createBookInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  cancelCreateBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelCreateBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmCreateBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmCreateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
