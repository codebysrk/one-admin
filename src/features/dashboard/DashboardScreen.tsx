import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminStore } from '../../store/useAdminStore';
import { logoutAdmin } from '../../services/authService';
import { COLORS, SPACING } from '../../core/theme';
import { LogOut, Users, Ticket, Bus, Bell, RefreshCw } from 'lucide-react-native';
import { collection, query, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const DashboardScreen = () => {
  const admin = useAdminStore((state) => state.admin);
  const logout = useAdminStore((state) => state.logout);
  const [stats, setStats] = useState({
    users: 0,
    tickets: 0,
    routes: 0,
    reports: 0
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const ticketsSnap = await getCountFromServer(collection(db, 'tickets'));
        const routesSnap = await getCountFromServer(collection(db, 'routes'));
        
        setStats(prev => ({
          ...prev,
          users: usersSnap.data().count,
          tickets: ticketsSnap.data().count,
          routes: routesSnap.data().count
        }));
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(logs);
      setLoading(false);
    });

    fetchStats();
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutAdmin();
    logout();
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>{admin?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Active Users" value={stats.users.toLocaleString()} icon={Users} color="#3B82F6" />
          <StatCard title="Tickets Today" value={stats.tickets.toLocaleString()} icon={Ticket} color="#10B981" />
          <StatCard title="Buses Live" value={stats.routes.toLocaleString()} icon={Bus} color="#F59E0B" />
          <StatCard title="Reports" value={stats.reports.toLocaleString()} icon={Bell} color="#EF4444" />
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {loading ? (
            <ActivityIndicator animating={true} color={COLORS.primary} style={{ padding: 20 }} />
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <Text style={styles.activityText}>{activity.details || activity.action}</Text>
                <Text style={styles.activityTime}>
                  {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: COLORS.textMuted, padding: 20 }}>No recent activity found</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  welcomeText: { fontSize: 14, color: COLORS.textMuted },
  adminName: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  logoutBtn: { padding: 8, borderRadius: 8, backgroundColor: '#FEE2E2' },
  content: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 16, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    backgroundColor: 'white', 
    width: '48%', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  statTitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  activityList: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  activityItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  activityText: { fontSize: 14, color: COLORS.text },
  activityTime: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 }
});
