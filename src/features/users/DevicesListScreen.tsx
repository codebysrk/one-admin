import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { db } from '../../services/firebase';
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
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'devices'), orderBy('lastActive', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deviceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDevices(deviceData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'BANNED' : 'APPROVED';
    try {
      await updateDoc(doc(db, 'devices', id), { status: newStatus });
    } catch (error) {
      Alert.alert('Error', 'Could not update device status');
    }
  };

  const toggleForceLogout = async (id: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'devices', id), { forceLogout: !currentVal });
    } catch (error) {
      Alert.alert('Error', 'Could not update force logout status');
    }
  };

  const renderDeviceItem = ({ item }: any) => {
    const approved = item.status === 'APPROVED';
    const isAndroid = (item.platform || '').toLowerCase().includes('android');
    const isIOS = (item.platform || '').toLowerCase().includes('ios');

    return (
      <View style={[styles.deviceCard, !approved && styles.deviceCardBanned]}>
        <View style={styles.deviceHeader}>
          <View style={styles.deviceInfo}>
            <View style={[styles.avatar, approved ? styles.avatarApproved : styles.avatarBanned]}>
              <Smartphone size={20} color={approved ? colors.success : colors.error} />
            </View>
            <View style={styles.deviceCopy}>
              <Text style={styles.deviceName} numberOfLines={1}>{item.deviceName || 'Unknown Device'}</Text>
              <Text style={styles.userName} numberOfLines={1}>Owner: {item.userName || 'System'}</Text>
            </View>
          </View>
          <View style={styles.badgeCol}>
            <StatusBadge label={item.status || 'Unknown'} tone={approved ? 'success' : 'error'} />
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
            style={[styles.actionBtn, approved ? styles.banBtn : styles.approveBtn]}
            onPress={() => toggleStatus(item.id, item.status)}
            activeOpacity={0.7}
          >
            {approved ? <ShieldAlert size={15} color={colors.error} /> : <ShieldCheck size={15} color={colors.success} />}
            <Text style={[styles.actionBtnText, { color: approved ? colors.error : colors.success }]}>
              {approved ? 'Ban Device' : 'Approve Device'}
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
      <AdminHeader title="Device Management" subtitle={`${devices.length} registered devices`} />

      {loading ? (
        <LoadingState label="Loading devices..." />
      ) : (
        <FlashList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Smartphone size={30} color={colors.textSubtle} />} title="No devices registered" message="Approved and flagged user devices will appear here." />}
        />
      )}
    </AdminScreen>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  deviceCard: { 
    backgroundColor: colors.surface, 
    borderRadius: RADIUS.lg, 
    padding: 14, 
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
    gap: 10 
  },
  deviceInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    flex: 1, 
    minWidth: 0 
  },
  deviceCopy: { 
    flex: 1, 
    minWidth: 0 
  },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: RADIUS.md, 
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
    fontSize: 14, 
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
    borderColor: '#FECDD3' 
  },
  approveBtn: { 
    backgroundColor: colors.successSoft, 
    borderColor: '#BBF7D0' 
  },
  logoutActiveBtn: { 
    backgroundColor: colors.infoSoft, 
    borderColor: '#BFDBFE' 
  },
  logoutInactiveBtn: { 
    backgroundColor: colors.surfaceMuted, 
    borderColor: colors.border 
  },
});
