import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../core/theme';
import { useTheme } from '../../core/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Ticket = IconWrapper('ticket');
const Download = IconWrapper('download-outline');
import { exportToCSV } from '../../utils/csvHelper';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField, UndoToast } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';
import { EditTicketModal } from './EditTicketModal';

export const AllTicketsScreen = () => {
  const { colors } = useTheme();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState<{ visible: boolean; ticket: any | null }>({ visible: false, ticket: null });
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Undo Toast & Deletion Queue Refs
  const [toastVisible, setToastVisible] = useState(false);
  const pendingDeleteRef = useRef<{ id: string; ticket: any; timer: ReturnType<typeof setTimeout> | null } | null>(null);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedTicketId((prev) => (prev === id ? null : id));
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, users(name, email)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) {
        setTickets(data.map((t: any) => {
          const d = t.created_at ? new Date(t.created_at) : new Date();
          const dateStr = !isNaN(d.getTime()) ? `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('en-GB', { month: 'short' })}, ${d.getFullYear()}` : '';
          const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

          return {
            id: t.id,
            tid: t.id,
            userId: t.user_id,
            userName: t.users?.name || 'User',
            userEmail: t.users?.email || '',
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
    } catch (err) {
      if (__DEV__) console.warn('Fetch tickets error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.userName?.toLowerCase().includes(q) ||
        t.route?.toLowerCase().includes(q) ||
        t.id?.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

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
        details: `Ticket ${id} was deleted.`,
        targetId: id,
        targetType: 'TICKET',
      });
    } catch (error) {
      if (__DEV__) console.warn('Error deleting ticket from database:', error);
    }
  }, []);

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
    }, 10000);

    pendingDeleteRef.current = { id, ticket: ticketToDelete, timer };
  }, [tickets, commitPendingDelete]);

  // Undo deletion
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

  const handleEdit = useCallback((ticket: any) => {
    setEditModal({ visible: true, ticket });
  }, []);

  const renderTicket = useCallback(
    ({ item }: { item: any }) => (
      <TicketCard 
        ticket={item} 
        showUserInfo={true} 
        onDelete={handleDelete} 
        onEdit={handleEdit} 
        expanded={expandedTicketId === item.id}
        onToggleExpand={() => handleToggleExpand(item.id)}
      />
    ),
    [handleDelete, handleEdit, expandedTicketId, handleToggleExpand]
  );

  return (
    <AdminScreen>
      <AdminHeader
        title="Booking History"
        subtitle={`${filteredTickets.length} tickets visible`}
        action={(
          <IconButton
            tone="success"
            accessibilityLabel="Export bookings CSV"
            onPress={() => exportToCSV(tickets, `onedelhi_tickets_${new Date().getTime()}`)}
          >
            <Download size={18} color={COLORS.white} />
          </IconButton>
        )}
      />

      <View style={styles.searchWrap}>
        <SearchField
          placeholder="Search by ticket ID, user, or route..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <LoadingState label="Loading tickets..." />
      ) : (
        <AnyFlashList
          data={filteredTickets}
          extraData={expandedTicketId}
          estimatedItemSize={150}
          keyExtractor={(item: any) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              icon={<Ticket size={30} color={colors.textSubtle} />}
              title="No Tickets Found"
              message="Try searching with a different ticket ID, passenger name, or route number."
            />
          }
        />
      )}

      {/* Edit Ticket Modal (for editing details) */}
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
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  list: { padding: SPACING.xl, paddingBottom: 60 },
});
