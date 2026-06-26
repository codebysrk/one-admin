import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Plus = IconWrapper('plus');
const Trash2 = IconWrapper('trash-can-outline');
const Bus = IconWrapper('bus');
const X = IconWrapper('close');
const MapPin = IconWrapper('map-marker');
const ChevronRight = IconWrapper('chevron-right');
const Navigation = IconWrapper('navigation');
const Map = IconWrapper('map-outline');
const Hash = IconWrapper('pound');
const ArrowRightLeft = IconWrapper('swap-horizontal');
const FileJson = IconWrapper('file-document-outline');
const ContentPaste = IconWrapper('content-paste');
const DragIcon = IconWrapper('drag-vertical');

import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, ReasonModal, SearchField, AdminBottomSheet, ConfirmationModal } from '../../components/AdminUI';
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
  onLayout: (y: number, height: number) => void;
  onDragStart: (index: number) => void;
  onDragMove: (index: number, dy: number) => void;
  onDragEnd: (index: number, dy: number) => void;
  onChangeText: (text: string) => void;
  onDelete: () => void;
  dragY: Animated.Value;
}

const DraggableStopRow = ({
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
}: DraggableStopRowProps) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;

  const translateX = useRef(new Animated.Value(0)).current;

  // Use propsRef to avoid stale closures in PanResponder callbacks
  const propsRef = useRef({ onDragStart, onDragMove, onDragEnd, onDelete, index, isAnyDragging });
  propsRef.current = { onDragStart, onDragMove, onDragEnd, onDelete, index, isAnyDragging };

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
            propsRef.current.onDelete();
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
        onLayout(y, height);
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
          onChangeText={onChangeText}
          placeholder={`Stop #${index + 1}`}
          placeholderTextColor={colors.textSubtle}
        />

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
};

interface StopSequenceEditorProps {
  stops: string[];
  onChangeStops: (stops: string[]) => void;
}

const StopSequenceEditor = ({ stops, onChangeStops }: StopSequenceEditorProps) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
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

  const handleDragStart = (index: number) => {
    setActiveDragIndex(index);
    setTargetDropIndex(index);
    activeDragIndexRef.current = index;
    targetDropIndexRef.current = index;
    dragY.setValue(0);
  };

  const handleDragMove = (index: number, dy: number) => {
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
  };

  const handleDragEnd = (index: number, dy: number) => {
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
  };

  const handleDelete = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index);
    onChangeStops(newStops);
  };

  const handleTextChange = (text: string, index: number) => {
    const newStops = [...stops];
    newStops[index] = text;
    onChangeStops(newStops);
  };

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

  return (
    <View style={{ width: '100%' }}>
      {stops.map((stop, index) => {
        const isDragging = activeDragIndex === index;
        const showLineAbove = activeDragIndex !== null && targetDropIndex === index && index < activeDragIndex;
        const showLineBelow = activeDragIndex !== null && targetDropIndex === index && index > activeDragIndex;

        return (
          <DraggableStopRow
            key={index}
            stop={stop}
            index={index}
            isDragging={isDragging}
            isAnyDragging={activeDragIndex !== null}
            showLineAbove={showLineAbove}
            showLineBelow={showLineBelow}
            dragY={dragY}
            onLayout={(y, height) => {
              rowLayouts.current[index] = { y, height };
            }}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onChangeText={(text) => handleTextChange(text, index)}
            onDelete={() => handleDelete(index)}
          />
        );
      })}

      {stops.length === 0 && (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.textSubtle, fontStyle: 'italic' }}>
            No stops in this sequence yet.
          </Text>
        </View>
      )}

      <View style={styles.editorFooter}>
        <TouchableOpacity style={styles.addStopBtn} onPress={handleAddStop}>
          <Plus size={14} color={colors.accent} />
          <Text style={styles.addStopBtnText}>Add Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bulkImportToggleBtn} 
          onPress={() => {
            setBulkText(stops.join('\n'));
            setIsBulkOpen(true);
          }}
        >
          <ContentPaste size={14} color={colors.textMuted} />
          <Text style={styles.bulkImportToggleBtnText}>Bulk Edit</Text>
        </TouchableOpacity>

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
          disabled={stops.length === 0}
          style={[styles.clearAllBtn, stops.length === 0 && { opacity: 0.5 }]}
        >
          <X size={14} color={colors.error} />
          <Text style={styles.clearAllBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isBulkOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBulkOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bulkModalCard}>
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
                placeholder={"Example:\nStop A\nStop B\nStop C"}
                placeholderTextColor={colors.textSubtle}
                multiline
                autoFocus
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
        </View>
      </Modal>
    </View>
  );
};

