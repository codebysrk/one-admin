import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../services/firebase';
import { COLORS, SPACING } from '../../core/theme';
import { User, Shield, ShieldAlert, Mail, Phone, Calendar, Trash2 } from 'lucide-react-native';

export const UsersListScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    try {
      await updateDoc(doc(db, 'users', id), {
        status: newStatus
      });
    } catch (error) {
      Alert.alert("Error", "Could not update user status");
    }
  };

  const renderUserItem = ({ item }: any) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: item.status === 'ACTIVE' ? '#E0F2FE' : '#FEE2E2' }]}>
            <User size={24} color={item.status === 'ACTIVE' ? '#0369A1' : '#B91C1C'} />
          </View>
          <View>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userRole}>{item.role.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.statusToggle}>
          <Text style={[styles.statusText, { color: item.status === 'ACTIVE' ? '#10B981' : '#EF4444' }]}>
            {item.status}
          </Text>
          <Switch
            value={item.status === 'ACTIVE'}
            onValueChange={() => toggleStatus(item.id, item.status)}
            trackColor={{ false: '#767577', true: '#10B981' }}
          />
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Mail size={14} color={COLORS.textMuted} />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        {item.phone && (
          <View style={styles.detailRow}>
            <Phone size={14} color={COLORS.textMuted} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => confirmDelete(item)}
        >
          <Trash2 size={16} color="#EF4444" />
          <Text style={styles.deleteText}>Delete User Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const confirmDelete = (user: any) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to PERMANENTLY delete ${user.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => handleDelete(user) 
        }
      ]
    );
  };

  const handleDelete = async (user: any) => {
    setLoading(true);
    try {
      const { id: uid, email, name } = user;
      
      // 1. Record in 'deleted_users' for manual Auth cleanup
      await setDoc(doc(db, 'deleted_users', uid), {
        uid,
        email,
        name,
        deletedAt: Date.now(),
        status: 'PENDING_AUTH_DELETION'
      });

      // 2. Delete Firestore User Doc
      await deleteDoc(doc(db, 'users', uid));
      
      Alert.alert("Success", "User data removed from Firestore and logged for Auth cleanup.");
    } catch (error: any) {
      console.error("Delete Error:", error);
      Alert.alert("Error", "Could not remove user data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found</Text>
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
  userCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  userRole: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', marginTop: 2 },
  statusToggle: { alignItems: 'flex-end', gap: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  userDetails: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: COLORS.textMuted },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  deleteText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.textMuted }
});
