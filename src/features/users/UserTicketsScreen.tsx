import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../core/theme';
import { ArrowLeft, Ticket, MapPin, Calendar, Clock, Bus } from 'lucide-react-native';

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

  const renderTicket = ({ item }: any) => (
    <View style={styles.ticketCard}>
      <View style={styles.cardHeader}>
        <View style={styles.routeBox}>
          <Bus size={16} color="white" />
          <Text style={styles.routeText}>{item.route}</Text>
        </View>
        <Text style={styles.fareText}>₹{item.total || item.fare}</Text>
      </View>

      <View style={styles.pathRow}>
        <View style={styles.stopInfo}>
          <MapPin size={14} color="#10B981" />
          <Text style={styles.stopName} numberOfLines={1}>{item.source}</Text>
        </View>
        <View style={styles.connector} />
        <View style={styles.stopInfo}>
          <MapPin size={14} color="#EF4444" />
          <Text style={styles.stopName} numberOfLines={1}>{item.dest}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoItem}>
          <Calendar size={12} color={COLORS.textMuted} />
          <Text style={styles.infoText}>{item.date}</Text>
        </View>
        <View style={styles.infoItem}>
          <Clock size={12} color={COLORS.textMuted} />
          <Text style={styles.infoText}>{item.time}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.qtyText}>Qty: {item.qty}</Text>
        </View>
      </View>
      <Text style={styles.tid}>TID: {item.tid}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Tickets History</Text>
          <Text style={styles.headerSubtitle}>{userName}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ticket size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>No tickets found for this user.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    paddingTop: 60,
    gap: 15
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted },
  listContent: { padding: 16 },
  ticketCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  routeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 6 },
  routeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  fareText: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
  pathRow: { marginBottom: 15 },
  stopInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopName: { fontSize: 13, color: '#1E293B', fontWeight: '500', flex: 1 },
  connector: { width: 1, height: 10, backgroundColor: '#E2E8F0', marginLeft: 6, marginVertical: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginBottom: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11, color: COLORS.textMuted },
  qtyText: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary },
  tid: { fontSize: 9, color: '#CBD5E1', textAlign: 'center', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 14 }
});
