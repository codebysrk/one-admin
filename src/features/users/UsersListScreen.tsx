import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { User, Trash2, Search, BadgeCheck, XCircle, Ticket } from 'lucide-react-native';
import { AdminHeader, AdminScreen, EmptyState, LoadingState, SearchField, StatusBadge } from '../../components/AdminUI';
import { UserTicketsScreen } from './UserTicketsScreen';

export const UsersListScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (user: any) => {
    const newStatus = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    try {
      await updateDoc(doc(db, 'users', user.id), { status: newStatus });
      Alert.alert('Status Updated', `${user.name} is now ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (user: any) => {
    Alert.alert(
      'Confirm Deletion',
      `Remove ${user.name}? This records the UID for manual Auth cleanup.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { id: uid, email, name } = user;
              await setDoc(doc(db, 'deleted_users', uid), { uid, email, name, deletedAt: new Date().toISOString(), status: 'PENDING_AUTH_DELETION' });
              await deleteDoc(doc(db, 'users', uid));
              Alert.alert('Success', 'User moved to Cleanup list.');
            } catch (err) {
              Alert.alert('Error', 'Deletion failed');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: any) => {
    const banned = item.status === 'BANNED';
    return (
      <View style={styles.userCard}>
        <View style={styles.cardMain}>
          <View style={[styles.avatar, { backgroundColor: banned ? COLORS.errorSoft : COLORS.accentSoft }]}>
            <User size={23} color={banned ? COLORS.error : COLORS.accent} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
            <View style={styles.statusRow}>
              <StatusBadge label={item.status || 'ACTIVE'} tone={banned ? 'error' : 'success'} />
              {item.role ? <Text style={styles.roleText} numberOfLines={1}>{item.role}</Text> : null}
            </View>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${item.name}`} onPress={() => handleDelete(item)} style={styles.deleteBtn} activeOpacity={0.82}>
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => toggleStatus(item)} activeOpacity={0.82}>
            {item.status === 'ACTIVE' ? <XCircle size={14} color={COLORS.error} /> : <BadgeCheck size={14} color={COLORS.success} />}
            <Text style={[styles.actionBtnText, { color: item.status === 'ACTIVE' ? COLORS.error : COLORS.success }]}>
              {item.status === 'ACTIVE' ? 'Ban User' : 'Unban User'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setSelectedUser(item)} activeOpacity={0.82}>
            <Ticket size={14} color={COLORS.textMuted} />
            <Text style={[styles.actionBtnText, { color: COLORS.textMuted }]}>View Tickets</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (selectedUser) {
    return (
      <UserTicketsScreen
        navigation={{ goBack: () => setSelectedUser(null) }}
        route={{ params: { userId: selectedUser.id, userName: selectedUser.name } }}
      />
    );
  }

  return (
    <AdminScreen>
      <AdminHeader title="User Moderation" subtitle={`${filteredUsers.length} users visible`} />
      <View style={styles.searchWrap}>
        <SearchField
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <LoadingState label="Loading users..." />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon={<Search size={30} color={COLORS.textSubtle} />} title="No users found" message="Try another name or email address." />}
        />
      )}
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  list: { padding: SPACING.xl, paddingBottom: 40 },
  userCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: { width: 52, height: 52, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 16, lineHeight: 21, fontWeight: '800', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  roleText: { fontSize: 10, color: COLORS.textSubtle, fontWeight: '800', textTransform: 'uppercase', flexShrink: 1 },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.errorSoft, borderRadius: RADIUS.md },
  cardActions: { flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.surfaceMuted, paddingTop: 12, gap: 12 },
  actionBtn: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceMuted, paddingHorizontal: 10, paddingVertical: 9, borderRadius: RADIUS.md, gap: 6, borderWidth: 1, borderColor: COLORS.border },
  actionBtnText: { fontSize: 11, fontWeight: '800' },
});
