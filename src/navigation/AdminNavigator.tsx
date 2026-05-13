import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { RoutesListScreen } from '../features/routes/RoutesListScreen';
import { UsersListScreen } from '../features/users/UsersListScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { AllTicketsScreen } from '../features/dashboard/AllTicketsScreen';
import { PendingDeletionsScreen } from '../features/users/PendingDeletionsScreen';
import { DevicesListScreen } from '../features/users/DevicesListScreen';
import { LogsScreen } from '../features/dashboard/LogsScreen';
import { AdminProfileScreen } from '../features/profile/AdminProfileScreen';
import { COLORS } from '../core/theme';
import { LayoutDashboard, Bus, Users, Bell, Ticket, UserMinus, Smartphone, Activity, UserCircle } from 'lucide-react-native';
import { useAdminStore } from '../store/useAdminStore';

const tabs = [
  { key: 'Dashboard', label: 'Home', icon: LayoutDashboard, screen: DashboardScreen },
  { key: 'Routes', label: 'Routes', icon: Bus, screen: RoutesListScreen },
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
          {tabs.filter(t => t.key !== 'Profile').map((tab) => {
            const isActive = activeTab === tab.key;
            const IconComponent = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <IconComponent
                  size={20}
                  color={isActive ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: isActive ? COLORS.primary : COLORS.textMuted }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tabItem: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
