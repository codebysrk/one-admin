import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Platform, PanResponder, Animated, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Swipeable } from 'react-native-gesture-handler';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Plus = IconWrapper('plus');
const Trash2 = IconWrapper('trash-can-outline');
const Bus = IconWrapper('bus');
const X = IconWrapper('close');
const ChevronRight = IconWrapper('chevron-right');
const ArrowRightLeft = IconWrapper('swap-horizontal');
const FileJson = IconWrapper('file-document-outline');
const ContentPaste = IconWrapper('content-paste');
const DragIcon = IconWrapper('drag-vertical');

import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField, AdminBottomSheet } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

interface DraggableStopRowProps {
  stop: string;
  index: number;
  isDragging: boolean;
  isAnyDragging: boolean;
  showLineAbove: boolean;
  showLineBelow: boolean;
  onLayout: (index: number, y: number, height: number) => void;
  onDragStart: (index: number) => void;
  onDragMove: (index: number, dy: number) => void;
  onDragEnd: (index: number, dy: number) => void;
  onChangeText: (index: number, text: string) => void;
  onDelete: (index: number) => void;
  dragY: Animated.Value;
  styles?: any;
}

const DraggableStopRow = React.memo(({
  stop,
  index,
  isDragging,
  isAnyDragging,
  showLineAbove,
  showLineBelow,
  onLayout,
  onDragStart,
  onDragMove,
  onDragEnd,
  onChangeText,
  onDelete,
  dragY,
  styles: propStyles,
}: DraggableStopRowProps) => {
  const { colors, isDark } = useTheme();
  const styles = propStyles || (typeof getStyles === 'function' ? getStyles(colors) : ({} as any));

  const translateX = useRef(new Animated.Value(0)).current;

  // Use propsRef to avoid stale closures in PanResponder callbacks
  const propsRef = useRef({ onDragStart, onDragMove, onDragEnd, onDelete, onChangeText, onLayout, index, isAnyDragging });
  propsRef.current = { onDragStart, onDragMove, onDragEnd, onDelete, onChangeText, onLayout, index, isAnyDragging };

  const verticalDragPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const { onDragStart, index } = propsRef.current;
        onDragStart(index);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { onDragMove, index } = propsRef.current;
        onDragMove(index, gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { onDragEnd, index } = propsRef.current;
        onDragEnd(index, gestureState.dy);
      },
      onPanResponderTerminate: () => {
        const { onDragEnd, index } = propsRef.current;
        onDragEnd(index, 0);
      },
    })
  ).current;

  const swipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (propsRef.current.isAnyDragging) return false;
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = -120;
        if (gestureState.dx < threshold) {
          Animated.timing(translateX, {
            toValue: -500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            propsRef.current.onDelete(propsRef.current.index);
            translateX.setValue(0);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View 
      style={{ width: '100%', position: 'relative' }}
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout;
        propsRef.current.onLayout(propsRef.current.index, y, height);
      }}
    >
      {showLineAbove && <View style={styles.dropLine} />}

      {/* Swipe to Delete Underlay Background */}
      {!isDragging && (
        <View style={styles.swipeDeleteBg}>
          <Trash2 size={18} color={colors.error} />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </View>
      )}

      <Animated.View 
        {...swipePanResponder.panHandlers}
        style={[
          styles.stopRow,
          {
            transform: [
              { translateY: isDragging ? dragY : 0 },
              { translateX: translateX }
            ]
          },
          isDragging && {
            zIndex: 99,
            backgroundColor: colors.surfacePressed,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 5,
            borderColor: colors.accent,
            opacity: 0.9,
          }
        ]}
      >
        <View style={styles.stopBadge}>
          <Text style={styles.stopBadgeText}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        <TextInput
          style={styles.stopInput}
          value={stop}
          onChangeText={(text) => propsRef.current.onChangeText(propsRef.current.index, text)}
          placeholder={`Bus Stop #${index + 1}`}
          placeholderTextColor={colors.textSubtle}
        />

        <TouchableOpacity
          style={styles.stopDeleteBtn}
          onPress={() => propsRef.current.onDelete(propsRef.current.index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={15} color={colors.textSubtle} />
        </TouchableOpacity>

        <View 
          {...verticalDragPanResponder.panHandlers} 
          style={styles.dragHandle}
        >
          <DragIcon size={18} color={colors.textSubtle} />
        </View>
      </Animated.View>

      {showLineBelow && <View style={styles.dropLine} />}
    </View>
  );
});

interface StopSequenceEditorProps {
  stops: string[];
  onChangeStops: (stops: string[]) => void;
  styles?: any;
}

