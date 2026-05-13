import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { Bell, Plus, Trash2, Megaphone, Info, AlertTriangle, Bus, X } from 'lucide-react-native';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, StatusBadge } from '../../components/AdminUI';

const NOTIFICATION_TYPES = [
  { id: 'general', label: 'General', icon: Bell, tone: 'neutral' as const },
  { id: 'alert', label: 'Alert', icon: AlertTriangle, tone: 'error' as const },
  { id: 'info', label: 'Info', icon: Info, tone: 'info' as const },
  { id: 'bus', label: 'Bus', icon: Bus, tone: 'success' as const },
  { id: 'announcement', label: 'Promo', icon: Megaphone, tone: 'warning' as const },
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
    if (!title.trim() || !message.trim()) return Alert.alert('Missing content', 'Title and message are required.');
    try {
      await addDoc(collection(db, 'notifications'), { title: title.trim(), message: message.trim(), type, timestamp: Date.now() });
      setModalVisible(false);
      setTitle('');
      setMessage('');
      setType('general');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Notification', 'Remove this notification for all users?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'notifications', id)) },
    ]);
  };

  const renderNotification = ({ item }: any) => {
    const typeInfo = NOTIFICATION_TYPES.find(t => t.id === item.type) || NOTIFICATION_TYPES[0];
    const Icon = typeInfo.icon;

    return (
      <View style={styles.notifCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeInfo}>
            <View style={styles.typeIcon}>
              <Icon size={17} color={COLORS.accent} />
            </View>
            <StatusBadge label={typeInfo.label} tone={typeInfo.tone} />
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${item.title}`} onPress={() => confirmDelete(item.id)} style={styles.deleteBtn} activeOpacity={0.82}>
            <Trash2 size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>
      </View>
    );
  };

  return (
    <AdminScreen>
      <AdminHeader
        title="Notifications"
        subtitle={`${notifications.length} active announcements`}
        action={(
          <IconButton accessibilityLabel="Create notification" onPress={() => setModalVisible(true)}>
            <Plus size={20} color={COLORS.white} />
          </IconButton>
        )}
      />

      {loading ? (
        <LoadingState label="Loading notifications..." />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Bell size={30} color={COLORS.textSubtle} />} title="No notifications" message="Create an announcement to reach app users." />}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Send Notification</Text>
                <Text style={styles.modalSubtitle}>Publish a concise update to users.</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close notification modal" onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeSelector}>
              {NOTIFICATION_TYPES.map(t => (
                <TouchableOpacity key={t.id} style={[styles.typeBtn, type === t.id && styles.typeBtnActive]} onPress={() => setType(t.id)} activeOpacity={0.82}>
                  <Text style={[styles.typeBtnText, type === t.id && styles.typeBtnTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Traffic alert" placeholderTextColor={COLORS.textSubtle} selectionColor={COLORS.accent} />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter message details..."
              placeholderTextColor={COLORS.textSubtle}
              multiline
              textAlignVertical="top"
              selectionColor={COLORS.accent}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.86}>
              <Text style={styles.sendBtnText}>Send Now</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  notifCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  typeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  typeIcon: { width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.errorSoft },
  notifTitle: { fontSize: 16, lineHeight: 21, color: COLORS.text, fontWeight: '800', marginBottom: 6 },
  notifMessage: { color: COLORS.textMuted, marginTop: 2, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: SPACING.xl },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: SPACING.xxl, ...SHADOWS.floating },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  modalTitle: { color: COLORS.text, fontSize: 20, lineHeight: 25, fontWeight: '800' },
  modalSubtitle: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600', marginTop: 3 },
  closeBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0 },
  input: { minHeight: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16, fontSize: 14, color: COLORS.text, fontWeight: '700', backgroundColor: COLORS.surface },
  messageInput: { height: 104, lineHeight: 20 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800' },
  typeBtnTextActive: { color: COLORS.white },
  sendBtn: { backgroundColor: COLORS.accent, minHeight: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', ...SHADOWS.accent },
  sendBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
});
