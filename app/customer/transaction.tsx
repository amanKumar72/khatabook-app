import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Camera, Calendar, FileText, Check, X, Clock } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useKhataStore } from '../../src/store/useKhataStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { TransactionType } from '../../src/types/models';
import DatePickerModal from '../../components/DatePickerModal';

export default function AddTransactionScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const { customerId, type } = useLocalSearchParams<{ customerId: string; type: string }>();

  const activeBook = useBookStore((s) => s.activeBook);
  const { activeCustomer, addTransaction } = useKhataStore();
  const { t } = useLanguageStore();

  const txType: TransactionType = type === '2' ? 2 : 1;
  const isGave = txType === 1;

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);

  // Date picker dialog states
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permission is needed to attach bill receipts.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        const sourceUri = result.assets[0].uri;
        const filename = `receipt_${Date.now()}.jpg`;
        const attachmentsDir = `${FileSystem.documentDirectory}attachments/`;
        await FileSystem.makeDirectoryAsync(attachmentsDir, { intermediates: true });
        const targetUri = `${attachmentsDir}${filename}`;

        await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
        setAttachmentUri(targetUri);
      } catch (e) {
        console.error('Failed to save receipt image locally:', e);
      }
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transaction amount.');
      return;
    }
    if (!activeBook || !customerId) return;

    await addTransaction(
      activeBook.id,
      customerId,
      numAmount,
      txType,
      entryDate,
      description.trim(),
      attachmentUri || '',
      dueDate.trim() || ''
    );

    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isGave ? t('you_gave') : t('you_got'),
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Header Banner */}
        <View
          style={[
            styles.typeHeader,
            { backgroundColor: isGave ? colors.dangerBg : colors.primaryBg },
          ]}
        >
          <Text
            style={[
              styles.typeHeaderText,
              { color: isGave ? colors.danger : colors.primary },
            ]}
          >
            {isGave ? 'YOU GAVE' : 'YOU GOT'} (
            {activeCustomer ? activeCustomer.name : 'Party'})
          </Text>
        </View>

        {/* Amount Input */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Amount (₹) *</Text>
        <TextInput
          style={[
            styles.amountInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />

        {/* Entry Date Selector */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Entry Date *</Text>
        <TouchableOpacity
          style={[
            styles.datePickerBtn,
            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
          ]}
          onPress={() => setShowEntryDatePicker(true)}
          activeOpacity={0.7}
        >
          <Calendar size={18} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.datePickerBtnText, { color: colors.text }]}>
            {entryDate}
          </Text>
          <Text style={[styles.datePickerTag, { color: colors.primary, backgroundColor: colors.primaryBg }]}>
            Change Date
          </Text>
        </TouchableOpacity>

        {/* Description / Note */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Note / Item Details (Optional)</Text>
        <View
          style={[
            styles.inputBox,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <FileText size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. 5 bags of rice / Monthly payment"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Payment Due Date Selector */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Due Date (Optional)</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[
              styles.datePickerBtn,
              { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
            ]}
            onPress={() => setShowDueDatePicker(true)}
            activeOpacity={0.7}
          >
            <Clock size={18} color={dueDate ? '#d97706' : colors.textMuted} style={{ marginRight: 10 }} />
            <Text
              style={[
                styles.datePickerBtnText,
                { color: dueDate ? colors.text : colors.textMuted },
              ]}
            >
              {dueDate || 'Tap to select due date'}
            </Text>
          </TouchableOpacity>

          {dueDate ? (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
              onPress={() => setDueDate('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Attach Receipt */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Attach Bill / Receipt Photo</Text>
        {attachmentUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: attachmentUri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setAttachmentUri(null)}
            >
              <X size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.attachBtn,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            <Camera size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.attachBtnText, { color: colors.textSecondary }]}>Add Receipt Photo</Text>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isGave ? '#dc2626' : '#16a34a' }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {t('save')} {isGave ? 'GAVE ENTRY' : 'GOT ENTRY'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Dialogs */}
      <DatePickerModal
        visible={showEntryDatePicker}
        initialDate={entryDate}
        title="Select Transaction Date"
        allowFuture={false}
        onSelect={(date) => setEntryDate(date)}
        onClose={() => setShowEntryDatePicker(false)}
      />

      <DatePickerModal
        visible={showDueDatePicker}
        initialDate={dueDate || entryDate}
        title="Select Payment Due Date"
        allowFuture={true}
        onSelect={(date) => setDueDate(date)}
        onClose={() => setShowDueDatePicker(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  typeHeader: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  typeHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  amountInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'space-between',
  },
  datePickerBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  datePickerTag: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
  },
  attachBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: 100,
    height: 100,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
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
