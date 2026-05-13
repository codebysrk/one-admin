import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../core/theme';
import { Bell, Plus, Trash2, Megaphone, Info, AlertTriangle, Bus } from 'lucide-react-native';

const NOTIFICATION_TYPES = [
  { id: 'general', label: 'General', icon: <Bell size={20} color="#6B7280" /> },
  { id: 'alert', label: 'Alert', icon: <AlertTriangle size={20} color="#EF4444" /> },
  { id: 'info', label: 'Info', icon: <Info size={20} color="#3B82F6" /> },
  { id: 'bus', label: 'Bus', icon: <Bus size={20} color="#10B981" /> },
  { id: 'announcement', label: 'Promo', icon: <Megaphone size={20} color="#F59E0B" /> },
];

export const NotificationsManagementScreen = () => {
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
    if (!title || !message) {
      Alert.alert("Error", "Title and message are required");
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        type,
        timestamp: Date.now(),
        createdAt: Date.now()
      });
      setModalVisible(false);
      setTitle(''); setMessage(''); setType('general');
    } catch (error) {
      Alert.alert("Error", "Could not send notification");
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete Notification",
      "This will remove it for all users.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteDoc(doc(db, 'notifications', id)) }
      ]
    );
  };

  const renderItem = ({ item }: any) => {
    const typeInfo = NOTIFICATION_TYPES.find(t => t.id === item.type);
    return (
      <View style={styles.notifCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeInfo}>
            {typeInfo?.icon}
            <Text style={styles.typeLabel}>{typeInfo?.label}</Text>
          </View>
          <TouchableOpacity onPress={() => confirmDelete(item.id)}>
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifDate}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus size={20} color="white" />
          <Text style={styles.addBtnText}>Send New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Global Notification</Text>
            
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeSelector}>
              {NOTIFICATION_TYPES.map((t) => (
                <TouchableOpacity 
                  key={t.id} 
                  style={[styles.typeBtn, type === t.id && styles.typeBtnActive]} 
                  onPress={() => setType(t.id)}
                >
                  <Text style={[styles.typeBtnText, type === t.id && { color: 'white' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Traffic Alert" />

            <Text style={styles.label}>Message</Text>
            <TextInput 
              style={[styles.input, { height: 100 }]} 
              value={message} 
              onChangeText={setMessage} 
              placeholder="Enter message details..." 
              multiline 
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <Text style={styles.sendBtnText}>Send Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  notifCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  notifTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  notifMessage: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 8 },
  notifDate: { fontSize: 10, color: '#94A3B8' },
  
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: COLORS.primary },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, color: '#64748B' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9' },
  typeBtnActive: { backgroundColor: COLORS.primary },
  typeBtnText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontWeight: 'bold' },
  sendBtn: { flex: 2, padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: COLORS.primary },
  sendBtnText: { color: 'white', fontWeight: 'bold' }
});
