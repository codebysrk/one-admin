import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../core/theme';
import { MapPin, Plus, Trash2, ChevronRight, Bus } from 'lucide-react-native';

export const RoutesManagementScreen = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);

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
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
          from: upFrom,
          to: upTo,
          totalStops: upStops.split(',').length,
          stops: upStops.split(',').map(s => s.trim()).filter(Boolean)
        },
        down: {
          from: downFrom,
          to: downTo,
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

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this route?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteDoc(doc(db, 'routes', id)) }
      ]
    );
  };

  const renderRouteItem = ({ item }: any) => (
    <TouchableOpacity style={styles.routeCard} onPress={() => startEdit(item)}>
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <View style={styles.iconBox}>
            <Bus size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.routeTitle}>Route {item.route}</Text>
        </View>
        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.routeDetails}>
        <Text style={styles.directionLabel}>UP: {item.directions?.up?.from} → {item.directions?.up?.to}</Text>
        <Text style={styles.stopCount}>{item.directions?.up?.totalStops} stops</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Route Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Plus size={20} color="white" />
          <Text style={styles.addBtnText}>New Route</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingRoute ? 'Edit Route' : 'New Route'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.form}>
            <Text style={styles.label}>Route Number</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 469" 
              value={routeNumber} 
              onChangeText={setRouteNumber} 
              editable={!editingRoute}
            />

            <View style={styles.directionSection}>
              <Text style={styles.sectionTitle}>UP Direction</Text>
              <TextInput style={styles.input} placeholder="From (Origin)" value={upFrom} onChangeText={setUpFrom} />
              <TextInput style={styles.input} placeholder="To (Destination)" value={upTo} onChangeText={setUpTo} />
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="Stops (comma separated)" 
                value={upStops} 
                onChangeText={setUpStops} 
                multiline 
              />
            </View>

            <View style={styles.directionSection}>
              <Text style={styles.sectionTitle}>DOWN Direction</Text>
              <TextInput style={styles.input} placeholder="From (Origin)" value={downFrom} onChangeText={setDownFrom} />
              <TextInput style={styles.input} placeholder="To (Destination)" value={downTo} onChangeText={setDownTo} />
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                placeholder="Stops (comma separated)" 
                value={downStops} 
                onChangeText={setDownStops} 
                multiline 
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Route</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    padding: 24, 
    backgroundColor: 'white', 
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  addBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  listContent: { padding: 16 },
  routeCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  routeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  routeDetails: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  directionLabel: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  stopCount: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  cancelText: { color: '#EF4444' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#475569' },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
  directionSection: { marginBottom: 24, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: COLORS.primary },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
