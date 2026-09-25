import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminHeader, AdminScreen, EmptyState, LoadingState, StatusBadge } from '../../components/AdminUI';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Smartphone = IconWrapper('cellphone');
const LogOut = IconWrapper('logout');
const ShieldAlert = IconWrapper('shield-alert');
const ShieldCheck = IconWrapper('shield-check');
const Clock = IconWrapper('clock-outline');
const Android = IconWrapper('android');
const Apple = IconWrapper('apple');

export const DevicesListScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => (typeof getStyles === 'function' ? getStyles(colors) : {} as any),
    [colors]
  );
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase
      .from('devices')
      .select('*, users(name, email)')
      .order('last_active', { ascending: false });
    if (data) {
      setDevices(data.map((d: any) => ({
        id: d.id,
        deviceName: d.device_name,
        userName: d.users?.name || 'Unknown User',
        userEmail: d.users?.email || '',
        status: d.status,
        forceLogout: d.force_logout,
        platform: d.platform,
        osVersion: d.os_version,
        brand: d.brand,
        model: d.model,
        lastActive: d.last_active,
      })));
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchDevices();
    const channel = supabase
      .channel('devices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDevices();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDevices]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      await supabase.from('devices').update({ status: newStatus }).eq('id', id);
      fetchDevices();
    } catch (error) {
      Alert.alert('Error', 'Could not update device status');
    }
  };

  const toggleForceLogout = async (id: string, currentVal: boolean) => {
    try {
      await supabase.from('devices').update({ force_logout: !currentVal }).eq('id', id);
      fetchDevices();
    } catch (error) {
      Alert.alert('Error', 'Could not update force logout status');
    }
  };

  const renderDeviceItem = ({ item }: any) => {
    const isBanned = item.status === 'BANNED';
    const isAllowed = !isBanned;
    const isAndroid = (item.platform || '').toLowerCase().includes('android');
    const isIOS = (item.platform || '').toLowerCase().includes('ios');

    return (
      <View style={[styles.deviceCard, isBanned && styles.deviceCardBanned]}>
        <View style={styles.deviceHeader}>
          <View style={styles.deviceInfo}>
            <View style={[styles.avatar, isAllowed ? styles.avatarApproved : styles.avatarBanned]}>
              <Smartphone size={20} color={isAllowed ? colors.success : colors.error} />
            </View>
            <View style={styles.deviceCopy}>
              <Text style={styles.deviceName} numberOfLines={1}>{item.deviceName || 'Unknown Device'}</Text>
              <Text style={styles.userName} numberOfLines={1}>Owner: {item.userName || 'System'}</Text>
            </View>
          </View>
          <View style={styles.badgeCol}>
            <StatusBadge label={item.status || 'ACTIVE'} tone={isAllowed ? 'success' : 'error'} />
          </View>
        </View>

        <View style={styles.deviceDetails}>
          <View style={styles.detailChipsRow}>
            <View style={styles.chip}>
              {isAndroid ? <Android size={12} color={colors.textMuted} style={{ marginRight: 4 }} /> : isIOS ? <Apple size={12} color={colors.textMuted} style={{ marginRight: 4 }} /> : <Smartphone size={12} color={colors.textMuted} style={{ marginRight: 4 }} />}
              <Text style={styles.chipText}>{(item.platform || 'Unknown').toUpperCase()} {item.osVersion || ''}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Model: </Text>
              <Text style={styles.chipValText} numberOfLines={1}>{item.brand || ''} {item.model || ''}</Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <Clock size={12} color={colors.textSubtle} style={{ marginRight: 6 }} />
            <Text style={styles.timeText} numberOfLines={1}>
              Last active: {new Date(item.lastActive).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, isAllowed ? styles.banBtn : styles.approveBtn]}
            onPress={() => toggleStatus(item.id, item.status)}
            activeOpacity={0.7}
          >
            {isAllowed ? <ShieldAlert size={15} color={colors.error} /> : <ShieldCheck size={15} color={colors.success} />}
            <Text style={[styles.actionBtnText, { color: isAllowed ? colors.error : colors.success }]}>
              {isAllowed ? 'Ban Device' : 'Unban Device'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, item.forceLogout ? styles.logoutActiveBtn : styles.logoutInactiveBtn]}
            onPress={() => toggleForceLogout(item.id, item.forceLogout)}
            activeOpacity={0.7}
          >
            <LogOut size={15} color={item.forceLogout ? colors.info : colors.textMuted} />
            <Text style={[styles.actionBtnText, { color: item.forceLogout ? colors.info : colors.textMuted }]}>
              {item.forceLogout ? 'Cancel Logout' : 'Force Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <AdminScreen>
      <AdminHeader title="Device Management" subtitle={`${devices.length} authorized client ${devices.length === 1 ? 'device' : 'devices'}`} />

      {loading ? (
        <LoadingState label="Loading devices..." />
      ) : (
        <FlashList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Smartphone size={30} color={colors.textSubtle} />} title="No Devices Found" message="Active user device sessions will appear here." />}
        />
      )}
    </AdminScreen>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  deviceCard: { 
    backgroundColor: colors.surface, 
    borderRadius: RADIUS.card, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.border, 
    ...SHADOWS.card 
  },
  deviceCardBanned: { 
    borderColor: colors.errorSoft, 
    backgroundColor: colors.surfaceMuted 
  },
  deviceHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12, 
    gap: 12 
  },
  deviceInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    flex: 1, 
    minWidth: 0 
  },
  deviceCopy: { 
    flex: 1, 
    minWidth: 0 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: RADIUS.lg, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1 
  },
  avatarApproved: { 
    backgroundColor: colors.successSoft, 
    borderColor: 'rgba(5, 150, 105, 0.15)' 
  },
  avatarBanned: { 
    backgroundColor: colors.errorSoft, 
    borderColor: 'rgba(225, 29, 72, 0.15)' 
  },
  deviceName: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: colors.text 
  },
  userName: { 
    fontSize: 11, 
    color: colors.textMuted, 
    marginTop: 1, 
    fontWeight: '600' 
  },
  badgeCol: { 
    justifyContent: 'center' 
  },
  deviceDetails: { 
    gap: 8, 
    marginBottom: 14, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  detailChipsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginBottom: 4 
  },
  chip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surfaceMuted, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: RADIUS.sm, 
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
  chipText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: colors.textMuted 
  },
  chipLabel: { 
    fontSize: 10, 
    color: colors.textSubtle, 
    fontWeight: '700' 
  },
  chipValText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: colors.text 
  },
  timeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 2 
  },
  timeText: { 
    fontSize: 10, 
    color: colors.textSubtle, 
    fontWeight: '700' 
  },
  actions: { 
    flexDirection: 'row', 
    gap: 10 
  },
  actionBtn: { 
    flex: 1, 
    minHeight: 38, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: RADIUS.md, 
    borderWidth: 1 
  },
  actionBtnText: { 
    fontSize: 11, 
    fontWeight: '800' 
  },
  banBtn: { 
    backgroundColor: colors.errorSoft, 
    borderColor: colors.error + '33' 
  },
  approveBtn: { 
    backgroundColor: colors.successSoft, 
    borderColor: colors.success + '33' 
  },
  logoutActiveBtn: { 
    backgroundColor: colors.infoSoft, 
    borderColor: colors.info + '33' 
  },
  logoutInactiveBtn: { 
    backgroundColor: colors.surfaceMuted, 
    borderColor: colors.border 
  },
});
