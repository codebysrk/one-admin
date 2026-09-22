import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, StatusBar, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Bell = IconWrapper('bell');
const Bus = IconWrapper('bus');
const ChevronRight = IconWrapper('chevron-right');
const Smartphone = IconWrapper('cellphone');
const Ticket = IconWrapper('ticket');
const TrendingUp = IconWrapper('trending-up');
const UserCircle = IconWrapper('account-circle');
const Users = IconWrapper('account-group');
const IndianRupee = IconWrapper('currency-inr');
const MapPin = IconWrapper('map-marker');
const ArrowUpRight = IconWrapper('arrow-top-right');
import { useAdminStore } from '../../store/useAdminStore';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { supabase } from '../../services/supabase';
import { AdminPressable, Card, SectionHeader, LoadingState, SkeletonBlock } from '../../components/AdminUI';

const formatLogTime = (timestamp: any) => {
  if (!timestamp) return 'Recent';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Recent';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  return isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}, ${timeStr}`;
};

const CompactHeader = React.memo(({ admin, onProfilePress }: any) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  return (
  <LinearGradient colors={['#4F46E5', '#3730A3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
    <SafeAreaView edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>One Delhi • Command Center</Text>
          <Text style={styles.adminName} numberOfLines={1}>{admin?.name || 'Administrator'}</Text>
        </View>
        <AdminPressable accessibilityRole="button" accessibilityLabel="Open profile settings" onPress={onProfilePress} style={styles.profileBtn}>
          <UserCircle size={28} color={colors.white} />
        </AdminPressable>
      </View>
    </SafeAreaView>
  </LinearGradient>
  );
});

const StatsGrid = React.memo(({ stats, weeklyRevenue, loading }: any) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const cards = [
    {
      key: 'weekly',
      label: 'Weekly Earnings',
      icon: TrendingUp,
      value: loading ? '...' : `₹${weeklyRevenue.toLocaleString('en-IN')}`,
      tone: colors.primary,
      bg: colors.primarySoft,
    },
    {
      key: 'revenue',
      label: 'Total Revenue',
      icon: IndianRupee,
      value: loading ? '...' : `₹${stats.revenue > 1000 ? (stats.revenue / 1000).toFixed(1) + 'k' : stats.revenue}`,
      tone: colors.success,
      bg: colors.successSoft,
    },
    {
      key: 'users',
      label: 'Active Users',
      icon: Users,
      value: loading ? '...' : stats.users.toLocaleString('en-IN'),
      tone: colors.accent,
      bg: colors.accentSoft,
    },
    {
      key: 'routes',
      label: 'Routes',
      icon: Bus,
      value: loading ? '...' : stats.routes.toLocaleString('en-IN'),
      tone: colors.warning,
      bg: colors.warningSoft,
    },
  ];

  return (
    <View style={styles.statsGrid}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIcon, { backgroundColor: card.bg }]}>
                <Icon size={16} color={card.tone} />
              </View>
              <Text style={styles.statLabel} numberOfLines={1}>{card.label}</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>{card.value}</Text>
          </Card>
        );
      })}
    </View>
  );
});

const RevenueChart = React.memo(({ loading, chartWidth, revenueData, chartConfig }: any) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  return (
  <Card style={styles.chartCard}>
    <SectionHeader
      icon={<TrendingUp size={17} color={isDark ? colors.text : colors.primary} />}
      title="Revenue Performance"
      caption="Earnings (₹) over the last 7 days"
    />
    <View style={styles.chartFrame}>
      {loading ? (
        <SkeletonBlock style={{ width: '100%', height: 160, borderRadius: 12 }} />
      ) : (
        <LineChart
          data={{
            labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Now'],
            datasets: [{ data: revenueData }],
          }}
          width={chartWidth}
          height={160}
          chartConfig={chartConfig}
          bezier
          withInnerLines
          withOuterLines={false}
          style={styles.chart}
        />
      )}
    </View>
  </Card>
  );
});

const ActivityItem = React.memo(({ log, isLast }: any) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  return (
  <View style={[styles.activityRow, isLast && styles.activityRowLast]}>
    <View style={[styles.activityDot, { backgroundColor: log.type === 'ADMIN' ? colors.primary : colors.info }]} />
    <View style={styles.activityContent}>
      <Text style={styles.activityTxt} numberOfLines={1}>{log.details || log.action}</Text>
      <Text style={styles.activityMeta}>{formatLogTime(log.timestamp)} • {log.userName || 'System'}</Text>
    </View>
  </View>
  );
});

