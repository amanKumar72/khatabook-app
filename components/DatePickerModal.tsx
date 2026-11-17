import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, X } from 'lucide-react-native';
import { useThemeStore } from '../src/store/useThemeStore';

interface DatePickerModalProps {
  visible: boolean;
  initialDate?: string; // Format: YYYY-MM-DD
  title?: string;
  allowFuture?: boolean;
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePickerModal({
  visible,
  initialDate,
  title = 'Select Date',
  allowFuture = true,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const colors = useThemeStore((s) => s.colors);

  const getParsedDate = (str?: string) => {
    if (str && /^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getParsedDate(initialDate));
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());

  useEffect(() => {
    if (visible) {
      const parsed = getParsedDate(initialDate);
      setSelectedDate(parsed);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [visible, initialDate]);

  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setSelectedDate(newDate);
  };

  const handlePreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setSelectedDate(target);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const handleConfirm = () => {
    onSelect(formatDateStr(selectedDate));
    onClose();
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CalendarIcon size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Selected Date Preview Bar */}
          <View style={[styles.previewBar, { backgroundColor: colors.cardSecondary }]}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Selected Date:</Text>
            <Text style={[styles.previewDate, { color: colors.primary }]}>
              {formatDateStr(selectedDate)}
            </Text>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
              onPress={() => handlePreset(0)}
            >
              <Text style={[styles.presetBtnText, { color: colors.text }]}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.presetBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
              onPress={() => handlePreset(-1)}
            >
              <Text style={[styles.presetBtnText, { color: colors.text }]}>Yesterday</Text>
            </TouchableOpacity>

            {allowFuture && (
              <>
                <TouchableOpacity
                  style={[styles.presetBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  onPress={() => handlePreset(7)}
                >
                  <Text style={[styles.presetBtnText, { color: colors.text }]}>+7 Days</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.presetBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  onPress={() => handlePreset(30)}
                >
                  <Text style={[styles.presetBtnText, { color: colors.text }]}>+30 Days</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Month & Year Navigation */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={handlePrevMonth}
            >
              <ChevronLeft size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.monthYearText, { color: colors.text }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: colors.cardSecondary }]}
              onPress={handleNextMonth}
            >
              <ChevronRight size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Names */}
          <View style={styles.daysHeader}>
            {DAY_LABELS.map((label, idx) => (
              <Text
                key={label}
                style={[
                  styles.dayLabel,
                  { color: idx === 0 ? colors.danger : colors.textSecondary },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    today && !selected && [styles.todayCell, { borderColor: colors.primary }],
                    selected && [styles.selectedCell, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => handleSelectDay(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.text },
                      today && !selected && { color: colors.primary, fontWeight: '700' },
                      selected && styles.selectedDayText,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewDate: {
    fontSize: 15,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '700',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  todayCell: {
    borderWidth: 1.5,
  },
  selectedCell: {
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

