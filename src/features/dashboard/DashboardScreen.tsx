import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getCountFromServer, limit, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import {
  Activity,
  Bell,
  Bus,
  Calendar,
  ChevronRight,
  LayoutGrid,
  Smartphone,
  Ticket,
  TrendingUp,
  UserCircle,
  UserMinus,
  Users,
} from 'lucide-react-native';
import { useAdminStore } from '../../store/useAdminStore';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../core/theme';
import { db } from '../../services/firebase';
import { AdminPressable, Card, EmptyState, LoadingState, SectionHeader } from '../../components/AdminUI';

const statCards = [
  { key: 'tickets', label: 'Bookings', icon: Ticket, tone: COLORS.success, bg: COLORS.successSoft },
  { key: 'users', label: 'Users', icon: Users, tone: COLORS.accent, bg: COLORS.accentSoft },
  { key: 'routes', label: 'Routes', icon: Bus, tone: COLORS.warning, bg: COLORS.warningSoft },
] as const;

const quickActions = [
  { label: 'Devices', target: 'Devices', icon: Smartphone, tone: COLORS.info, bg: COLORS.infoSoft },
  { label: 'System Logs', target: 'Logs', icon: Activity, tone: COLORS.success, bg: COLORS.successSoft },
  { label: 'Cleanup', target: 'Cleanup', icon: UserMinus, tone: COLORS.warning, bg: COLORS.warningSoft },
  { label: 'Alerts', target: 'Alerts', icon: Bell, tone: COLORS.error, bg: COLORS.errorSoft },
] as const;

