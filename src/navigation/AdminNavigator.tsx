import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { RoutesManagementScreen } from '../features/routes/RoutesManagementScreen';
import { UsersListScreen } from '../features/users/UsersListScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { AllTicketsScreen } from '../features/dashboard/AllTicketsScreen';
import { PendingDeletionsScreen } from '../features/users/PendingDeletionsScreen';
import { DevicesListScreen } from '../features/users/DevicesListScreen';
import { LogsScreen } from '../features/dashboard/LogsScreen';
import { AdminProfileScreen } from '../features/profile/AdminProfileScreen';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../core/theme';
import { LayoutDashboard, Bus, Users, Bell, Ticket, UserMinus, Smartphone, Activity, UserCircle } from 'lucide-react-native';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPressable } from '../components/AdminUI';

const tabs = [
  { key: 'Dashboard', label: 'Home', icon: LayoutDashboard, screen: DashboardScreen },
  { key: 'Routes', label: 'Routes', icon: Bus, screen: RoutesManagementScreen },
  { key: 'Users', label: 'Users', icon: Users, screen: UsersListScreen },
  { key: 'Tickets', label: 'Tickets', icon: Ticket, screen: AllTicketsScreen },
  { key: 'Devices', label: 'Devices', icon: Smartphone, screen: DevicesListScreen },
  { key: 'Logs', label: 'Logs', icon: Activity, screen: LogsScreen },
  { key: 'Cleanup', label: 'Cleanup', icon: UserMinus, screen: PendingDeletionsScreen },
  { key: 'Alerts', label: 'Alerts', icon: Bell, screen: NotificationsScreen },
  { key: 'Profile', label: 'Profile', icon: UserCircle, screen: AdminProfileScreen },
];

export const AdminNavigator = () => {
  const activeTab = useAdminStore((state) => state.activeTab);
  const setActiveTab = useAdminStore((state) => state.setActiveTab);

  const ActiveScreen = tabs.find(t => t.key === activeTab)?.screen || DashboardScreen;

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        <ActiveScreen />
      </View>

      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {tabs.filter(t => t.key !== 'Profile' && !t.hidden).map((tab) => {
            const isActive = activeTab === tab.key;
            const IconComponent = tab.icon;
            return (
              <AdminPressable
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${tab.label}`}
              >
                <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                  <IconComponent
                    size={18}
                    color={isActive ? COLORS.white : COLORS.textMuted}
                  />
                </View>
                <Text style={[
                  styles.tabLabel,
                  { color: isActive ? COLORS.primary : COLORS.textMuted }
                ]}>
                  {tab.label}
                </Text>
              </AdminPressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screenContainer: { flex: 1 },
  tabBarContainer: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    paddingBottom: Platform.OS === 'ios' ? 22 : 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.floating,
  },
  tabBar: { flexDirection: 'row', paddingHorizontal: SPACING.md, alignItems: 'center', gap: SPACING.sm },
  tabItem: { width: 76, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: RADIUS.md },
  tabItemActive: { backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accentMuted },
  iconBox: { width: 36, height: 36, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceMuted },
  iconBoxActive: { backgroundColor: COLORS.accent, ...SHADOWS.accent },
  tabLabel: { fontSize: 10, lineHeight: 13, fontWeight: '800' }
});
