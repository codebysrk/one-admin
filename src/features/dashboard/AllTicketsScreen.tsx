import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { supabase } from '../../services/supabase';
import { COLORS, SPACING } from '../../core/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Ticket = IconWrapper('ticket');
const Download = IconWrapper('download-outline');
import { exportToCSV } from '../../utils/csvHelper';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, ReasonModal, SearchField, ConfirmationModal } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';
import { EditTicketModal } from './EditTicketModal';

export const AllTicketsScreen = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState({ visible: false, ticketId: '' });
  const [reasonModal, setReasonModal] = useState({ visible: false, ticketId: '' });
  const [editModal, setEditModal] = useState<{ visible: boolean; ticket: any | null }>({ visible: false, ticket: null });

  const fetchTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data) {
        setTickets(data.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          userName: t.user_name || 'Unknown User',
          userEmail: t.user_email,
          route: t.route,
          fare: t.fare,
          passengers: t.passengers,
          busNumber: t.bus_number,
          qrPayload: t.qr_payload,
          isUsed: t.is_used,
          status: t.status,
          timestamp: t.timestamp,
          from: t.source,
          to: t.destination,
        })));
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

  const handleDelete = useCallback((id: string) => {
    setConfirmModal({ visible: true, ticketId: id });
  }, []);

  const confirmDelete = useCallback(async (reason: string) => {
    const id = reasonModal.ticketId;
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      await logActivity({
        type: 'ADMIN',
        action: 'TICKET_DELETED',
        details: `Ticket ${id} was deleted.`,
        targetId: id,
        targetType: 'TICKET',
        notes: reason,
      });
      setReasonModal({ visible: false, ticketId: '' });
      fetchTickets();
    } catch (error) {
      if (__DEV__) console.warn('Error deleting ticket:', error);
    }
  }, [reasonModal.ticketId, fetchTickets]);

  const handleEdit = useCallback((ticket: any) => {
    setEditModal({ visible: true, ticket });
  }, []);

  const renderTicket = useCallback(
    ({ item }: { item: any }) => (
      <TicketCard ticket={item} showUserInfo={true} onDelete={handleDelete} onEdit={handleEdit} />
    ),
    [handleDelete, handleEdit]
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
          placeholder="Search by TID, user or route..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <LoadingState label="Loading bookings..." />
      ) : (
        <AnyFlashList
          data={filteredTickets}
          estimatedItemSize={150}
          keyExtractor={(item: any) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={<EmptyState icon={<Ticket size={30} color={COLORS.textSubtle} />} title="No bookings found" message="Try a different route, user, or ticket ID." />}
        />
      )}

      <ReasonModal
        visible={reasonModal.visible}
        onClose={() => setReasonModal({ visible: false, ticketId: '' })}
        title="Delete Ticket Record"
        onSubmit={confirmDelete}
      />

      <ConfirmationModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, ticketId: '' })}
        onConfirm={() => {
          const id = confirmModal.ticketId;
          setConfirmModal({ visible: false, ticketId: '' });
          setReasonModal({ visible: true, ticketId: id });
        }}
        title="Void Ticket?"
        message="This will permanently mark this ticket as invalid and remove it from the system audit."
      />

      <EditTicketModal
        visible={editModal.visible}
        ticket={editModal.ticket}
        onClose={() => setEditModal({ visible: false, ticket: null })}
        onTicketUpdated={fetchTickets}
      />
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  list: { padding: SPACING.xl, paddingBottom: 40 },
});
