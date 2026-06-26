import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, setDoc, deleteDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminHeader, AdminScreen, EmptyState, LoadingState, ReasonModal, SearchField, StatusBadge } from '../../components/AdminUI';
import { UserTicketsScreen } from './UserTicketsScreen';
import { logActivity } from '../../services/logService';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const UserIcon = IconWrapper('account');
const Trash2 = IconWrapper('trash-can-outline');
const Search = IconWrapper('magnify');
const BadgeCheck = IconWrapper('check-decagram');
const XCircle = IconWrapper('close-circle');
const Ticket = IconWrapper('ticket');
const ShieldCheck = IconWrapper('shield-check');
const IndianRupee = IconWrapper('currency-inr');
const Star = IconWrapper('star');

const UserCard = React.memo(({ item, userRevenue, initiateDelete, initiateStatusToggle, setSelectedUser }: any) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const banned = item.status === 'BANNED';
  const isAdmin = item.role === 'admin';
  const revenue = userRevenue[item.id] || 0;
  const isVIP = revenue >= 1000;

  return (
    <View style={[styles.userCard, banned && styles.userCardBanned]}>
      <View style={styles.cardMain}>
        <View style={[styles.avatar, banned ? styles.avatarBanned : (isAdmin ? styles.avatarAdmin : styles.avatarUser)]}>
          {isAdmin ? <ShieldCheck size={20} color={isDark ? colors.text : colors.primary} /> : <UserIcon size={20} color={banned ? colors.error : colors.accent} />}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            {isVIP && (
              <View style={styles.vipBadge}>
                <Star size={9} color="#D97706" fill="#D97706" />
                <Text style={styles.vipText}>VIP</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
          <View style={styles.statusRow}>
            <StatusBadge label={item.status || 'ACTIVE'} tone={banned ? 'error' : 'success'} />
            {isAdmin && <StatusBadge label="ADMIN" tone="info" />}
          </View>
        </View>
        <TouchableOpacity 
          accessibilityRole="button" 
          accessibilityLabel={`Delete ${item.name}`} 
          onPress={() => initiateDelete(item)} 
          style={styles.deleteBtn} 
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.revenueRow}>
        <View style={styles.revBox}>
          <IndianRupee size={12} color={colors.success} />
          <Text style={styles.revLabel}>Lifetime Revenue</Text>
          <Text style={styles.revValue}>₹{revenue.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, banned ? styles.unbanBtn : styles.banBtn]} 
          onPress={() => initiateStatusToggle(item)} 
          activeOpacity={0.7}
        >
          {item.status === 'ACTIVE' || !item.status ? <XCircle size={14} color={colors.error} /> : <BadgeCheck size={14} color={colors.success} />}
          <Text style={[styles.actionBtnText, { color: (item.status === 'ACTIVE' || !item.status) ? colors.error : colors.success }]}>
            {item.status === 'ACTIVE' || !item.status ? 'Ban User' : 'Unban'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.viewTicketsBtn]} 
          onPress={() => setSelectedUser(item)} 
          activeOpacity={0.7}
        >
          <Ticket size={14} color={colors.accent} />
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>View Tickets</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

type FilterType = 'ALL' | 'ACTIVE' | 'BANNED' | 'ADMINS';

export const UsersListScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const [, startTransition] = useTransition();
  const [users, setUsers] = useState<any[]>([]);
  const [userRevenue, setUserRevenue] = useState<Record<string, number>>({});
  const [, setUserAlerts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [reasonModal, setReasonModal] = useState({ visible: false, title: '', type: '', data: null as any });

  useEffect(() => {
    // Listen for users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userData);
      setLoading(false);
    });

    // Listen for tickets to calculate revenue
    const qTickets = query(collection(db, 'tickets'));
    const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
      const revenueMap: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const uid = data.userId;
        const fare = Number(data.fare) || 0;
        if (uid) {
          revenueMap[uid] = (revenueMap[uid] || 0) + fare;
        }
      });
      startTransition(() => setUserRevenue(revenueMap));
    });

    // Listen for security alerts (screenshots)
    const qLogs = query(collection(db, 'logs'), where('action', '==', 'SCREENSHOT_ATTEMPT'));
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const alertsMap: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const uid = data.userId;
        if (uid) {
          alertsMap[uid] = data.timestamp?.toDate ? data.timestamp.toDate().toLocaleDateString() : 'Recent';
        }
      });
      alertsMap[String(new Date())] = 'test'; // dummy alert trigger
      setUserAlerts(alertsMap);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTickets();
      unsubscribeLogs();
    };
  }, []);

  const initiateStatusToggle = useCallback((user: any) => {
    const action = user.status === 'ACTIVE' || !user.status ? 'Ban User' : 'Unban User';
    setReasonModal({ visible: true, title: `${action}: ${user.name}`, type: 'TOGGLE_STATUS', data: user });
  }, []);

  const initiateDelete = useCallback((user: any) => {
    setReasonModal({ visible: true, title: `Remove User: ${user.name}`, type: 'DELETE_USER', data: user });
  }, []);

  const handleActionWithReason = async (reason: string) => {
    const { type, data: user } = reasonModal;

    if (type === 'TOGGLE_STATUS') {
      const newStatus = user.status === 'ACTIVE' || !user.status ? 'BANNED' : 'ACTIVE';
      try {
        await updateDoc(doc(db, 'users', user.id), { status: newStatus });
        await logActivity({
          type: 'ADMIN',
          action: newStatus === 'BANNED' ? 'USER_BANNED' : 'USER_UNBANNED',
          details: `${user.name}'s access status was changed to ${newStatus}.`,
          targetId: user.id,
          targetType: 'USER',
          oldValue: user.status || 'ACTIVE',
          newValue: newStatus,
          notes: reason
        });
        Alert.alert('Status Updated', `${user.name} is now ${newStatus}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to update status');
      }
    } else if (type === 'DELETE_USER') {
      try {
        const { id: uid, email, name } = user;

        // User ke saare devices delete karo
        const devicesSnap = await getDocs(
          query(collection(db, 'devices'), where('userId', '==', uid))
        );
        if (!devicesSnap.empty) {
          const batch = writeBatch(db);
          devicesSnap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }

        await setDoc(doc(db, 'deleted_users', uid), { uid, email, name, deletedAt: new Date().toISOString(), status: 'PENDING_AUTH_DELETION' });
        await deleteDoc(doc(db, 'users', uid));
        await logActivity({
          type: 'ADMIN',
          action: 'USER_DELETED',
          details: `User ${name} (${email}) was removed and moved to cleanup queue.`,
          targetId: uid,
          targetType: 'USER',
          notes: reason
        });
        Alert.alert('Success', 'User and their devices have been removed.');
      } catch (err) {
        Alert.alert('Error', 'Deletion failed');
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'ACTIVE':
          return u.status === 'ACTIVE' || !u.status;
        case 'BANNED':
          return u.status === 'BANNED';
        case 'ADMINS':
          return u.role === 'admin';
        default:
          return true;
      }
    });
  }, [users, searchQuery, activeFilter]);

  const renderUser = useCallback(
    ({ item }: any) => (
      <UserCard
        item={item}
        userRevenue={userRevenue}
        initiateDelete={initiateDelete}
        initiateStatusToggle={initiateStatusToggle}
        setSelectedUser={setSelectedUser}
      />
    ),
    [userRevenue, initiateDelete, initiateStatusToggle]
  );

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
      <AdminHeader 
        title="Identity & Access" 
        subtitle={`${filteredUsers.length} ${activeFilter.toLowerCase()} records indexed`} 
      />
      
      <View style={styles.controls}>
        <SearchField
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {(['ALL', 'ACTIVE', 'BANNED', 'ADMINS'] as FilterType[]).map((f) => (
            <TouchableOpacity 
              key={f} 
              onPress={() => {
                setActiveFilter(f);
              }}
              style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingState label="Indexing users..." />
      ) : (
        <FlashList
          data={filteredUsers}
          keyExtractor={(item: any) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState 
              icon={<Search size={30} color={colors.textSubtle} />} 
              title={`No ${activeFilter.toLowerCase()} users`} 
              message="No records found matching your search or filter." 
            />
          }
        />
      )}

      <ReasonModal
        visible={reasonModal.visible}
        onClose={() => setReasonModal({ ...reasonModal, visible: false })}
        title={reasonModal.title}
        onSubmit={handleActionWithReason}
      />
    </AdminScreen>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  controls: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, gap: 12 },
  filterBar: { gap: 8, paddingBottom: 4 },
  filterTab: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: RADIUS.pill, 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  filterTabActive: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  filterText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  filterTextActive: { color: colors.white },
  
  list: { padding: SPACING.xl, paddingBottom: 40 },
  userCard: { 
    backgroundColor: colors.surface, 
    borderRadius: RADIUS.lg, 
    padding: 14, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.border, 
    ...SHADOWS.card 
  },
  userCardBanned: {
    borderColor: colors.errorSoft,
    backgroundColor: colors.surfaceMuted,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: RADIUS.md, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarUser: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  avatarAdmin: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(11, 18, 32, 0.15)',
  },
  avatarBanned: {
    backgroundColor: colors.errorSoft,
    borderColor: 'rgba(225, 29, 72, 0.15)',
  },
  userInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 14, fontWeight: '800', color: colors.text, flexShrink: 1 },
  vipBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: RADIUS.xs, 
    borderWidth: 1, 
    borderColor: '#FDE68A' 
  },
  vipText: { fontSize: 9, fontWeight: '900', color: '#B45309' },
  userEmail: { fontSize: 11, color: colors.textMuted, marginTop: 1, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  deleteBtn: { 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: colors.errorSoft, 
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: RADIUS.md 
  },
  
  revenueRow: { 
    marginTop: 12, 
    backgroundColor: colors.surfaceMuted, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: RADIUS.md, 
    borderLeftWidth: 3, 
    borderLeftColor: colors.success,
    borderWidth: 1,
    borderColor: colors.border
  },
  revBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revLabel: { fontSize: 11, fontWeight: '700', color: colors.textSubtle },
  revValue: { fontSize: 12, fontWeight: '800', color: colors.text },

  cardActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: { 
    flex: 1, 
    minHeight: 38, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: RADIUS.md, 
    gap: 6, 
    borderWidth: 1, 
  },
  actionBtnText: { fontSize: 11, fontWeight: '800' },
  banBtn: {
    backgroundColor: colors.errorSoft,
    borderColor: '#FECDD3',
  },
  unbanBtn: {
    backgroundColor: colors.successSoft,
    borderColor: '#BBF7D0',
  },
  viewTicketsBtn: {
    backgroundColor: colors.accentSoft,
    borderColor: 'rgba(37, 99, 235, 0.15)',
  },
});
