import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SPACING } from '../../core/theme';
import { ArrowLeft, Ticket } from 'lucide-react-native';
import { EmptyState, LoadingState } from '../../components/AdminUI';
import { TicketCard } from '../../components/TicketCard';

export const UserTicketsScreen = ({ navigation, route }: any) => {
  const { userId, userName } = route.params;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

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
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Ticket size={30} color={COLORS.textSubtle} />} title="No tickets found" message="This user has no booking history yet." />}
        />
      )}
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
