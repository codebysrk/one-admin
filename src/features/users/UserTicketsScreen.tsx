import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SPACING } from '../../core/theme';
import { ArrowLeft, Ticket } from 'lucide-react-native';
import { EmptyState, LoadingState, ReasonModal, ConfirmationModal } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';

export const UserTicketsScreen = ({ navigation, route }: any) => {
  const { userId, userName } = route.params;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ visible: false, ticketId: '' });
  const [reasonModal, setReasonModal] = useState({ visible: false, ticketId: '' });

  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(data);
      setLoading(false);
    }, (err) => {
      if (__DEV__) console.warn('User tickets listener:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

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
        details: `Ticket ${id} of user ${userName} was deleted.`,
        targetId: id,
        targetType: 'TICKET',
        notes: reason
      });
      setReasonModal({ visible: false, ticketId: '' });
    } catch (error) {
      if (__DEV__) console.warn('Error deleting ticket:', error);
    }
  }, [reasonModal.ticketId, userName]);

  const renderTicket = useCallback(
    ({ item }: { item: any }) => (
      <TicketCard ticket={item} showUserInfo listUserName={userName} onDelete={handleDelete} />
    ),
    [handleDelete, userName]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Tickets History</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{userName}</Text>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Loading tickets..." />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={12}
          initialNumToRender={10}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Ticket size={30} color={COLORS.textSubtle} />} title="No tickets found" message="This user has no booking history yet." />}
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
        title="Delete Ticket?"
        message="This will permanently remove this ticket from the user's history and invalidate it."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 14 },
  headerCopy: { flex: 1, minWidth: 0 },
  backBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceMuted },
  headerTitle: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: COLORS.primary },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
});
