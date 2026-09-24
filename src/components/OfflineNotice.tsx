import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RADIUS, SPACING } from '../core/theme';

export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // Standard zero-byte connectivity ping endpoint used by Android
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeoutId);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
};

export const OfflineNotice = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const insets = useSafeAreaInsets();

  const checkStatus = useCallback(async () => {
    setChecking(true);
    const online = await checkInternetConnection();
    setChecking(false);

    if (!online) {
      setIsOffline(true);
      setWasOffline(true);
    } else {
      setIsOffline(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();

    // Check when user resumes the app from background
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkStatus();
      }
    });

    // Periodic check
    const interval = setInterval(() => {
      checkStatus();
    }, isOffline ? 8000 : 25000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [checkStatus, isOffline]);

  // Hide the restored banner after 2.5s
  useEffect(() => {
    if (!isOffline && wasOffline) {
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  if (!isOffline && !wasOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 6),
          backgroundColor: isOffline ? '#DC2626' : '#10B981',
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={isOffline ? 'wifi-off' : 'wifi-check'}
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.text}>
          {isOffline
            ? (checking ? 'Checking network...' : 'No Internet Connection')
            : 'Back Online'}
        </Text>
      </View>

      {isOffline && (
        <TouchableOpacity
          onPress={() => checkStatus()}
          style={styles.retryBtn}
          accessibilityRole="button"
          accessibilityLabel="Retry internet connection"
          activeOpacity={0.7}
        >
          <Text style={styles.retryText}>{checking ? '...' : 'RETRY'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 10,
    paddingBottom: 8,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
