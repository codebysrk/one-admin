import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../core/ThemeContext';
import { StatusBadge } from './AdminUI';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Bus = IconWrapper('bus');
const Users = IconWrapper('account-group');
const Trash2 = IconWrapper('trash-can-outline');
const Pencil = IconWrapper('pencil-outline');
const ChevronDown = IconWrapper('chevron-down');
const ContentCopy = IconWrapper('content-copy');
const MapPin = IconWrapper('map-marker');
const ClockOutline = IconWrapper('clock-outline');
const CalendarOutline = IconWrapper('calendar-blank-outline');

interface TicketCardProps {
  ticket: any;
  showUserInfo?: boolean;
  listUserName?: string;
  onDelete?: (id: string) => void;
  onEdit?: (ticket: any) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

let activeSwipeableRow: any = null;

const TicketCardInner = ({
  ticket,
  showUserInfo = false,
  listUserName,
  onDelete,
  onEdit,
  expanded: controlledExpanded,
  onToggleExpand,
}: TicketCardProps) => {
  const { colors, radius, shadows, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, radius, shadows, isDark), [colors, radius, shadows, isDark]);

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isControlled = typeof controlledExpanded === 'boolean';
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  // Smooth Chevron Rotation Animation
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Tactile Press Micro-interaction
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.985,
      speed: 60,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      speed: 50,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [pressScale]);

  // Smooth Expand/Collapse Handler
  const handleToggle = useCallback(() => {
    if (activeSwipeableRow) {
      activeSwipeableRow.close();
      activeSwipeableRow = null;
    }

    try {
      const { LayoutAnimation } = require('react-native');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {
      // fallback gracefully if LayoutAnimation not available
    }

    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [onToggleExpand]);

  // Track single active swipe row
  const handleSwipeableWillOpen = useCallback(() => {
    if (activeSwipeableRow && activeSwipeableRow !== swipeableRef.current) {
      try {
        activeSwipeableRow.close();
      } catch {
        // ignore
      }
    }
    activeSwipeableRow = swipeableRef.current;
  }, []);

  const handleSwipeableClose = useCallback(() => {
    if (activeSwipeableRow === swipeableRef.current) {
      activeSwipeableRow = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (activeSwipeableRow === swipeableRef.current) {
        activeSwipeableRow = null;
      }
    };
  }, []);

  // Copy Feedback Micro-interaction
  const [copied, setCopied] = useState(false);
  const copyScale = useRef(new Animated.Value(1)).current;
  const swipeableRef = useRef<Swipeable>(null);
  const userLabel = listUserName ?? ticket.userName;

  const handleCopyTid = async () => {
    const tidToCopy = ticket.tid || ticket.id;
    if (tidToCopy) {
      await Clipboard.setStringAsync(tidToCopy);
      setCopied(true);
      Animated.sequence([
        Animated.timing(copyScale, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.spring(copyScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAC =
    String(ticket.busType || ticket.bus_type || '').toUpperCase() === 'AC' ||
    (ticket.route && String(ticket.route).toLowerCase().includes('ac'));

  const handleSwipeDelete = useCallback(() => {
    swipeableRef.current?.close();
    if (activeSwipeableRow === swipeableRef.current) {
      activeSwipeableRow = null;
    }
    onDelete?.(ticket.id);
  }, [onDelete, ticket.id]);

  const handleSwipeEdit = useCallback(() => {
    swipeableRef.current?.close();
    if (activeSwipeableRow === swipeableRef.current) {
      activeSwipeableRow = null;
    }
    onEdit?.(ticket);
  }, [onEdit, ticket]);

  const renderLeftActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const opacity = dragX.interpolate({
        inputRange: [40, 80],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });
      return (
        <Animated.View style={[styles.swipeEditAction, { opacity }]}>
          <TouchableOpacity
            style={styles.swipeEditBtn}
            onPress={handleSwipeEdit}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit ticket"
          >
            <Pencil size={20} color={colors.white} />
            <Text style={styles.swipeEditText}>Edit</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [styles, colors.white, handleSwipeEdit]
  );

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const opacity = dragX.interpolate({
        inputRange: [-80, -40],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      });
      return (
        <Animated.View style={[styles.swipeDeleteAction, { opacity }]}>
          <TouchableOpacity
            style={styles.swipeDeleteBtn}
            onPress={handleSwipeDelete}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Delete ticket"
          >
            <Trash2 size={20} color={colors.white} />
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [styles, colors.white, handleSwipeDelete]
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={onEdit ? renderLeftActions : undefined}
      renderRightActions={onDelete ? renderRightActions : undefined}
      leftThreshold={40}
      rightThreshold={40}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableWillOpen={handleSwipeableWillOpen}
      onSwipeableClose={handleSwipeableClose}
    >
      <Animated.View
        style={[
          styles.ticketContainer,
          expanded && styles.ticketContainerExpanded,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        <Pressable
          style={styles.mainCardButton}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleToggle}
          accessibilityRole="button"
          accessibilityLabel={`Ticket ${ticket.route || 'Transit'}`}
        >
          {/* Header Row: Route Badge + AC Pill, Status Badge + Animated Chevron */}
          <View style={styles.headerRow}>
            <View style={styles.routeBadgeWrapper}>
              <View style={[styles.busBadge, isAC ? styles.acBadge : styles.nonAcBadge]}>
                <Bus size={15} color={isAC ? colors.accent : colors.warning} />
              </View>
              <View>
                <View style={styles.routeNameRow}>
                  <Text style={styles.routeName}>{ticket.route || 'Route'}</Text>
                  <View style={[styles.busTypePill, isAC ? styles.acPill : styles.nonAcPill]}>
                    <Text style={[styles.busTypeText, { color: isAC ? colors.accent : colors.warning }]}>
                      {isAC ? 'AC' : 'Non-AC'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.rightHeader}>
              <StatusBadge
                label={ticket.status || 'Active'}
                tone={
                  String(ticket.status).toUpperCase() === 'ACTIVE'
                    ? 'success'
                    : String(ticket.status).toUpperCase() === 'EXPIRED'
                    ? 'neutral'
                    : 'error'
                }
              />
              <Animated.View
                style={[
                  styles.chevronShell,
                  { transform: [{ rotate: chevronRotate }] },
                ]}
              >
                <ChevronDown size={16} color={colors.textSubtle} />
              </Animated.View>
            </View>
          </View>

          {/* Journey Stepper: Source & Destination */}
          <View style={styles.journeyWrapper}>
            <View style={styles.journeyTimeline}>
              <View style={styles.timelineDotStart} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineDotDest}>
                <MapPin size={11} color={colors.success} />
              </View>
            </View>
            <View style={styles.journeyStops}>
              <View style={styles.stopBlock}>
                <Text style={styles.stopCaption}>FROM</Text>
                <Text style={styles.stopText} numberOfLines={1}>
                  {ticket.source || ticket.from || 'Source'}
                </Text>
              </View>
              <View style={styles.stopBlock}>
                <Text style={styles.stopCaption}>TO</Text>
                <Text style={[styles.stopText, styles.destStopText]} numberOfLines={1}>
                  {ticket.dest || ticket.destination || ticket.to || 'Destination'}
                </Text>
              </View>
            </View>
          </View>

          {/* Perforated Cutout Separator */}
          <View style={styles.stubSeparator}>
            <View style={[styles.notch, styles.notchLeft]} />
            <View style={styles.perforatedLine} />
            <View style={[styles.notch, styles.notchRight]} />
          </View>

          {/* Footer Quick Info: Date, Time, Fare */}
          <View style={styles.quickInfoRow}>
            <View style={styles.scheduleRow}>
              <CalendarOutline size={13} color={colors.textSubtle} />
              <Text style={styles.dateTimeText}>{ticket.date || 'Today'}</Text>
              {ticket.time ? (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <ClockOutline size={12} color={colors.textSubtle} />
                  <Text style={styles.dateTimeText}>{ticket.time}</Text>
                </>
              ) : null}
            </View>
            <View style={styles.fareContainer}>
              <Text style={styles.fareCurrency}>₹</Text>
              <Text style={styles.fareAmount}>{ticket.total || ticket.fare || 0}</Text>
            </View>
          </View>
        </Pressable>

        {/* Expanded Detail Panel */}
        {expanded && (
          <View style={styles.detailPanel}>
            <View style={styles.detailDivider} />

            {showUserInfo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Passenger</Text>
                <View style={styles.userValueContainer}>
                  <Users size={13} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.detailValue}>{userLabel || 'Passenger'}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Passengers</Text>
              <View style={styles.pillValue}>
                <Text style={styles.pillValueText}>
                  {ticket.passengers || ticket.qty || 1} Ticket{Number(ticket.passengers || ticket.qty || 1) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base Fare</Text>
              <Text style={styles.detailValue}>₹{ticket.fare || ticket.total || 0}</Text>
            </View>

            {Number(ticket.fare) > Number(ticket.total || ticket.finalFare) && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Discounted Fare</Text>
                <Text style={[styles.detailValue, { color: colors.success, fontWeight: '800' }]}>
                  ₹{ticket.total || ticket.finalFare}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Animated.View style={{ transform: [{ scale: copyScale }] }}>
                <TouchableOpacity onPress={handleCopyTid} style={styles.copyButton} activeOpacity={0.7}>
                  <Text style={styles.tidText} numberOfLines={1}>{ticket.tid || ticket.id}</Text>
                  <ContentCopy size={12} color={copied ? colors.success : colors.accent} />
                  {copied && <Text style={styles.copiedText}>Copied!</Text>}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}
      </Animated.View>
    </Swipeable>
  );
};

const getStyles = (colors: any, radius: any, shadows: any, isDark: boolean) =>
  StyleSheet.create({
    ticketContainer: {
      marginBottom: 8,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 0,
      overflow: 'hidden',
    },
    ticketContainerExpanded: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    mainCardButton: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    routeBadgeWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    busBadge: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    acBadge: {
      backgroundColor: colors.accentSoft,
    },
    nonAcBadge: {
      backgroundColor: colors.warningSoft,
    },
    routeNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    routeName: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    busTypePill: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: radius.xs,
    },
    acPill: {
      backgroundColor: colors.accentSoft,
    },
    nonAcPill: {
      backgroundColor: colors.warningSoft,
    },
    busTypeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    rightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    chevronShell: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    journeyWrapper: {
      flexDirection: 'row',
      marginVertical: 6,
      paddingHorizontal: 2,
      gap: 12,
    },
    journeyTimeline: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 3,
      width: 14,
    },
    timelineDotStart: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      borderWidth: 1.5,
      borderColor: colors.surface,
    },
    timelineLine: {
      width: 1.5,
      flex: 1,
      minHeight: 18,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    timelineDotDest: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 14,
      height: 14,
    },
    journeyStops: {
      flex: 1,
      gap: 8,
      justifyContent: 'center',
    },
    stopBlock: {
      gap: 1,
    },
    stopCaption: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textSubtle,
      letterSpacing: 0.8,
    },
    stopText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    destStopText: {
      fontWeight: '700',
      color: colors.text,
    },
    stubSeparator: {
      position: 'relative',
      height: 18,
      justifyContent: 'center',
      marginHorizontal: -16,
      marginVertical: 4,
    },
    notch: {
      width: 24,
      height: 24,
      borderRadius: 20,
      backgroundColor: colors.background,
      position: 'absolute',
      zIndex: 2,
    },
    notchLeft: {
      left: -7,
    },
    notchRight: {
      right: -7,
    },
    perforatedLine: {
      borderBottomWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginHorizontal: 16,
    },
    quickInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 4,
    },
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    dotSeparator: {
      color: colors.textSubtle,
      fontSize: 10,
      marginHorizontal: 2,
    },
    dateTimeText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    fareContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    fareCurrency: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
      marginRight: 1,
    },
    fareAmount: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: -0.3,
    },
    detailPanel: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.surfaceMuted,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailDivider: {
      height: 6,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 7,
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    detailValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    userValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pillValue: {
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillValueText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.xs,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    tidText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    copiedText: {
      fontSize: 9,
      color: colors.success,
      fontWeight: '800',
      marginLeft: 2,
    },
    swipeEditAction: {
      marginBottom: 12,
      borderRadius: radius.lg,
      overflow: 'hidden',
      justifyContent: 'center',
      marginRight: 8,
    },
    swipeEditBtn: {
      width: 80,
      flex: 1,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      borderRadius: radius.lg,
    },
    swipeEditText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: '800',
    },
    swipeDeleteAction: {
      marginBottom: 12,
      borderRadius: radius.lg,
      overflow: 'hidden',
      justifyContent: 'center',
      marginLeft: 8,
    },
    swipeDeleteBtn: {
      width: 80,
      flex: 1,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      borderRadius: radius.lg,
    },
    swipeDeleteText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: '800',
    },
  });

export const TicketCard = React.memo(TicketCardInner);
