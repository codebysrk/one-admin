/**
 * Design Tokens - Single Source of Truth for all design decisions
 * Following iOS Human Interface Guidelines & Material Design principles
 */

export const Colors = {
  // Primary Colors - Brand identity
  primary: {
    DEFAULT: '#0B1220',       // Main brand color - deep navy
    light: '#1E293B',         // Lighter variant
    dark: '#05080F',          // Darker variant
  },

  // Accent Colors - CTAs and highlights
  accent: {
    DEFAULT: '#2563EB',      // Primary action - vivid blue
    light: '#3B82F6',         // Hover state
    dark: '#1D4ED8',          // Pressed state
    subtle: '#DBEAFE',        // Background variant
    muted: '#EFF6FF',        // Very light background
  },

  // Semantic Colors - Status indicators
  success: {
    DEFAULT: '#059669',      // Positive states
    light: '#10B981',
    dark: '#047857',
    soft: '#ECFDF5',         // Background
    muted: '#D1FAE5',
  },

  warning: {
    DEFAULT: '#D97706',      // Caution states
    light: '#F59E0B',
    dark: '#B45309',
    soft: '#FFF7ED',
    muted: '#FEF3C7',
  },

  error: {
    DEFAULT: '#E11D48',      // Error/danger states
    light: '#F43F5E',
    dark: '#BE123C',
    soft: '#FFF1F2',
    muted: '#FFE4E6',
  },

  info: {
    DEFAULT: '#2563EB',      // Informational states
    soft: '#EFF6FF',
    muted: '#DBEAFE',
  },

  // Neutrals - Grayscale palette
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Base colors
  white: '#FFFFFF',
  black: '#000000',

  // Functional colors
  background: {
    DEFAULT: '#F4F7FB',      // Main background
    alt: '#EDF2F8',          // Alternative background
    elevated: '#FFFFFF',    // Card/surface background
  },

  surface: {
    DEFAULT: '#FFFFFF',
    muted: '#F8FAFC',
    pressed: '#F1F5F9',
    elevated: '#FFFFFF',
  },

  border: {
    DEFAULT: '#E2E8F0',
    strong: '#CBD5E1',
    subtle: '#F1F5F9',
  },

  text: {
    primary: '#0F172A',      // Primary text
    secondary: '#334155',   // Secondary text
    muted: '#5B687A',        // Muted text
    subtle: '#8A99AD',       // Very subtle text
    inverse: '#FFFFFF',      // Text on dark backgrounds
    link: '#2563EB',         // Link text
  },

  // Overlay & Glass
  overlay: 'rgba(15, 23, 42, 0.54)',
  overlayLight: 'rgba(15, 23, 42, 0.4)',
  glass: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

export const Typography = {
  // Font sizes following 4px grid system
  sizes: {
    xxs: 10,
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 22,
    '4xl': 24,
    '5xl': 28,
    hero: 32,
  },

  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  tracking: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

export const Spacing = {
  // Base spacing values - 4px grid
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const BorderRadius = {
  // Border radius following iOS guidelines
  none: 0,
  xs: 2,
  sm: 4,
  base: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  // Shadow presets for depth hierarchy
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  base: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },

  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 7,
  },

  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
  },

  // Colored shadows for accent elements
  accent: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },

  success: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },

  error: {
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const Layout = {
  // Screen padding
  screenPadding: {
    horizontal: 20,
    vertical: 16,
  },

  // Content max width
  contentMaxWidth: 600,

  // Header height
  headerHeight: 56,

  // Tab bar height
  tabBarHeight: {
    default: 70,
    compact: 60,
  },

  // Card minimum heights
  cardMinHeight: 80,

  // List item heights
  listItemHeight: {
    small: 44,
    medium: 56,
    large: 72,
    xlarge: 88,
  },
};

export const Animation = {
  // Duration presets (ms)
  duration: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 400,
  },

  // Easing curves
  easing: {
    default: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },
};

// Z-index layers for proper layering
export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
};