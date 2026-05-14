import React, { Suspense, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../core/theme';
import {
  LayoutDashboard,
  Bus,
  Users,
  Bell,
  Ticket,
  UserMinus,
  Smartphone,
  Activity,
  UserCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPressable } from '../components/AdminUI';

const DashboardScreen = React.lazy(() =>
  import('../features/dashboard/DashboardScreen').then((m) => ({ default: m.DashboardScreen }))
);
const RoutesManagementScreen = React.lazy(() =>
  import('../features/routes/RoutesManagementScreen').then((m) => ({ default: m.RoutesManagementScreen }))
);
const UsersListScreen = React.lazy(() =>
  import('../features/users/UsersListScreen').then((m) => ({ default: m.UsersListScreen }))
);
const NotificationsScreen = React.lazy(() =>
  import('../features/notifications/NotificationsScreen').then((m) => ({ default: m.NotificationsScreen }))
);
const AllTicketsScreen = React.lazy(() =>
  import('../features/dashboard/AllTicketsScreen').then((m) => ({ default: m.AllTicketsScreen }))
);
const PendingDeletionsScreen = React.lazy(() =>
  import('../features/users/PendingDeletionsScreen').then((m) => ({ default: m.PendingDeletionsScreen }))
);
const DevicesListScreen = React.lazy(() =>
  import('../features/users/DevicesListScreen').then((m) => ({ default: m.DevicesListScreen }))
);
const LogsScreen = React.lazy(() =>
  import('../features/dashboard/LogsScreen').then((m) => ({ default: m.LogsScreen }))
);
const AdminProfileScreen = React.lazy(() =>
  import('../features/profile/AdminProfileScreen').then((m) => ({ default: m.AdminProfileScreen }))
);
const AdminsManagementScreen = React.lazy(() =>
  import('../features/admins/AdminsManagementScreen').then((m) => ({ default: m.AdminsManagementScreen }))
);

type TabConfig = {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  screen: React.LazyExoticComponent<React.ComponentType<any>>;
  requiredPermission?: import('../services/authService').AdminPermission;
  hidden?: boolean;
};

const tabs: TabConfig[] = [
  { key: 'Dashboard', label: 'Home', icon: LayoutDashboard, screen: DashboardScreen },
  { key: 'Routes', label: 'Routes', icon: Bus, screen: RoutesManagementScreen, requiredPermission: 'MANAGE_ROUTES' },
  { key: 'Users', label: 'Users', icon: Users, screen: UsersListScreen, requiredPermission: 'MANAGE_USERS' },
  { key: 'Tickets', label: 'Tickets', icon: Ticket, screen: AllTicketsScreen, requiredPermission: 'MANAGE_TICKETS' },
  { key: 'Devices', label: 'Devices', icon: Smartphone, screen: DevicesListScreen, requiredPermission: 'MANAGE_USERS' },
  { key: 'Logs', label: 'Logs', icon: Activity, screen: LogsScreen, requiredPermission: 'MANAGE_LOGS' },
  { key: 'Cleanup', label: 'Cleanup', icon: UserMinus, screen: PendingDeletionsScreen, requiredPermission: 'MANAGE_USERS' },
  { key: 'Admins', label: 'Admin Hub', icon: ShieldCheck, screen: AdminsManagementScreen, requiredPermission: 'MANAGE_ADMINS' },
  { key: 'Alerts', label: 'Alerts', icon: Bell, screen: NotificationsScreen },
  { key: 'Profile', label: 'Profile', icon: UserCircle, screen: AdminProfileScreen },
];

const TabBarFallback = () => (
  <View style={tabFallbackStyles.wrap}>
    <ActivityIndicator size="small" color={COLORS.accent} />
  </View>
);

const tabFallbackStyles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 120 },
});

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const LazyScreen = (Component: React.LazyExoticComponent<any>) => (props: any) => (
  <Suspense fallback={<TabBarFallback />}>
    <Component {...props} />
  </Suspense>
);

const CustomTabBar = ({ state, descriptors, navigation, visibleTabs }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
        {visibleTabs.map((tab: any) => {
          const isActive = state.index === state.routes.findIndex((r: any) => r.name === tab.key);
          const IconComponent = tab.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes.find((r: any) => r.name === tab.key)?.key,
              canPreventDefault: true,
            });

            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(tab.key);
            }
          };

          return (
            <AdminPressable
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={`Open ${tab.label}`}
            >
              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <IconComponent size={18} color={isActive ? COLORS.white : COLORS.textMuted} />
              </View>
              <Text style={[styles.tabLabel, { color: isActive ? COLORS.primary : COLORS.textMuted }]}>
                {tab.label}
              </Text>
            </AdminPressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export const AdminNavigator = () => {
  const admin = useAdminStore((state) => state.admin);

  const visibleTabs = useMemo(() => {
    return tabs.filter((t) => {
      if (t.key === 'Profile' || t.hidden) return false;
      if (admin?.email === 'admin@onedelhi.com') return true;
      const adminPermissions = admin?.permissions;
      if (!adminPermissions) return true;
      if (t.requiredPermission) {
        const hasFull = adminPermissions.includes('FULL_ACCESS');
        if (!hasFull && !adminPermissions.includes(t.requiredPermission)) return false;
      }
      return true;
    });
  }, [admin?.email, admin?.permissions]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} visibleTabs={visibleTabs} />}
      screenOptions={{
        headerShown: false,
        lazy: false, // Ensure screens are preserved in memory
      }}
    >
      {visibleTabs.map((tab) => (
        <Tab.Screen 
          key={tab.key} 
          name={tab.key} 
          component={LazyScreen(tab.screen)} 
        />
      ))}
      {/* Hidden tabs or tabs not in the scrollbar can still be added here if needed */}
      <Tab.Screen 
        name="Profile" 
        component={LazyScreen(AdminProfileScreen)} 
      />
    </Tab.Navigator>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    flexGrow: 1,
    justifyContent: 'center',
  },
  tabItem: {
    width: 76,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: RADIUS.md,
  },
  tabItemActive: { backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: COLORS.accentMuted },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  iconBoxActive: { backgroundColor: COLORS.accent, ...SHADOWS.accent },
  tabLabel: { fontSize: 10, lineHeight: 13, fontWeight: '800' },
});
