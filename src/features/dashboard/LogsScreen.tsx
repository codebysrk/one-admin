import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Modal, ActivityIndicator, Alert } from 'react-native';
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { Search, Clock, User, Download, Activity, Shield, Smartphone, ChevronRight, Filter, Calendar, ArrowRight, Trash2, Settings, AlertTriangle } from 'lucide-react-native';
import { exportToCSV } from '../../utils/csvHelper';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField } from '../../components/AdminUI';
import { useAdminStore } from '../../store/useAdminStore';

const formatFullTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Pending';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = date.toLocaleDateString([], { day: '2-digit', month: 'short' });

  return isToday ? `Today, ${timeStr}` : `${dateStr}, ${timeStr}`;
};

export const LogsScreen = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [dateFilter, setDateFilter] = useState<'RECENT' | 'TODAY' | 'WEEK'>('RECENT');
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const setActiveTab = useAdminStore((state) => state.setActiveTab);

  useEffect(() => {
    let q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(150));
    
    if (dateFilter === 'TODAY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      q = query(collection(db, 'logs'), where('timestamp', '>=', Timestamp.fromDate(today)), orderBy('timestamp', 'desc'));
    } else if (dateFilter === 'WEEK') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      q = query(collection(db, 'logs'), where('timestamp', '>=', Timestamp.fromDate(weekAgo)), orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(logData);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dateFilter]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'ALL') return matchesSearch;
    return matchesSearch && log.type === activeFilter;
  });

  const getLogStyle = (action: string) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('DELETE') || act.includes('BANNED') || act.includes('FAILED')) return { color: COLORS.error, bg: COLORS.errorSoft };
    if (act.includes('ADD') || act.includes('CREATE') || act.includes('LOGIN') || act.includes('SUCCESS')) return { color: COLORS.success, bg: COLORS.successSoft };
    if (act.includes('UPDATE') || act.includes('EDIT')) return { color: COLORS.warning, bg: COLORS.warningSoft };
    if (act.includes('SEARCH')) return { color: COLORS.info, bg: COLORS.infoSoft };
    return { color: COLORS.accent, bg: COLORS.accentSoft };
  };

  const handleNavigate = (item: any) => {
    if (!item.targetType) return;
    if (item.targetType === 'USER') setActiveTab('Users');
    if (item.targetType === 'ROUTE') setActiveTab('Routes');
    if (item.targetType === 'TICKET') setActiveTab('Dashboard'); 
  };

  const handleCleanup = async (days: number | 'ALL') => {
    setCleaning(true);
    try {
      let q;
      if (days === 'ALL') {
        q = query(collection(db, 'logs'));
      } else {
        const cutOff = new Date();
        cutOff.setDate(cutOff.getDate() - days);
        q = query(collection(db, 'logs'), where('timestamp', '<', Timestamp.fromDate(cutOff)));
      }

      const snapshot = await getDocs(q);
      const batchSize = 100; // Firestore batch limit is 500, we'll be safe
      
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = snapshot.docs.slice(i, i + batchSize);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      Alert.alert('Success', `Successfully purged ${snapshot.docs.length} legacy logs.`);
      setShowCleanupModal(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Cleanup process failed.');
    } finally {
      setCleaning(false);
    }
  };

  const renderLogItem = ({ item, index }: any) => {
    const theme = getLogStyle(item.action);
    const isLast = index === filteredLogs.length - 1;

    return (
      <View style={styles.logWrapper}>
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineDot, { backgroundColor: theme.color }]} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>

        <TouchableOpacity 
          activeOpacity={0.85} 
          onPress={() => handleNavigate(item)}
          style={styles.logCard}
        >
          <View style={styles.logHeader}>
            <View style={[styles.typeBadge, { backgroundColor: item.type === 'ADMIN' ? COLORS.primary : COLORS.info }]}>
               {item.type === 'ADMIN' ? <Shield size={10} color={COLORS.white} /> : <User size={10} color={COLORS.white} />}
               <Text style={styles.typeText}>{item.type || 'SYSTEM'}</Text>
            </View>
            <View style={styles.timeWrapper}>
              <Clock size={12} color={COLORS.textSubtle} />
              <Text style={styles.timeText}>
                {formatFullTimestamp(item.timestamp)}
              </Text>
            </View>
          </View>

          <Text style={styles.logAction} numberOfLines={1}>{item.action}</Text>
          <Text style={styles.logDetails}>{item.details}</Text>

          {(item.oldValue !== undefined && item.newValue !== undefined) && (
            <View style={styles.deltaBox}>
              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>FROM</Text>
                <Text style={styles.deltaValue}>{String(item.oldValue)}</Text>
              </View>
              <ArrowRight size={12} color={COLORS.textSubtle} />
              <View style={styles.deltaRow}>
                <Text style={styles.deltaLabel}>TO</Text>
                <Text style={[styles.deltaValue, { color: theme.color }]}>{String(item.newValue)}</Text>
              </View>
            </View>
          )}

          {item.notes && (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>REASONING</Text>
              <Text style={styles.noteText}>{item.notes}</Text>
            </View>
          )}

          {item.deviceMeta && (
            <View style={styles.metaBox}>
               <View style={styles.metaRow}>
                  <Smartphone size={12} color={COLORS.textSubtle} />
                  <Text style={styles.metaTitle}>DEVICE HARDWARE</Text>
               </View>
               <View style={styles.deviceDetails}>
                  <Text style={styles.deviceText}>{item.deviceMeta.model || 'Unknown Device'} ({item.deviceMeta.os} {item.deviceMeta.osVersion})</Text>
                  <View style={[styles.securityPill, { backgroundColor: item.deviceMeta.isRooted ? COLORS.errorSoft : COLORS.successSoft }]}>
                     <Text style={[styles.securityText, { color: item.deviceMeta.isRooted ? COLORS.error : COLORS.success }]}>
                        {item.deviceMeta.isRooted ? 'EMULATOR/ROOTED' : 'SECURE DEVICE'}
                     </Text>
                  </View>
               </View>
               <Text style={styles.versionText}>App Version: {item.deviceMeta.appVersion}</Text>
            </View>
          )}

          <View style={styles.logFooter}>
            <View style={styles.actorInfo}>
              <View style={styles.actorAvatar}>
                <Text style={styles.actorInitial}>{(item.userName || item.name || item.userEmail || 'S').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.actorName} numberOfLines={1}>{item.userName || item.name || item.userEmail || 'Anonymous'}</Text>
            </View>
            {item.targetType && (
              <View style={styles.navIndicator}>
                <Text style={styles.navText}>View Details</Text>
                <ChevronRight size={12} color={COLORS.primary} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <AdminScreen>
      <AdminHeader
        title="Security Audit"
        subtitle="Real-time system activity feed"
        action={(
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              tone="neutral"
              accessibilityLabel="System Maintenance"
              onPress={() => setShowCleanupModal(true)}
              style={{ marginRight: 8 }}
            >
              <Settings size={18} color={COLORS.text} />
            </IconButton>
            <IconButton
              tone="success"
              accessibilityLabel="Export activity logs"
              onPress={() => exportToCSV(logs, `security_audit_${new Date().getTime()}`)}
            >
              <Download size={18} color={COLORS.white} />
            </IconButton>
          </View>
        )}
      />

      <View style={styles.controls}>
        <SearchField
          placeholder="Search by action, user or details..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.filterRow}>
          <View style={styles.tabGroup}>
            {(['ALL', 'ADMIN', 'USER'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
              >
                <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.dateGroup}>
            {(['RECENT', 'TODAY', 'WEEK'] as const).map((dF) => (
              <TouchableOpacity
                key={dF}
                onPress={() => setDateFilter(dF)}
                style={[styles.dateTab, dateFilter === dF && styles.activeDateTab]}
              >
                <Text style={[styles.dateTabText, dateFilter === dF && styles.activeDateTabText]}>
                  {dF.charAt(0)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {loading ? (
        <LoadingState label="Decrypting logs..." />
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState 
              icon={<Activity size={40} color={COLORS.textSubtle} />} 
              title="Audit Log Empty" 
              message="No activities recorded matching your current filters." 
            />
          }
        />
      )}

      {/* Maintenance Modal */}
      <Modal visible={showCleanupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.maintenanceCard}>
            <View style={styles.maintenanceHeader}>
               <View style={styles.warnIcon}>
                  <AlertTriangle size={24} color="#D97706" />
               </View>
               <Text style={styles.maintenanceTitle}>System Maintenance</Text>
               <TouchableOpacity onPress={() => !cleaning && setShowCleanupModal(false)}>
                  <X size={20} color={COLORS.textMuted} />
               </TouchableOpacity>
            </View>

            <View style={styles.maintenanceBody}>
               <Text style={styles.maintenanceLabel}>PRUNE AUDIT LOGS</Text>
               <Text style={styles.maintenanceDesc}>Deleting old logs will reduce your Firestore storage usage and improve audit performance.</Text>
               
               <View style={styles.cleanupActions}>
                  <TouchableOpacity 
                    style={styles.cleanupBtn} 
                    onPress={() => handleCleanup(7)}
                    disabled={cleaning}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                    <Text style={styles.cleanupBtnText}>Older than 7 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.cleanupBtn} 
                    onPress={() => handleCleanup(30)}
                    disabled={cleaning}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                    <Text style={styles.cleanupBtnText}>Older than 30 Days</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.cleanupBtn, { borderColor: COLORS.error, backgroundColor: COLORS.errorSoft }]} 
                    onPress={() => {
                      Alert.alert(
                        'Wipe All Logs?',
                        'This will permanently delete every log in the system. Proceed with caution.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Yes, Wipe All', style: 'destructive', onPress: () => handleCleanup('ALL') }
                        ]
                      )
                    }}
                    disabled={cleaning}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                    <Text style={[styles.cleanupBtnText, { color: COLORS.error }]}>Clear Entire History</Text>
                  </TouchableOpacity>
               </View>
            </View>

            {cleaning && (
               <View style={styles.cleaningOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.cleaningText}>Pruning Database Records...</Text>
               </View>
            )}
          </View>
        </View>
      </Modal>
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  controls: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, gap: SPACING.md },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  tabGroup: { flexDirection: 'row', gap: 6 },
  dateGroup: { flexDirection: 'row', gap: 4, backgroundColor: COLORS.surfaceMuted, padding: 3, borderRadius: RADIUS.md },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: COLORS.surfaceMuted, borderWidth: 1, borderColor: COLORS.border },
  activeFilterTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted },
  activeFilterTabText: { color: COLORS.white },
  dateTab: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  activeDateTab: { backgroundColor: COLORS.surface, ...SHADOWS.card },
  dateTabText: { fontSize: 10, fontWeight: '800', color: COLORS.textSubtle },
  activeDateTabText: { color: COLORS.primary },
  
  listContent: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xl, paddingBottom: 60 },
  logWrapper: { flexDirection: 'row', marginBottom: 2 },
  timelineContainer: { width: 30, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, zIndex: 1, marginTop: 18 },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginVertical: 2 },
  
  logCard: { 
    flex: 1, 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.lg, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    ...SHADOWS.card 
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  typeText: { fontSize: 9, fontWeight: '800', color: COLORS.white, textTransform: 'uppercase' },
  timeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { fontSize: 11, color: COLORS.textSubtle, fontWeight: '700' },
  
  logAction: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  logDetails: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 12, fontWeight: '500' },
  
  deltaBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceMuted, padding: 10, borderRadius: RADIUS.md, gap: 12, marginBottom: 16 },
  deltaRow: { flex: 1 },
  deltaLabel: { fontSize: 8, fontWeight: '800', color: COLORS.textSubtle, marginBottom: 2 },
  deltaValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  
  noteBox: { backgroundColor: '#FDF4FF', borderLeftWidth: 3, borderLeftColor: '#D946EF', padding: 10, borderRadius: 6, marginBottom: 16 },
  noteLabel: { fontSize: 9, fontWeight: '800', color: '#D946EF', marginBottom: 4 },
  noteText: { fontSize: 12, color: '#701A75', fontWeight: '600', fontStyle: 'italic' },
  
  logFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.surfaceMuted 
  },
  actorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  actorAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  actorInitial: { fontSize: 11, fontWeight: '800', color: COLORS.accent },
  actorName: { fontSize: 12, color: COLORS.text, fontWeight: '700', flex: 1 },
  navIndicator: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  navText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  metaBox: { marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#E2E8F0' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  metaTitle: { fontSize: 9, fontWeight: '900', color: COLORS.textSubtle, letterSpacing: 0.5 },
  deviceDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  deviceText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  securityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  securityText: { fontSize: 9, fontWeight: '900' },
  versionText: { fontSize: 10, color: COLORS.textSubtle, fontWeight: '600' },
  maintenanceCard: { width: '100%', backgroundColor: COLORS.surface, borderRadius: RADIUS.xxl, padding: 24, ...SHADOWS.floating },
  maintenanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  warnIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  maintenanceTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1 },
  maintenanceBody: { marginBottom: 12 },
  maintenanceLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textSubtle, letterSpacing: 0.5, marginBottom: 8 },
  maintenanceDesc: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', lineHeight: 20, marginBottom: 20 },
  cleanupActions: { gap: 10 },
  cleanupBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  cleanupBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  cleaningOverlay: { marginTop: 20, alignItems: 'center', gap: 10 },
  cleaningText: { fontSize: 12, fontWeight: '700', color: COLORS.primary }
});
