import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, ReasonModal, SearchField, StatusBadge } from '../../components/AdminUI';
import { UserTicketsScreen } from './UserTicketsScreen';
import { CreateUserModal } from './CreateUserModal';
import { logActivity } from '../../services/logService';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const UserIcon = IconWrapper('account');
const UserPlus = IconWrapper('account-plus');
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
  const styles = typeof getStyles === 'function' ? getStyles(colors, isDark) : {} as any;
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
          <Trash2 size={15} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardMetricsRow}>
        <View style={styles.metricBadge}>
          <IndianRupee size={12} color={colors.success} />
          <Text style={styles.metricLabel}>Lifetime Revenue</Text>
          <Text style={styles.metricValue}>₹{revenue.toLocaleString('en-IN')}</Text>
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
  const styles = typeof getStyles === 'function' ? getStyles(colors, isDark) : {} as any;
  const [, startTransition] = useTransition();
  const [users, setUsers] = useState<any[]>([]);
  const [userRevenue, setUserRevenue] = useState<Record<string, number>>({});
  const [, setUserAlerts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [reasonModal, setReasonModal] = useState({ visible: false, title: '', type: '', data: null as any });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (userData) {
        setUsers(userData);
      }

      const { data: ticketData } = await supabase.from('tickets').select('user_id, fare');
      if (ticketData) {
        const revenueMap: Record<string, number> = {};
        ticketData.forEach((t: any) => {
          if (t.user_id) {
            revenueMap[t.user_id] = (revenueMap[t.user_id] || 0) + (Number(t.fare) || 0);
          }
        });
        startTransition(() => setUserRevenue(revenueMap));
      }
    } catch (err) {
      if (__DEV__) console.warn('Fetch users error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('users-screen-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

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
        await supabase.from('users').update({ status: newStatus }).eq('id', user.id);
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
        fetchAll();
        Alert.alert('Status Updated', `${user.name} is now ${newStatus}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to update status');
      }
    } else if (type === 'DELETE_USER') {
      try {
        const { id: uid, email, name } = user;
        await supabase.from('users').delete().eq('id', uid);
        await logActivity({
          type: 'ADMIN',
          action: 'USER_DELETED',
          details: `User ${name} (${email}) was removed.`,
          targetId: uid,
          targetType: 'USER',
          notes: reason
        });
        fetchAll();
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
          return u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || u.role === 'admin';
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
        action={
          <IconButton
            accessibilityLabel="Add New User"
            onPress={() => setShowCreateModal(true)}
            tone="primary"
          >
            <UserPlus size={18} color="#ffffff" />
          </IconButton>
        }
      />
      
      <View style={styles.controls}>
        <SearchField
          placeholder="Search by name, email, or mobile..."
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
        <LoadingState label="Loading users..." />
      ) : (
        <FlashList
          data={filteredUsers}
          keyExtractor={(item: any) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => fetchAll(true)}
          ListEmptyComponent={
            <EmptyState 
              icon={<Search size={30} color={colors.textSubtle} />} 
              title={activeFilter === 'ALL' ? 'No Users Found' : `No ${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Users`} 
              message="No registered users match your search criteria or filter." 
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

      <CreateUserModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchAll();
        }}
        onUserCreated={() => {
          fetchAll();
        }}
      />
    </AdminScreen>
  );
};

function getStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
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
    backgroundColor: isDark ? colors.accent : colors.primary, 
    borderColor: isDark ? colors.accent : colors.primary 
  },
  filterText: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  filterTextActive: { color: colors.white },
  
  list: { padding: SPACING.xl, paddingBottom: 40 },
  userCard: { 
    backgroundColor: colors.surface, 
    borderRadius: RADIUS.card, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.border, 
    ...SHADOWS.card 
  },
  userCardBanned: {
    borderColor: colors.errorSoft,
    backgroundColor: colors.surfaceMuted,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { 
    width: 42, 
    height: 42, 
    borderRadius: RADIUS.lg, 
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
    borderColor: isDark ? colors.border : 'rgba(11, 18, 32, 0.15)',
  },
  avatarBanned: {
    backgroundColor: colors.errorSoft,
    borderColor: 'rgba(225, 29, 72, 0.15)',
  },
  userInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 15, fontWeight: '800', color: colors.text, flexShrink: 1 },
  vipBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 7, 
    paddingVertical: 2, 
    borderRadius: RADIUS.pill, 
    borderWidth: 1, 
    borderColor: '#FDE68A' 
  },
  vipText: { fontSize: 9, fontWeight: '900', color: '#B45309' },
  userEmail: { fontSize: 12, color: colors.textMuted, marginTop: 1, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  deleteBtn: { 
    width: 38, 
    height: 38, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: colors.errorSoft, 
    borderWidth: 1,
    borderColor: colors.error + '33',
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
  cardMetricsRow: { 
    marginTop: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: { fontSize: 10, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue: { fontSize: 11, fontWeight: '800', color: colors.text },

  cardActions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: { 
    flex: 1, 
    minHeight: 36, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: RADIUS.sm, 
    gap: 6, 
    borderWidth: 1, 
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
  banBtn: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.error + '33',
  },
  unbanBtn: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success + '33',
  },
  viewTicketsBtn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent + '33',
  },
  });
}
