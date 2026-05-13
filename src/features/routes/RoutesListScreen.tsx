import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { Bus, Search, Plus, MapPin, ChevronRight, Settings2, Clock } from 'lucide-react-native';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField } from '../../components/AdminUI';
import { useAdminStore } from '../../store/useAdminStore';

export const RoutesListScreen = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const setActiveTab = useAdminStore((state) => state.setActiveTab);

  useEffect(() => {
    const q = query(collection(db, 'routes'), orderBy('routeNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRoutes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredRoutes = routes.filter(r => r.routeNumber?.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderRoute = ({ item }: any) => (
    <TouchableOpacity style={styles.routeCard} activeOpacity={0.82} accessibilityRole="button" onPress={() => setActiveTab('RoutesManage')}>
      <View style={styles.cardHeader}>
        <View style={styles.routeIcon}>
          <Bus size={22} color="white" />
        </View>
        <View style={styles.routeMeta}>
          <Text style={styles.routeNum}>{item.routeNumber}</Text>
          <Text style={styles.stopCount}>{item.stops?.length || 0} stops configured</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setActiveTab('RoutesManage')} accessibilityRole="button" accessibilityLabel={`Manage route ${item.routeNumber}`}>
          <Settings2 size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.pathPreview}>
        <View style={styles.stopNode}>
          <MapPin size={12} color={COLORS.success} />
          <Text style={styles.stopName} numberOfLines={1}>{item.stops?.[0]?.name || 'Start'}</Text>
        </View>
        <View style={styles.connector} />
        <View style={styles.stopNode}>
          <MapPin size={12} color={COLORS.error} />
          <Text style={styles.stopName} numberOfLines={1}>{item.stops?.[item.stops?.length - 1]?.name || 'End'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <Clock size={12} color={COLORS.textSubtle} />
          <Text style={styles.footerText}>Last sync: Today 10:30 AM</Text>
        </View>
        <View style={styles.goBtn}>
          <Text style={styles.goText}>Manage</Text>
          <ChevronRight size={14} color={COLORS.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminScreen>
      <AdminHeader
        title="Route Network"
        subtitle={`${filteredRoutes.length} visible routes`}
        action={(
          <IconButton accessibilityLabel="Add route" onPress={() => setActiveTab('RoutesManage')}>
            <Plus size={20} color={COLORS.white} />
          </IconButton>
        )}
      />
      <View style={styles.searchWrap}>
        <SearchField placeholder="Find a route..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <LoadingState label="Loading routes..." />
      ) : (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.id}
          renderItem={renderRoute}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon={<Search size={30} color={COLORS.textSubtle} />} title="No routes found" message="Try another route number or clear the search." />}
        />
      )}
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  list: { padding: SPACING.xl, paddingBottom: 40 },
  routeCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeIcon: { width: 46, height: 46, borderRadius: RADIUS.md, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', ...SHADOWS.accent },
  routeMeta: { flex: 1, marginLeft: 14 },
  routeNum: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: COLORS.text },
  stopCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  settingsBtn: { padding: 8 },
  pathPreview: { backgroundColor: COLORS.surfaceMuted, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: 16 },
  stopNode: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopName: { fontSize: 12, color: COLORS.text, fontWeight: '600', flex: 1 },
  connector: { width: 1, height: 8, backgroundColor: COLORS.border, marginLeft: 5, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.surfaceMuted, paddingTop: 12, gap: 12 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 10, color: COLORS.textSubtle, fontWeight: '700' },
  goBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goText: { fontSize: 12, fontWeight: '800', color: COLORS.accent },
});
