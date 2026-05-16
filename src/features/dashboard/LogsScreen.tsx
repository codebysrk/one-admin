import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { useNavigation } from '@react-navigation/native';
import { collection, onSnapshot, query, orderBy, limit, where, Timestamp, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Search = IconWrapper('magnify');
const Clock = IconWrapper('clock-outline');
const User = IconWrapper('account');
const Download = IconWrapper('download-outline');
const Activity = IconWrapper('pulse');
const Shield = IconWrapper('shield-outline');
const Smartphone = IconWrapper('cellphone');
const ChevronRight = IconWrapper('chevron-right');
const ArrowRight = IconWrapper('arrow-right');
const Trash2 = IconWrapper('trash-can-outline');
const Settings = IconWrapper('cog-outline');
const AlertTriangle = IconWrapper('alert');
import { exportToCSV } from '../../utils/csvHelper';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField, AdminBottomSheet, ConfirmationModal } from '../../components/AdminUI';
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
  const [confirmModal, setConfirmModal] = useState({ visible: false, days: 0 as number | 'ALL' });
  const navigation = useNavigation<any>();

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
      if (__DEV__) console.warn('Logs listener:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dateFilter]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const matchesSearch =
        log.userName?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.notes?.toLowerCase().includes(q);

      if (activeFilter === 'ALL') return matchesSearch;
      return matchesSearch && log.type === activeFilter;
    });
  }, [logs, searchQuery, activeFilter]);

  const getLogStyle = useCallback((action: string) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('DELETE') || act.includes('BANNED') || act.includes('FAILED')) return { color: COLORS.error, bg: COLORS.errorSoft };
    if (act.includes('ADD') || act.includes('CREATE') || act.includes('LOGIN') || act.includes('SUCCESS')) return { color: COLORS.success, bg: COLORS.successSoft };
    if (act.includes('UPDATE') || act.includes('EDIT')) return { color: COLORS.warning, bg: COLORS.warningSoft };
    if (act.includes('SEARCH')) return { color: COLORS.info, bg: COLORS.infoSoft };
    return { color: COLORS.accent, bg: COLORS.accentSoft };
  }, []);

  const handleNavigate = useCallback(
    (item: any) => {
      if (!item.targetType) return;
      if (item.targetType === 'USER') navigation.navigate('Users');
      if (item.targetType === 'ROUTE') navigation.navigate('Routes');
      if (item.targetType === 'TICKET') navigation.navigate('Tickets');
      if (item.targetType === 'ADMIN') navigation.navigate('Admins');
      if (item.targetType === 'NOTIFICATION') navigation.navigate('Alerts');
    },
    [navigation]
  );

  const handleCleanup = async (days: number | 'ALL') => {
    setConfirmModal({ visible: true, days });
  };

  const executeCleanup = async () => {
    const days = confirmModal.days;
    setConfirmModal({ ...confirmModal, visible: false });
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
      const batchSize = 100;
      
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = snapshot.docs.slice(i, i + batchSize);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      Alert.alert('Success', `Successfully purged ${snapshot.docs.length} legacy logs.`);
      setShowCleanupModal(false);
    } catch (error) {
      if (__DEV__) console.warn('Log cleanup failed:', error);
      Alert.alert('Error', 'Cleanup process failed.');
    } finally {
      setCleaning(false);
    }
  };

  const renderLogItem = useCallback(
    ({ item, index }: any) => {
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
    },
    [filteredLogs, getLogStyle, handleNavigate]
  );

  return (
    <AdminScreen>
      <AdminHeader
        title="Security Audit"
        subtitle="Real-time system activity feed"
        action={(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <IconButton
              tone="neutral"
              accessibilityLabel="System Maintenance"
              onPress={() => setShowCleanupModal(true)}
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
        <AnyFlashList
          data={filteredLogs}
          keyExtractor={(item: any) => item.id}
          renderItem={renderLogItem}
          estimatedItemSize={220}
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

      <AdminBottomSheet
        visible={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        title="System Maintenance"
        subtitle="Optimize your database performance"
        loading={cleaning}
        loadingText="Pruning Database Records..."
        headerIcon={<AlertTriangle size={20} color="#D97706" />}
      >
        <View style={styles.alertBox}>
          <Text style={styles.maintenanceDesc}>Deleting old logs reduces storage costs and keeps the audit feed responsive.</Text>
        </View>
        
        <View style={styles.cleanupActions}>
          <TouchableOpacity 
            style={styles.cleanupBtn} 
            onPress={() => handleCleanup(7)}
            disabled={cleaning}
          >
            <View style={styles.btnIconBox}><Trash2 size={16} color={COLORS.textMuted} /></View>
            <Text style={styles.cleanupBtnText}>Older than 7 Days</Text>
            <ChevronRight size={14} color={COLORS.border} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cleanupBtn} 
            onPress={() => handleCleanup(30)}
            disabled={cleaning}
          >
            <View style={styles.btnIconBox}><Trash2 size={16} color={COLORS.textMuted} /></View>
            <Text style={styles.cleanupBtnText}>Older than 30 Days</Text>
            <ChevronRight size={14} color={COLORS.border} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.cleanupBtn, { borderStyle: 'dashed' }]} 
            onPress={() => handleCleanup('ALL')}
            disabled={cleaning}
          >
            <View style={[styles.btnIconBox, { backgroundColor: COLORS.errorSoft }]}><Trash2 size={16} color={COLORS.error} /></View>
            <Text style={[styles.cleanupBtnText, { color: COLORS.error }]}>Clear Entire History</Text>
            <ChevronRight size={14} color={COLORS.errorSoft} />
          </TouchableOpacity>
        </View>
      </AdminBottomSheet>

      <ConfirmationModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ ...confirmModal, visible: false })}
        onConfirm={executeCleanup}
        title={confirmModal.days === 'ALL' ? 'Wipe Audit History?' : 'Purge Old Logs?'}
        message={confirmModal.days === 'ALL' 
          ? 'This will permanently remove every log entry in the system. This action is irreversible.' 
          : `This will permanently delete audit records older than ${confirmModal.days} days.`}
      />
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
  deviceDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  deviceText: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1 },
  securityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  securityText: { fontSize: 9, fontWeight: '900' },
  versionText: { fontSize: 10, color: COLORS.textSubtle, fontWeight: '600' },
  alertBox: { backgroundColor: COLORS.surfaceMuted, padding: 16, borderRadius: 16, marginBottom: 24 },
  maintenanceDesc: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', lineHeight: 20 },
  cleanupActions: { gap: 12 },
  cleanupBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14, 
    padding: 16, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    backgroundColor: COLORS.surface 
  },
  btnIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  cleanupBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.text, flex: 1 },
});
