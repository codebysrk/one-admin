import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { useAdminStore } from './src/store/useAdminStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AdminNavigator } from './src/navigation/AdminNavigator';
import { COLORS } from './src/core/theme';
import { AdminPressable } from './src/components/AdminUI';
import { checkAppUpdate } from './src/services/updateService';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean; message?: string };

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.warn('App error boundary:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.wrap}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.body}>{this.state.message}</Text>
          <AdminPressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={errorStyles.btn}
            onPress={() => this.setState({ hasError: false, message: undefined })}
          >
            <Text style={errorStyles.btnText}>Try again</Text>
          </AdminPressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: COLORS.background },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  body: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  btn: { alignSelf: 'flex-start', backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: COLORS.white, fontWeight: '800' },
});

import { NavigationContainer } from '@react-navigation/native';

function AppBody() {
  const admin = useAdminStore((state) => state.admin);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {admin ? <AdminNavigator /> : <LoginScreen />}
    </View>
  );
}

export default function App() {
  React.useEffect(() => {
    // Check for updates when app starts
    checkAppUpdate();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppBody />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
