import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Stack } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Share2, Phone, MapPin, Store, ShieldCheck } from 'lucide-react-native';
import { useBookStore } from '../src/store/useBookStore';
import { useThemeStore } from '../src/store/useThemeStore';
import { generateUpiUrl } from '../src/services/upi';

export default function BusinessCardScreen() {
  const colors = useThemeStore((s) => s.colors);
  const activeBook = useBookStore((s) => s.activeBook);
  const businessProfile = useBookStore((s) => s.businessProfile);

  const qrValue = businessProfile.upi_id
    ? generateUpiUrl({
        vpa: businessProfile.upi_id,
        name: businessProfile.name,
      })
    : `https://wa.me/${(businessProfile.phone || '').replace(/[^0-9]/g, '')}`;

  const handleShare = async () => {
    try {
      let text = `📇 *${businessProfile.name || activeBook?.name || 'My Store'}*\n`;
      if (businessProfile.category) text += `Category: ${businessProfile.category}\n`;
      if (businessProfile.phone) text += `Phone: ${businessProfile.phone}\n`;
      if (businessProfile.address) text += `Address: ${businessProfile.address}\n`;
      if (businessProfile.upi_id) text += `UPI ID: ${businessProfile.upi_id}\n`;
      text += `\nConnected via Khatabook Offline`;

      await Share.share({ message: text });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Digital Business Card',
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Visiting Card Representation */}
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Card Header Strip */}
          <View style={[styles.cardHeaderStrip, { backgroundColor: colors.primary }]}>
            <Store size={22} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.headerStripText}>OFFICIAL BUSINESS CARD</Text>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.bizName, { color: colors.text }]}>{businessProfile.name || 'My Store'}</Text>
            <Text style={[styles.categoryBadge, { backgroundColor: colors.primaryBg, color: colors.primary }]}>
              {businessProfile.category || 'Retail Store'}
            </Text>

            <View style={styles.infoRow}>
              <Phone size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {businessProfile.phone || 'Phone not set'}
              </Text>
            </View>

            {businessProfile.address ? (
              <View style={styles.infoRow}>
                <MapPin size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{businessProfile.address}</Text>
              </View>
            ) : null}

            {businessProfile.gstin ? (
              <View style={[styles.gstBadge, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.gstText, { color: colors.textSecondary }]}>
                  GSTIN: {businessProfile.gstin}
                </Text>
              </View>
            ) : null}

            <View style={[styles.qrContainer, { backgroundColor: '#ffffff', borderColor: colors.border }]}>
              <QRCode value={qrValue} size={150} color="#0f172a" backgroundColor="#ffffff" />
              <Text style={[styles.qrSub, { color: '#64748b' }]}>Scan for UPI Payment / WhatsApp</Text>
            </View>
          </View>

          <View
            style={[
              styles.cardFooter,
              { backgroundColor: colors.primaryBg, borderTopColor: colors.borderSubtle },
            ]}
          >
            <ShieldCheck size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.footerText, { color: colors.primary }]}>Khatabook Verified Merchant</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Share2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.shareBtnText}>SHARE CARD ON WHATSAPP</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderStrip: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerStripText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardBody: {
    padding: 24,
    alignItems: 'center',
  },
  bizName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  categoryBadge: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
  },
  gstBadge: {
    marginTop: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gstText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  qrContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qrSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 10,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
  },
  footerText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    elevation: 2,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

