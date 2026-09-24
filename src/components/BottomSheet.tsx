import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Animated,
  PanResponder,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// BottomSheet icon wrapper
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

  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const topSafeOffset = Math.max(insets.top, 24);
  const maxSheetHeight = keyboardHeight > 0
    ? Math.max(screenHeight - keyboardHeight - topSafeOffset, 200)
    : Math.max(screenHeight - topSafeOffset - 20, 200);

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
            Keyboard.dismiss();
            Animated.timing(panY, {
              toValue: screenHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              if (!loading) onClose();
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
    [loading, onClose, panY, screenHeight]
  );

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

  const animatedBackdropStyle = {
    opacity: panY.interpolate({
      inputRange: [0, 250],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
  };

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
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              if (!loading) onClose();
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: maxSheetHeight,
              transform: [{ translateY: panY }],
            },
            sheetStyle,
          ]}
        >
          <View {...panResponder.panHandlers} collapsable={false} style={styles.dragZone}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              {headerIcon && <View style={styles.iconBox}>{headerIcon}</View>}
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            </View>
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
        </Animated.View>
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
    paddingTop: 8,
    ...SHADOWS.floating,
  },
  dragZone: {
    width: '100%',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 14,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
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
