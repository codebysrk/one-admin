import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../core/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconBox}>
              <AlertTriangle size={48} color={COLORS.error} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              An unexpected error occurred in the dashboard. Our security system has safely isolated it.
            </Text>
            
            {__DEV__ && (
              <View style={styles.debugBox}>
                <Text style={styles.debugText}>{this.state.error?.message}</Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={this.handleReset}>
                <RefreshCcw size={18} color={COLORS.white} />
                <Text style={styles.btnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  iconBox: { width: 80, height: 80, borderRadius: RADIUS.lg, backgroundColor: COLORS.errorSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  message: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  debugBox: { backgroundColor: COLORS.surfaceMuted, padding: 12, borderRadius: RADIUS.md, marginBottom: 24, width: '100%', borderWidth: 1, borderColor: COLORS.border },
  debugText: { fontSize: 12, color: COLORS.error, fontFamily: 'monospace' },
  actions: { width: '100%', gap: 12 },
  btnPrimary: { height: 56, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' }
});
