import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminStore } from '../../store/useAdminStore';
import { logoutAdmin } from '../../services/authService';
import { COLORS } from '../../core/theme';
import { LogOut, Users, Ticket, Bus, Bell, Smartphone, Activity, UserMinus, UserCircle, TrendingUp } from 'lucide-react-native';
import { collection, query, orderBy, limit, onSnapshot, getCountFromServer, where, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen = () => {
  const admin = useAdminStore((state) => state.admin);
  const setActiveTab = useAdminStore((state) => state.setActiveTab);
  
  const [stats, setStats] = useState({ users: 0, tickets: 0, routes: 0, reports: 0 });
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const ticketsSnap = await getCountFromServer(collection(db, 'tickets'));
        const routesSnap = await getCountFromServer(collection(db, 'routes'));
        
        setStats({
          users: usersSnap.data().count,
          tickets: ticketsSnap.data().count,
          routes: routesSnap.data().count,
          reports: 0
        });

        // Fetch weekly booking data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const qTickets = query(
          collection(db, 'tickets'), 
          where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo))
        );
        
        // This is a simplified grouping for the free plan (client-side)
        const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
          const counts = [0, 0, 0, 0, 0, 0, 0];
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const date = data.timestamp.toDate();
            const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
            if (diffDays >= 0 && diffDays < 7) {
              counts[6 - diffDays]++;
            }
          });
          setWeeklyData(counts);
        });
        return () => unsubscribeTickets();
      } catch (error) { console.error(error); }
    };

    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    fetchStats();
    return () => unsubscribeLogs();
  }, []);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>System Overview</Text>
          <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('Profile')}>
          <UserCircle size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Users size={20} color="#2563EB" />
            <Text style={styles.statVal}>{stats.users}</Text>
            <Text style={styles.statLab}>Users</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <Ticket size={20} color="#16A34A" />
            <Text style={styles.statVal}>{stats.tickets}</Text>
            <Text style={styles.statLab}>Tickets</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Bus size={20} color="#D97706" />
            <Text style={styles.statVal}>{stats.routes}</Text>
            <Text style={styles.statLab}>Routes</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <TrendingUp size={18} color={COLORS.primary} />
            <Text style={styles.chartTitle}>Weekly Bookings</Text>
          </View>
          <LineChart
            data={{
              labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Now'],
              datasets: [{ data: weeklyData }]
            }}
            width={screenWidth - 32}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick Management</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => setActiveTab('Devices')}>
            <Smartphone size={20} color="#475569" />
            <Text style={styles.actionLabel}>Devices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => setActiveTab('Logs')}>
            <Activity size={20} color="#475569" />
            <Text style={styles.actionLabel}>Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => setActiveTab('Cleanup')}>
            <UserMinus size={20} color="#475569" />
            <Text style={styles.actionLabel}>Cleanup</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Logs</Text>
        <View style={styles.activityList}>
          {activities.map((log: any) => (
            <View key={log.id} style={styles.activityItem}>
              <Text style={styles.activityText} numberOfLines={1}>{log.details || log.action}</Text>
              <Text style={styles.activityTime}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  welcomeText: { fontSize: 12, color: '#64748B' },
  adminName: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  content: { padding: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { width: '31%', padding: 12, borderRadius: 12, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
  statLab: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  chartSection: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  chart: { marginVertical: 8, borderRadius: 16, paddingRight: 40 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionItem: { width: '31%', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  actionLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginTop: 8 },
  activityList: { backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activityText: { fontSize: 12, color: '#1E293B', flex: 1 },
  activityTime: { fontSize: 10, color: '#94A3B8', marginLeft: 10 }
});
