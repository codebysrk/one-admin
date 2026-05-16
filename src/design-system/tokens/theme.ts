/**
 * Theme Provider - Central export for all design tokens
 * Use this to import all tokens in components
 */

export * from './index';

import { Colors, Typography, Spacing, BorderRadius, Shadows, Layout, Animation, ZIndex } from './index';

// Re-export for convenience
export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  layout: Layout,
  animation: Animation,
  zIndex: ZIndex,
};

export type Theme = typeof theme;
export default theme;