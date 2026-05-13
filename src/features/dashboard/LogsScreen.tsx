import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, SPACING } from '../../core/theme';
import { Search, Filter, Clock, User, ShieldAlert } from 'lucide-react-native';

export const LogsScreen = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes('BANNED') || action.includes('LOGOUT')) return '#EF4444';
    if (action.includes('LOGIN')) return '#10B981';
    if (action.includes('BUY')) return '#3B82F6';
    return '#6B7280';
  };

  const renderLogItem = ({ item }: any) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.actionTag, { backgroundColor: getActionColor(item.action) + '15' }]}>
          <Text style={[styles.actionText, { color: getActionColor(item.action) }]}>{item.action}</Text>
        </View>
        <View style={styles.timeWrapper}>
          <Clock size={12} color={COLORS.textMuted} />
          <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}</Text>
        </View>
      </View>
      
      <Text style={styles.logDetails}>{item.details}</Text>
      
      <View style={styles.logFooter}>
        <View style={styles.footerItem}>
          <User size={14} color={COLORS.textMuted} />
          <Text style={styles.footerText}>{item.userName} ({item.userEmail})</Text>
        </View>
        {item.deviceId && (
          <View style={styles.footerItem}>
            <Text style={[styles.footerText, { color: COLORS.primary }]}>ID: {item.deviceId.slice(0, 8)}...</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Logs</Text>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            placeholder="Search logs, users or actions..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching logs found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    padding: 20, 
    backgroundColor: 'white', 
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 60
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  listContent: { padding: 16 },
  logCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  actionTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  actionText: { fontSize: 10, fontWeight: 'bold' },
  timeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 11, color: COLORS.textMuted },
  logDetails: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 12 },
  logFooter: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: COLORS.textMuted },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted }
});
