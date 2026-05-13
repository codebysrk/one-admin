import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, SPACING } from '../../core/theme';
import { Ticket, Download } from 'lucide-react-native';
import { exportToCSV } from '../../utils/csvHelper';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField, ReasonModal } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';

export const AllTicketsScreen = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonModal, setReasonModal] = useState({ visible: false, ticketId: '' });

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ticketData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch user names for each ticket
      const ticketsWithUsers = await Promise.all(
        ticketData.map(async (ticket: any) => {
          if (ticket.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', ticket.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return { ...ticket, userName: userData.name || 'Unknown User' };
              }
            } catch (error) {
              console.error('Error fetching user:', error);
            }
          }
          return { ...ticket, userName: 'Unknown User' };
        })
      );
      
      setTickets(ticketsWithUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

    t.tid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setReasonModal({ visible: true, ticketId: id });
  };

  const confirmDelete = async (reason: string) => {
    const id = reasonModal.ticketId;
    try {
      await deleteDoc(doc(db, 'tickets', id));
      await logActivity({
        type: 'ADMIN',
        action: 'TICKET_DELETED',
        details: `Ticket ${id} was deleted.`,
        targetId: id,
        targetType: 'TICKET',
        notes: reason
      });
      setReasonModal({ visible: false, ticketId: '' });
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

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
          renderItem={({ item }) => (
            <TicketCard 
              ticket={item} 
              showUserInfo={true} 
              onDelete={handleDelete}
            />
          )}
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
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  list: { padding: SPACING.xl, paddingBottom: 40 },
});
