import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../core/theme';
import { Bell, Plus, Trash2, Megaphone, Info, AlertTriangle, Bus } from 'lucide-react-native';

const NOTIFICATION_TYPES = [
  { id: 'general', label: 'General', icon: <Bell size={18} color="#6B7280" /> },
  { id: 'alert', label: 'Alert', icon: <AlertTriangle size={18} color="#EF4444" /> },
  { id: 'info', label: 'Info', icon: <Info size={18} color="#3B82F6" /> },
  { id: 'bus', label: 'Bus', icon: <Bus size={18} color="#10B981" /> },
  { id: 'announcement', label: 'Promo', icon: <Megaphone size={18} color="#F59E0B" /> },
];

export const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!title || !message) return Alert.alert("Error", "Required fields empty");
    try {
      await addDoc(collection(db, 'notifications'), { title, message, type, timestamp: Date.now() });
      setModalVisible(false); setTitle(''); setMessage(''); setType('general');
    } catch (error) { Alert.alert("Error", "Failed to send"); }
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete", "Remove for all?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDoc(doc(db, 'notifications', id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}><Plus size={20} color="white" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} /> : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.notifCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <TouchableOpacity onPress={() => confirmDelete(item.id)}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
              </View>
              <Text style={styles.notifMessage}>{item.message}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
            <TextInput style={[styles.input, { height: 80 }]} value={message} onChangeText={setMessage} placeholder="Message" multiline />
            <View style={styles.typeSelector}>
              {NOTIFICATION_TYPES.map(t => (
                <TouchableOpacity key={t.id} style={[styles.typeBtn, type === t.id && { backgroundColor: COLORS.primary }]} onPress={() => setType(t.id)}>
                  <Text style={[styles.typeBtnText, type === t.id && { color: 'white' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}><Text style={{ color: 'white' }}>Send</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10, alignSelf: 'center' }}><Text>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  addBtn: { backgroundColor: COLORS.primary, padding: 8, borderRadius: 8 },
  listContent: { padding: 16 },
  notifCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  notifTitle: { fontWeight: 'bold', fontSize: 15 },
  notifMessage: { color: '#666', marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 10 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 15 },
  typeBtn: { padding: 6, backgroundColor: '#EEE', borderRadius: 5 },
  typeBtnText: { fontSize: 11 },
  sendBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, alignItems: 'center' }
});