const StopSequenceEditor = ({ stops, onChangeStops, styles: propStyles }: StopSequenceEditorProps) => {
  const { colors, isDark } = useTheme();
  const styles = propStyles || (typeof getStyles === 'function' ? getStyles(colors) : ({} as any));
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // Drag and drop states
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [targetDropIndex, setTargetDropIndex] = useState<number | null>(null);
  
  // Refs to prevent stale closures inside PanResponders
  const activeDragIndexRef = useRef<number | null>(null);
  const targetDropIndexRef = useRef<number | null>(null);
  const stopsRef = useRef<string[]>([]);

  activeDragIndexRef.current = activeDragIndex;
  targetDropIndexRef.current = targetDropIndex;
  stopsRef.current = stops;

  const rowLayouts = useRef<{ [key: number]: { y: number; height: number } }>({});
  const dragY = useRef(new Animated.Value(0)).current;

  const handleDragStart = useCallback((index: number) => {
    setActiveDragIndex(index);
    setTargetDropIndex(index);
    activeDragIndexRef.current = index;
    targetDropIndexRef.current = index;
    dragY.setValue(0);
  }, [dragY]);

  const handleDragMove = useCallback((index: number, dy: number) => {
    dragY.setValue(dy);

    const layout = rowLayouts.current[index];
    if (!layout) return;

    // Calculate current center Y of the dragged item
    const currentCenterY = layout.y + layout.height / 2 + dy;
    let minDistance = Infinity;
    let target = index;

    const currentStops = stopsRef.current;
    for (let i = 0; i < currentStops.length; i++) {
      const targetLayout = rowLayouts.current[i];
      if (!targetLayout) continue;

      const targetCenter = targetLayout.y + targetLayout.height / 2;
      const distance = Math.abs(currentCenterY - targetCenter);
      if (distance < minDistance) {
        minDistance = distance;
        target = i;
      }
    }
    setTargetDropIndex(target);
    targetDropIndexRef.current = target;
  }, [dragY]);

  const handleDragEnd = useCallback((index: number, dy: number) => {
    const finalTarget = targetDropIndexRef.current;

    if (finalTarget !== null && finalTarget !== index) {
      // Immediate swap without visual jumps
      setActiveDragIndex(null);
      setTargetDropIndex(null);
      activeDragIndexRef.current = null;
      targetDropIndexRef.current = null;
      dragY.setValue(0);

      const newStops = [...stopsRef.current];
      const [removed] = newStops.splice(index, 1);
      newStops.splice(finalTarget, 0, removed);
      onChangeStops(newStops);
    } else {
      // Spring back to original position
      setTargetDropIndex(null);
      targetDropIndexRef.current = null;
      Animated.spring(dragY, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        setActiveDragIndex(null);
        activeDragIndexRef.current = null;
      });
    }
  }, [dragY, onChangeStops]);

  const handleDelete = useCallback((index: number) => {
    const newStops = stopsRef.current.filter((_, i) => i !== index);
    onChangeStops(newStops);
  }, [onChangeStops]);

  const handleTextChange = useCallback((index: number, text: string) => {
    const newStops = [...stopsRef.current];
    newStops[index] = text;
    onChangeStops(newStops);
  }, [onChangeStops]);

  const handleRowLayout = useCallback((index: number, y: number, height: number) => {
    rowLayouts.current[index] = { y, height };
  }, []);

  const handleAddStop = () => {
    onChangeStops([...stops, '']);
  };

  const getDetectedCount = (text: string) => {
    return text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length;
  };

  const handleBulkImport = (append: boolean) => {
    const parsed = bulkText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    
    if (parsed.length === 0) {
      Alert.alert('Import Error', 'Please paste at least one valid stop name.');
      return;
    }

    if (append) {
      onChangeStops([...stops, ...parsed]);
    } else {
      onChangeStops(parsed);
    }
    setBulkText('');
    setIsBulkOpen(false);
  };

  const renderStopRow = useCallback(({ item: stop, index }: { item: string; index: number }) => {
    const isDragging = activeDragIndex === index;
    const showLineAbove = activeDragIndex !== null && targetDropIndex === index && index < activeDragIndex;
    const showLineBelow = activeDragIndex !== null && targetDropIndex === index && index > activeDragIndex;

    return (
      <DraggableStopRow
        stop={stop}
        index={index}
        isDragging={isDragging}
        isAnyDragging={activeDragIndex !== null}
        showLineAbove={showLineAbove}
        showLineBelow={showLineBelow}
        dragY={dragY}
        onLayout={handleRowLayout}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onChangeText={handleTextChange}
        onDelete={handleDelete}
        styles={styles}
      />
    );
  }, [activeDragIndex, targetDropIndex, dragY, handleRowLayout, handleDragStart, handleDragMove, handleDragEnd, handleTextChange, handleDelete, styles]);

  return (
    <View style={styles.sequenceContainer}>
      <View style={styles.sequenceHeader}>
        <View style={styles.sequenceTitleBlock}>
          <Text style={styles.sequenceHeading}>STOP SEQUENCE</Text>
          <Text style={styles.sequenceCountLabel}>
            ({stops.length} {stops.length === 1 ? 'stop' : 'stops'})
          </Text>
        </View>

        <View style={styles.sequenceHeaderActions}>
          <TouchableOpacity style={styles.sequenceActionChip} onPress={handleAddStop} activeOpacity={0.8}>
            <Plus size={13} color={colors.accent} />
            <Text style={styles.sequenceActionChipTextAccent}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sequenceActionChip} 
            onPress={() => {
              setBulkText(stops.join('\n'));
              setIsBulkOpen(true);
            }}
            activeOpacity={0.8}
          >
            <ContentPaste size={13} color={colors.textMuted} />
            <Text style={styles.sequenceActionChipText}>Bulk</Text>
          </TouchableOpacity>

          {stops.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Clear Sequence',
                  'Are you sure you want to remove all stops from this journey?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => onChangeStops([]) }
                  ]
                );
              }}
              style={[styles.sequenceActionChip, styles.sequenceActionChipDanger]}
              activeOpacity={0.8}
            >
              <Trash2 size={13} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={stops}
        keyExtractor={(_item, index) => String(index)}
        scrollEnabled={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={renderStopRow}
        ListEmptyComponent={
          stops.length === 0 ? (
            <View style={styles.emptyStopsBox}>
              <Bus size={22} color={colors.textSubtle} />
              <Text style={styles.emptyStopsText}>
                No stops added yet in this sequence.
              </Text>
              <TouchableOpacity style={styles.addFirstStopBtn} onPress={handleAddStop}>
                <Plus size={13} color={colors.accent} />
                <Text style={styles.addFirstStopText}>Add First Stop</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {isBulkOpen && (
        <View style={[styles.bulkModalCard, { width: '100%', marginTop: 12 }]}>
          <View style={styles.bulkModalHeader}>
            <View style={styles.bulkModalIconBox}>
              <ContentPaste size={20} color={isDark ? colors.text : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bulkModalTitle}>Bulk Edit Sequence</Text>
              <Text style={styles.bulkModalSub}>Write one stop per line or separate by commas</Text>
            </View>
            <TouchableOpacity 
              style={styles.bulkModalCloseBtn}
              onPress={() => setIsBulkOpen(false)}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.bulkModalBody}>
            <TextInput
              style={styles.bulkModalInput}
              value={bulkText}
              onChangeText={setBulkText}
              placeholder={"Example:\nKashmere Gate ISBT\nRed Fort\nDelhi Gate\nITO\nPragati Maidan"}
              placeholderTextColor={colors.textSubtle}
              multiline
            />

            <View style={styles.detectedBadge}>
              <View style={styles.detectedDot} />
              <Text style={styles.detectedText}>
                {getDetectedCount(bulkText)} stops detected
              </Text>
            </View>
          </View>

          <View style={styles.bulkModalActions}>
            <TouchableOpacity 
              style={[styles.bulkBtn, styles.bulkBtnSecondary]} 
              onPress={() => setIsBulkOpen(false)}
            >
              <Text style={styles.bulkBtnTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={[styles.bulkBtn, styles.bulkBtnSecondary]} 
                onPress={() => handleBulkImport(true)}
              >
                <Text style={styles.bulkBtnTextSecondary}>Append</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.bulkBtn, styles.bulkBtnPrimary]} 
                onPress={() => handleBulkImport(false)}
              >
                <Text style={styles.bulkBtnTextPrimary}>Overwrite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

let activeRouteSwipeableRow: any = null;

const RouteCard = React.memo(({ item, onEdit, onDelete, colors, styles }: any) => {
  const swipeableRef = useRef<Swipeable>(null);
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

  const handleSwipeableWillOpen = useCallback(() => {
    if (activeRouteSwipeableRow && activeRouteSwipeableRow !== swipeableRef.current) {
      try {
        activeRouteSwipeableRow.close();
      } catch {
        // ignore
      }
    }
    activeRouteSwipeableRow = swipeableRef.current;
  }, []);

  const handleSwipeableClose = useCallback(() => {
    if (activeRouteSwipeableRow === swipeableRef.current) {
      activeRouteSwipeableRow = null;
    }
  }, []);

  const handleSwipeDelete = useCallback(() => {
    swipeableRef.current?.close();
    if (activeRouteSwipeableRow === swipeableRef.current) {
      activeRouteSwipeableRow = null;
    }
    onDelete?.(item.id);
  }, [onDelete, item.id]);

  const renderRightActions = useCallback(
    (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const opacity = dragX.interpolate({
        inputRange: [-80, -40],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      });
      return (
        <Animated.View style={[styles.routeSwipeDeleteAction, { opacity }]}>
          <TouchableOpacity
            style={styles.routeSwipeDeleteBtn}
            onPress={handleSwipeDelete}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Delete route"
          >
            <Trash2 size={20} color={colors.white} />
            <Text style={styles.routeSwipeDeleteText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [styles, colors.white, handleSwipeDelete]
  );

  const upStopsCount = item.directions?.up?.totalStops || item.directions?.up?.stops?.length || 0;
  const downStopsCount = item.directions?.down?.totalStops || item.directions?.down?.stops?.length || 0;
  const isBidirectional = Boolean(upStopsCount > 0 && downStopsCount > 0);
  const intermediateCount = Math.max(0, upStopsCount - 2);

  const originName = item.directions?.up?.from || item.directions?.up?.stops?.[0] || 'Origin Terminal';
  const destName = item.directions?.up?.to || item.directions?.up?.stops?.[item.directions?.up?.stops?.length - 1] || 'Destination Terminal';

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      overshootRight={false}
      onSwipeableWillOpen={handleSwipeableWillOpen}
      onSwipeableClose={handleSwipeableClose}
    >
      <Animated.View style={[styles.routeCardContainer, { transform: [{ scale: pressScale }] }]}>
        <TouchableOpacity
          style={styles.routeCard}
          onPress={() => onEdit(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {/* Top Header Row */}
          <View style={styles.routeCardHeader}>
            <View style={styles.routeHeaderLeft}>
              {/* Route Line Pill */}
              <View style={styles.routePill}>
                <Bus size={13} color={colors.white} />
                <Text style={styles.routeNumberText}>{item.route}</Text>
              </View>

              {/* Way Mode Badge */}
              <View style={[styles.routeModeBadge, isBidirectional ? styles.twoWayBadge : styles.oneWayBadge]}>
                <ArrowRightLeft size={10} color={isBidirectional ? colors.accent : colors.textMuted} />
                <Text style={[styles.routeModeText, { color: isBidirectional ? colors.accent : colors.textMuted }]}>
                  {isBidirectional ? '2-WAY' : '1-WAY'}
                </Text>
              </View>
            </View>

            <View style={styles.routeHeaderRight}>
              <View style={styles.stopsBadge}>
                <Text style={styles.stopsBadgeText}>{upStopsCount} STOPS</Text>
              </View>
              <View style={styles.routeActionCircle}>
                <ChevronRight size={14} color={colors.textMuted} />
              </View>
            </View>
          </View>

          {/* Transit Wayfinding Corridor */}
          <View style={styles.routeCorridor}>
            <View style={styles.corridorTrack}>
              <View style={styles.corridorOriginDot} />
              <View style={styles.corridorLine} />
              <View style={styles.corridorDestDot} />
            </View>

            <View style={styles.corridorStops}>
              {/* Origin Terminal */}
              <View style={styles.corridorStopBlock}>
                <Text style={styles.corridorCaption}>FROM</Text>
                <Text style={styles.corridorStopName} numberOfLines={1}>
                  {originName}
                </Text>
              </View>

              {/* Intermediate via indicator */}
              <View style={styles.corridorViaRow}>
                <Text style={styles.corridorViaText}>
                  {intermediateCount > 0 ? `via ${intermediateCount} intermediate stops` : 'Direct corridor'}
                </Text>
              </View>

              {/* Destination Terminal */}
              <View style={styles.corridorStopBlock}>
                <Text style={styles.corridorCaption}>TO</Text>
                <Text style={[styles.corridorStopName, styles.corridorDestName]} numberOfLines={1}>
                  {destName}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Summary Bar */}
          <View style={styles.routeCardFooter}>
            <View style={styles.dirChipsContainer}>
              <View style={styles.dirMiniChip}>
                <Text style={styles.dirMiniChipLabel}>UP</Text>
                <Text style={styles.dirMiniChipValue}>{upStopsCount} stops</Text>
              </View>
              <View style={styles.dirMiniChip}>
                <Text style={styles.dirMiniChipLabel}>DN</Text>
                <Text style={styles.dirMiniChipValue}>{downStopsCount} stops</Text>
              </View>
            </View>

            <View style={styles.configureLink}>
              <Text style={styles.configureLinkText}>Configure</Text>
              <ChevronRight size={13} color={colors.accent} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
});

export const RoutesManagementScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => (typeof getStyles === 'function' ? getStyles(colors) : ({} as any)), [colors]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const insets = useSafeAreaInsets();
  const [toastVisible, setToastVisible] = useState(false);
  const pendingDeleteRef = useRef<{ id: string; route: any; timer: ReturnType<typeof setTimeout> | null } | null>(null);

  // Form State
  const [routeNumber, setRouteNumber] = useState('');
  const [activeDirection, setActiveDirection] = useState<'up' | 'down'>('up');
  const [upFrom, setUpFrom] = useState('');
  const [upTo, setUpTo] = useState('');
  const [upStops, setUpStops] = useState<string[]>([]);
  const [downFrom, setDownFrom] = useState('');
  const [downTo, setDownTo] = useState('');
  const [downStops, setDownStops] = useState<string[]>([]);

  const fetchRoutes = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('route', { ascending: true });
      if (error) throw error;
      if (data) {
        setRoutes(data);
      }
    } catch (err) {
      if (__DEV__) console.warn('Fetch routes error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
    const channel = supabase
      .channel('public:routes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, () => {
        fetchRoutes();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRoutes]);

  const handleSave = async () => {
    if (!routeNumber.trim()) {
      Alert.alert('Error', 'Route number is required');
      return;
    }

    const upStopList = upStops.map(s => s.trim()).filter(Boolean);
    const downStopList = downStops.map(s => s.trim()).filter(Boolean);
    const payload = {
      id: routeNumber.trim(),
      route: routeNumber.trim(),
      directions: {
        up: { from: upFrom.trim(), to: upTo.trim(), totalStops: upStopList.length, stops: upStopList },
        down: { from: downFrom.trim(), to: downTo.trim(), totalStops: downStopList.length, stops: downStopList },
      },
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('routes').upsert(payload);
      if (error) throw error;
      await logActivity({
        type: 'ADMIN',
        action: editingRoute ? 'ROUTE_UPDATED' : 'ROUTE_CREATED',
        details: `${editingRoute ? 'Modified' : 'Created'} route ${routeNumber.trim()}.`,
        targetId: routeNumber.trim(),
        targetType: 'ROUTE',
      });
      setModalVisible(false);
      resetForm();
      fetchRoutes();
    } catch (error) {
      Alert.alert('Error', 'Could not save route');
    }
  };
  
  const handleImportJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const jsonData = JSON.parse(fileContent);

      // Validate Structure
      if (!jsonData.route || !jsonData.directions) {
        throw new Error("Invalid JSON structure. Missing 'route' or 'directions' fields.");
      }

      setLoading(true);
      const { error } = await supabase.from('routes').upsert({
        id: jsonData.route.trim(),
        route: jsonData.route.trim(),
        directions: jsonData.directions,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      await logActivity({
        type: 'ADMIN',
        action: 'ROUTE_IMPORTED',
        details: `Imported route ${jsonData.route} via JSON.`,
        targetId: jsonData.route,
        targetType: 'ROUTE',
      });

      Alert.alert('Success', `Route ${jsonData.route} imported successfully!`);
      fetchRoutes();
    } catch (error: any) {
      if (__DEV__) console.error(error);
      Alert.alert('Import Failed', error.message || 'Could not parse JSON file.');
    } finally {
      setLoading(false);
    }
  };

  const commitPendingDelete = useCallback(async () => {
    if (!pendingDeleteRef.current) return;
    const { id } = pendingDeleteRef.current;
    pendingDeleteRef.current = null;
    setToastVisible(false);

    try {
      const { error } = await supabase.from('routes').delete().eq('id', id);
      if (error) throw error;
      await logActivity({
        type: 'ADMIN',
        action: 'ROUTE_DELETED',
        details: `Route ${id} was deleted.`,
        targetId: id,
        targetType: 'ROUTE',
      });
    } catch (error) {
      fetchRoutes();
      Alert.alert('Error', 'Deletion failed.');
    }
  }, [fetchRoutes]);

  const handleDeleteRoute = useCallback((id: string) => {
    if (pendingDeleteRef.current) {
      if (pendingDeleteRef.current.timer) clearTimeout(pendingDeleteRef.current.timer);
      commitPendingDelete();
    }

    const routeToDelete = routes.find((r) => r.id === id);
    if (!routeToDelete) return;

    // Optimistically remove from state immediately
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    setToastVisible(true);

    const timer = setTimeout(() => {
      commitPendingDelete();
    }, 4000);

    pendingDeleteRef.current = { id, route: routeToDelete, timer };
  }, [routes, commitPendingDelete]);

  const handleUndo = useCallback(() => {
    if (!pendingDeleteRef.current) return;
    const { route, timer } = pendingDeleteRef.current;
    if (timer) clearTimeout(timer);
    pendingDeleteRef.current = null;
    setToastVisible(false);

    // Restore route back into list
    setRoutes((prev) => [route, ...prev]);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current) {
        if (pendingDeleteRef.current.timer) clearTimeout(pendingDeleteRef.current.timer);
        commitPendingDelete();
      }
    };
  }, [commitPendingDelete]);

  const resetForm = () => {
    setRouteNumber('');
    setUpFrom(''); setUpTo(''); setUpStops([]);
    setDownFrom(''); setDownTo(''); setDownStops([]);
    setEditingRoute(null);
    setActiveDirection('up');
  };

  const startEdit = useCallback((route: any) => {
    setEditingRoute(route);
    setRouteNumber(route.route);
    setUpFrom(route.directions?.up?.from || '');
    setUpTo(route.directions?.up?.to || '');
    setUpStops(route.directions?.up?.stops || []);
    setDownFrom(route.directions?.down?.from || '');
    setDownTo(route.directions?.down?.to || '');
    setDownStops(route.directions?.down?.stops || []);
    setActiveDirection('up');
    setModalVisible(true);
  }, []);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const query = searchQuery.toLowerCase();
    return routes.filter(r => r.route?.toLowerCase().includes(query));
  }, [routes, searchQuery]);

  const getStopCount = (arr: string[]) => arr.filter(s => s.trim().length > 0).length;

  const renderRouteItem = useCallback(
    ({ item }: any) => (
      <RouteCard
        item={item}
        onEdit={startEdit}
        onDelete={handleDeleteRoute}
        colors={colors}
        styles={styles}
      />
    ),
    [startEdit, handleDeleteRoute, colors, styles]
  );

  return (
    <AdminScreen>
      <AdminHeader
        title="Route Hub"
        subtitle={`${filteredRoutes.length} network lines active`}
        action={(
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <IconButton 
              tone="neutral"
              accessibilityLabel="Import JSON" 
              onPress={handleImportJSON}
            >
              <FileJson size={20} color={colors.text} />
            </IconButton>
            <IconButton 
              accessibilityLabel="New route" 
              onPress={() => { resetForm(); setModalVisible(true); }}
            >
              <Plus size={20} color={colors.white} />
            </IconButton>
          </View>
        )}
      />

      <View style={styles.searchBar}>
        <SearchField placeholder="Search by route number or terminal..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <LoadingState label="Loading routes network..." />
      ) : (
        <FlashList
          data={filteredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState 
              icon={<Bus size={30} color={colors.textSubtle} />} 
              title="No Routes Found" 
              message="No route matches your search query. Tap + to add a route." 
            />
          }
        />
      )}

      <AdminBottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingRoute ? `Edit Line ${routeNumber}` : 'Create Line'}
        subtitle={editingRoute ? 'Configure directions & stops sequence' : 'Define route number and sequence of stops'}
        contentStyle={{ paddingHorizontal: 0, flex: 1 }}
        sheetStyle={{ height: '88%' }}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.compactFormScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Route Identifier Section (for new lines) */}
            {!editingRoute ? (
              <View style={styles.compactIdCard}>
                <Text style={styles.compactInputLabel}>ROUTE IDENTIFIER</Text>
                <View style={styles.compactIdInputWrapper}>
                  <View style={styles.compactRouteBadge}>
                    <Bus size={13} color={colors.white} />
                    <Text style={styles.compactRouteBadgeText}>LINE</Text>
                  </View>
                  <TextInput
                    style={styles.compactIdInput}
                    placeholder="e.g. 469, 729, TMS"
                    value={routeNumber}
                    onChangeText={setRouteNumber}
                    placeholderTextColor={colors.textSubtle}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            ) : null}

            {/* Direction Segment Switcher */}
            <View style={styles.directionSegmentBar}>
              <TouchableOpacity
                style={[
                  styles.directionSegmentTab,
                  activeDirection === 'up' && styles.directionSegmentTabActive,
                ]}
                onPress={() => setActiveDirection('up')}
                activeOpacity={0.8}
              >
                <View style={[styles.directionDot, { backgroundColor: '#10B981' }]} />
                <Text
                  style={[
                    styles.directionSegmentTitle,
                    activeDirection === 'up' && styles.directionSegmentTitleActive,
                  ]}
                >
                  Up Journey
                </Text>
                <View
                  style={[
                    styles.directionCountBadge,
                    activeDirection === 'up' && styles.directionCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.directionCountText,
                      activeDirection === 'up' && styles.directionCountTextActive,
                    ]}
                  >
                    {getStopCount(upStops)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.directionSegmentTab,
                  activeDirection === 'down' && styles.directionSegmentTabActive,
                ]}
                onPress={() => setActiveDirection('down')}
                activeOpacity={0.8}
              >
                <View style={[styles.directionDot, { backgroundColor: '#EF4444' }]} />
                <Text
                  style={[
                    styles.directionSegmentTitle,
                    activeDirection === 'down' && styles.directionSegmentTitleActive,
                  ]}
                >
                  Down Journey
                </Text>
                <View
                  style={[
                    styles.directionCountBadge,
                    activeDirection === 'down' && styles.directionCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.directionCountText,
                      activeDirection === 'down' && styles.directionCountTextActive,
                    ]}
                  >
                    {getStopCount(downStops)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Compact Origin-Destination Terminals Card */}
            <View style={styles.terminalsCard}>
              <View style={styles.terminalRow}>
                <View style={[styles.terminalIndicator, { backgroundColor: activeDirection === 'up' ? '#10B981' : '#EF4444' }]} />
                <TextInput
                  style={styles.terminalInput}
                  placeholder={activeDirection === 'up' ? 'Origin Terminal (e.g. Anand Vihar ISBT)' : 'Origin Terminal (e.g. Uttam Nagar)'}
                  value={activeDirection === 'up' ? upFrom : downFrom}
                  onChangeText={activeDirection === 'up' ? setUpFrom : setDownFrom}
                  placeholderTextColor={colors.textSubtle}
                />
              </View>

              <View style={styles.terminalDividerRow}>
                <View style={styles.terminalTrackLine} />
                <TouchableOpacity
                  style={styles.swapTerminalsBtn}
                  onPress={() => {
                    if (activeDirection === 'up') {
                      const tmp = upFrom; setUpFrom(upTo); setUpTo(tmp);
                    } else {
                      const tmp = downFrom; setDownFrom(downTo); setDownTo(tmp);
                    }
                  }}
                  accessibilityLabel="Swap Terminals"
                  activeOpacity={0.7}
                >
                  <ArrowRightLeft size={12} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.terminalRow}>
                <View style={[styles.terminalIndicator, { backgroundColor: colors.error }]} />
                <TextInput
                  style={styles.terminalInput}
                  placeholder={activeDirection === 'up' ? 'Destination Terminal (e.g. Uttam Nagar)' : 'Destination Terminal (e.g. Anand Vihar ISBT)'}
                  value={activeDirection === 'up' ? upTo : downTo}
                  onChangeText={activeDirection === 'up' ? setUpTo : setDownTo}
                  placeholderTextColor={colors.textSubtle}
                />
              </View>
            </View>

            {/* Helper to reverse Up sequence into Down sequence if empty */}
            {activeDirection === 'down' && downStops.length === 0 && upStops.length > 0 && (
              <TouchableOpacity
                style={styles.reverseHelperChip}
                onPress={() => {
                  setDownStops([...upStops].reverse());
                  if (!downFrom && upTo) setDownFrom(upTo);
                  if (!downTo && upFrom) setDownTo(upFrom);
                }}
                activeOpacity={0.8}
              >
                <ArrowRightLeft size={13} color={colors.accent} />
                <Text style={styles.reverseHelperText}>
                  Auto-fill reverse of Up journey ({upStops.length} stops)
                </Text>
              </TouchableOpacity>
            )}

            {/* Stop Sequence Editor */}
            <StopSequenceEditor
              key={activeDirection}
              stops={activeDirection === 'up' ? upStops : downStops}
              onChangeStops={activeDirection === 'up' ? setUpStops : setDownStops}
              styles={styles}
            />
          </ScrollView>

          {/* Sticky Bottom Save Action */}
          <View style={styles.compactSheetFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.88}>
              <LinearGradient colors={[colors.accent, '#3730A3']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveGrad}>
                <Bus size={15} color={colors.white} />
                <Text style={styles.saveText}>Save Configuration</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </AdminBottomSheet>

      {toastVisible && (
        <View style={[styles.undoToast, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.undoToastCopy}>
            <Text style={styles.undoToastMessage}>Route deleted</Text>
          </View>
          <TouchableOpacity onPress={handleUndo} style={styles.undoToastBtn}>
            <Text style={styles.undoToastBtnText}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}
    </AdminScreen>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  searchBar: { paddingHorizontal: 20, paddingTop: 16 },
  list: { padding: 20, paddingBottom: 40 },
  routeCardContainer: {
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.card,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    ...SHADOWS.accent,
  },
  routeNumberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  routeModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  twoWayBadge: {
    backgroundColor: colors.accentSoft,
  },
  oneWayBadge: {
    backgroundColor: colors.surfaceMuted,
  },
  routeModeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  routeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopsBadge: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  stopsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  routeActionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeCorridor: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  corridorTrack: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  corridorOriginDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  corridorLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  corridorDestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  corridorStops: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
    gap: 3,
  },
  corridorStopBlock: {
    gap: 1,
  },
  corridorCaption: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSubtle,
    letterSpacing: 0.8,
  },
  corridorStopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  corridorDestName: {
    color: colors.text,
  },
  corridorViaRow: {
    paddingVertical: 2,
  },
  corridorViaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSubtle,
    fontStyle: 'italic',
  },
  routeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dirChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dirMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dirMiniChipLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.accent,
  },
  dirMiniChipValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  configureLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  configureLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
  },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  sheetSubtitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  closeBtn: { padding: 8, backgroundColor: colors.surfaceMuted, borderRadius: 10 },
  compactFormScroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

  compactIdCard: { marginBottom: 12 },
  compactInputLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  compactIdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    height: 44,
    gap: 8,
  },
  compactRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  compactRouteBadgeText: { fontSize: 11, fontWeight: '900', color: colors.white },
  compactIdInput: { flex: 1, height: 44, fontSize: 14, fontWeight: '700', color: colors.text },

  directionSegmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  directionSegmentTab: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.sm,
  },
  directionSegmentTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.card,
  },
  directionDot: { width: 7, height: 7, borderRadius: 3.5 },
  directionSegmentTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  directionSegmentTitleActive: { color: colors.text, fontWeight: '800' },
  directionCountBadge: {
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  directionCountBadgeActive: {
    backgroundColor: colors.accentSoft,
  },
  directionCountText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  directionCountTextActive: { color: colors.accent },

  terminalsCard: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  terminalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  terminalIndicator: { width: 8, height: 8, borderRadius: 4 },
  terminalInput: { flex: 1, height: 36, fontSize: 13, fontWeight: '700', color: colors.text, paddingVertical: 0 },
  terminalDividerRow: { flexDirection: 'row', alignItems: 'center', height: 16, paddingLeft: 3 },
  terminalTrackLine: { width: 2, height: 16, backgroundColor: colors.border },
  swapTerminalsBtn: {
    marginLeft: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reverseHelperChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  reverseHelperText: { fontSize: 11, fontWeight: '700', color: colors.accent },

  sequenceContainer: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    ...SHADOWS.card,
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sequenceTitleBlock: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sequenceHeading: { fontSize: 11, fontWeight: '900', color: colors.textMuted, letterSpacing: 0.5 },
  sequenceCountLabel: { fontSize: 11, fontWeight: '700', color: colors.textSubtle },
  sequenceHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sequenceActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sequenceActionChipText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  sequenceActionChipTextAccent: { fontSize: 11, fontWeight: '800', color: colors.accent },
  sequenceActionChipDanger: { backgroundColor: colors.errorSoft, borderColor: colors.error + '40' },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: RADIUS.sm,
    height: 42,
    paddingHorizontal: 8,
    marginBottom: 6,
    gap: 6,
  },
  stopBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBadgeText: { fontSize: 10, fontWeight: '900', color: colors.accent },
  stopInput: { flex: 1, height: 40, fontSize: 13, fontWeight: '600', color: colors.text, paddingHorizontal: 4 },
  stopDeleteBtn: { padding: 4, justifyContent: 'center', alignItems: 'center' },
  dragHandle: { paddingHorizontal: 4, paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  dropLine: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 1.5,
    marginVertical: 3,
    width: '100%',
  },
  swipeDeleteBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 6,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error + '44',
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
    gap: 6,
  },
  swipeDeleteText: { color: colors.error, fontSize: 12, fontWeight: '800' },

  emptyStopsBox: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyStopsText: { fontSize: 12, color: colors.textSubtle, fontWeight: '600' },
  addFirstStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  addFirstStopText: { fontSize: 12, fontWeight: '800', color: colors.accent },

  compactSheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  bulkModalCard: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.floating,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulkModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  bulkModalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  bulkModalSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  bulkModalCloseBtn: {
    padding: 6,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
  },
  bulkModalBody: {
    marginBottom: 16,
  },
  bulkModalInput: {
    height: 180,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  detectedBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  detectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  detectedText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
  },
  bulkModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bulkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkBtnPrimary: {
    backgroundColor: colors.accent,
  },
  bulkBtnSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bulkBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  bulkBtnTextSecondary: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },

  sheetFooter: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, paddingBottom: Platform.OS === 'ios' ? 30 : 12 },
  saveBtn: { borderRadius: 10, overflow: 'hidden', ...SHADOWS.card },
  saveGrad: { height: 46, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.white, fontSize: 14, fontWeight: '800' },

  routeSwipeDeleteAction: {
    width: 80,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginLeft: 8,
  },
  routeSwipeDeleteBtn: {
    flex: 1,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  },
  routeSwipeDeleteText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  undoToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#18181B',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.floating,
    elevation: 8,
    zIndex: 9999,
  },
  undoToastCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoToastMessage: {
    color: '#F4F4F5',
    fontSize: 13,
    fontWeight: '600',
  },
  undoToastBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.sm,
  },
  undoToastBtnText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
