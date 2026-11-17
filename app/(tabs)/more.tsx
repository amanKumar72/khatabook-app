import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Save,
  Users,
  CreditCard,
  Lock,
  ChevronRight,
  BookOpen,
  Plus,
  Store,
  Check,
  ShieldCheck,
  X,
  Languages,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useLanguageStore } from '../../src/store/useLanguageStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { ThemeMode } from '../../src/constants/theme';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../src/i18n/languages';
import { BUSINESS_CATEGORIES } from '../../src/constants/categories';

export default function MoreScreen() {
  const router = useRouter();
  const { books, activeBook, businessProfile, setActiveBook, createBook, updateBusinessProfile } =
    useBookStore();
  const { isLockEnabled, setLockEnabled } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();
  const { themeMode, isDark, colors, setThemeMode } = useThemeStore();

  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState(businessProfile.name);
  const [editPhone, setEditPhone] = useState(businessProfile.phone || '');
  const [editAddress, setEditAddress] = useState(businessProfile.address || '');
  const [editGstin, setEditGstin] = useState(businessProfile.gstin || '');

  const handleCreateBook = async () => {
    if (newBookName.trim()) {
      await createBook(newBookName.trim());
      setNewBookName('');
      setBookModalVisible(false);
    }
  };

  const handleSaveProfile = async () => {
    await updateBusinessProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
      gstin: editGstin.trim(),
    });
    setProfileModalVisible(false);
  };

  const handleToggleLock = async (value: boolean) => {
    await setLockEnabled(value);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Business Card Preview */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
          <Store size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>{businessProfile.name || 'My Business'}</Text>
          <Text style={[styles.profileSub, { color: colors.textSecondary }]}>
            {businessProfile.phone ? `${businessProfile.phone} • ` : ''}
            {businessProfile.category || 'Retail Store'}
          </Text>
          {businessProfile.gstin ? (
            <Text style={[styles.gstText, { color: colors.primary }]}>GSTIN: {businessProfile.gstin}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.editProfileBtn, { backgroundColor: colors.cardSecondary }]}
          onPress={() => {
            setEditName(businessProfile.name);
            setEditPhone(businessProfile.phone || '');
            setEditAddress(businessProfile.address || '');
            setEditGstin(businessProfile.gstin || '');
            setProfileModalVisible(true);
          }}
        >
          <Text style={[styles.editProfileBtnText, { color: colors.text }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Book Switcher Section */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <BookOpen size={18} color={colors.text} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Books / Businesses ({books.length})</Text>
        </View>

        {books.map((b) => {
          const isActive = b.id === activeBook?.id;
          return (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.bookRow,
                isActive && { backgroundColor: colors.primaryBg },
              ]}
              onPress={() => setActiveBook(b.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.bookRowName, { color: isActive ? colors.primary : colors.text }]}>
                  {b.name}
                </Text>
                <Text style={[styles.bookRowSub, { color: colors.textSecondary }]}>
                  {b.business_category || 'Business Book'}
                </Text>
              </View>
              {isActive && <Check size={18} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.addBookBtn, { borderTopColor: colors.border }]}
          onPress={() => setBookModalVisible(true)}
          activeOpacity={0.7}
        >
          <Plus size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.addBookBtnText, { color: colors.primary }]}>Create Another Book</Text>
        </TouchableOpacity>
      </View>

      {/* Operations & Utilities */}
      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Backup & Restore Hub */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/backup')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#dbeafe' }]}>
            <Save size={20} color="#2563eb" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t('backup_restore')}</Text>
            <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Export all data to JSON or import previous backup</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* Staff Management */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/staff')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
            <Users size={20} color="#d97706" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t('staff_payroll')}</Text>
            <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Attendance tracker, daily/monthly wage calculation</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Visiting Card */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/business-card')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#ede9fe' }]}>
            <CreditCard size={20} color="#7c3aed" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t('visiting_card')}</Text>
            <Text style={[styles.menuSub, { color: colors.textSecondary }]}>QR code visiting card for customer WhatsApp sharing</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* App Language Selection */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => setLanguageModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
            <Languages size={20} color="#0284c7" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t('app_language')}</Text>
            <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
              {language === 'hi'
                ? 'हिंदी (Hindi) • आवाज व संदेश'
                : language === 'hi_en'
                ? 'Hinglish • Voice & WhatsApp'
                : 'English • Voice & WhatsApp'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0284c7', marginRight: 4 }}>
              {language === 'hi' ? 'हिंदी' : language === 'hi_en' ? 'Hinglish' : 'English'}
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Visual Theme Selection */}
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => setThemeModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#1e1b4b' : '#fef3c7' }]}>
            {isDark ? <Moon size={20} color="#818cf8" /> : <Sun size={20} color="#d97706" />}
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t('theme_setting')}</Text>
            <Text style={[styles.menuSub, { color: colors.textSecondary }]}>
              {themeMode === 'dark'
                ? t('theme_dark')
                : themeMode === 'light'
                ? t('theme_light')
                : t('theme_system')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#818cf8' : '#d97706', marginRight: 4 }}>
              {themeMode === 'dark' ? 'Dark 🌙' : themeMode === 'light' ? 'Light ☀️' : 'Auto ⚙️'}
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Biometric App Lock */}
        <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
          <View style={[styles.menuIconBox, { backgroundColor: '#fee2e2' }]}>
            <Lock size={20} color="#dc2626" />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>{t('security_lock')}</Text>
            <Text style={[styles.menuSub, { color: colors.textSecondary }]}>Require Face ID / Fingerprint on opening app</Text>
          </View>
          <Switch
            value={isLockEnabled}
            onValueChange={handleToggleLock}
            trackColor={{ false: colors.border, true: '#86efac' }}
            thumbColor={isLockEnabled ? colors.primary : '#f4f4f5'}
          />
        </View>
      </View>

      {/* Security & Offline Badge */}
      <View
        style={[
          styles.offlineBadge,
          { backgroundColor: colors.primaryBg, borderColor: colors.primary },
        ]}
      >
        <ShieldCheck size={18} color={colors.primary} style={{ marginRight: 6 }} />
        <Text style={[styles.offlineBadgeText, { color: colors.primary }]}>
          100% Local-First Offline Storage • Zero Cloud Dependency
        </Text>
      </View>

      {/* Create Book Modal */}
      <Modal visible={bookModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Business Book</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Maintain independent accounting for a different shop or personal ledger.</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Branch 2 / Wholesale Book"
              placeholderTextColor={colors.textMuted}
              value={newBookName}
              onChangeText={setNewBookName}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.cardSecondary }]}
                onPress={() => setBookModalVisible(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateBook}
              >
                <Text style={styles.modalConfirmBtnText}>Create Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Business Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Business / Shop Name</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contact Phone</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Shop Address</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              value={editAddress}
              onChangeText={setEditAddress}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GSTIN (Optional)</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={editGstin}
              onChangeText={setEditGstin}
            />

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.modalConfirmBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal visible={languageModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Language / भाषा चुनें</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>{t('app_language_sub')}</Text>

            {SUPPORTED_LANGUAGES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.languageOptionRow,
                  { borderColor: colors.border, backgroundColor: colors.cardSecondary },
                  language === item.code && [
                    styles.languageOptionRowActive,
                    { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                  ],
                ]}
                onPress={async () => {
                  await setLanguage(item.code);
                  setLanguageModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.languageOptionName,
                      { color: colors.text },
                      language === item.code && [styles.languageOptionTextActive, { color: colors.primary }],
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.languageOptionNative, { color: colors.textSecondary }]}>
                    {item.nativeName}
                  </Text>
                </View>
                {language === item.code && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal visible={themeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Theme / थीम चुनें</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>{t('theme_sub')}</Text>

            {[
              { mode: 'light' as ThemeMode, label: t('theme_light'), icon: '☀️', desc: 'Clean bright look' },
              { mode: 'dark' as ThemeMode, label: t('theme_dark'), icon: '🌙', desc: 'Easy on the eyes at night' },
              { mode: 'system' as ThemeMode, label: t('theme_system'), icon: '⚙️', desc: 'Follow device settings' },
            ].map((item) => (
              <TouchableOpacity
                key={item.mode}
                style={[
                  styles.languageOptionRow,
                  { borderColor: colors.border, backgroundColor: colors.cardSecondary },
                  themeMode === item.mode && { borderColor: colors.primary, backgroundColor: colors.primaryBg },
                ]}
                onPress={async () => {
                  await setThemeMode(item.mode);
                  setThemeModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.languageOptionName,
                      { color: colors.text },
                      themeMode === item.mode && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {item.icon}  {item.label}
                  </Text>
                  <Text style={[styles.languageOptionNative, { color: colors.textSecondary }]}>
                    {item.desc}
                  </Text>
                </View>
                {themeMode === item.mode && <Check size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  gstText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  editProfileBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  bookRowActive: {
    backgroundColor: '#f0fdf4',
  },
  bookRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  bookRowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  addBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  addBookBtnText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  offlineBadgeText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  languageOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  languageOptionRowActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  languageOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  languageOptionTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  languageOptionNative: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});

