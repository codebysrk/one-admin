import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
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
import { EmptyState, LoadingState, ConfirmationModal } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';
import { EditTicketModal } from '../dashboard/EditTicketModal';

// Floating Undo Toast Component (Option 3)
const UndoToast = ({
  visible,
  message = 'Ticket deleted',
  onUndo,
}: {
  visible: boolean;
  message?: string;
  onUndo: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.undoToast,
        {
          bottom: Math.max(insets.bottom, 16) + 12,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.undoToastCopy}>
        <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
        <Text style={styles.undoToastMessage}>{message}</Text>
      </View>
      <TouchableOpacity
        onPress={onUndo}
        activeOpacity={0.7}
        style={styles.undoToastBtn}
        accessibilityRole="button"
        accessibilityLabel="Undo delete"
      >
        <Text style={styles.undoToastBtnText}>UNDO</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const UserTicketsScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useTheme();
  const localStyles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const { userId, userName } = route.params;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, [fetchTickets]);

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

  // Instant Delete with 4s Undo window (Option 3)
  const handleDelete = useCallback((id: string) => {
    if (pendingDeleteRef.current) {
      if (pendingDeleteRef.current.timer) clearTimeout(pendingDeleteRef.current.timer);
      commitPendingDelete();
    }

    const ticketToDelete = tickets.find((t) => t.id === id);
    if (!ticketToDelete) return;

    // Optimistically remove from state immediately
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setToastVisible(true);

    const timer = setTimeout(() => {
      commitPendingDelete();
    }, 4000);

    pendingDeleteRef.current = { id, ticket: ticketToDelete, timer };
  }, [tickets, commitPendingDelete]);

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

  return (
    <SafeAreaView style={localStyles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={isDark ? colors.text : colors.primary} />
        </TouchableOpacity>
        <View style={localStyles.headerCopy}>
          <Text style={localStyles.headerTitle}>Tickets History ({tickets.length})</Text>
          <Text style={localStyles.headerSubtitle} numberOfLines={1}>{userName}</Text>
        </View>
        {tickets.length > 0 && !loading && (
          <TouchableOpacity
            onPress={handleDeleteAll}
            style={localStyles.deleteAllBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete all tickets"
          >
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <LoadingState label="Loading tickets..." />
      ) : (
        <AnyFlashList
          data={tickets}
          extraData={expandedTicketId}
          estimatedItemSize={150}
          keyExtractor={(item: any) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={localStyles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <EmptyState
              icon={<Ticket size={30} color={colors.textSubtle} />}
              title="No tickets found"
              message="This user has no booking history yet."
            />
          }
        />
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 },
  headerCopy: { flex: 1, minWidth: 0 },
  backBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: colors.surfaceMuted },
  headerTitle: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: colors.background === '#000000' ? colors.text : colors.primary },
  headerSubtitle: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  listContent: { padding: SPACING.xl, paddingBottom: 60 },
  deleteAllBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: colors.errorSoft },
});

const styles = StyleSheet.create({
  undoToast: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: '#18181B',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.floating,
    elevation: 8,
    zIndex: 9999,
  },
  undoToastCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoToastMessage: {
    color: '#F4F4F5',
    fontSize: 13,
    fontWeight: '600',
  },
  undoToastBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.sm,
  },
  undoToastBtnText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
