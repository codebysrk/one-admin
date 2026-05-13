import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  deleteDoc,
  getDocs,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, SPACING } from '../../core/theme';
import { Ticket, Download } from 'lucide-react-native';
import { exportToCSV } from '../../utils/csvHelper';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, ReasonModal, SearchField, ConfirmationModal } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';

const FIRESTORE_IN_QUERY_MAX = 30;

async function mapTicketsWithUserNames(ticketData: any[]) {
  const userIds = [...new Set(ticketData.map((t) => t.userId).filter(Boolean))] as string[];
  const nameById: Record<string, string> = {};

  for (let i = 0; i < userIds.length; i += FIRESTORE_IN_QUERY_MAX) {
    const chunk = userIds.slice(i, i + FIRESTORE_IN_QUERY_MAX);
    try {
      const usersSnap = await getDocs(
        query(collection(db, 'users'), where(documentId(), 'in', chunk))
      );
      usersSnap.docs.forEach((d) => {
        const data = d.data();
        nameById[d.id] = data.name || 'Unknown User';
      });
    } catch (error) {
      if (__DEV__) console.warn('Batch user fetch failed:', error);
    }
  }

  return ticketData.map((ticket: any) => ({
    ...ticket,
    userName: ticket.userId ? nameById[ticket.userId] ?? 'Unknown User' : 'Unknown User',
  }));
}

export const AllTicketsScreen = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState({ visible: false, ticketId: '' });
  const [reasonModal, setReasonModal] = useState({ visible: false, ticketId: '' });

  useEffect(() => {
    let cancelled = false;
    const q = query(collection(db, 'tickets'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ticketData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const ticketsWithUsers = await mapTicketsWithUserNames(ticketData);
      if (!cancelled) {
        setTickets(ticketsWithUsers);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.userName?.toLowerCase().includes(q) ||
        t.route?.toLowerCase().includes(q) ||
        t.tid?.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  const handleDelete = useCallback((id: string) => {
    setConfirmModal({ visible: true, ticketId: id });
  }, []);

  const confirmDelete = useCallback(async (reason: string) => {
    const id = reasonModal.ticketId;
    try {
      await deleteDoc(doc(db, 'tickets', id));
      await logActivity({
        type: 'ADMIN',
        action: 'TICKET_DELETED',
        details: `Ticket ${id} was deleted.`,
        targetId: id,
        targetType: 'TICKET',
        notes: reason,
      });
      setReasonModal({ visible: false, ticketId: '' });
    } catch (error) {
      if (__DEV__) console.warn('Error deleting ticket:', error);
    }
  }, [reasonModal.ticketId]);

  const renderTicket = useCallback(
    ({ item }: { item: any }) => (
      <TicketCard ticket={item} showUserInfo={true} onDelete={handleDelete} />
    ),
    [handleDelete]
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
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          contentContainerStyle={styles.list}
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
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  list: { padding: SPACING.xl, paddingBottom: 40 },
});
