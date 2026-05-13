import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../core/theme';
import { Search, Ticket, Bus, User, Calendar } from 'lucide-react-native';

export const AllTicketsScreen = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredTickets = tickets.filter(t => 
    t.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.route?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tid?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.routeBox}>
          <Bus size={14} color="white" />
          <Text style={styles.routeText}>{item.route}</Text>
        </View>
        <Text style={styles.fareText}>₹{item.total}</Text>
      </View>
      
      <View style={styles.userRow}>
        <User size={12} color={COLORS.textMuted} />
        <Text style={styles.userName}>{item.userName || 'Unknown User'}</Text>
      </View>

      <Text style={styles.pathText} numberOfLines={1}>
        {item.source} → {item.dest}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.timeRow}>
          <Calendar size={12} color={COLORS.textMuted} />
          <Text style={styles.timeText}>{item.date} | {item.time}</Text>
        </View>
        <Text style={styles.tidText}>TID: {item.tid?.slice(-8)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Bookings</Text>
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search by user, route or TID..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ticket size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>No bookings found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 60 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B' },
  listContent: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  routeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 5 },
  routeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  fareText: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  userName: { fontSize: 13, color: '#475569', fontWeight: '600' },
  pathText: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { fontSize: 11, color: '#94A3B8' },
  tidText: { fontSize: 10, color: '#CBD5E1', fontWeight: 'bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 14 }
});
