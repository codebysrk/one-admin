import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Platform,
  Vibration,
  Alert as RNAlert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../core/ThemeContext';
import { RADIUS, SHADOWS } from '../core/theme';

export interface AlertButton {
  text?: string;
  onPress?: (value?: string) => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertPayload {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: { cancelable?: boolean; onDismiss?: () => void };
}

let globalAlertListener: ((payload: AlertPayload) => void) | null = null;
const originalAlert = RNAlert.alert;

export const showStyledAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: any
) => {
  if (globalAlertListener) {
    globalAlertListener({
      visible: true,
      title: title || '',
      message: message || '',
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }],
      options,
    });
  } else {
    originalAlert(title, message, buttons, options);
  }
};

// Patch RNAlert.alert globally so all native alerts across the app are styled
RNAlert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
  showStyledAlert(title, message, buttons, options);
};

export const StyledAlertModal = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [alert, setAlert] = useState<AlertPayload>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  useEffect(() => {
    globalAlertListener = (payload: AlertPayload) => {
      setAlert(payload);
    };
    return () => {
      globalAlertListener = null;
    };
  }, []);

  if (!alert.visible) return null;

  const closeAlert = (callback?: () => void) => {
    try {
      if (Platform.OS === 'android') Vibration.vibrate(10);
    } catch {}
    setAlert((prev) => ({ ...prev, visible: false }));
    if (callback) {
      setTimeout(callback, 50);
    }
  };

  const handleBackdropPress = () => {
    if (alert.options?.cancelable !== false) {
      const cancelBtn = alert.buttons?.find((b) => b.style === 'cancel');
      if (cancelBtn?.onPress) {
        closeAlert(cancelBtn.onPress);
      } else {
        closeAlert(alert.options?.onDismiss);
      }
    }
  };

  // Determine icon tone based on title / message content
  const lowerTitle = (alert.title || '').toLowerCase();
  const lowerMsg = (alert.message || '').toLowerCase();
  const isError =
    lowerTitle.includes('error') ||
    lowerTitle.includes('fail') ||
    lowerTitle.includes('invalid') ||
    lowerTitle.includes('delete') ||
    lowerTitle.includes('ban') ||
    lowerTitle.includes('remove') ||
    lowerTitle.includes('required') ||
    lowerMsg.includes('error') ||
    lowerMsg.includes('failed');

  const isSuccess =
    !isError &&
    (lowerTitle.includes('success') ||
      lowerTitle.includes('saved') ||
      lowerTitle.includes('updated') ||
      lowerTitle.includes('imported') ||
      lowerTitle.includes('created') ||
      lowerTitle.includes('sent') ||
      lowerMsg.includes('success'));

  const isWarning =
    !isError &&
    !isSuccess &&
    (lowerTitle.includes('warning') ||
      lowerTitle.includes('caution') ||
      lowerTitle.includes('alert') ||
      lowerTitle.includes('notice'));

  let iconName: any = 'information';
  let iconColor = colors.accent || '#3B82F6';
  let iconBg = colors.accentSoft || '#EFF6FF';

  if (isError) {
    iconName = 'alert-circle';
    iconColor = colors.error || '#EF4444';
    iconBg = colors.errorSoft || '#FEF2F2';
  } else if (isSuccess) {
    iconName = 'check-circle';
    iconColor = colors.success || '#10B981';
    iconBg = colors.successSoft || '#ECFDF5';
  } else if (isWarning) {
    iconName = 'alert';
    iconColor = colors.warning || '#F59E0B';
    iconBg = colors.warningSoft || '#FFFBEB';
  }

  const buttons = alert.buttons || [{ text: 'OK', style: 'default' }];
  const isSingle = buttons.length === 1;
  const isDouble = buttons.length === 2;

  return (
    <Modal
      visible={alert.visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
          </View>

          <Text style={styles.title}>{alert.title}</Text>

          {alert.message ? (
            <Text style={styles.message}>{alert.message}</Text>
          ) : null}

          <View style={[styles.actions, !isSingle && !isDouble && styles.actionsStacked]}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              let btnBg = colors.primary;
              let textColor = isDark ? '#09090B' : '#FFFFFF';

              if (isDestructive) {
                btnBg = colors.error || '#EF4444';
                textColor = '#FFFFFF';
              } else if (isCancel) {
                btnBg = colors.surfaceMuted;
                textColor = colors.textMuted;
              }

              return (
                <Pressable
                  key={index}
                  onPress={() => closeAlert(btn.onPress)}
                  android_ripple={{
                    color: isCancel
                      ? colors.border
                      : isDark
                      ? 'rgba(0, 0, 0, 0.15)'
                      : 'rgba(255, 255, 255, 0.25)',
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel && styles.cancelButton,
                    { backgroundColor: btnBg },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
                    isDouble && (isCancel ? styles.doubleBtnCancel : styles.doubleBtnAction),
                    isSingle && styles.singleBtn,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text || 'Action'}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: textColor },
                      isCancel && styles.cancelBtnText,
                    ]}
                  >
                    {btn.text || 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
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
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 22,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
    },
    actionsStacked: {
      flexDirection: 'column',
    },
    button: {
      height: 46,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      ...SHADOWS.card,
    },
    singleBtn: {
      flex: 1,
    },
    doubleBtnCancel: {
      flex: 1,
    },
    doubleBtnAction: {
      flex: 1.25,
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    btnText: {
      fontSize: 14,
      fontWeight: '800',
    },
    cancelBtnText: {
      fontWeight: '700',
    },
  });
