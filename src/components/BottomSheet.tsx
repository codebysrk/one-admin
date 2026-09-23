import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const X = IconWrapper('close');
import { useTheme } from '../core/ThemeContext';
import { SHADOWS } from '../core/theme';


interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  headerIcon?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
}

export const AdminBottomSheet = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  loading,
  loadingText = 'Processing...',
  headerIcon,
  contentStyle,
  sheetStyle,
}: BottomSheetProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const topSafeOffset = Math.max(insets.top, 24);
  const maxSheetHeight = keyboardHeight > 0
    ? Math.max(screenHeight - keyboardHeight - topSafeOffset, 200)
    : Math.max(screenHeight - topSafeOffset - 20, 200);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        Keyboard.dismiss();
        if (!loading) onClose();
      }}
    >
      <View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            if (!loading) onClose();
          }}
        />
        <View style={[styles.sheet, { maxHeight: maxSheetHeight }, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            {headerIcon && <View style={styles.iconBox}>{headerIcon}</View>}
            <View style={styles.titleWrapper}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                if (!loading) onClose();
              }}
              style={styles.closeBtn}
              disabled={loading}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.body, contentStyle]}>
            {children}
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          )}
          
          <SafeAreaView edges={['bottom']} />
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    ...SHADOWS.floating,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    flexShrink: 1,
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
