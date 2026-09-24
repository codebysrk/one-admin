import { useTheme } from '../core/ThemeContext';
import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RADIUS, SHADOWS } from '../core/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAdminStore } from '../store/useAdminStore';
import { AdminPressable } from '../components/AdminUI';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const LayoutDashboard = IconWrapper('view-dashboard');
const Bus = IconWrapper('bus');
const Users = IconWrapper('account-group');
const Megaphone = IconWrapper('bullhorn');
const Bell = IconWrapper('bell');
const Ticket = IconWrapper('ticket');
const Activity = IconWrapper('pulse');
const UserCircle = IconWrapper('account-circle');
const ShieldCheck = IconWrapper('shield-check');
const Cash = IconWrapper('cash-multiple');


import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { RoutesManagementScreen } from '../features/routes/RoutesManagementScreen';
import { UsersListScreen } from '../features/users/UsersListScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { AllTicketsScreen } from '../features/dashboard/AllTicketsScreen';
import { LogsScreen } from '../features/dashboard/LogsScreen';
import { AdminProfileScreen } from '../features/profile/AdminProfileScreen';
import { FareConfigScreen } from '../features/fare/FareConfigScreen';
import { AdminsManagementScreen } from '../features/admins/AdminsManagementScreen';

type TabConfig = {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  screen: React.ComponentType<any>;
  requiredPermission?: import('../services/authService').AdminPermission;
  hidden?: boolean;
};

const tabs: TabConfig[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, screen: DashboardScreen },
  { key: 'Routes', label: 'Routes', icon: Bus, screen: RoutesManagementScreen, requiredPermission: 'MANAGE_ROUTES' },
  { key: 'Users', label: 'Users', icon: Users, screen: UsersListScreen, requiredPermission: 'MANAGE_USERS' },
  { key: 'Tickets', label: 'Tickets', icon: Ticket, screen: AllTicketsScreen, requiredPermission: 'MANAGE_TICKETS' },
  { key: 'Logs', label: 'Activity', icon: Activity, screen: LogsScreen, requiredPermission: 'MANAGE_LOGS' },
  { key: 'Admins', label: 'Admins', icon: ShieldCheck, screen: AdminsManagementScreen, requiredPermission: 'MANAGE_ADMINS' },
  { key: 'Alerts', label: 'Broadcast', icon: Megaphone, screen: NotificationsScreen },
  { key: 'Profile', label: 'Profile', icon: UserCircle, screen: AdminProfileScreen },
];

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const PRIMARY_TABS = ['Dashboard', 'Routes', 'Users', 'Tickets', 'Logs'];

const CustomTabBar = React.memo(({ state, descriptors, navigation, visibleTabs }: any) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors, insets), [colors, insets]);

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
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
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <IconComponent size={20} color={isActive ? colors.accent : colors.textSubtle} />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.accent : colors.textMuted,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </AdminPressable>
          );
        })}
      </View>
    </View>
  );
});

export const AdminNavigator = () => {
  const admin = useAdminStore((state) => state.admin);

  const visibleTabs = useMemo(() => {
    return tabs.filter((t) => {
      if (!PRIMARY_TABS.includes(t.key) || t.hidden) return false;
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
      backBehavior="firstRoute"
      tabBar={(props) => <CustomTabBar {...props} visibleTabs={visibleTabs} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen 
          key={tab.key} 
          name={tab.key} 
          component={tab.screen} 
        />
      ))}
      <Tab.Screen 
        name="Fare" 
        component={FareConfigScreen} 
      />
    </Tab.Navigator>
  );
};

function getStyles(colors: any, insets?: any) {
  const bottomInset = insets?.bottom ?? 0;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    screenContainer: { flex: 1 },
    tabBarContainer: {
      backgroundColor: colors.surface,
      paddingBottom: Math.max(bottomInset, Platform.OS === 'ios' ? 16 : 8),
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      ...SHADOWS.card,
    },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    tabItem: {
      flex: 1,
      paddingVertical: 5,
      paddingHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRadius: RADIUS.md,
    },
    tabItemActive: {
      backgroundColor: colors.accentSoft,
    },
    iconWrapper: {
      width: 28,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapperActive: {
      backgroundColor: colors.surface,
      ...SHADOWS.subtle,
    },
    tabLabel: {
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 0.1,
    },
  });
}
