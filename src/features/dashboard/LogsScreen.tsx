import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { Search, Clock, User, Download, Activity } from 'lucide-react-native';
import { exportToCSV } from '../../utils/csvHelper';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField } from '../../components/AdminUI';

export const LogsScreen = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
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
    if (action?.includes('BANNED') || action?.includes('LOGOUT')) return COLORS.error;
    if (action?.includes('LOGIN')) return COLORS.success;
    if (action?.includes('BUY')) return COLORS.info;
    return COLORS.textMuted;
  };

  const renderLogItem = ({ item }: any) => {
    const actionColor = getActionColor(item.action);
    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={[styles.actionTag, { backgroundColor: `${actionColor}15` }]}>
            <Text style={[styles.actionText, { color: actionColor }]} numberOfLines={1}>{item.action}</Text>
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
            <Text style={styles.footerText} numberOfLines={1}>{item.userName} ({item.userEmail})</Text>
          </View>
          {item.deviceId ? (
            <Text style={styles.deviceText}>ID: {item.deviceId.slice(0, 8)}...</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <AdminScreen>
      <AdminHeader
        title="System Logs"
        subtitle={`${filteredLogs.length} recent events`}
        action={(
          <IconButton
            tone="success"
            accessibilityLabel="Export logs CSV"
            onPress={() => exportToCSV(logs, `logs_export_${new Date().getTime()}`)}
          >
            <Download size={18} color={COLORS.white} />
          </IconButton>
        )}
      />
      <View style={styles.searchWrap}>
        <SearchField
          placeholder="Search logs, users or actions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <LoadingState label="Loading logs..." />
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Activity size={30} color={COLORS.textSubtle} />} title="No matching logs" message="Try a broader search term or clear the filter." />}
        />
      )}
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  logCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 },
  actionTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, maxWidth: '52%' },
  actionText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0 },
  timeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  timeText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  logDetails: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 12, fontWeight: '600' },
  logFooter: { borderTopWidth: 1, borderTopColor: COLORS.surfaceMuted, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  footerText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', flex: 1 },
  deviceText: { fontSize: 11, color: COLORS.primary, fontWeight: '800' },
});
