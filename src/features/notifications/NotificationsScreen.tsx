import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, addDoc, query, orderBy, getCountFromServer } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { Bell, Plus, Trash2, Megaphone, Info, AlertTriangle, Bus, X, Send } from 'lucide-react-native';
import { AdminHeader, AdminScreen, EmptyState, LoadingState, StatusBadge } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { LinearGradient } from 'expo-linear-gradient';

const NOTIFICATION_TYPES = [
  { id: 'general', label: 'General', icon: Bell, tone: '#6366F1', bg: '#EEF2FF' },
  { id: 'alert', label: 'Alert', icon: AlertTriangle, tone: '#EF4444', bg: '#FEF2F2' },
  { id: 'info', label: 'Info', icon: Info, tone: '#3B82F6', bg: '#EFF6FF' },
  { id: 'bus', label: 'Bus', icon: Bus, tone: '#10B981', bg: '#ECFDF5' },
  { id: 'promo', label: 'Promo', icon: Megaphone, tone: '#F59E0B', bg: '#FFFBEB' },
];

export const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [sending, setSending] = useState(false);

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

    const fetchUserCount = async () => {
      const snap = await getCountFromServer(collection(db, 'users'));
      setTotalUsers(snap.data().count);
    };

    fetchUserCount();
    return () => unsubscribe();
  }, []);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', 'Provide title & message.');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        timestamp: Date.now(),
        isBroadcast: true,
        sentBy: 'Admin Hub',
        targetCount: totalUsers
      };

      await addDoc(collection(db, 'notifications'), payload);
      setModalVisible(false);
      setTitle('');
      setMessage('');
      setType('general');
    } catch (error) {
      Alert.alert('Error', 'Failed to dispatch');
    } finally {
      setSending(false);
    }
  };

  const renderNotification = ({ item }: any) => {
    const typeInfo = NOTIFICATION_TYPES.find(t => t.id === item.type) || NOTIFICATION_TYPES[0];
    return (
      <View style={styles.notifCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeInfo}>
            <View style={[styles.typeIcon, { backgroundColor: typeInfo.bg }]}>
              <typeInfo.icon size={14} color={typeInfo.tone} />
            </View>
            <Text style={styles.dateText}>{new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
          </View>
          <TouchableOpacity onPress={() => deleteDoc(doc(db, 'notifications', item.id))} style={styles.deleteBtn}>
            <Trash2 size={14} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={1}>{item.message}</Text>
      </View>
    );
  };

  const selectedType = NOTIFICATION_TYPES.find(t => t.id === type) || NOTIFICATION_TYPES[0];

  return (
    <AdminScreen>
      <AdminHeader title="Broadcast" subtitle={`${totalUsers} active users`} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <TouchableOpacity style={styles.mainAction} onPress={() => setModalVisible(true)}>
             <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.actionGrad}>
                <Megaphone size={20} color={COLORS.white} />
                <View style={styles.actionCopy}>
                   <Text style={styles.actionTitle}>New Broadcast</Text>
                   <Text style={styles.actionSub}>Global alert system</Text>
                </View>
                <Plus size={20} color={COLORS.white} />
             </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={loading ? <LoadingState label="Loading..." compact /> : <EmptyState title="No history" />}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Dispatch Hub</Text>
                  <Text style={styles.modalSubtitle}>Configure system-wide announcement</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formBody}>
                <Text style={styles.label}>Broadcast Category</Text>
                <View style={styles.categoryGrid}>
                   {NOTIFICATION_TYPES.map(t => (
                     <TouchableOpacity key={t.id} style={[styles.catBtn, type === t.id && { borderColor: t.tone, backgroundColor: t.bg }]} onPress={() => setType(t.id)}>
                        <t.icon size={16} color={type === t.id ? t.tone : COLORS.textMuted} />
                        <Text style={[styles.catLabel, type === t.id && { color: t.tone }]}>{t.label}</Text>
                     </TouchableOpacity>
                   ))}
                </View>

                <View style={styles.inputSection}>
                  <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Headline (e.g., Schedule Update)" placeholderTextColor={COLORS.textSubtle} maxLength={45} />
                  <TextInput style={[styles.input, styles.area]} value={message} onChangeText={setMessage} multiline numberOfLines={3} placeholder="Describe the announcement..." placeholderTextColor={COLORS.textSubtle} />
                </View>

                <View style={styles.previewCard}>
                   <View style={styles.previewHeader}>
                      <View style={[styles.previewIcon, { backgroundColor: selectedType.bg }]}><selectedType.icon size={12} color={selectedType.tone} /></View>
                      <Text style={styles.previewType}>{selectedType.label} Announcement • Now</Text>
                   </View>
                   <Text style={styles.previewTitle} numberOfLines={1}>{title || 'Headline'}</Text>
                   <Text style={styles.previewText} numberOfLines={1}>{message || 'Message content...'}</Text>
                </View>

                <TouchableOpacity style={styles.sendBtn} onPress={handleBroadcast} disabled={sending}>
                   <LinearGradient colors={['#4F46E5', '#3730A3']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.sendGrad}>
                      {sending ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.sendText}>Dispatch to {totalUsers} Users</Text>}
                   </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.bottomBleed} />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 60 },
  mainAction: { marginBottom: 16, borderRadius: 16, overflow: 'hidden', ...SHADOWS.card },
  actionGrad: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionCopy: { flex: 1 },
  actionTitle: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  actionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  notifCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 10, color: COLORS.textSubtle, fontWeight: '700' },
  deleteBtn: { padding: 6, backgroundColor: COLORS.errorSoft, borderRadius: 6 },
  notifTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  notifMessage: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  keyboard: { width: '100%', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40, maxHeight: '98%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  modalSubtitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 },
  closeBtn: { padding: 6, backgroundColor: COLORS.surfaceMuted, borderRadius: 10 },
  formBody: { gap: 14 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  categoryGrid: { flexDirection: 'row', gap: 10 },
  catBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 6 },
  catLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  inputSection: { gap: 12 },
  input: { backgroundColor: COLORS.surfaceMuted, borderRadius: 14, padding: 16, fontSize: 15, fontWeight: '700', color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  area: { height: 110, textAlignVertical: 'top' },
  previewCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  previewIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  previewType: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, flex: 1 },
  previewTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  previewText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', lineHeight: 18 },
  sendBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, ...SHADOWS.accent },
  sendGrad: { height: 56, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  bottomBleed: { position: 'absolute', bottom: -100, left: 0, right: 0, height: 120, backgroundColor: COLORS.surface, zIndex: 1 },
});
