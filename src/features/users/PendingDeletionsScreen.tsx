import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AdminHeader, AdminScreen, EmptyState, LoadingState, StatusBadge } from '../../components/AdminUI';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const UserMinus = IconWrapper('account-minus');
const Trash2 = IconWrapper('trash-can-outline');
const Clock = IconWrapper('clock-outline');
const ContentCopy = IconWrapper('content-copy');

export const PendingDeletionsScreen = () => {
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'deleted_users'), orderBy('deletedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeletedUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  const renderItem = ({ item }: any) => {
    const isCopied = copiedId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <UserMinus size={20} color={COLORS.error} />
            </View>
            <View style={styles.userCopy}>
              <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
            </View>
          </View>
          <TouchableOpacity 
            accessibilityRole="button" 
            accessibilityLabel={`Remove cleanup record for ${item.name}`} 
            onPress={() => removeRecord(item.id)} 
            style={styles.deleteBtn} 
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <TouchableOpacity 
            style={styles.uidRow} 
            onPress={() => copyToClipboard(item.uid, item.id)} 
            activeOpacity={0.6}
          >
            <Text style={styles.uidText} numberOfLines={1}>UID: {item.uid}</Text>
            <View style={styles.copyBadge}>
              <ContentCopy size={11} color={isCopied ? COLORS.success : COLORS.accent} />
              <Text style={[styles.copyBadgeText, isCopied && { color: COLORS.success }]}>
                {isCopied ? 'Copied' : 'Copy'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.metaRow}>
            <View style={styles.timeRow}>
              <Clock size={12} color={COLORS.textSubtle} style={{ marginRight: 4 }} />
              <Text style={styles.timeText}>
                Deleted: {new Date(item.deletedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}
              </Text>
            </View>
            <StatusBadge label="Pending Auth Deletion" tone="warning" />
          </View>
        </View>
      </View>
    );
  };

  return (
    <AdminScreen>
      <AdminHeader title="Cleanup List" subtitle={`${deletedUsers.length} users pending Auth removal`} />

      {loading ? (
        <LoadingState label="Loading cleanup records..." />
      ) : (
        <FlashList
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
  card: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.lg, 
    padding: 14, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    ...SHADOWS.card 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
    gap: 10 
  },
  userInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    flex: 1, 
    minWidth: 0 
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorSoft,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCopy: { flex: 1, minWidth: 0 },
  userName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  userEmail: { fontSize: 11, color: COLORS.textMuted, marginTop: 1, fontWeight: '600' },
  deleteBtn: { 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.errorSoft,
    borderWidth: 1,
    borderColor: '#FECDD3'
  },
  details: { gap: 10 },
  uidRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceMuted, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  uidText: { 
    fontSize: 10, 
    color: COLORS.textMuted, 
    flex: 1, 
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', 
    fontWeight: '700' 
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  copyBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
    gap: 8
  },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 10, color: COLORS.textSubtle, fontWeight: '700' },
});
