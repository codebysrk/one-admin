import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS } from '../../core/theme';
import { UserMinus, Trash2, Mail, Clock, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export const PendingDeletionsScreen = () => {
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'deleted_users'), orderBy('deletedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeletedUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "UID copied to clipboard. Use this in Firebase Console to delete the Auth account.");
  };

  const removeRecord = (id: string) => {
    Alert.alert(
      "Remove Record",
      "Only do this AFTER you have manually deleted the user from Firebase Auth. Remove this record now?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => deleteDoc(doc(db, 'deleted_users', id)) }
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.iconBox}>
            <UserMinus size={20} color="#EF4444" />
          </View>
          <View>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => removeRecord(item.id)}>
          <Trash2 size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <TouchableOpacity style={styles.uidRow} onPress={() => copyToClipboard(item.uid)}>
          <Text style={styles.uidText} numberOfLines={1}>UID: {item.uid}</Text>
          <Copy size={12} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.timeRow}>
          <Clock size={12} color="#94A3B8" />
          <Text style={styles.timeText}>Deleted on: {new Date(item.deletedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' })}</Text>
        </View>
      </View>
      
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PENDING AUTH DELETION</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cleanup List</Text>
        <Text style={styles.headerSubtitle}>{deletedUsers.length} users pending Auth removal</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={deletedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <UserMinus size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>All clean! No pending deletions.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 60 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  listContent: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  userEmail: { fontSize: 12, color: '#64748B' },
  details: { gap: 8, marginBottom: 12 },
  uidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', padding: 8, borderRadius: 6 },
  uidText: { fontSize: 11, color: '#475569', flex: 1, fontFamily: 'monospace' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 11, color: '#94A3B8' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#F59E0B20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: 'bold', color: '#D97706' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 14 }
});