const TicketItem = React.memo(({ ticket, isLast }: any) => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  return (
  <View style={[styles.activityRow, isLast && styles.activityRowLast]}>
    <View style={[styles.activityDot, { backgroundColor: ticket.busType === 'AC' ? colors.primary : colors.warning }]} />
    <View style={styles.activityContent}>
      <Text style={styles.activityTxt} numberOfLines={1}>{(ticket.route || 'Route')} • {ticket.source} to {ticket.dest}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={styles.activityMeta}>{formatLogTime(ticket.timestamp)} • </Text>
        {Number(ticket.fare) > Number(ticket.total || ticket.finalFare) && (
          <Text style={[styles.activityMeta, { textDecorationLine: 'line-through', opacity: 0.5 }]}>
            ₹{ticket.fare}
          </Text>
        )}
        <Text style={styles.activityMeta}>
          ₹{ticket.total || ticket.finalFare} • {ticket.qty} Ticket(s)
        </Text>
      </View>
    </View>
  </View>
  );
});

export const DashboardScreen = () => {
  console.log('DashboardScreen loaded successfully');
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const admin = useAdminStore((state) => state.admin);
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const [stats, setStats] = useState({ users: 0, revenue: 0, routes: 0 });
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [topRoutes, setTopRoutes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [liveTickets, setLiveTickets] = useState<any[]>([]);
  const [busStats, setBusStats] = useState({ ac: 0, nonAc: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [{ count: usersCount }, { count: routesCount }, { data: ticketsData }, { data: logsData }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('routes').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*').order('timestamp', { ascending: false }).limit(500),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      let totalRev = 0;
      let weeklyTotal = 0;
      const dailyRev = [0, 0, 0, 0, 0, 0, 0];
      const routeCount: Record<string, { count: number; revenue: number; originalRevenue: number }> = {};

      if (ticketsData) {
        ticketsData.forEach((data: any) => {
          const fare = Number(data.fare) || 0;
          const date = data.timestamp ? new Date(data.timestamp) : new Date();

          if (!Number.isNaN(date.getTime())) {
            const dayIndex = Math.floor((date.getTime() - sevenDaysAgo.getTime()) / (1000 * 3600 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
              dailyRev[dayIndex] += fare;
              weeklyTotal += fare;
            }
          }

          totalRev += fare;
          const rName = data.route || 'Unknown';
          if (!routeCount[rName]) routeCount[rName] = { count: 0, revenue: 0, originalRevenue: 0 };
          routeCount[rName].count += 1;
          routeCount[rName].revenue += fare;
          routeCount[rName].originalRevenue += fare;
        });

        const sortedRoutes = Object.entries(routeCount)
          .map(([name, val]) => ({ name, ...val }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3);

        setStats({
          users: usersCount || 0,
          revenue: totalRev,
          routes: routesCount || 0,
        });
        setWeeklyRevenue(weeklyTotal);
        setRevenueData(dailyRev);
        setTopRoutes(sortedRoutes);

        const liveTickets = ticketsData.slice(0, 5).map((d: any) => ({
          id: d.id,
          ...d,
          from: d.source,
          to: d.destination,
        }));
        setLiveTickets(liveTickets);
        const acCount = liveTickets.filter((t: any) => t.busType === 'AC').length;
        setBusStats({ ac: acCount, nonAc: liveTickets.length - acCount });
      }

      if (logsData) {
        setActivities(logsData.map((l: any) => ({
          id: l.id,
          action: l.action,
          details: l.details,
          userName: l.user_name,
          timestamp: l.created_at,
        })));
      }
    } catch (error) {
      if (__DEV__) console.warn('Dashboard stats fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllDashboard();
    }, [fetchAllDashboard])
  );

  useEffect(() => {
    fetchAllDashboard();

    const channel = supabase
      .channel('dashboard-realtime-sub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchAllDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        fetchAllDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchAllDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, () => {
        fetchAllDashboard();
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchAllDashboard();
    }, 10000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchAllDashboard]);

  const handleRefresh = useCallback(() => {
    fetchAllDashboard(true);
  }, [fetchAllDashboard]);

  const chartConfig = useMemo(
    () => ({
      backgroundColor: colors.surface,
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
      propsForDots: { r: '4', strokeWidth: '2', stroke: colors.white },
      propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border, opacity: 0.5 },
    }),
    []
  );

  const chartWidth = Math.max(260, width - 64);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CompactHeader admin={admin} onProfilePress={() => navigation.navigate('Profile')} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <StatsGrid stats={stats} weeklyRevenue={weeklyRevenue} loading={loading} />
        <RevenueChart loading={loading} chartWidth={chartWidth} revenueData={revenueData} chartConfig={chartConfig} />

        <SectionHeader
          icon={<MapPin size={17} color={isDark ? colors.text : colors.primary} />}
          title="Top Performing Routes"
          caption="Routes generating highest ticket volume"
        />
        
        <View style={styles.routesGrid}>
          {topRoutes.length === 0 ? (
            <Text style={styles.noData}>Collecting route data...</Text>
          ) : topRoutes.map((route, idx) => (
            <View key={route.name} style={styles.routeRow}>
              <View style={[styles.routeRank, { backgroundColor: idx === 0 ? '#FEF3C7' : colors.surfaceMuted }]}>
                <Text style={[styles.rankText, { color: idx === 0 ? '#D97706' : colors.textMuted }]}>{idx + 1}</Text>
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routeVolume}>{route.count} tickets issued</Text>
              </View>
              <View style={[styles.routeMetrics, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                {route.originalRevenue > route.revenue && (
                  <Text style={[styles.routeVolume, { textDecorationLine: 'line-through', fontSize: 11, opacity: 0.5 }]}>
                    ₹{route.originalRevenue.toLocaleString('en-IN')}
                  </Text>
                )}
                <Text style={styles.routeRev}>₹{route.revenue.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          ))}
        </View>

        <SectionHeader
          icon={<Smartphone size={17} color={isDark ? colors.text : colors.primary} />}
          title="Fleet Performance"
          caption="Ticket distribution by bus type"
        />
        
        <View style={styles.fleetGrid}>
          <Card style={styles.fleetCard}>
            <Text style={styles.fleetLabel}>AC BUSES</Text>
            <Text style={[styles.fleetValue, { color: isDark ? colors.text : colors.primary }]}>{busStats.ac}</Text>
          </Card>
          <Card style={styles.fleetCard}>
            <Text style={styles.fleetLabel}>NON-AC BUSES</Text>
            <Text style={[styles.fleetValue, { color: colors.warning }]}>{busStats.nonAc}</Text>
          </Card>
        </View>

        <SectionHeader
          icon={<Ticket size={17} color={isDark ? colors.text : colors.primary} />}
          title="Live Ticket Feed"
          caption="Real-time passenger bookings"
        />

        <Card style={styles.activityFeed}>
          {liveTickets.length === 0 ? (
            <Text style={styles.noData}>Waiting for bookings...</Text>
          ) : liveTickets.map((ticket, index) => (
            <TicketItem key={ticket.id} ticket={ticket} isLast={index === liveTickets.length - 1} />
          ))}
        </Card>

        <SectionHeader
          icon={<Bell size={17} color={isDark ? colors.text : colors.primary} />}
          title="Security Feed"
          caption="Latest critical system activities"
          action={(
            <AdminPressable style={styles.viewAll} onPress={() => navigation.navigate('Logs')}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={colors.accent} />
            </AdminPressable>
          )}
        />

        <Card style={styles.activityFeed}>
          {loading ? (
            <View style={{ padding: 16 }}>
              <SkeletonBlock style={{ height: 40, width: '100%', marginBottom: 12, borderRadius: 8 }} />
              <SkeletonBlock style={{ height: 40, width: '100%', marginBottom: 12, borderRadius: 8 }} />
              <SkeletonBlock style={{ height: 40, width: '100%', borderRadius: 8 }} />
            </View>
          ) : activities.map((log: any, index) => (
            <ActivityItem key={log.id} log={log} isLast={index === activities.length - 1} />
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};

function getStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { paddingBottom: 20, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
  headerCopy: { flex: 1 },
  greeting: { fontSize: 10, color: '#E0E7FF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  adminName: { fontSize: 24, fontWeight: '800', color: colors.white, marginTop: 4 },
  profileBtn: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginTop: 16 },
  contentInner: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%', flexGrow: 1, marginBottom: 0, padding: 14 },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  statIcon: { width: 28, height: 28, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', flexShrink: 1 },
  chartCard: { padding: 16, marginBottom: 24 },
  chartFrame: { marginTop: 16 },
  chart: { marginLeft: -15 },
  routesGrid: { backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border, ...SHADOWS.card },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routeRank: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '800' },
  routeInfo: { flex: 1, marginLeft: 12 },
  routeName: { fontSize: 14, fontWeight: '800', color: colors.text },
  routeVolume: { fontSize: 11, color: colors.textSubtle, marginTop: 2, fontWeight: '600' },
  routeMetrics: { alignItems: 'flex-end' },
  routeRev: { fontSize: 14, fontWeight: '800', color: colors.success },
  noData: { textAlign: 'center', color: colors.textMuted, fontSize: 12, paddingVertical: 10 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: 11, fontWeight: '800', color: colors.accent },
  activityFeed: { padding: 0, overflow: 'hidden' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityRowLast: { borderBottomWidth: 0 },
  activityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 12 },
  activityContent: { flex: 1 },
  activityTxt: { fontSize: 13, color: colors.text, fontWeight: '700' },
  activityMeta: { fontSize: 10, color: colors.textSubtle, marginTop: 2, fontWeight: '600' },
  fleetGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  fleetCard: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
  fleetLabel: { fontSize: 9, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  fleetValue: { fontSize: 24, fontWeight: '900' },
  });
}
