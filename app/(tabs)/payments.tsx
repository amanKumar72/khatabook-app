import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Volume2, Share2, Edit3, CheckCircle, Smartphone } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { generateUpiUrl } from '../../src/services/upi';
import { SoundboxService } from '../../src/services/soundbox';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';

export default function PaymentsScreen() {
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  const activeBook = useBookStore((s) => s.activeBook);
  const businessProfile = useBookStore((s) => s.businessProfile);
  const updateBusinessProfile = useBookStore((s) => s.updateBusinessProfile);
  const { language, t } = useLanguageStore();

  const [vpa, setVpa] = useState(businessProfile.upi_id || 'merchant@upi');
  const [isEditingVpa, setIsEditingVpa] = useState(!businessProfile.upi_id);
  const [requestAmount, setRequestAmount] = useState('');
  const [note, setNote] = useState('');

  const numAmount = parseFloat(requestAmount);
  const validAmount = !isNaN(numAmount) && numAmount > 0 ? numAmount : undefined;

  const upiUrl = generateUpiUrl({
    vpa: vpa.trim(),
    name: businessProfile.name || activeBook?.name || 'Khatabook Store',
    amount: validAmount,
    note: note.trim() || undefined,
  });

  const handleSaveVpa = async () => {
    if (vpa.trim()) {
      await updateBusinessProfile({ upi_id: vpa.trim() });
      setIsEditingVpa(false);
    }
  };

  const handleTestSoundbox = () => {
    SoundboxService.announcePayment(validAmount || 100, language);
  };

  const handleSharePaymentLink = async () => {
    try {
      await Share.share({
        message: `Pay ₹${validAmount ? validAmount.toFixed(2) : ''} to ${businessProfile.name} using UPI:\n${upiUrl}`,
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* UPI QR Display Card */}
      <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.storeName, { color: colors.text }]}>
          {businessProfile.name || activeBook?.name || 'Khatabook Store'}
        </Text>
        <Text style={[styles.scanText, { color: colors.textSecondary }]}>
          Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
        </Text>

        <View style={[styles.qrWrapper, { borderColor: colors.border }]}>
          <QRCode
            value={upiUrl}
            size={220}
            color="#0f172a"
            backgroundColor="#ffffff"
          />
        </View>

        {validAmount ? (
          <View style={[styles.amountPill, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.amountPillText, { color: colors.primary }]}>
              Requested: ₹{validAmount.toFixed(2)}
            </Text>
          </View>
        ) : null}

        {/* UPI VPA Configuration */}
        <View style={styles.vpaRow}>
          {isEditingVpa ? (
            <View style={styles.vpaEditBox}>
              <TextInput
                style={[
                  styles.vpaInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter UPI VPA (e.g. mobile@okaxis)"
                placeholderTextColor={colors.textMuted}
                value={vpa}
                onChangeText={setVpa}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.saveVpaBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveVpa}
              >
                <CheckCircle size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.vpaDisplayBox}>
              <Text style={[styles.vpaText, { color: colors.textSecondary }]}>
                UPI ID: <Text style={{ fontWeight: '700', color: colors.text }}>{vpa}</Text>
              </Text>
              <TouchableOpacity onPress={() => setIsEditingVpa(true)} style={{ marginLeft: 8 }}>
                <Edit3 size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Dynamic Amount Builder */}
      <View style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.toolTitle, { color: colors.text }]}>Create Dynamic Amount QR</Text>
        <Text style={[styles.toolSub, { color: colors.textSecondary }]}>
          Entering an amount automatically embeds it into the QR code above and in payment links.
        </Text>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount to Collect (₹)</Text>
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
          value={requestAmount}
          onChangeText={setRequestAmount}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Payment Note (Optional)</Text>
        <TextInput
          style={[
            styles.noteInput,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="e.g. Bill #104 or Order #5"
          value={note}
          onChangeText={setNote}
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity
          style={styles.shareLinkBtn}
          onPress={handleSharePaymentLink}
          activeOpacity={0.8}
        >
          <Share2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.shareLinkBtnText}>Share Payment Link on WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Audio Voice Soundbox Simulator */}
      <View style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.soundboxHeader}>
          <View style={[styles.soundboxIconBox, { backgroundColor: colors.primaryBg }]}>
            <Volume2 size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.toolTitle, { color: colors.text }]}>{t('soundbox_title')}</Text>
            <Text style={[styles.toolSub, { color: colors.textSecondary }]}>
              Instant voice confirmation announced when customers pay.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.soundboxTestBtn,
            { backgroundColor: colors.primaryBg, borderColor: colors.primary },
          ]}
          onPress={handleTestSoundbox}
          activeOpacity={0.8}
        >
          <Volume2 size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.soundboxTestText, { color: colors.primary }]}>
            Test Voice Alert ({validAmount ? `₹${validAmount}` : '₹100'})
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginBottom: 16,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  scanText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 18,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },
  amountPillText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 14,
  },
  vpaRow: {
    marginTop: 16,
    width: '100%',
  },
  vpaDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  vpaText: {
    fontSize: 13,
    color: '#334155',
  },
  vpaEditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vpaInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  saveVpaBtn: {
    backgroundColor: '#16a34a',
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  toolSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 14,
  },
  shareLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
  },
  shareLinkBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  soundboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  soundboxIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundboxTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 12,
    borderRadius: 10,
  },
  soundboxTestText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '700',
  },
});
