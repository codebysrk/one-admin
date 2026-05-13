import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { RoutesListScreen } from '../features/routes/RoutesListScreen';
import { UsersListScreen } from '../features/users/UsersListScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { COLORS } from '../core/theme';
import { LayoutDashboard, Bus, Users, Bell } from 'lucide-react-native';

const tabs = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, screen: DashboardScreen },
  { key: 'Routes', label: 'Routes', icon: Bus, screen: RoutesListScreen },
  { key: 'Users', label: 'Users', icon: Users, screen: UsersListScreen },
  { key: 'Alerts', label: 'Alerts', icon: Bell, screen: NotificationsScreen },
];

export const AdminNavigator = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const ActiveScreen = tabs.find(t => t.key === activeTab)?.screen || DashboardScreen;

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        <ActiveScreen />
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
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
                size={22}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
