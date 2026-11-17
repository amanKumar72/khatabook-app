import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Phone,
  MessageCircle,
  FileText,
  Trash2,
  Paperclip,
  Calendar,
  AlertCircle,
  Edit3,
  X,
  Check,
  Clock,
} from 'lucide-react-native';
import { useKhataStore } from '../../src/store/useKhataStore';
import { useBookStore } from '../../src/store/useBookStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { Transaction, TransactionType } from '../../src/types/models';
import { PdfGenerator } from '../../src/services/pdfGenerator';
import { getWhatsAppReminderMessage, generateUpiUrl } from '../../src/services/upi';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const businessProfile = useBookStore((s) => s.businessProfile);
  const activeBook = useBookStore((s) => s.activeBook);
  const {
    activeCustomer,
    activeTransactions,
    loadCustomerDetails,
    updateCustomer,
    updateTransaction,
    deleteTransaction,
    deleteCustomer,
  } = useKhataStore();
  const { t, language } = useLanguageStore();
  const { colors, isDark } = useThemeStore();

  // Contact Edit Modal State
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCreditLimit, setEditCreditLimit] = useState('');

  // Transaction Edit Modal State
  const [showEditTxModal, setShowEditTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>(1);
  const [txDate, setTxDate] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDueDate, setTxDueDate] = useState('');

  useEffect(() => {
    if (id) {
      loadCustomerDetails(id);
    }
  }, [id]);

  useEffect(() => {
    if (activeCustomer) {
      setEditName(activeCustomer.name);
      setEditPhone(activeCustomer.phone || '');
      setEditAddress(activeCustomer.address || '');
      setEditCreditLimit(activeCustomer.credit_limit ? activeCustomer.credit_limit.toString() : '');
    }
  }, [activeCustomer]);

  if (!activeCustomer) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>Party not found.</Text>
      </View>
    );
  }

  const isCustomer = activeCustomer.party_type === 1;
  // For customer: balance >= 0 means they owe you (Receivable - Green). Negative means you owe them (Payable - Red)
  // For supplier: balance > 0 means you owe supplier (Payable - Red). Negative means advance paid (Receivable - Green)
  const isReceivable = isCustomer ? activeCustomer.balance >= 0 : activeCustomer.balance < 0;
  const balanceAbs = Math.abs(activeCustomer.balance);

  const getBalanceStatusText = () => {
    if (activeCustomer.balance === 0) return t('all_settled');
    if (isCustomer) {
      return activeCustomer.balance > 0 ? "You'll Get (Receivable)" : "You'll Give (Payable)";
    } else {
      return activeCustomer.balance > 0 ? "You'll Give (Payable)" : "You'll Get (Advance Paid)";
    }
  };

  const handleCall = () => {
    if (activeCustomer.phone) {
      Linking.openURL(`tel:${activeCustomer.phone}`);
    } else {
      Alert.alert('No Phone', 'No phone number saved for this contact.');
    }
  };

  const handleWhatsApp = () => {
    if (!activeCustomer.phone) {
      Alert.alert('No Phone', 'No phone number saved for this contact.');
      return;
    }
    const upiUrl = businessProfile.upi_id
      ? generateUpiUrl({
          vpa: businessProfile.upi_id,
          name: businessProfile.name,
          amount: balanceAbs,
        })
      : undefined;

    const text = getWhatsAppReminderMessage(
      activeCustomer.name,
      businessProfile.name || 'Our Store',
      activeCustomer.balance,
      upiUrl,
      language
    );

    Linking.openURL(`https://wa.me/${activeCustomer.phone.replace(/[^0-9]/g, '')}?text=${text}`);
  };

  const handleDownloadPdf = async () => {
    try {
      await PdfGenerator.generateLedgerStatement(activeCustomer, activeTransactions, {
        name: businessProfile.name || activeBook?.name || 'Khatabook Store',
        phone: businessProfile.phone,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to generate PDF');
    }
  };

  const handleDeleteContact = () => {
    const partyName = isCustomer ? 'Customer' : 'Supplier';
    Alert.alert(
      `Archive ${partyName}?`,
      `Are you sure you want to archive ${activeCustomer.name}? They will be hidden from the active list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomer(activeCustomer.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleSaveContactEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }
    await updateCustomer(
      activeCustomer.id,
      editName.trim(),
      editPhone.trim(),
      editAddress.trim(),
      parseFloat(editCreditLimit) || 0
    );
    setShowEditContactModal(false);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxAmount(tx.amount.toString());
    setTxType(tx.type);
    setTxDate(tx.date);
    setTxDescription(tx.description || '');
    setTxDueDate(tx.due_date || '');
    setShowEditTxModal(true);
  };

  const handleSaveTxEdit = async () => {
    if (!editingTx) return;
    const numAmount = parseFloat(txAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!txDate.trim()) {
      Alert.alert('Invalid Date', 'Please enter a valid date (YYYY-MM-DD).');
      return;
    }

    await updateTransaction(
      editingTx.id,
      numAmount,
      txType,
      txDate.trim(),
      txDescription.trim(),
      txDueDate.trim()
    );

    setShowEditTxModal(false);
    setEditingTx(null);
  };

  const handleDeleteTx = (txId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this ledger entry? Your net balance will update automatically.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(txId);
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isGave = item.type === 1;
    return (
      <View
        style={[
          styles.txCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.txInfoCol}
          onPress={() => handleOpenEditTx(item)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.txDate, { color: colors.text }]}>{item.date}</Text>
          </View>
          {item.description ? (
            <Text style={[styles.txDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          {item.attachment_uri ? (
            <View style={styles.attachmentBadge}>
              <Paperclip size={12} color="#2563eb" />
              <Text style={styles.attachmentText}>Receipt Attached</Text>
            </View>
          ) : null}
          {item.due_date ? (
            <View style={styles.dueDateBadge}>
              <Calendar size={12} color="#d97706" />
              <Text style={styles.dueDateText}>Due: {item.due_date}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.txAmountsRow}>
          <View style={styles.txAmountCol}>
            <Text style={[styles.txColLabel, { color: colors.textSecondary }]}>You Gave</Text>
            <Text style={[styles.txAmountText, { color: colors.danger }]}>
              {isGave ? `₹${item.amount.toFixed(2)}` : '-'}
            </Text>
          </View>

          <View style={styles.txAmountCol}>
            <Text style={[styles.txColLabel, { color: colors.textSecondary }]}>You Got</Text>
            <Text style={[styles.txAmountText, { color: colors.primary }]}>
              {!isGave ? `₹${item.amount.toFixed(2)}` : '-'}
            </Text>
          </View>

          <View style={styles.actionButtonsCol}>
            <TouchableOpacity
              style={[styles.txActionBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={() => handleOpenEditTx(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={15} color={colors.accentBlue} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.txActionBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={() => handleDeleteTx(item.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isCustomer ? 'Customer Ledger' : 'Supplier Ledger',
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Customer / Supplier Header Box */}
        <View
          style={[
            styles.headerBox,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.customerName, { color: colors.text }]}>{activeCustomer.name}</Text>
                <View
                  style={[
                    styles.partyTypeTag,
                    {
                      backgroundColor: isCustomer ? colors.primaryBg : colors.dangerBg,
                      borderColor: isCustomer ? colors.primary : colors.danger,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.partyTypeTagText,
                      { color: isCustomer ? colors.primary : colors.danger },
                    ]}
                  >
                    {isCustomer ? 'Customer' : 'Supplier'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
                {activeCustomer.phone || 'No phone number'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowEditContactModal(true)}
                style={[styles.actionIconBtn, { backgroundColor: colors.cardSecondary }]}
                activeOpacity={0.7}
              >
                <Edit3 size={16} color={colors.accentBlue} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteContact}
                style={[styles.actionIconBtn, { backgroundColor: colors.cardSecondary }]}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Display */}
          <View style={[styles.balanceBox, { backgroundColor: colors.cardSecondary }]}>
            <Text style={[styles.balanceTitle, { color: colors.textSecondary }]}>{t('net_balance')}</Text>
            <Text
              style={[
                styles.balanceBig,
                { color: isReceivable ? colors.primary : colors.danger },
              ]}
            >
              ₹{balanceAbs.toFixed(2)}
            </Text>
            <Text style={[styles.balanceStatus, { color: colors.textSecondary }]}>
              {getBalanceStatusText()}
            </Text>
          </View>

          {/* Communication CTA Row */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Phone size={18} color="#2563eb" style={{ marginRight: 6 }} />
              <Text style={[styles.ctaBtnText, { color: '#2563eb' }]}>{t('call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleWhatsApp}
              activeOpacity={0.7}
            >
              <MessageCircle size={18} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={[styles.ctaBtnText, { color: '#16a34a' }]}>{t('whatsapp')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleDownloadPdf}
              activeOpacity={0.7}
            >
              <FileText size={18} color="#7c3aed" style={{ marginRight: 6 }} />
              <Text style={[styles.ctaBtnText, { color: '#7c3aed' }]}>{t('report')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction History */}
        <FlatList
          data={activeTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={[
            styles.txList,
            { paddingBottom: 88 + Math.max(insets.bottom, 12) },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertCircle size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('no_entries')}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {t('no_entries_sub')}
              </Text>
            </View>
          }
        />

        {/* Fixed Bottom Action Buttons with Theme & Safe Area */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.bigActionBtn, { backgroundColor: '#dc2626' }]}
            onPress={() =>
              router.push(`/customer/transaction?customerId=${activeCustomer.id}&type=1`)
            }
            activeOpacity={0.85}
          >
            <Text style={styles.bigActionBtnText}>{t('you_gave')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigActionBtn, { backgroundColor: '#16a34a' }]}
            onPress={() =>
              router.push(`/customer/transaction?customerId=${activeCustomer.id}&type=2`)
            }
            activeOpacity={0.85}
          >
            <Text style={styles.bigActionBtnText}>{t('you_got')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Transaction Modal */}
      <Modal visible={showEditTxModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderTopWidth: 1,
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Edit3 size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Ledger Entry</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditTxModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Transaction Type</Text>
              <View style={[styles.modalTypeRow, { backgroundColor: colors.cardSecondary }]}>
                <TouchableOpacity
                  style={[
                    styles.modalTypeBtn,
                    txType === 1 && { backgroundColor: '#dc2626' },
                  ]}
                  onPress={() => setTxType(1)}
                >
                  <Text
                    style={[
                      styles.modalTypeBtnText,
                      { color: txType === 1 ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    YOU GAVE ₹
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalTypeBtn,
                    txType === 2 && { backgroundColor: '#16a34a' },
                  ]}
                  onPress={() => setTxType(2)}
                >
                  <Text
                    style={[
                      styles.modalTypeBtnText,
                      { color: txType === 2 ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    YOU GOT ₹
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Amount (₹) *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: '700',
                  },
                ]}
                value={txAmount}
                onChangeText={setTxAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />

              {/* Date */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Date (YYYY-MM-DD) *</Text>
                <TouchableOpacity
                  onPress={() => setTxDate(new Date().toISOString().split('T')[0])}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700', marginBottom: 4 }}>
                    Today
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={txDate}
                onChangeText={setTxDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />

              {/* Description */}
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Note / Details (Optional)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={txDescription}
                onChangeText={setTxDescription}
                placeholder="e.g. 5 bags of flour / partial cash payment"
                placeholderTextColor={colors.textMuted}
              />

              {/* Due Date */}
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Due Date (Optional, YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={txDueDate}
                onChangeText={setTxDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveTxEdit}
                activeOpacity={0.8}
              >
                <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal visible={showEditContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderTopWidth: 1,
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('edit_contact')}</Text>
              <TouchableOpacity onPress={() => setShowEditContactModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Name *</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Phone Number</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Address / Location</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Shop number, city, or locality"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Credit Limit (₹)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                value={editCreditLimit}
                onChangeText={setEditCreditLimit}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveContactEdit}
                activeOpacity={0.8}
              >
                <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalSaveText}>{t('save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  headerBox: {
    padding: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 20,
    fontWeight: '800',
  },
  partyTypeTag: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  partyTypeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  balanceBox: {
    alignItems: 'center',
    marginVertical: 14,
    padding: 12,
    borderRadius: 12,
  },
  balanceTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceBig: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  balanceStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  txList: {
    padding: 12,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  txInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  txDate: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  attachmentText: {
    fontSize: 11,
    color: '#2563eb',
    marginLeft: 3,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dueDateText: {
    fontSize: 11,
    color: '#d97706',
    marginLeft: 3,
  },
  txAmountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txAmountCol: {
    alignItems: 'flex-end',
    minWidth: 62,
  },
  txColLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionButtonsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  txActionBtn: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderTopWidth: 1,
  },
  bigActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
  },
  bigActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  modalTypeRow: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 14,
    gap: 6,
  },
  modalTypeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalTypeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalSaveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
