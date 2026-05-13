import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../core/theme';
import { Plus, Trash2, Bus } from 'lucide-react-native';

export const RoutesListScreen = () => {
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
    if (!routeNumber) {
      Alert.alert("Error", "Route number is required");
      return;
    }
    const payload = {
      route: routeNumber,
      directions: {
        up: {
          from: upFrom, to: upTo,
          totalStops: upStops.split(',').length,
          stops: upStops.split(',').map(s => s.trim()).filter(Boolean)
        },
        down: {
          from: downFrom, to: downTo,
          totalStops: downStops.split(',').length,
          stops: downStops.split(',').map(s => s.trim()).filter(Boolean)
        }
      },
      updatedAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'routes', routeNumber), payload);
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert("Error", "Could not save route");
    }
  };

  const resetForm = () => {
    setRouteNumber(''); setUpFrom(''); setUpTo(''); setUpStops('');
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

  const confirmDelete = (id: string) => {
    Alert.alert("Delete Route", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDoc(doc(db, 'routes', id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Route Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Plus size={20} color="white" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} /> : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.routeCard} onPress={() => startEdit(item)}>
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <Bus size={20} color={COLORS.primary} />
                  <Text style={styles.routeTitle}>Route {item.route}</Text>
                </View>
                <TouchableOpacity onPress={() => confirmDelete(item.id)}><Trash2 size={18} color="#EF4444" /></TouchableOpacity>
              </View>
              <Text style={styles.directionLabel}>{item.directions?.up?.from} → {item.directions?.up?.to}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.form}>
          <Text style={styles.modalTitle}>{editingRoute ? 'Edit' : 'New'} Route</Text>
          <TextInput style={styles.input} placeholder="Route Number" value={routeNumber} onChangeText={setRouteNumber} editable={!editingRoute} />
          <Text style={styles.sectionTitle}>UP</Text>
          <TextInput style={styles.input} placeholder="From" value={upFrom} onChangeText={setUpFrom} />
          <TextInput style={styles.input} placeholder="To" value={upTo} onChangeText={setUpTo} />
          <TextInput style={[styles.input, { height: 80 }]} placeholder="Stops (csv)" value={upStops} onChangeText={setUpStops} multiline />
          <Text style={styles.sectionTitle}>DOWN</Text>
          <TextInput style={styles.input} placeholder="From" value={downFrom} onChangeText={setDownFrom} />
          <TextInput style={styles.input} placeholder="To" value={downTo} onChangeText={setDownTo} />
          <TextInput style={[styles.input, { height: 80 }]} placeholder="Stops (csv)" value={downStops} onChangeText={setDownStops} multiline />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  addBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  listContent: { padding: 16 },
  routeCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  directionLabel: { fontSize: 13, color: COLORS.textMuted },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  form: { padding: 20 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, marginBottom: 12 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8, color: COLORS.primary },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { padding: 16, alignItems: 'center' }
});
