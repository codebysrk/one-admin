import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
  Vibration,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING } from '../core/theme';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const AlertTriangle = IconWrapper('alert');
const Info = IconWrapper('information-outline');

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info';
  variant?: 'alert' | 'sheet';
}

export const ConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Yes, Delete',
  cancelLabel = 'Cancel',
  type = 'danger',
  variant = 'sheet',
}: ConfirmationModalProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const screenHeight = Dimensions.get('window').height;

  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            gestureState.dy > 2 &&
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
          );
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          return (
            gestureState.dy > 4 &&
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
          );
        },
        onPanResponderGrant: () => {
          panY.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            panY.setValue(gestureState.dy);
          } else {
            panY.setValue(0);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (
            gestureState.dy > 160 ||
            (gestureState.dy > 50 && gestureState.vy > 0.5)
          ) {
            try {
              if (Platform.OS === 'android') Vibration.vibrate(10);
            } catch {}
            Animated.timing(panY, {
              toValue: screenHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              onClose();
            });
          } else {
            Animated.spring(panY, {
              toValue: 0,
              bounciness: 4,
              speed: 14,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [onClose, panY, screenHeight]
  );

  if (!visible) return null;

  const isDanger = type === 'danger';
  const isSheet = variant === 'sheet';

  const animatedBackdropStyle = isSheet
    ? {
        opacity: panY.interpolate({
          inputRange: [0, 200],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        }),
      }
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isSheet ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={isSheet ? styles.sheetOverlay : styles.alertOverlay}>
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            isSheet ? styles.sheet : styles.alertCard,
            isSheet && { transform: [{ translateY: panY }] },
          ]}
        >
          {isSheet && (
            <View
              {...panResponder.panHandlers}
              collapsable={false}
              style={styles.sheetDragZone}
            >
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            </View>
          )}

          <View style={isSheet ? styles.sheetHeaderRow : styles.alertIconContainer}>
            <View
              style={[
                isSheet ? styles.sheetIconBox : styles.alertIconBox,
                { backgroundColor: isDanger ? colors.errorSoft : colors.primarySoft },
              ]}
            >
              {isDanger ? (
                <AlertTriangle size={isSheet ? 22 : 26} color={colors.error} />
              ) : (
                <Info size={isSheet ? 22 : 26} color={colors.primary} />
              )}
            </View>
            {isSheet && (
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>{title}</Text>
              </View>
            )}
          </View>

          {!isSheet && <Text style={styles.alertTitle}>{title}</Text>}

          <Text style={isSheet ? styles.sheetMessage : styles.alertMessage}>
            {message}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                try {
                  if (Platform.OS === 'android') Vibration.vibrate(10);
                } catch {}
                onClose();
              }}
              android_ripple={{ color: colors.border }}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                try {
                  if (Platform.OS === 'android') Vibration.vibrate(10);
                } catch {}
                onClose();
                onConfirm();
              }}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: isDanger ? colors.error : colors.primary },
                pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any, insets: any) => StyleSheet.create({
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.floating,
  },
  alertIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    fontWeight: '500',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: SPACING.xl,
    paddingBottom: Math.max(insets.bottom, 16) + 8,
    borderTopWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.floating,
  },
  sheetDragZone: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  sheetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sheetMessage: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: 20,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
