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
import { useRouter, Stack } from 'expo-router';
import { Users, UserPlus, Calendar, Phone, Check, X } from 'lucide-react-native';
import { useBookStore } from '../../src/store/useBookStore';
import { useStaffStore } from '../../src/store/useStaffStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { Staff, AttendanceStatus, WageType, StaffRole } from '../../src/types/models';

export default function StaffScreen() {
  const colors = useThemeStore((s) => s.colors);
  const activeBook = useBookStore((s) => s.activeBook);
  const { staffList, attendanceMap, loadStaff, addStaff, markAttendance, isLoading } = useStaffStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wageAmount, setWageAmount] = useState('');
  const [wageType, setWageType] = useState<WageType>('MONTHLY');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (activeBook) {
      loadStaff(activeBook.id, todayStr);
    }
  }, [activeBook]);

  const handleAddStaff = async () => {
    if (!name.trim() || !activeBook) return;
    await addStaff(
      activeBook.id,
      name.trim(),
      phone.trim(),
      'STAFF',
      wageType,
      parseFloat(wageAmount) || 0,
      todayStr
    );
    setName('');
    setPhone('');
    setWageAmount('');
    setModalVisible(false);
  };

  const renderStaffItem = ({ item }: { item: Staff }) => {
    const currentAtt = attendanceMap[item.id]?.status;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.staffName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.staffPhone, { color: colors.textSecondary }]}>{item.phone || 'No phone'}</Text>
            <Text style={[styles.staffWage, { color: colors.primary }]}>
              ₹{item.wage_amount.toFixed(2)} ({item.wage_type})
            </Text>
          </View>
        </View>

        {/* Daily Attendance Picker */}
        <View style={[styles.attRow, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.attLabel, { color: colors.textSecondary }]}>Today's Attendance:</Text>
          <View style={styles.attButtons}>
            <TouchableOpacity
              style={[
                styles.attBtn,
                { borderColor: colors.border, backgroundColor: colors.cardSecondary },
                currentAtt === 'PRESENT' && { backgroundColor: '#16a34a', borderColor: '#16a34a' },
              ]}
              onPress={() => markAttendance(item.id, todayStr, 'PRESENT')}
            >
              <Text
                style={[
                  styles.attBtnText,
                  { color: colors.textSecondary },
                  currentAtt === 'PRESENT' && { color: '#ffffff' },
                ]}
              >
                P
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attBtn,
                { borderColor: colors.border, backgroundColor: colors.cardSecondary },
                currentAtt === 'HALF_DAY' && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
              ]}
              onPress={() => markAttendance(item.id, todayStr, 'HALF_DAY')}
            >
              <Text
                style={[
                  styles.attBtnText,
                  { color: colors.textSecondary },
                  currentAtt === 'HALF_DAY' && { color: '#ffffff' },
                ]}
              >
                HD
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.attBtn,
                { borderColor: colors.border, backgroundColor: colors.cardSecondary },
                currentAtt === 'ABSENT' && { backgroundColor: '#dc2626', borderColor: '#dc2626' },
              ]}
              onPress={() => markAttendance(item.id, todayStr, 'ABSENT')}
            >
              <Text
                style={[
                  styles.attBtnText,
                  { color: colors.textSecondary },
                  currentAtt === 'ABSENT' && { color: '#ffffff' },
                ]}
              >
                A
              </Text>
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
          title: 'Staff & Attendance',
          headerBackTitle: 'Back',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Date Header */}
        <View
          style={[
            styles.dateHeader,
            { backgroundColor: colors.primaryBg, borderColor: colors.border },
          ]}
        >
          <Calendar size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.dateText, { color: colors.primary }]}>
            Daily Attendance Sheet • {todayStr}
          </Text>
        </View>

        <FlatList
          data={staffList}
          keyExtractor={(s) => s.id}
          renderItem={renderStaffItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                if (activeBook) loadStaff(activeBook.id, todayStr);
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Staff Members Added</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Add your store helpers, sales staff, and record daily attendance with auto-calculated payroll.
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <UserPlus size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>ADD STAFF MEMBER</Text>
        </TouchableOpacity>

        {/* Add Staff Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Staff Member</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Staff Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Mukesh Yadav"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Contact Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. 9812345678"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Salary / Wage Type</Text>
              <View style={styles.wageRow}>
                {(['MONTHLY', 'DAILY', 'HOURLY'] as WageType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.wageChip,
                      {
                        backgroundColor: colors.cardSecondary,
                        borderColor: colors.border,
                      },
                      wageType === type && [
                        styles.wageChipActive,
                        {
                          backgroundColor: colors.primaryBg,
                          borderColor: colors.primary,
                        },
                      ],
                    ]}
                    onPress={() => setWageType(type)}
                  >
                    <Text
                      style={[
                        styles.wageChipText,
                        { color: colors.textSecondary },
                        wageType === type && [styles.wageChipTextActive, { color: colors.primary }],
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Salary Amount (₹) *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. 15000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={wageAmount}
                onChangeText={setWageAmount}
              />

              <TouchableOpacity
                style={[styles.saveStaffBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddStaff}
              >
                <Text style={styles.saveStaffBtnText}>ADD TO ROSTER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  staffPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  staffWage: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  attRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  attLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  attButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  attBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
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
    color: '#0f172a',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  wageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  wageChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wageChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  wageChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  wageChipTextActive: {
    color: '#16a34a',
  },
  saveStaffBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  saveStaffBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
