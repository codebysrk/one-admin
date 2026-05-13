import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { Plus, Trash2, Bus, X, Search, MapPin, ChevronRight, Edit3, Navigation, Map, Hash, ArrowRightLeft, Info } from 'lucide-react-native';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, ReasonModal, SearchField, AdminBottomSheet } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { LinearGradient } from 'expo-linear-gradient';

export const RoutesManagementScreen = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [reasonModal, setReasonModal] = useState({ visible: false, title: '', type: '', data: null as any });

  // Form State
  const [routeNumber, setRouteNumber] = useState('');
  const [upFrom, setUpFrom] = useState('');
  const [upTo, setUpTo] = useState('');
  const [upStops, setUpStops] = useState('');
  const [downFrom, setDownFrom] = useState('');
  const [downTo, setDownTo] = useState('');
  const [downStops, setDownStops] = useState('');

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

    const upStopList = upStops.split(',').map(s => s.trim()).filter(Boolean);
    const downStopList = downStops.split(',').map(s => s.trim()).filter(Boolean);
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

  const handleConfirmedDelete = async (reason: string) => {
    const id = reasonModal.data;
    try {
      await deleteDoc(doc(db, 'routes', id));
      setReasonModal({ ...reasonModal, visible: false });
    } catch (err) { Alert.alert('Error', 'Deletion failed'); }
  };

  const resetForm = () => {
    setRouteNumber('');
    setUpFrom(''); setUpTo(''); setUpStops('');
    setDownFrom(''); setDownTo(''); setDownStops('');
    setEditingRoute(null);
  };

  const startEdit = (route: any) => {
    setEditingRoute(route);
    setRouteNumber(route.route);
    setUpFrom(route.directions?.up?.from || '');
    setUpTo(route.directions?.up?.to || '');
    setUpStops(route.directions?.up?.stops?.join(', ') || '');
    setDownFrom(route.directions?.down?.from || '');
    setDownTo(route.directions?.down?.to || '');
    setDownStops(route.directions?.down?.stops?.join(', ') || '');
    setModalVisible(true);
  };

  const filteredRoutes = routes.filter(r => r.route?.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStopCount = (str: string) => str.split(',').filter(s => s.trim().length > 0).length;

  const renderRouteItem = ({ item }: any) => (
    <TouchableOpacity style={styles.routeCard} onPress={() => startEdit(item)} activeOpacity={0.82}>
      <View style={styles.cardHeader}>
        <View style={styles.routeIconBox}>
          <Bus size={22} color={COLORS.white} />
        </View>
        <View style={styles.routeMeta}>
          <Text style={styles.routeTitle}>{item.route}</Text>
          <Text style={styles.stopInfo}>{item.directions?.up?.totalStops || 0} stops • 2-way</Text>
        </View>
        <TouchableOpacity onPress={() => setReasonModal({ visible: true, title: `Delete Route ${item.id}`, type: 'DELETE_ROUTE', data: item.id })} style={styles.miniBtn}>
          <Trash2 size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.pathPreview}>
        <View style={styles.pathNode}>
           <MapPin size={12} color={COLORS.success} />
           <Text style={styles.pathText} numberOfLines={1}>{item.directions?.up?.from || 'Origin'}</Text>
        </View>
        <View style={styles.pathConnector} />
        <View style={styles.pathNode}>
           <MapPin size={12} color={COLORS.error} />
           <Text style={styles.pathText} numberOfLines={1}>{item.directions?.up?.to || 'Dest'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <Text style={styles.footerInfo}>Tap to configure network</Text>
         <ChevronRight size={14} color={COLORS.accent} />
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminScreen>
      <AdminHeader
        title="Route Hub"
        subtitle={`${filteredRoutes.length} network lines active`}
        action={(
          <IconButton accessibilityLabel="New route" onPress={() => { resetForm(); setModalVisible(true); }}>
            <Plus size={20} color={COLORS.white} />
          </IconButton>
        )}
      />

      <View style={styles.searchBar}>
        <SearchField placeholder="Find a route line..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <LoadingState label="Analyzing network..." />
      ) : (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon={<Bus size={30} color={COLORS.textSubtle} />} title="No routes found" message="Try a different route number or create one." />}
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
                      <Hash size={18} color={COLORS.accent} />
                      <TextInput 
                        style={styles.idInput} 
                        placeholder="Route Number (e.g. 469)" 
                        value={routeNumber} 
                        onChangeText={setRouteNumber} 
                        editable={!editingRoute} 
                        placeholderTextColor={COLORS.textSubtle}
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
                         <MapPin size={14} color={COLORS.error} />
                      </View>
                      <View style={styles.journeyInputs}>
                         <TextInput style={styles.inlineInput} placeholder="Origin Stop" value={upFrom} onChangeText={setUpFrom} placeholderTextColor={COLORS.textSubtle} />
                         <View style={styles.divider} />
                         <TextInput style={styles.inlineInput} placeholder="Destination Stop" value={upTo} onChangeText={setUpTo} placeholderTextColor={COLORS.textSubtle} />
                      </View>
                   </View>

                   <View style={styles.stopsSection}>
                      <View style={styles.stopsHeader}>
                         <Map size={14} color={COLORS.textMuted} />
                         <Text style={styles.stopsLabel}>STOP SEQUENCE</Text>
                      </View>
                      <TextInput 
                        style={styles.stopsArea} 
                        placeholder="Type stop names separated by commas..." 
                        value={upStops} 
                        onChangeText={setUpStops} 
                        multiline 
                        placeholderTextColor={COLORS.textSubtle}
                      />
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
                         <MapPin size={14} color={COLORS.error} />
                      </View>
                      <View style={styles.journeyInputs}>
                         <TextInput style={styles.inlineInput} placeholder="Origin Stop" value={downFrom} onChangeText={setDownFrom} placeholderTextColor={COLORS.textSubtle} />
                         <View style={styles.divider} />
                         <TextInput style={styles.inlineInput} placeholder="Destination Stop" value={downTo} onChangeText={setDownTo} placeholderTextColor={COLORS.textSubtle} />
                      </View>
                   </View>

                   <View style={styles.stopsSection}>
                      <View style={styles.stopsHeader}>
                         <Map size={14} color={COLORS.textMuted} />
                         <Text style={styles.stopsLabel}>STOP SEQUENCE</Text>
                      </View>
                      <TextInput 
                        style={styles.stopsArea} 
                        placeholder="Type stop names separated by commas..." 
                        value={downStops} 
                        onChangeText={setDownStops} 
                        multiline 
                        placeholderTextColor={COLORS.textSubtle}
                      />
                   </View>
                </View>
          </KeyboardAvoidingView>
        </ScrollView>

        <View style={styles.sheetFooter}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
             <LinearGradient colors={[COLORS.accent, '#3730A3']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.saveGrad}>
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
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchBar: { paddingHorizontal: 20, paddingTop: 16 },
  list: { padding: 20, paddingBottom: 40 },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', ...SHADOWS.accent },
  routeMeta: { flex: 1, marginLeft: 14 },
  routeTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  stopInfo: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  miniBtn: { padding: 8, backgroundColor: COLORS.errorSoft, borderRadius: 8 },
  pathPreview: { backgroundColor: COLORS.surfaceMuted, padding: 12, borderRadius: 12, marginBottom: 16 },
  pathNode: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pathText: { fontSize: 12, fontWeight: '700', color: COLORS.text, flex: 1 },
  pathConnector: { width: 1, height: 8, backgroundColor: COLORS.border, marginLeft: 5, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  footerInfo: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)' },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  sheetSubtitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 },
  closeBtn: { padding: 8, backgroundColor: COLORS.surfaceMuted, borderRadius: 10 },
  formScroll: { padding: 20, paddingBottom: 30 },

  idSection: { marginBottom: 16 },
  idInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 16, gap: 12 },
  idInput: { flex: 1, height: 50, fontSize: 16, fontWeight: '800', color: COLORS.text },
  hint: { fontSize: 11, color: COLORS.textSubtle, marginTop: 4, fontWeight: '600', marginLeft: 4 },

  segmentCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  segmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  segmentIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  segmentTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  segmentSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  countBadge: { backgroundColor: COLORS.surfaceMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  countText: { fontSize: 12, fontWeight: '900', color: COLORS.primary },

  journeyBox: { flexDirection: 'row', backgroundColor: COLORS.surfaceMuted, borderRadius: 16, padding: 12, marginBottom: 16 },
  journeyIcons: { alignItems: 'center', paddingVertical: 10, paddingRight: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  line: { width: 1.5, flex: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  journeyInputs: { flex: 1, gap: 4 },
  inlineInput: { height: 40, fontSize: 14, fontWeight: '700', color: COLORS.text, paddingHorizontal: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  stopsSection: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  stopsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  stopsLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5 },
  stopsArea: { height: 90, fontSize: 13, fontWeight: '700', color: COLORS.text, lineHeight: 20, textAlignVertical: 'top' },

  sheetFooter: { padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surface, paddingBottom: Platform.OS === 'ios' ? 30 : 12 },
  saveBtn: { borderRadius: 10, overflow: 'hidden', ...SHADOWS.card },
  saveGrad: { height: 46, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
});
