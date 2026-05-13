import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { UserMinus, Trash2, Clock, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { AdminHeader, AdminScreen, EmptyState, LoadingState, StatusBadge } from '../../components/AdminUI';

export const PendingDeletionsScreen = () => {
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'deleted_users'), orderBy('deletedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeletedUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'UID copied to clipboard. Use this in Firebase Console to delete the Auth account.');
  };

  const removeRecord = (id: string) => {
    Alert.alert(
      'Remove Record',
      'Only do this after manually deleting the user from Firebase Auth. Remove this record now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteDoc(doc(db, 'deleted_users', id)) },
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.iconBox}>
            <UserMinus size={20} color={COLORS.error} />
          </View>
          <View style={styles.userCopy}>
            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          </View>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove cleanup record for ${item.name}`} onPress={() => removeRecord(item.id)} style={styles.deleteBtn} activeOpacity={0.82}>
          <Trash2 size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <TouchableOpacity style={styles.uidRow} onPress={() => copyToClipboard(item.uid)} activeOpacity={0.82}>
          <Text style={styles.uidText} numberOfLines={1}>UID: {item.uid}</Text>
          <Copy size={13} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <Clock size={12} color={COLORS.textSubtle} />
          <Text style={styles.timeText}>Deleted: {new Date(item.deletedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}</Text>
        </View>
      </View>

      <StatusBadge label="Pending Auth Deletion" tone="warning" />
    </View>
  );

  return (
    <AdminScreen>
      <AdminHeader title="Cleanup List" subtitle={`${deletedUsers.length} users pending Auth removal`} />

      {loading ? (
        <LoadingState label="Loading cleanup records..." />
      ) : (
        <FlatList
          data={deletedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<UserMinus size={30} color={COLORS.textSubtle} />} title="All clean" message="There are no pending user deletion records." />}
        />
      )}
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  userCopy: { flex: 1, minWidth: 0 },
  iconBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.errorSoft, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 3 },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.errorSoft },
  details: { gap: 10, marginBottom: 14 },
  uidRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surfaceMuted, padding: SPACING.md, borderRadius: RADIUS.md },
  uidText: { fontSize: 11, color: COLORS.textMuted, flex: 1, fontFamily: 'monospace', fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 11, color: COLORS.textSubtle, fontWeight: '700' },
});
