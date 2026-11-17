import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
  FileJson,
  Database,
  AlertTriangle,
  FolderSync,
} from 'lucide-react-native';
import { BackupEngine, RestoreResult } from '../../src/services/backupEngine';
import { useBookStore } from '../../src/store/useBookStore';
import { useKhataStore } from '../../src/store/useKhataStore';
import { useCashbookStore } from '../../src/store/useCashbookStore';
import { useBillStore } from '../../src/store/useBillStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { getDatabase } from '../../src/db/database';

export default function BackupScreen() {
  const router = useRouter();
  const colors = useThemeStore((s) => s.colors);
  const activeBook = useBookStore((s) => s.activeBook);
  const loadBooks = useBookStore((s) => s.loadBooks);
  const loadCustomers = useKhataStore((s) => s.loadCustomers);
  const loadCashbook = useCashbookStore((s) => s.loadCashbook);
  const loadBills = useBillStore((s) => s.loadBills);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastExportPath, setLastExportPath] = useState<string | null>(null);
  const [restoreStats, setRestoreStats] = useState<RestoreResult['counts'] | null>(null);

  // Live database stats
  const [dbStats, setDbStats] = useState({
    books: 0,
    customers: 0,
    transactions: 0,
    bills: 0,
    cashEntries: 0,
  });

  const fetchLiveStats = async () => {
    try {
      const db = await getDatabase();
      const bCount = await db.getFirstAsync<{ c: number }>('SELECT count(*) as c FROM books');
      const cCount = await db.getFirstAsync<{ c: number }>('SELECT count(*) as c FROM customers');
      const tCount = await db.getFirstAsync<{ c: number }>('SELECT count(*) as c FROM transactions WHERE is_deleted = 0');
      const billCount = await db.getFirstAsync<{ c: number }>('SELECT count(*) as c FROM bills');
      const cbCount = await db.getFirstAsync<{ c: number }>('SELECT count(*) as c FROM cashbook');

      setDbStats({
        books: bCount?.c || 0,
        customers: cCount?.c || 0,
        transactions: tCount?.c || 0,
        bills: billCount?.c || 0,
        cashEntries: cbCount?.c || 0,
      });
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const path = await BackupEngine.exportCompleteData();
      setLastExportPath(path);
      Alert.alert(
        'Export Successful',
        'Complete user backup package generated and shared! You can save it to your phone, Google Drive, or send it via WhatsApp.'
      );
    } catch (e: any) {
      console.error('Export error:', e);
      Alert.alert('Export Failed', e.message || 'Could not export database.');
    } finally {
      setIsExporting(false);
      fetchLiveStats();
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Restore From Backup?',
      'Importing will replace existing local data with the records inside your backup file. Do you wish to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose File & Restore',
          onPress: async () => {
            try {
              setIsImporting(true);
              const result = await BackupEngine.importCompleteData();

              if (!result.success) {
                Alert.alert('Import Failed', result.message);
                return;
              }

              // Reload all stores with freshly restored database
              await loadBooks();
              if (activeBook) {
                await loadCustomers(activeBook.id);
                await loadCashbook(activeBook.id);
                await loadBills(activeBook.id);
              }
              await fetchLiveStats();

              if (result.counts) {
                setRestoreStats(result.counts);
              }

              Alert.alert(
                'Restore Complete!',
                `Successfully restored:\n• ${result.counts?.books || 0} Books\n• ${result.counts?.customers || 0} Customers & Suppliers\n• ${result.counts?.transactions || 0} Transactions\n• ${result.counts?.bills || 0} Bills\n• ${result.counts?.attachments || 0} Receipt Photos`
              );
            } catch (e: any) {
              console.error('Import error:', e);
              Alert.alert('Import Failed', e.message || 'Failed to restore backup.');
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Backup & Restore Hub',
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Overview Banner */}
        <View
          style={[
            styles.heroBanner,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FolderSync size={32} color={colors.primary} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>Offline Data Sovereignty</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Your entire business accounting is stored locally on this phone. Create full JSON backups
            anytime, or restore past backups to bring back all your customers, bills, transactions, and photos.
          </Text>
        </View>

        {/* Action 1: Export Complete Backup */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryBg }]}>
              <Download size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Export Complete Backup</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Packages all SQLite tables + Base64 receipts into a single verified JSON file.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.primary }]}
            onPress={handleExport}
            disabled={isExporting}
            activeOpacity={0.85}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <FileJson size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.exportBtnText}>EXPORT & SHARE BACKUP</Text>
              </>
            )}
          </TouchableOpacity>

          {lastExportPath && (
            <View style={styles.successNote}>
              <CheckCircle2 size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.successNoteText, { color: colors.primary }]} numberOfLines={1}>
                Last backup generated successfully
              </Text>
            </View>
          )}
        </View>

        {/* Action 2: Import & Restore Previous Backup */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.accentBlueBg }]}>
              <Upload size={22} color={colors.accentBlue} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Import & Restore Backup</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                Select your previously exported backup JSON file. Reconstructs all records with SHA-256 checksum validation.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.importBtn, { backgroundColor: colors.accentBlue }]}
            onPress={handleImport}
            disabled={isImporting}
            activeOpacity={0.85}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Database size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.importBtnText}>SELECT BACKUP FILE & RESTORE</Text>
              </>
            )}
          </TouchableOpacity>

          {restoreStats && (
            <View
              style={[
                styles.statsBox,
                { backgroundColor: colors.cardSecondary, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statsBoxTitle, { color: colors.text }]}>Restoration Summary:</Text>
              <Text style={[styles.statsBoxLine, { color: colors.textSecondary }]}>• {restoreStats.books} Books</Text>
              <Text style={[styles.statsBoxLine, { color: colors.textSecondary }]}>• {restoreStats.customers} Customers / Suppliers</Text>
              <Text style={[styles.statsBoxLine, { color: colors.textSecondary }]}>• {restoreStats.transactions} Transactions</Text>
              <Text style={[styles.statsBoxLine, { color: colors.textSecondary }]}>• {restoreStats.bills} Bills & Invoices</Text>
              <Text style={[styles.statsBoxLine, { color: colors.textSecondary }]}>• {restoreStats.attachments} Receipt Photos Restored</Text>
            </View>
          )}
        </View>

        {/* Live On-Device Record Statistics */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Current On-Device Database</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsCol}>
              <Text style={[styles.statsNum, { color: colors.text }]}>{dbStats.books}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Books</Text>
            </View>
            <View style={styles.statsCol}>
              <Text style={[styles.statsNum, { color: colors.text }]}>{dbStats.customers}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Parties</Text>
            </View>
            <View style={styles.statsCol}>
              <Text style={[styles.statsNum, { color: colors.text }]}>{dbStats.transactions}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Transactions</Text>
            </View>
            <View style={styles.statsCol}>
              <Text style={[styles.statsNum, { color: colors.text }]}>{dbStats.bills}</Text>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Invoices</Text>
            </View>
          </View>
        </View>

        {/* Security Statement */}
        <View
          style={[
            styles.securityBox,
            { backgroundColor: colors.primaryBg, borderColor: colors.primary },
          ]}
        >
          <ShieldCheck size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.securityText, { color: colors.primary }]}>
            Your data never touches remote servers without your explicit action. 100% private and portable.
          </Text>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 2,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 2,
  },
  importBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  successNoteText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  statsBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statsBoxLine: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCol: {
    alignItems: 'center',
    flex: 1,
  },
  statsNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  statsLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
    lineHeight: 16,
  },
});

