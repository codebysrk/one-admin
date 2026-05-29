export const lightColors = {
  primary: '#0B1220',
  primarySoft: '#E8EEF7',
  accent: '#2563EB',
  accentDark: '#1D4ED8',
  accentSoft: '#EAF2FF',
  accentMuted: '#DBEAFE',
  teal: '#0D9488',
  tealSoft: '#E6FFFB',
  background: '#F4F7FB',
  backgroundAlt: '#EDF2F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  surfacePressed: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#0F172A',
  textMuted: '#5B687A',
  textSubtle: '#8A99AD',
  textOnDark: '#F8FAFC',
  error: '#E11D48',
  errorSoft: '#FFF1F2',
  success: '#059669',
  successSoft: '#ECFDF5',
  warning: '#D97706',
  warningSoft: '#FFF7ED',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 23, 42, 0.54)',
  glass: 'rgba(255,255,255,0.12)',
};

export const darkColors: typeof lightColors = {
  primary: '#0F172A',
  primarySoft: '#1E293B',
  accent: '#3B82F6',
  accentDark: '#60A5FA',
  accentSoft: '#1E3A8A',
  accentMuted: '#1E40AF',
  teal: '#14B8A6',
  tealSoft: '#134E4A',
  background: '#0B1220',
  backgroundAlt: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  surfaceMuted: '#0F172A',
  surfacePressed: '#334155',
  border: '#334155',
  borderStrong: '#475569',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textSubtle: '#64748B',
  textOnDark: '#F8FAFC',
  error: '#F43F5E',
  errorSoft: '#1F1229',
  success: '#10B981',
  successSoft: '#064E3B',
  warning: '#F59E0B',
  warningSoft: '#451A03',
  info: '#3B82F6',
  infoSoft: '#1E3A8A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(2, 6, 23, 0.7)',
  glass: 'rgba(255,255,255,0.05)',
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  jumbo: 40,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  pill: 999,
};

export const TYPOGRAPHY = {
  hero: 30,
  title: 22,
  section: 17,
  body: 14,
  bodySmall: 13,
  label: 12,
  caption: 11,
};

export const SHADOWS = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 7,
  },
  accent: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// Legacy static export — used by screens not yet migrated to useAppTheme
export const COLORS = lightColors;

// Primary hook — wired to ThemeContext so all consumers re-render on system theme change
export { useTheme as useAppTheme } from './ThemeContext';