const formatLogTime = (timestamp: any) => {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const DashboardScreen = () => {
  const admin = useAdminStore((state) => state.admin);
  const setActiveTab = useAdminStore((state) => state.setActiveTab);
  const { width } = useWindowDimensions();

  const [stats, setStats] = useState({ users: 0, tickets: 0, routes: 0 });
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeTickets: undefined | (() => void);

    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const ticketsSnap = await getCountFromServer(collection(db, 'tickets'));
        const routesSnap = await getCountFromServer(collection(db, 'routes'));

        setStats({
          users: usersSnap.data().count,
          tickets: ticketsSnap.data().count,
          routes: routesSnap.data().count,
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const qTickets = query(collection(db, 'tickets'), where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)));

        unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
          const counts = [0, 0, 0, 0, 0, 0, 0];
          snapshot.docs.forEach(doc => {
            const date = doc.data().timestamp.toDate();
            const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
            if (diffDays >= 0 && diffDays < 7) counts[6 - diffDays]++;
          });
          setWeeklyData(counts);
        });
      } catch (error) {
        console.error(error);
      }
    };

    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(6));
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    fetchStats();

    return () => {
      unsubscribeLogs();
      unsubscribeTickets?.();
    };
  }, []);

  const totalWeeklyBookings = useMemo(() => weeklyData.reduce((sum, value) => sum + value, 0), [weeklyData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(91, 104, 122, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '0', color: COLORS.accent },
    propsForBackgroundLines: { strokeDasharray: '', stroke: COLORS.border },
  };

  const chartWidth = Math.max(260, width - 64);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#101A2E', '#0B1220']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.adminName} numberOfLines={1}>{admin?.name || 'Admin'}</Text>
              <Text style={styles.adminSubtitle}>Live operations overview</Text>
            </View>
            <AdminPressable accessibilityRole="button" accessibilityLabel="Open profile settings" onPress={() => setActiveTab('Profile')} style={styles.profileBtn}>
              <UserCircle size={29} color="#E2E8F0" />
            </AdminPressable>
          </View>

          <View style={styles.heroPanel}>
            <View>
              <Text style={styles.heroLabel}>Weekly bookings</Text>
              <Text style={styles.heroValue}>{totalWeeklyBookings}</Text>
            </View>
            <View style={styles.heroSignal}>
              <TrendingUp size={16} color={COLORS.white} />
              <Text style={styles.heroSignalText}>7 day trend</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentInner}>
        <View style={styles.statsGrid}>
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.key} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                  <Icon size={18} color={stat.tone} />
                </View>
                <Text style={styles.statValue}>{stats[stat.key]}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Card>
            );
          })}
        </View>

        <Card style={styles.chartCard}>
          <SectionHeader
            icon={<TrendingUp size={17} color={COLORS.accent} />}
            title="Engagement Overview"
            caption="Tickets created over the last seven days"
            action={<Calendar size={16} color={COLORS.textSubtle} />}
          />
          <View style={styles.chartFrame}>
            <LineChart
              data={{
                labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Now'],
                datasets: [{ data: weeklyData }],
              }}
              width={chartWidth}
              height={168}
              chartConfig={chartConfig}
              bezier
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
            />
          </View>
        </Card>

        <SectionHeader
          icon={<LayoutGrid size={17} color={COLORS.primary} />}
          title="Quick Management"
          caption="Frequent controls for live administration"
        />

        <View style={styles.quickGrid}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <AdminPressable key={action.label} style={styles.actionCard} onPress={() => setActiveTab(action.target)} accessibilityRole="button" accessibilityLabel={`Open ${action.label}`}>
                <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                  <Icon size={19} color={action.tone} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <ChevronRight size={15} color={COLORS.textSubtle} />
              </AdminPressable>
            );
          })}
        </View>

        <SectionHeader
          icon={<Bell size={17} color={COLORS.primary} />}
          title="Recent Activity"
          caption="Latest admin and system events"
          action={(
            <AdminPressable style={styles.viewAll} onPress={() => setActiveTab('Logs')} accessibilityRole="button" accessibilityLabel="View all activity logs">
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={COLORS.accent} />
            </AdminPressable>
          )}
        />

        <Card style={styles.activityFeed}>
          {loading ? (
            <LoadingState label="Loading activity..." compact />
          ) : activities.length === 0 ? (
            <EmptyState title="No activity yet" message="Recent admin and system events will appear here." />
          ) : activities.map((log: any, index) => (
            <View key={log.id} style={[styles.activityRow, index === activities.length - 1 && styles.activityRowLast]}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTxt} numberOfLines={1}>{log.details || log.action}</Text>
                <Text style={styles.activityMeta} numberOfLines={1}>{formatLogTime(log.timestamp)}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { paddingBottom: 34, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, gap: SPACING.lg },
  headerCopy: { flex: 1, minWidth: 0 },
  greeting: { fontSize: TYPOGRAPHY.bodySmall, color: '#CBD5E1', fontWeight: '700' },
  adminName: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: COLORS.white, marginTop: 3 },
  adminSubtitle: { color: '#94A3B8', fontSize: TYPOGRAPHY.bodySmall, lineHeight: 18, fontWeight: '600', marginTop: 3 },
  profileBtn: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.glass, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroPanel: { marginTop: SPACING.xxl, marginHorizontal: SPACING.xl, padding: SPACING.lg, borderRadius: RADIUS.md, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.lg },
  heroLabel: { color: '#CBD5E1', fontSize: TYPOGRAPHY.caption, fontWeight: '800', textTransform: 'uppercase' },
  heroValue: { color: COLORS.white, fontSize: 30, lineHeight: 36, fontWeight: '800', marginTop: 3 },
  heroSignal: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: RADIUS.pill, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroSignalText: { color: COLORS.white, fontSize: TYPOGRAPHY.caption, fontWeight: '800' },
  content: { flex: 1, marginTop: -20 },
  contentInner: { paddingHorizontal: SPACING.lg, paddingBottom: 44 },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, marginBottom: 0, padding: SPACING.md },
  statIcon: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  statValue: { color: COLORS.text, fontSize: 22, lineHeight: 26, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.caption, lineHeight: 15, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  chartCard: { padding: SPACING.lg },
  chartFrame: { overflow: 'hidden', borderRadius: RADIUS.md, backgroundColor: COLORS.surface },
  chart: { marginLeft: -12, paddingRight: 0 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.xxl },
  actionCard: { width: '47.9%', minHeight: 76, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, ...SHADOWS.card },
  actionIcon: { width: 38, height: 38, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: TYPOGRAPHY.bodySmall, lineHeight: 17, fontWeight: '800', color: COLORS.text },
  viewAll: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, borderRadius: RADIUS.md },
  viewAllText: { fontSize: TYPOGRAPHY.caption, fontWeight: '800', color: COLORS.accent },
  activityFeed: { padding: 0, overflow: 'hidden' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  activityRowLast: { borderBottomWidth: 0 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginRight: 12 },
  activityContent: { flex: 1, minWidth: 0 },
  activityTxt: { fontSize: TYPOGRAPHY.bodySmall, color: COLORS.text, fontWeight: '700' },
  activityMeta: { fontSize: TYPOGRAPHY.caption, color: COLORS.textSubtle, marginTop: 3, fontWeight: '700' },
});
