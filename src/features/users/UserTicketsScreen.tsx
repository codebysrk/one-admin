import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, PanResponder } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SPACING, SHADOWS } from '../../core/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const ArrowLeft = IconWrapper('arrow-left');
const Ticket = IconWrapper('ticket');
const Trash2 = IconWrapper('trash-can-outline');
const Smartphone = IconWrapper('cellphone');
const Android = IconWrapper('android');
const Apple = IconWrapper('apple');
const Clock = IconWrapper('clock-outline');
const ShieldAlert = IconWrapper('shield-alert');
const ShieldCheck = IconWrapper('shield-check');
const LogOut = IconWrapper('logout');
import { AdminHeader, EmptyState, LoadingState, ConfirmationModal, StatusBadge, AdminPressable, UndoToast } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';
import { EditTicketModal } from '../dashboard/EditTicketModal';

export const UserTicketsScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useTheme();
  const localStyles = useMemo(
    () => (typeof getStyles === 'function' ? getStyles(colors) : {} as any),
    [colors]
  );
  const { userId, userName, initialTab = 'tickets' } = route.params;
  const [activeTab, setActiveTab] = useState<'tickets' | 'devices'>(initialTab);
  const [tickets, setTickets] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [editModal, setEditModal] = useState<{ visible: boolean; ticket: any | null }>({ visible: false, ticket: null });
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Undo Toast & Deletion Queue
  const [toastVisible, setToastVisible] = useState(false);
  const pendingDeleteRef = useRef<{ id: string; ticket: any; timer: ReturnType<typeof setTimeout> | null } | null>(null);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedTicketId((prev) => (prev === id ? null : id));
  }, []);

  const fetchTickets = useCallback(async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setTickets(data.map((t: any) => {
        const d = t.created_at ? new Date(t.created_at) : new Date();
        const dateStr = !isNaN(d.getTime()) ? `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('en-GB', { month: 'short' })}, ${d.getFullYear()}` : '';
        const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

        return {
          id: t.id,
          tid: t.id,
          userId: t.user_id,
          userName: userName || 'User',
          route: t.route,
          busType: t.bus_type || (t.route && String(t.route).toLowerCase().includes('ac') ? 'AC' : 'Non-AC'),
          bus_type: t.bus_type || (t.route && String(t.route).toLowerCase().includes('ac') ? 'AC' : 'Non-AC'),
          fare: t.fare,
          total: t.fare,
          passengers: t.passengers || 1,
          qty: t.passengers || 1,
          status: t.status,
          timestamp: t.created_at,
          created_at: t.created_at,
          date: dateStr,
          time: timeStr,
          from: t.source,
          source: t.source,
          to: t.destination,
          destination: t.destination,
          dest: t.destination,
        };
      }));
    }
    setLoading(false);
    setRefreshing(false);
  }, [userId, userName]);

  const fetchDevices = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });
      if (data) {
        setDevices(data.map((d: any) => ({
          id: d.id,
          deviceName: d.device_name,
          userName: userName || 'User',
          status: d.status,
          forceLogout: d.force_logout,
          platform: d.platform,
          osVersion: d.os_version,
          brand: d.brand,
          model: d.model,
          lastActive: d.last_active,
        })));
      }
    } catch (err) {
      if (__DEV__) console.warn('Fetch devices error:', err);
    } finally {
      setDevicesLoading(false);
      setRefreshing(false);
    }
  }, [userId, userName]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchDevices();
    const channel = supabase
      .channel(`user-devices-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` }, () => {
        fetchDevices();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices, userId]);

  const toggleDeviceStatus = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      await supabase.from('devices').update({ status: newStatus }).eq('id', id);
      await logActivity({
        type: 'ADMIN',
        action: 'DEVICE_STATUS_CHANGED',
        details: `Device ${id} status set to ${newStatus} for user ${userName}.`,
        targetId: id,
        targetType: 'USER',
      });
      fetchDevices();
      Alert.alert('Status Updated', `Device is now ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Could not update device status');
    }
  }, [userName, fetchDevices]);

  const toggleForceLogout = useCallback(async (id: string, currentVal: boolean) => {
    try {
      await supabase.from('devices').update({ force_logout: !currentVal }).eq('id', id);
      await logActivity({
        type: 'ADMIN',
        action: 'DEVICE_FORCE_LOGOUT',
        details: `Device ${id} force logout toggled to ${!currentVal} for user ${userName}.`,
        targetId: id,
        targetType: 'USER',
      });
      fetchDevices();
    } catch (error) {
      Alert.alert('Error', 'Could not update force logout status');
    }
  }, [userName, fetchDevices]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'tickets') {
      fetchTickets();
    } else {
      fetchDevices();
    }
  }, [activeTab, fetchTickets, fetchDevices]);

  // Commit pending delete to DB
  const commitPendingDelete = useCallback(async () => {
    if (!pendingDeleteRef.current) return;
    const { id } = pendingDeleteRef.current;
    pendingDeleteRef.current = null;
    setToastVisible(false);

    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      await logActivity({
        type: 'ADMIN',
        action: 'TICKET_DELETED',
        details: `Ticket ${id} of user ${userName} was deleted.`,
        targetId: id,
        targetType: 'TICKET',
      });
    } catch (error) {
      if (__DEV__) console.warn('Error deleting ticket:', error);
    }
  }, [userName]);

  const ticketsRef = useRef(tickets);
  ticketsRef.current = tickets;

  // Instant Delete with 10s Undo window (Option 3)
  const handleDelete = useCallback((id: string) => {
    if (pendingDeleteRef.current) {
      if (pendingDeleteRef.current.timer) clearTimeout(pendingDeleteRef.current.timer);
      commitPendingDelete();
    }

    const ticketToDelete = ticketsRef.current.find((t) => t.id === id);
    if (!ticketToDelete) return;

    // Optimistically remove from state immediately
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setToastVisible(true);

    const timer = setTimeout(() => {
      commitPendingDelete();
    }, 10000);

    pendingDeleteRef.current = { id, ticket: ticketToDelete, timer };
  }, [commitPendingDelete]);

  // Undo single ticket delete
  const handleUndo = useCallback(() => {
    if (!pendingDeleteRef.current) return;
    const { ticket, timer } = pendingDeleteRef.current;
    if (timer) clearTimeout(timer);
    pendingDeleteRef.current = null;
    setToastVisible(false);

    // Restore ticket back into list
    setTickets((prev) => [ticket, ...prev]);
  }, []);

  // Flush pending delete on unmount
  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current) {
        if (pendingDeleteRef.current.timer) clearTimeout(pendingDeleteRef.current.timer);
        commitPendingDelete();
      }
    };
  }, [commitPendingDelete]);

  const handleDeleteAll = useCallback(() => {
    setDeleteAllConfirm(true);
  }, []);

  // Single step confirm delete all - ReasonModal completely removed
  const confirmDeleteAll = useCallback(async () => {
    setDeleteAllConfirm(false);
    try {
      await supabase.from('tickets').delete().eq('user_id', userId);
      await logActivity({
        type: 'ADMIN',
        action: 'ALL_TICKETS_DELETED',
        details: `All tickets of user ${userName} were cleared.`,
        targetId: userId,
        targetType: 'USER',
      });
      fetchTickets();
    } catch (error) {
      if (__DEV__) console.warn('Error clearing user tickets:', error);
    }
  }, [userId, userName, fetchTickets]);

  const handleEdit = useCallback((ticket: any) => {
    setEditModal({ visible: true, ticket });
  }, []);

  const renderTicket = useCallback(
    ({ item }: { item: any }) => (
      <TicketCard 
        ticket={item} 
        showUserInfo 
        listUserName={userName} 
        onDelete={handleDelete} 
        onEdit={handleEdit} 
        expanded={expandedTicketId === item.id}
        onToggleExpand={() => handleToggleExpand(item.id)}
      />
    ),
    [handleDelete, handleEdit, userName, expandedTicketId, handleToggleExpand]
  );

  const renderDeviceItem = useCallback(({ item }: any) => {
    const isBanned = item.status === 'BANNED';
    const isAllowed = !isBanned;
    const isAndroid = (item.platform || '').toLowerCase().includes('android');
    const isIOS = (item.platform || '').toLowerCase().includes('ios');

    return (
      <View style={[localStyles.deviceCard, isBanned && localStyles.deviceCardBanned]}>
        <View style={localStyles.deviceHeader}>
          <View style={localStyles.deviceInfo}>
            <View style={[localStyles.avatar, isAllowed ? localStyles.avatarApproved : localStyles.avatarBanned]}>
              <Smartphone size={20} color={isAllowed ? colors.success : colors.error} />
            </View>
            <View style={localStyles.deviceCopy}>
              <Text style={localStyles.deviceName} numberOfLines={1}>{item.deviceName || 'Unknown Device'}</Text>
              <Text style={localStyles.devicePlatform} numberOfLines={1}>{(item.platform || 'Unknown').toUpperCase()} {item.osVersion || ''}</Text>
            </View>
          </View>
          <View style={localStyles.badgeCol}>
            <StatusBadge label={item.status || 'ACTIVE'} tone={isAllowed ? 'success' : 'error'} />
          </View>
        </View>

        <View style={localStyles.deviceDetails}>
          <View style={localStyles.detailChipsRow}>
            <View style={localStyles.chip}>
              {isAndroid ? <Android size={12} color={colors.textMuted} style={{ marginRight: 4 }} /> : isIOS ? <Apple size={12} color={colors.textMuted} style={{ marginRight: 4 }} /> : <Smartphone size={12} color={colors.textMuted} style={{ marginRight: 4 }} />}
              <Text style={localStyles.chipText}>{(item.platform || 'Unknown').toUpperCase()} {item.osVersion || ''}</Text>
            </View>
            {(item.brand || item.model) ? (
              <View style={localStyles.chip}>
                <Text style={localStyles.chipLabel}>Model: </Text>
                <Text style={localStyles.chipValText} numberOfLines={1}>{item.brand || ''} {item.model || ''}</Text>
              </View>
            ) : null}
          </View>

          {item.lastActive ? (
            <View style={localStyles.timeRow}>
              <Clock size={12} color={colors.textSubtle} style={{ marginRight: 6 }} />
              <Text style={localStyles.timeText} numberOfLines={1}>
                Last active: {new Date(item.lastActive).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={localStyles.deviceActions}>
          <AdminPressable
            style={[localStyles.deviceActionBtn, isAllowed ? localStyles.deviceBanBtn : localStyles.deviceApproveBtn]}
            onPress={() => toggleDeviceStatus(item.id, item.status)}
          >
            {isAllowed ? <ShieldAlert size={15} color={colors.error} /> : <ShieldCheck size={15} color={colors.success} />}
            <Text style={[localStyles.deviceActionBtnText, { color: isAllowed ? colors.error : colors.success }]}>
              {isAllowed ? 'Ban Device' : 'Unban Device'}
            </Text>
          </AdminPressable>

          <AdminPressable
            style={[localStyles.deviceActionBtn, item.forceLogout ? localStyles.logoutActiveBtn : localStyles.logoutInactiveBtn]}
            onPress={() => toggleForceLogout(item.id, item.forceLogout)}
          >
            <LogOut size={15} color={item.forceLogout ? colors.info : colors.textMuted} />
            <Text style={[localStyles.deviceActionBtnText, { color: item.forceLogout ? colors.info : colors.textMuted }]}>
              {item.forceLogout ? 'Cancel Logout' : 'Force Logout'}
            </Text>
          </AdminPressable>
        </View>
      </View>
    );
  }, [colors, localStyles, toggleDeviceStatus, toggleForceLogout]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.x0 < 60 && gestureState.dx > 25 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 60 || gestureState.vx > 0.4) {
          navigation.goBack();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={localStyles.container} edges={['bottom']} {...panResponder.panHandlers}>
      <AdminHeader
        title={activeTab === 'tickets' ? `Tickets History (${tickets.length})` : `Linked Devices (${devices.length})`}
        subtitle={userName}
        onBack={() => navigation.goBack()}
        action={activeTab === 'tickets' && tickets.length > 0 && !loading ? (
          <AdminPressable
            onPress={handleDeleteAll}
            style={localStyles.deleteAllBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete all tickets"
          >
            <Trash2 size={18} color={colors.error} />
          </AdminPressable>
        ) : null}
      />

      <View style={localStyles.tabSwitcher}>
        <AdminPressable
          style={[localStyles.tabBtn, activeTab === 'tickets' && localStyles.tabBtnActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Ticket size={16} color={activeTab === 'tickets' ? (isDark ? colors.text : colors.primary) : colors.textMuted} />
          <Text style={[localStyles.tabBtnText, activeTab === 'tickets' && localStyles.tabBtnTextActive]}>
            Tickets ({tickets.length})
          </Text>
        </AdminPressable>

        <AdminPressable
          style={[localStyles.tabBtn, activeTab === 'devices' && localStyles.tabBtnActive]}
          onPress={() => setActiveTab('devices')}
        >
          <Smartphone size={16} color={activeTab === 'devices' ? (isDark ? colors.text : colors.primary) : colors.textMuted} />
          <Text style={[localStyles.tabBtnText, activeTab === 'devices' && localStyles.tabBtnTextActive]}>
            Devices ({devices.length})
          </Text>
        </AdminPressable>
      </View>

      {activeTab === 'tickets' ? (
        loading ? (
          <LoadingState label="Loading tickets..." />
        ) : (
          <FlashList
            data={tickets}
            extraData={expandedTicketId}
            keyExtractor={(item: any) => item.id}
            renderItem={renderTicket}
            contentContainerStyle={localStyles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon={<Ticket size={30} color={colors.textSubtle} />}
                title="No Tickets Found"
                message="This user has not booked any bus tickets yet."
              />
            }
          />
        )
      ) : (
        devicesLoading ? (
          <LoadingState label="Loading devices..." />
        ) : (
          <FlashList
            data={devices}
            keyExtractor={(item: any) => item.id}
            renderItem={renderDeviceItem}
            contentContainerStyle={localStyles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <EmptyState
                icon={<Smartphone size={30} color={colors.textSubtle} />}
                title="No Devices Found"
                message="This user has no registered devices yet."
              />
            }
          />
        )
      )}

      {/* Single Confirmation Modal for Batch Delete - Reason Modal Completely Removed */}
      <ConfirmationModal
        visible={deleteAllConfirm}
        onClose={() => setDeleteAllConfirm(false)}
        onConfirm={confirmDeleteAll}
        title="Delete All Tickets?"
        message={`This will permanently delete all ${tickets.length} tickets for ${userName}. This action cannot be undone.`}
      />

      <EditTicketModal
        visible={editModal.visible}
        ticket={editModal.ticket}
        onClose={() => setEditModal({ visible: false, ticket: null })}
        onTicketUpdated={fetchTickets}
      />

      {/* Modern Floating Undo Toast (Option 3) */}
      <UndoToast
        visible={toastVisible}
        message="Ticket deleted"
        onUndo={handleUndo}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  listContent: { padding: SPACING.xl, paddingBottom: 60 },
  deleteAllBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.15)',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: colors.surfaceMuted,
  },
  tabBtnActive: {
    backgroundColor: colors.primarySoft || 'rgba(37, 99, 235, 0.1)',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    fontWeight: '800',
    color: colors.primary,
  },
  deviceCard: {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.subtle,
  },
  deviceCardBanned: {
    borderColor: colors.error + '40',
    backgroundColor: colors.errorSoft + '10',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  deviceCopy: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarApproved: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(5, 150, 105, 0.15)',
  },
  avatarBanned: {
    backgroundColor: colors.errorSoft,
    borderColor: 'rgba(225, 29, 72, 0.15)',
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  devicePlatform: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
    fontWeight: '600',
  },
  badgeCol: {
    justifyContent: 'center',
  },
  deviceDetails: {
    gap: 8,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  chipLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chipValText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: '500',
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deviceActionBtn: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
  },
  deviceActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deviceBanBtn: {
    backgroundColor: colors.errorSoft,
    borderColor: 'rgba(225, 29, 72, 0.2)',
  },
  deviceApproveBtn: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  logoutActiveBtn: {
    backgroundColor: colors.infoSoft,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  logoutInactiveBtn: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
});