export const RoutesManagementScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ visible: false, routeId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [reasonModal, setReasonModal] = useState({ visible: false, title: '', type: '', data: null as any });

  // Form State
  const [routeNumber, setRouteNumber] = useState('');
  const [upFrom, setUpFrom] = useState('');
  const [upTo, setUpTo] = useState('');
  const [upStops, setUpStops] = useState<string[]>([]);
  const [downFrom, setDownFrom] = useState('');
  const [downTo, setDownTo] = useState('');
  const [downStops, setDownStops] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'routes'), orderBy('route', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!routeNumber.trim()) {
      Alert.alert('Error', 'Route number is required');
      return;
    }

    const upStopList = upStops.map(s => s.trim()).filter(Boolean);
    const downStopList = downStops.map(s => s.trim()).filter(Boolean);
    const payload = {
      route: routeNumber.trim(),
      directions: {
        up: { from: upFrom.trim(), to: upTo.trim(), totalStops: upStopList.length, stops: upStopList },
        down: { from: downFrom.trim(), to: downTo.trim(), totalStops: downStopList.length, stops: downStopList },
      },
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, 'routes', routeNumber.trim()), payload);
      await logActivity({
        type: 'ADMIN',
        action: editingRoute ? 'ROUTE_UPDATED' : 'ROUTE_CREATED',
        details: `${editingRoute ? 'Modified' : 'Created'} route ${routeNumber.trim()}.`,
        targetId: routeNumber.trim(),
        targetType: 'ROUTE',
      });
      setModalVisible(false);
      resetForm();
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
      await setDoc(doc(db, 'routes', jsonData.route.trim()), {
        ...jsonData,
        updatedAt: Date.now(),
      });

      await logActivity({
        type: 'ADMIN',
        action: 'ROUTE_IMPORTED',
        details: `Imported route ${jsonData.route} via JSON.`,
        targetId: jsonData.route,
        targetType: 'ROUTE',
      });

      Alert.alert('Success', `Route ${jsonData.route} imported successfully!`);
    } catch (error: any) {
      if (__DEV__) console.error(error);
      Alert.alert('Import Failed', error.message || 'Could not parse JSON file.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedDelete = async (reason: string) => {
    const id = reasonModal.data;
    try {
      await deleteDoc(doc(db, 'routes', id));
      setReasonModal({ ...reasonModal, visible: false });
    } catch (err) { Alert.alert('Error', 'Deletion failed'); }
  };

  const resetForm = () => {
    setRouteNumber('');
    setUpFrom(''); setUpTo(''); setUpStops([]);
    setDownFrom(''); setDownTo(''); setDownStops([]);
    setEditingRoute(null);
  };

  const startEdit = (route: any) => {
    setEditingRoute(route);
    setRouteNumber(route.route);
    setUpFrom(route.directions?.up?.from || '');
    setUpTo(route.directions?.up?.to || '');
    setUpStops(route.directions?.up?.stops || []);
    setDownFrom(route.directions?.down?.from || '');
    setDownTo(route.directions?.down?.to || '');
    setDownStops(route.directions?.down?.stops || []);
    setModalVisible(true);
  };

  const filteredRoutes = routes.filter(r => r.route?.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStopCount = (arr: string[]) => arr.filter(s => s.trim().length > 0).length;

  const renderRouteItem = ({ item }: any) => (
    <TouchableOpacity style={styles.routeCard} onPress={() => startEdit(item)} activeOpacity={0.82}>
      <View style={styles.cardHeader}>
        <View style={styles.routeIconBox}>
          <Bus size={22} color={colors.white} />
        </View>
        <View style={styles.routeMeta}>
          <Text style={styles.routeTitle}>{item.route}</Text>
          <Text style={styles.stopInfo}>{item.directions?.up?.totalStops || 0} stops • 2-way</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setConfirmModal({ visible: true, routeId: item.id })} 
          style={styles.miniBtn}
        >
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.pathPreview}>
        <View style={styles.pathNode}>
           <MapPin size={12} color={colors.success} />
           <Text style={styles.pathText} numberOfLines={1}>{item.directions?.up?.from || 'Origin'}</Text>
        </View>
        <View style={styles.pathConnector} />
        <View style={styles.pathNode}>
           <MapPin size={12} color={colors.error} />
           <Text style={styles.pathText} numberOfLines={1}>{item.directions?.up?.to || 'Dest'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <Text style={styles.footerInfo}>Tap to configure network</Text>
         <ChevronRight size={14} color={colors.accent} />
      </View>
    </TouchableOpacity>
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
        <SearchField placeholder="Find a route line..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <LoadingState label="Analyzing network..." />
      ) : (
        <FlashList
          data={filteredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon={<Bus size={30} color={colors.textSubtle} />} title="No routes found" message="Try a different route number or create one." />}
        />
      )}

      <AdminBottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingRoute ? 'Edit Line' : 'Create Line'}
        subtitle="Configure your transit network"
        contentStyle={{ paddingHorizontal: 0 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.idSection}>
                   <View style={styles.idInputBox}>
                      <Hash size={18} color={colors.accent} />
                      <TextInput 
                        style={styles.idInput} 
                        placeholder="Route Number (e.g. 469)" 
                        value={routeNumber} 
                        onChangeText={setRouteNumber} 
                        editable={!editingRoute} 
                        placeholderTextColor={colors.textSubtle}
                      />
                   </View>
                   <Text style={styles.hint}>This is the unique identifier for this route.</Text>
                </View>

                {/* UP DIRECTION */}
                <View style={styles.segmentCard}>
                   <View style={styles.segmentHeader}>
                      <LinearGradient colors={['#10B981', '#059669']} style={styles.segmentIcon}>
                         <Navigation size={14} color="white" />
                      </LinearGradient>
                      <View style={{flex:1}}>
                         <Text style={styles.segmentTitle}>UP JOURNEY</Text>
                         <Text style={styles.segmentSub}>{getStopCount(upStops)} Stops Configured</Text>
                      </View>
                      <View style={styles.countBadge}><Text style={styles.countText}>{getStopCount(upStops)}</Text></View>
                   </View>

                   <View style={styles.journeyBox}>
                      <View style={styles.journeyIcons}>
                         <View style={styles.dot} />
                         <View style={styles.line} />
                         <MapPin size={14} color={colors.error} />
                      </View>
                      <View style={styles.journeyInputs}>
                         <TextInput style={styles.inlineInput} placeholder="Origin Stop" value={upFrom} onChangeText={setUpFrom} placeholderTextColor={colors.textSubtle} />
                         <View style={styles.divider} />
                         <TextInput style={styles.inlineInput} placeholder="Destination Stop" value={upTo} onChangeText={setUpTo} placeholderTextColor={colors.textSubtle} />
                      </View>
                   </View>

                   <View style={styles.stopsSection}>
                      <View style={styles.stopsHeader}>
                         <Map size={14} color={colors.textMuted} />
                         <Text style={styles.stopsLabel}>STOP SEQUENCE</Text>
                      </View>
                      <StopSequenceEditor stops={upStops} onChangeStops={setUpStops} />
                   </View>
                </View>

                {/* DOWN DIRECTION */}
                <View style={[styles.segmentCard, { marginTop: 12 }]}>
                   <View style={styles.segmentHeader}>
                      <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.segmentIcon}>
                         <ArrowRightLeft size={14} color="white" />
                      </LinearGradient>
                      <View style={{flex:1}}>
                         <Text style={styles.segmentTitle}>DOWN JOURNEY</Text>
                         <Text style={styles.segmentSub}>{getStopCount(downStops)} Stops Configured</Text>
                      </View>
                      <View style={styles.countBadge}><Text style={styles.countText}>{getStopCount(downStops)}</Text></View>
                   </View>

                   <View style={styles.journeyBox}>
                      <View style={styles.journeyIcons}>
                         <View style={styles.dot} />
                         <View style={styles.line} />
                         <MapPin size={14} color={colors.error} />
                      </View>
                      <View style={styles.journeyInputs}>
                         <TextInput style={styles.inlineInput} placeholder="Origin Stop" value={downFrom} onChangeText={setDownFrom} placeholderTextColor={colors.textSubtle} />
                         <View style={styles.divider} />
                         <TextInput style={styles.inlineInput} placeholder="Destination Stop" value={downTo} onChangeText={setDownTo} placeholderTextColor={colors.textSubtle} />
                      </View>
                   </View>

                   <View style={styles.stopsSection}>
                      <View style={styles.stopsHeader}>
                         <Map size={14} color={colors.textMuted} />
                         <Text style={styles.stopsLabel}>STOP SEQUENCE</Text>
                      </View>
                      <StopSequenceEditor stops={downStops} onChangeStops={setDownStops} />
                   </View>
                </View>
          </KeyboardAvoidingView>
        </ScrollView>

        <View style={styles.sheetFooter}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
             <LinearGradient colors={[colors.accent, '#3730A3']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveGrad}>
                <Text style={styles.saveText}>Save Configuration</Text>
             </LinearGradient>
          </TouchableOpacity>
        </View>
      </AdminBottomSheet>

      <ReasonModal
        visible={reasonModal.visible}
        onClose={() => setReasonModal({ ...reasonModal, visible: false })}
        title={reasonModal.title}
        onSubmit={handleConfirmedDelete}
      />

      <ConfirmationModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, routeId: '' })}
        onConfirm={() => {
          const id = confirmModal.routeId;
          setConfirmModal({ visible: false, routeId: '' });
          setReasonModal({ visible: true, title: `Delete Route ${id}`, type: 'DELETE_ROUTE', data: id });
        }}
        title="Delete Bus Line?"
        message={`This will permanently remove Route ${confirmModal.routeId} and all its stop configurations from the network.`}
      />
    </AdminScreen>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  searchBar: { paddingHorizontal: 20, paddingTop: 16 },
  list: { padding: 20, paddingBottom: 40 },
  routeCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', ...SHADOWS.accent },
  routeMeta: { flex: 1, marginLeft: 14 },
  routeTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  stopInfo: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  miniBtn: { padding: 8, backgroundColor: colors.errorSoft, borderRadius: 8 },
  pathPreview: { backgroundColor: colors.surfaceMuted, padding: 12, borderRadius: 12, marginBottom: 16 },
  pathNode: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pathText: { fontSize: 12, fontWeight: '700', color: colors.text, flex: 1 },
  pathConnector: { width: 1, height: 8, backgroundColor: colors.border, marginLeft: 5, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  footerInfo: { fontSize: 11, fontWeight: '700', color: colors.accent },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  sheetSubtitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 4 },
  closeBtn: { padding: 8, backgroundColor: colors.surfaceMuted, borderRadius: 10 },
  formScroll: { padding: 20, paddingBottom: 30 },

  idSection: { marginBottom: 16 },
  idInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, gap: 12 },
  idInput: { flex: 1, height: 50, fontSize: 16, fontWeight: '800', color: colors.text },
  hint: { fontSize: 11, color: colors.textSubtle, marginTop: 4, fontWeight: '600', marginLeft: 4 },

  segmentCard: { backgroundColor: colors.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, ...SHADOWS.card },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  segmentIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  segmentTitle: { fontSize: 13, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  segmentSub: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  countBadge: { backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  countText: { fontSize: 12, fontWeight: '900', color: colors.background === '#000000' ? colors.text : colors.primary },

  journeyBox: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: 12, marginBottom: 16 },
  journeyIcons: { alignItems: 'center', paddingVertical: 10, paddingRight: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  line: { width: 1.5, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  journeyInputs: { flex: 1, gap: 4 },
  inlineInput: { height: 40, fontSize: 14, fontWeight: '700', color: colors.text, paddingHorizontal: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },

  stopsSection: { backgroundColor: colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border },
  stopsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  stopsLabel: { fontSize: 10, fontWeight: '900', color: colors.textMuted, letterSpacing: 0.5 },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 8,
  },
  stopBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  stopBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
  },
  stopInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 4,
  },
  dragHandle: {
    paddingHorizontal: 6,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropLine: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginVertical: 4,
    width: '100%',
  },
  swipeDeleteBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 8,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
    gap: 6,
  },
  swipeDeleteText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '800',
  },
  editorFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  addStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    flex: 1,
    minWidth: 120,
  },
  addStopBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
  },
  bulkImportToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  bulkImportToggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: colors.errorSoft,
  },
  clearAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
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
});
