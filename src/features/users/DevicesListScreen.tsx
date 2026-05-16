import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Smartphone = IconWrapper('cellphone');
const LogOut = IconWrapper('logout');
const ShieldAlert = IconWrapper('shield-alert');
const ShieldCheck = IconWrapper('shield-check');
const Clock = IconWrapper('clock-outline');
import { AdminHeader, AdminScreen, EmptyState, LoadingState, StatusBadge } from '../../components/AdminUI';

export const DevicesListScreen = () => {
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
    return (
      <View style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <View style={styles.deviceInfo}>
            <View style={[styles.avatar, { backgroundColor: approved ? COLORS.successSoft : COLORS.errorSoft }]}>
              <Smartphone size={24} color={approved ? COLORS.success : COLORS.error} />
            </View>
            <View style={styles.deviceCopy}>
              <Text style={styles.deviceName} numberOfLines={1}>{item.deviceName}</Text>
              <Text style={styles.userName} numberOfLines={1}>User: {item.userName}</Text>
            </View>
          </View>
          <StatusBadge label={item.status || 'Unknown'} tone={approved ? 'success' : 'error'} />
        </View>

        <View style={styles.deviceDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{item.brand} {item.model}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>OS</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{(item.platform || 'Unknown').toUpperCase()} {item.osVersion}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={12} color={COLORS.textMuted} />
            <Text style={styles.timeText} numberOfLines={1}>Last active: {new Date(item.lastActive).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleStatus(item.id, item.status)}
            activeOpacity={0.82}
          >
            {approved ? <ShieldAlert size={16} color={COLORS.error} /> : <ShieldCheck size={16} color={COLORS.success} />}
            <Text style={[styles.actionBtnText, { color: approved ? COLORS.error : COLORS.success }]}>
              {approved ? 'Ban Device' : 'Unban Device'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleForceLogout(item.id, item.forceLogout)}
            activeOpacity={0.82}
          >
            <LogOut size={16} color={item.forceLogout ? COLORS.info : COLORS.textMuted} />
            <Text style={[styles.actionBtnText, { color: item.forceLogout ? COLORS.info : COLORS.textMuted }]}>
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
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon={<Smartphone size={30} color={COLORS.textSubtle} />} title="No devices registered" message="Approved and flagged user devices will appear here." />}
        />
      )}
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: SPACING.xl, paddingBottom: 40 },
  deviceCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  deviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  deviceCopy: { flex: 1, minWidth: 0 },
  avatar: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  deviceName: { fontSize: 16, lineHeight: 21, fontWeight: '800', color: COLORS.text },
  userName: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, fontWeight: '600' },
  deviceDetails: { gap: 8, marginBottom: 16, backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, padding: SPACING.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, width: 50, fontWeight: '800', textTransform: 'uppercase' },
  detailValue: { fontSize: 12, color: COLORS.text, fontWeight: '700', flex: 1 },
  timeText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.surfaceMuted, paddingTop: 16 },
  actionBtn: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceMuted },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
});
