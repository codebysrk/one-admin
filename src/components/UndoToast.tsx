import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { RADIUS, SHADOWS } from '../core/theme';

const TIMER_SIZE = 24;
const TIMER_STROKE = 2.5;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

export interface UndoToastProps {
  visible: boolean;
  message?: string;
  onUndo: () => void;
  duration?: number;
  bottomOffset?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  visible,
  message = 'Item deleted',
  onUndo,
  duration = 10,
  bottomOffset,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [remainingMs, setRemainingMs] = useState(duration * 1000);

  useEffect(() => {
    if (visible) {
      const startTime = Date.now();
      const totalMs = duration * 1000;
      setRemainingMs(totalMs);

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const left = Math.max(0, totalMs - elapsed);
        setRemainingMs(left);
        if (left <= 0) {
          clearInterval(interval);
        }
      }, 100);

      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      return () => clearInterval(interval);
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, duration, translateY, opacity]);

  if (!visible) return null;

  const totalMs = duration * 1000;
  const progress = remainingMs / totalMs;
  const strokeDashoffset = TIMER_CIRCUMFERENCE * (1 - progress);
  const secondsDisplay = Math.max(1, Math.ceil(remainingMs / 1000));
  const bottom = bottomOffset !== undefined ? bottomOffset : Math.max(insets.bottom, 16) + 12;

  return (
    <Animated.View
      style={[
        styles.undoToast,
        {
          bottom,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.undoToastCopy}>
        <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
        <Text style={styles.undoToastMessage} numberOfLines={1}>{message}</Text>
      </View>
      <TouchableOpacity
        onPress={onUndo}
        activeOpacity={0.7}
        style={styles.undoToastBtn}
        accessibilityRole="button"
        accessibilityLabel="Undo delete"
      >
        <Text style={styles.undoToastBtnText}>UNDO</Text>
        <View style={styles.timerCircleWrap}>
          <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={TIMER_RADIUS}
              stroke="rgba(96, 165, 250, 0.25)"
              strokeWidth={TIMER_STROKE}
              fill="transparent"
            />
            <Circle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={TIMER_RADIUS}
              stroke="#60A5FA"
              strokeWidth={TIMER_STROKE}
              fill="transparent"
              strokeDasharray={`${TIMER_CIRCUMFERENCE} ${TIMER_CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <View style={styles.timerNumberOverlay}>
            <Text style={styles.timerNumberText}>{secondsDisplay}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  undoToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#18181B',
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...SHADOWS.floating,
    elevation: 8,
    zIndex: 9999,
  },
  undoToastCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  undoToastMessage: {
    color: '#F4F4F5',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  undoToastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.pill,
  },
  undoToastBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerCircleWrap: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerNumberOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerNumberText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '800',
  },
});
