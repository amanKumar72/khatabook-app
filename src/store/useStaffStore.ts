import { create } from 'zustand';
import { Staff, StaffAttendance, AttendanceStatus, StaffRole, WageType } from '../types/models';
import { getDatabase } from '../db/database';

interface StaffState {
  staffList: Staff[];
  attendanceMap: Record<string, StaffAttendance>;
  isLoading: boolean;
  loadStaff: (bookId: string, date?: string) => Promise<void>;
  addStaff: (
    bookId: string,
    name: string,
    phone: string,
    role: StaffRole,
    wageType: WageType,
    wageAmount: number,
    joiningDate: string
  ) => Promise<void>;
  markAttendance: (
    staffId: string,
    date: string,
    status: AttendanceStatus,
    overtimeHours?: number
  ) => Promise<void>;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staffList: [],
  attendanceMap: {},
  isLoading: true,

  loadStaff: async (bookId: string, date?: string) => {
    try {
      const db = await getDatabase();
      const staffList = await db.getAllAsync<Staff>(
        'SELECT * FROM staff WHERE book_id = ? ORDER BY name ASC',
        [bookId]
      );

      const targetDate = date || new Date().toISOString().split('T')[0];
      const attendance = await db.getAllAsync<StaffAttendance>(
        'SELECT * FROM staff_attendance WHERE date = ?',
        [targetDate]
      );

      const attMap: Record<string, StaffAttendance> = {};
      for (const a of attendance) {
        attMap[a.staff_id] = a;
      }

      set({ staffList, attendanceMap: attMap, isLoading: false });
    } catch (e) {
      console.error('Failed to load staff:', e);
      set({ isLoading: false });
    }
  },

  addStaff: async (bookId, name, phone, role, wageType, wageAmount, joiningDate) => {
    const db = await getDatabase();
    const id = `staff_${Date.now()}`;
    await db.runAsync(
      'INSERT INTO staff (id, book_id, name, phone, role, wage_type, wage_amount, joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, bookId, name, phone, role, wageType, wageAmount, joiningDate]
    );
    await get().loadStaff(bookId);
  },

  markAttendance: async (staffId, date, status, overtimeHours = 0) => {
    const db = await getDatabase();
    const id = `att_${staffId}_${date}`;
    await db.runAsync(
      'INSERT OR REPLACE INTO staff_attendance (id, staff_id, date, status, overtime_hours) VALUES (?, ?, ?, ?, ?)',
      [id, staffId, date, status, overtimeHours]
    );

    const attMap = { ...get().attendanceMap };
    attMap[staffId] = { id, staff_id: staffId, date, status, overtime_hours: overtimeHours };
    set({ attendanceMap: attMap });
  },
}));

