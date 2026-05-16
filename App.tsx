import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Platform } from 'react-native';
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

import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { BackHandler, ToastAndroid } from 'react-native';

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
  const navigationRef = useNavigationContainerRef();
  const lastBackPressed = React.useRef(0);

  React.useEffect(() => {
    // Check for updates when app starts
    checkAppUpdate();

    const backAction = () => {
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      const now = Date.now();
      if (lastBackPressed.current && now - lastBackPressed.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressed.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
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
