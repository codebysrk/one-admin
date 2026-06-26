import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SPACING  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const ArrowLeft = IconWrapper('arrow-left');
const Ticket = IconWrapper('ticket');
const Trash2 = IconWrapper('trash-can-outline');
import { EmptyState, LoadingState, ReasonModal, ConfirmationModal } from '../../components/AdminUI';
import { logActivity } from '../../services/logService';
import { TicketCard } from '../../components/TicketCard';

export const UserTicketsScreen = ({ navigation, route }: any) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const { userId, userName } = route.params;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ visible: false, ticketId: '' });
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteAllReason, setDeleteAllReason] = useState(false);

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

  const executeDelete = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tickets', id));
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

  const handleDeleteAll = useCallback(() => {
    setDeleteAllConfirm(true);
  }, []);

  const confirmDeleteAll = useCallback(async (reason: string) => {
    try {
      const batch = writeBatch(db);
      tickets.forEach((ticket) => {
        const ref = doc(db, 'tickets', ticket.id);
        batch.delete(ref);
      });
      await batch.commit();

      await logActivity({
        type: 'ADMIN',
        action: 'ALL_USER_TICKETS_DELETED',
        details: `Deleted all ${tickets.length} tickets for user ${userName} (${userId}).`,
        targetId: userId,
        targetType: 'USER',
        notes: reason
      });
      setDeleteAllReason(false);
    } catch (error) {
      if (__DEV__) console.warn('Error deleting all tickets:', error);
    }
  }, [tickets, userName, userId]);

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
          <ArrowLeft size={20} color={isDark ? colors.text : colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Tickets History ({tickets.length})</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{userName}</Text>
        </View>
        {tickets.length > 0 && !loading && (
          <TouchableOpacity 
            onPress={handleDeleteAll} 
            style={styles.deleteAllBtn}
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
          estimatedItemSize={150}
          keyExtractor={(item: any) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Ticket size={30} color={colors.textSubtle} />} title="No tickets found" message="This user has no booking history yet." />}
        />
      )}

      <ConfirmationModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, ticketId: '' })}
        onConfirm={() => {
          const id = confirmModal.ticketId;
          setConfirmModal({ visible: false, ticketId: '' });
          executeDelete(id);
        }}
        title="Delete Ticket?"
        message="This will permanently remove this ticket from the user's history and invalidate it."
      />

      <ReasonModal
        visible={deleteAllReason}
        onClose={() => setDeleteAllReason(false)}
        title="Reason for Batch Deletion"
        placeholder="Reason for deleting all user tickets..."
        onSubmit={confirmDeleteAll}
      />

      <ConfirmationModal
        visible={deleteAllConfirm}
        onClose={() => setDeleteAllConfirm(false)}
        onConfirm={() => {
          setDeleteAllConfirm(false);
          setDeleteAllReason(true);
        }}
        title="Delete All Tickets?"
        message={`This will permanently delete all ${tickets.length} tickets for ${userName}. This action cannot be undone.`}
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
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  deleteAllBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: colors.errorSoft },
});
