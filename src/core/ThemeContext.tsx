import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { lightColors, darkColors, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from './theme';

type Colors = typeof lightColors;

type ThemeContextType = {
  colors: Colors;
  isDark: boolean;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  typography: typeof TYPOGRAPHY;
  shadows: typeof SHADOWS;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  spacing: SPACING,
  radius: RADIUS,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? darkColors.background : lightColors.background).catch(() => {});
  }, [isDark]);

  const value: ThemeContextType = {
    colors: isDark ? darkColors : lightColors,
    isDark,
    spacing: SPACING,
    radius: RADIUS,
    typography: TYPOGRAPHY,
    shadows: SHADOWS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
