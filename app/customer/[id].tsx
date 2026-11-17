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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
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
} from 'lucide-react-native';
import { useKhataStore } from '../../src/store/useKhataStore';
import { useBookStore } from '../../src/store/useBookStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { Transaction } from '../../src/types/models';
import { PdfGenerator } from '../../src/services/pdfGenerator';
import { getWhatsAppReminderMessage, generateUpiUrl } from '../../src/services/upi';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const businessProfile = useBookStore((s) => s.businessProfile);
  const activeBook = useBookStore((s) => s.activeBook);
  const {
    activeCustomer,
    activeTransactions,
    loadCustomerDetails,
    updateCustomer,
    deleteTransaction,
    deleteCustomer,
  } = useKhataStore();
  const { t, language } = useLanguageStore();
  const { colors, isDark } = useThemeStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCreditLimit, setEditCreditLimit] = useState('');

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
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundText}>Party not found.</Text>
      </View>
    );
  }

  const isCustomer = activeCustomer.party_type === 1;
  const isReceivable = isCustomer ? activeCustomer.balance >= 0 : activeCustomer.balance <= 0;
  const balanceAbs = Math.abs(activeCustomer.balance);

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
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    }
  };

  const handleDeleteContact = () => {
    Alert.alert(
      'Archive Party?',
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
    setShowEditModal(false);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isGave = item.type === 1;
    return (
      <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.txInfoCol}>
          <Text style={[styles.txDate, { color: colors.text }]}>{item.date}</Text>
          {item.description ? <Text style={[styles.txDesc, { color: colors.textSecondary }]}>{item.description}</Text> : null}
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
        </View>

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

          <TouchableOpacity
            style={styles.txDeleteBtn}
            onPress={() => deleteTransaction(item.id)}
          >
            <Trash2 size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Customer Ledger',
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Customer Header Box */}
        <View style={[styles.headerBox, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.customerName, { color: colors.text }]}>{activeCustomer.name}</Text>
              <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>{activeCustomer.phone || 'No phone number'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
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
              {activeCustomer.balance === 0
                ? t('all_settled')
                : isReceivable
                ? `${t('to_collect')} (Receivable)`
                : `${t('to_pay')} (Payable)`}
            </Text>
          </View>

          {/* Communication CTA Row */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleCall} activeOpacity={0.7}>
              <Phone size={18} color="#2563eb" style={{ marginRight: 6 }} />
              <Text style={[styles.ctaBtnText, { color: '#2563eb' }]}>{t('call')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleWhatsApp} activeOpacity={0.7}>
              <MessageCircle size={18} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={[styles.ctaBtnText, { color: '#16a34a' }]}>{t('whatsapp')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleDownloadPdf} activeOpacity={0.7}>
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
          contentContainerStyle={styles.txList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AlertCircle size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>{t('no_entries')}</Text>
              <Text style={styles.emptySubtitle}>{t('no_entries_sub')}</Text>
            </View>
          }
        />

        {/* Fixed Bottom Action Buttons */}
        <View style={styles.bottomBar}>
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

      {/* Edit Contact Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('edit_contact')}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Name *</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.modalLabel}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />

            <Text style={styles.modalLabel}>Address (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="e.g. Shop 12, Main Market"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.modalLabel}>Credit Limit (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={editCreditLimit}
              onChangeText={setEditCreditLimit}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveContactEdit}>
              <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.modalSaveText}>{t('save')}</Text>
            </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748b',
  },
  headerBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  customerPhone: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  balanceBox: {
    alignItems: 'center',
    marginVertical: 14,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  balanceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
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
    color: '#475569',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  txList: {
    padding: 12,
    paddingBottom: 90,
  },
  txCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  txInfoCol: {
    flex: 1,
  },
  txDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  txDesc: {
    fontSize: 12,
    color: '#64748b',
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
    gap: 12,
  },
  txAmountCol: {
    alignItems: 'flex-end',
    minWidth: 65,
  },
  txColLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 2,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  txDeleteBtn: {
    padding: 4,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 12,
  },
  modalSaveBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 8,
    marginTop: 6,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
