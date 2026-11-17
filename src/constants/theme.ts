export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;       // Screen background
  card: string;             // Cards, surfaces, header, modals
  cardSecondary: string;    // Nested boxes, secondary cards
  border: string;           // Border and dividers
  borderSubtle: string;     // Lighter divider
  text: string;             // Primary text
  textSecondary: string;    // Secondary text / hints
  textMuted: string;        // Inactive / placeholder text
  primary: string;          // Khatabook Green
  primaryBg: string;        // Subtle Green Badge
  danger: string;           // Debit Red
  dangerBg: string;         // Subtle Red Badge
  inputBg: string;          // Input fields
  inputBorder: string;      // Input outline
  accentBlue: string;       // Blue CTAs
  accentBlueBg: string;
  accentPurple: string;     // Purple CTAs
  accentPurpleBg: string;
  statusBar: 'light' | 'dark';
}

export const lightColors: ThemeColors = {
  background: '#f8fafc',
  card: '#ffffff',
  cardSecondary: '#f1f5f9',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  primary: '#16a34a',
  primaryBg: '#f0fdf4',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  accentBlue: '#0284c7',
  accentBlueBg: '#f0f9ff',
  accentPurple: '#7c3aed',
  accentPurpleBg: '#ede9fe',
  statusBar: 'dark',
};

export const darkColors: ThemeColors = {
  background: '#090d16',
  card: '#131b2e',
  cardSecondary: '#1c263d',
  border: '#23304b',
  borderSubtle: '#1a243a',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#22c55e',
  primaryBg: '#052e16',
  danger: '#ef4444',
  dangerBg: '#450a0a',
  inputBg: '#0f172a',
  inputBorder: '#334155',
  accentBlue: '#38bdf8',
  accentBlueBg: '#082f49',
  accentPurple: '#a855f7',
  accentPurpleBg: '#3b0764',
  statusBar: 'light',
};

