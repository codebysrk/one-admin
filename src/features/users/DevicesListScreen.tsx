import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, SPACING } from '../../core/theme';
import { Smartphone, LogOut, ShieldAlert, ShieldCheck, User, Clock } from 'lucide-react-native';

export const DevicesListScreen = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'devices'), orderBy('lastActive', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deviceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(deviceData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'BANNED' : 'APPROVED';
    try {
      await updateDoc(doc(db, 'devices', id), {
        status: newStatus
      });
    } catch (error) {
      Alert.alert("Error", "Could not update device status");
    }
  };

  const toggleForceLogout = async (id: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'devices', id), {
        forceLogout: !currentVal
      });
    } catch (error) {
      Alert.alert("Error", "Could not update force logout status");
    }
  };

  const renderDeviceItem = ({ item }: any) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <View style={[styles.avatar, { backgroundColor: item.status === 'APPROVED' ? '#ECFDF5' : '#FEF2F2' }]}>
            <Smartphone size={24} color={item.status === 'APPROVED' ? '#059669' : '#DC2626'} />
          </View>
          <View>
            <Text style={styles.deviceName}>{item.deviceName}</Text>
            <Text style={styles.userName}>User: {item.userName}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
           <Text style={[styles.statusText, { color: item.status === 'APPROVED' ? '#059669' : '#DC2626' }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.deviceDetails}>
        <View style={styles.detailRow}>
           <Text style={styles.detailLabel}>Model:</Text>
           <Text style={styles.detailValue}>{item.brand} {item.model}</Text>
        </View>
        <View style={styles.detailRow}>
           <Text style={styles.detailLabel}>OS:</Text>
           <Text style={styles.detailValue}>{(item.platform || 'Unknown').toUpperCase()} {item.osVersion}</Text>
        </View>
        <View style={styles.detailRow}>
           <Clock size={12} color={COLORS.textMuted} />
           <Text style={styles.timeText}>Last Active: {new Date(item.lastActive).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: item.status === 'APPROVED' ? '#EF4444' : '#10B981' }]} 
          onPress={() => toggleStatus(item.id, item.status)}
        >
          {item.status === 'APPROVED' ? <ShieldAlert size={16} color="#EF4444" /> : <ShieldCheck size={16} color="#10B981" />}
          <Text style={[styles.actionBtnText, { color: item.status === 'APPROVED' ? '#EF4444' : '#10B981' }]}>
            {item.status === 'APPROVED' ? 'Ban Device' : 'Unban Device'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: item.forceLogout ? '#3B82F6' : '#6B7280' }]} 
          onPress={() => toggleForceLogout(item.id, item.forceLogout)}
        >
          <LogOut size={16} color={item.forceLogout ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.actionBtnText, { color: item.forceLogout ? '#3B82F6' : '#6B7280' }]}>
            {item.forceLogout ? 'Cancel Logout' : 'Force Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Device Management</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No devices registered</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    padding: 24, 
    backgroundColor: 'white', 
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 60
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  listContent: { padding: 16 },
  deviceCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  deviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  deviceName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  userName: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  deviceDetails: { gap: 6, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, width: 50 },
  detailValue: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  timeText: { fontSize: 11, color: COLORS.textMuted },
  actions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted }
});
