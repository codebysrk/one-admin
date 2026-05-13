import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { ArrowLeft, Plus, Trash2, Bus, X } from 'lucide-react-native';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState } from '../../components/AdminUI';
import { useAdminStore } from '../../store/useAdminStore';

export const RoutesManagementScreen = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);

  const [routeNumber, setRouteNumber] = useState('');
  const [upFrom, setUpFrom] = useState('');
  const [upTo, setUpTo] = useState('');
  const [upStops, setUpStops] = useState('');
  const [downFrom, setDownFrom] = useState('');
  const [downTo, setDownTo] = useState('');
  const [downStops, setDownStops] = useState('');
  const setActiveTab = useAdminStore((state) => state.setActiveTab);

  useEffect(() => {
    const q = query(collection(db, 'routes'), orderBy('route', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
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
        up: {
          from: upFrom.trim(),
          to: upTo.trim(),
          totalStops: upStopList.length,
          stops: upStopList,
        },
        down: {
          from: downFrom.trim(),
          to: downTo.trim(),
          totalStops: downStopList.length,
          stops: downStopList,
        },
      },
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, 'routes', routeNumber.trim()), payload);
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Could not save route');
    }
  };

  const resetForm = () => {
    setRouteNumber('');
    setUpFrom('');
    setUpTo('');
    setUpStops('');
    setDownFrom('');
    setDownTo('');
    setDownStops('');
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

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'routes', id)) },
      ]
    );
  };

  const renderRouteItem = ({ item }: any) => (
    <TouchableOpacity style={styles.routeCard} onPress={() => startEdit(item)} activeOpacity={0.82}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <View style={styles.iconBox}>
            <Bus size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.routeTitle} numberOfLines={1}>Route {item.route}</Text>
        </View>
        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn} activeOpacity={0.82}>
          <Trash2 size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      <View style={styles.routeDetails}>
        <Text style={styles.directionLabel} numberOfLines={1}>UP: {item.directions?.up?.from} {'->'} {item.directions?.up?.to}</Text>
        <Text style={styles.stopCount}>{item.directions?.up?.totalStops || 0} stops</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminScreen>
      <AdminHeader
        title="Route Management"
        subtitle={`${routes.length} editable routes`}
        action={(
          <IconButton
            accessibilityLabel="Create route"
            onPress={() => { resetForm(); setModalVisible(true); }}
          >
            <Plus size={20} color={COLORS.white} />
          </IconButton>
        )}
      />

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.backChip} onPress={() => setActiveTab('Routes')} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel="Back to route network">
          <ArrowLeft size={15} color={COLORS.accent} />
          <Text style={styles.backChipText}>Route Network</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState label="Loading routes..." />
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Bus size={30} color={COLORS.textSubtle} />} title="No routes yet" message="Create a route to configure stops and directions." />}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingRoute ? 'Edit Route' : 'New Route'}</Text>
                <Text style={styles.modalSubtitle}>Configure both travel directions.</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn} accessibilityLabel="Close route form">
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} contentContainerStyle={styles.formInner} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Route Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 469"
                placeholderTextColor={COLORS.textSubtle}
                value={routeNumber}
                onChangeText={setRouteNumber}
                editable={!editingRoute}
                selectionColor={COLORS.accent}
              />

              <View style={styles.directionSection}>
                <Text style={styles.sectionTitle}>Up Direction</Text>
                <TextInput style={styles.input} placeholder="From origin" placeholderTextColor={COLORS.textSubtle} value={upFrom} onChangeText={setUpFrom} selectionColor={COLORS.accent} />
                <TextInput style={styles.input} placeholder="To destination" placeholderTextColor={COLORS.textSubtle} value={upTo} onChangeText={setUpTo} selectionColor={COLORS.accent} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Stops, comma separated"
                  placeholderTextColor={COLORS.textSubtle}
                  value={upStops}
                  onChangeText={setUpStops}
                  multiline
                  textAlignVertical="top"
                  selectionColor={COLORS.accent}
                />
              </View>

              <View style={styles.directionSection}>
                <Text style={styles.sectionTitle}>Down Direction</Text>
                <TextInput style={styles.input} placeholder="From origin" placeholderTextColor={COLORS.textSubtle} value={downFrom} onChangeText={setDownFrom} selectionColor={COLORS.accent} />
                <TextInput style={styles.input} placeholder="To destination" placeholderTextColor={COLORS.textSubtle} value={downTo} onChangeText={setDownTo} selectionColor={COLORS.accent} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Stops, comma separated"
                  placeholderTextColor={COLORS.textSubtle}
                  value={downStops}
                  onChangeText={setDownStops}
                  multiline
                  textAlignVertical="top"
                  selectionColor={COLORS.accent}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.86}>
                <Text style={styles.saveBtnText}>Save Route</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  toolbar: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  backChip: { alignSelf: 'flex-start', minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, borderRadius: RADIUS.pill, backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accentMuted },
  backChipText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  routeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.errorSoft, alignItems: 'center', justifyContent: 'center' },
  routeTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, flex: 1 },
  routeDetails: { borderTopWidth: 1, borderTopColor: COLORS.surfaceMuted, paddingTop: 12 },
  directionLabel: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  stopCount: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalKeyboard: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  modalTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: COLORS.text },
  modalSubtitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 3 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceMuted },
  form: { flex: 1 },
  formInner: { padding: SPACING.xl, paddingBottom: 44 },
  label: { fontSize: 11, fontWeight: '800', marginBottom: 8, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0 },
  input: { minHeight: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14, fontSize: 14, color: COLORS.text, fontWeight: '600', backgroundColor: COLORS.surface },
  textArea: { height: 92, lineHeight: 20 },
  directionSection: { marginBottom: SPACING.xl, padding: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12, color: COLORS.primary },
  saveBtn: { backgroundColor: COLORS.accent, minHeight: 54, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', ...SHADOWS.accent },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});
