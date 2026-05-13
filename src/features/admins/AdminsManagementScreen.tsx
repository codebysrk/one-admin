import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { UserPlus, Shield, ShieldCheck, ShieldAlert, Trash2, ChevronRight, CheckSquare, Square, Search } from 'lucide-react-native';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField, AdminBottomSheet, ConfirmationModal } from '../../components/AdminUI';
import { AdminPermission } from '../../services/authService';
import { logActivity } from '../../services/logService';

const ALL_PERMISSIONS: { key: AdminPermission; label: string; desc: string }[] = [
  { key: 'MANAGE_ROUTES', label: 'Route Management', desc: 'Can create, edit and delete bus lines' },
  { key: 'MANAGE_TICKETS', label: 'Ticket Audit', desc: 'Can view and void passenger tickets' },
  { key: 'MANAGE_LOGS', label: 'Security Logs', desc: 'Can view and prune system audit logs' },
  { key: 'MANAGE_USERS', label: 'User Control', desc: 'Can manage user accounts and deletions' },
  { key: 'MANAGE_ADMINS', label: 'Admin Hub', desc: 'Can manage other admins and their rights' },
  { key: 'FULL_ACCESS', label: 'Full Access', desc: 'Unrestricted access to all system features' },
];

export const AdminsManagementScreen = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [confirmModal, setConfirmModal] = useState({ visible: false, adminId: '', action: '' as 'REMOVE' | 'UPDATE' });

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTogglePermission = (permission: AdminPermission) => {
    if (!editingAdmin) return;
    
    const current = editingAdmin.permissions || [];
    let updated;
    
    if (current.includes(permission)) {
      updated = current.filter((p: string) => p !== permission);
    } else {
      updated = [...current, permission];
    }
    
    setEditingAdmin({ ...editingAdmin, permissions: updated });
  };

  const savePermissions = async () => {
    if (!editingAdmin) return;
    try {
      await updateDoc(doc(db, 'users', editingAdmin.id), {
        permissions: editingAdmin.permissions
      });
      await logActivity({
        type: 'ADMIN',
        action: 'ADMIN_RIGHTS_UPDATED',
        details: `Updated rights for admin ${editingAdmin.name}`,
        targetId: editingAdmin.id,
        targetType: 'ADMIN'
      });
      setEditingAdmin(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update permissions');
    }
  };

  const promoteUser = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        Alert.alert('User Not Found', 'No registered user found with this email. They must sign up on the app first.');
        return;
      }

      const userDoc = snap.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        role: 'admin',
        permissions: ['MANAGE_ROUTES'], // Default right
        status: 'ACTIVE'
      });

      await logActivity({
        type: 'ADMIN',
        action: 'NEW_ADMIN_CREATED',
        details: `Promoted ${inviteEmail} to Administrator role`,
        targetId: userDoc.id,
        targetType: 'ADMIN'
      });

      setShowInviteModal(false);
      setInviteEmail('');
      Alert.alert('Success', `${inviteEmail} is now an administrator.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Promotion failed');
    }
  };

  const removeAdmin = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        role: 'user',
        permissions: []
      });
      setConfirmModal({ visible: false, adminId: '', action: '' as any });
      Alert.alert('Success', 'Administrator rights revoked.');
    } catch (error) {
      console.error(error);
    }
  };

  const renderAdminItem = ({ item }: any) => (
    <TouchableOpacity style={styles.adminCard} onPress={() => setEditingAdmin(item)}>
      <View style={styles.adminHeader}>
        <View style={styles.adminAvatar}>
          <ShieldCheck size={20} color={COLORS.primary} />
        </View>
        <View style={styles.adminInfo}>
          <Text style={styles.adminName}>{item.name || 'Admin User'}</Text>
          <Text style={styles.adminEmail}>{item.email}</Text>
        </View>
        <IconButton 
          tone="neutral" 
          onPress={() => {
            if (item.email === 'admin@onedelhi.com') {
              Alert.alert('Restricted', 'Super Admin account cannot be removed.');
              return;
            }
            setConfirmModal({ visible: true, adminId: item.id, action: 'REMOVE' });
          }}
        >
          <Trash2 size={16} color={item.email === 'admin@onedelhi.com' ? COLORS.textMuted : COLORS.error} />
        </IconButton>
      </View>
      
      <View style={styles.rightsOverview}>
        {(item.permissions || []).slice(0, 3).map((p: string) => (
          <View key={p} style={styles.rightBadge}>
            <Text style={styles.rightBadgeText}>{p.replace('MANAGE_', '')}</Text>
          </View>
        ))}
        {(item.permissions || []).length > 3 && (
          <Text style={styles.moreRights}>+{(item.permissions || []).length - 3} more</Text>
        )}
        {(item.permissions || []).length === 0 && (
          <Text style={styles.noRights}>No permissions assigned</Text>
        )}
      </View>

      <View style={styles.cardFooter}>
         <Text style={styles.footerInfo}>Manage Admin Rights</Text>
         <ChevronRight size={14} color={COLORS.accent} />
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminScreen>
      <AdminHeader 
        title="Admin Hub" 
        subtitle="Manage system access & rights"
        action={(
          <IconButton tone="success" onPress={() => setShowInviteModal(true)}>
            <UserPlus size={18} color={COLORS.white} />
          </IconButton>
        )}
      />

      <View style={styles.searchBox}>
        <SearchField placeholder="Find an administrator..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <LoadingState label="Verifying access..." />
      ) : (
        <FlatList
          data={admins.filter(a => a.email?.toLowerCase().includes(searchQuery.toLowerCase()) || a.name?.toLowerCase().includes(searchQuery.toLowerCase()))}
          keyExtractor={(item) => item.id}
          renderItem={renderAdminItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon={<ShieldAlert size={30} color={COLORS.textSubtle} />} title="No admins found" message="Add a new administrator to help manage the system." />}
        />
      )}

      {/* Permissions Sheet */}
      <AdminBottomSheet
        visible={!!editingAdmin}
        onClose={() => setEditingAdmin(null)}
        title="Manage Rights"
        subtitle={editingAdmin?.name || 'Administrator'}
        contentStyle={{ paddingHorizontal: 0 }}
      >
        <ScrollView style={styles.rightsScroll}>
          {editingAdmin?.email === 'admin@onedelhi.com' && (
            <View style={styles.superAdminNotice}>
              <ShieldCheck size={16} color={COLORS.success} />
              <Text style={styles.superAdminText}>Super Admin has permanent full access.</Text>
            </View>
          )}
          <Text style={styles.sheetSection}>ACCESS PERMISSIONS</Text>
          {ALL_PERMISSIONS.map((perm) => {
            const hasPerm = editingAdmin?.permissions?.includes(perm.key);
            return (
              <TouchableOpacity 
                key={perm.key} 
                style={styles.permRow}
                onPress={() => handleTogglePermission(perm.key)}
              >
                <View style={styles.permIcon}>
                  {hasPerm ? <CheckSquare size={20} color={COLORS.primary} /> : <Square size={20} color={COLORS.textMuted} />}
                </View>
                <View style={styles.permContent}>
                  <Text style={[styles.permLabel, hasPerm && styles.permLabelActive]}>{perm.label}</Text>
                  <Text style={styles.permDesc}>{perm.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {editingAdmin?.email !== 'admin@onedelhi.com' && (
            <TouchableOpacity style={styles.saveBtn} onPress={savePermissions}>
              <Text style={styles.saveBtnText}>Update Access Rights</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </AdminBottomSheet>

      {/* Add Admin Modal */}
      <AdminBottomSheet
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Add New Admin"
        subtitle="Promote an existing user to admin"
      >
        <View style={styles.inviteBox}>
          <Text style={styles.inputLabel}>USER EMAIL ADDRESS</Text>
          <SearchField 
            placeholder="Search by email..." 
            value={inviteEmail} 
            onChangeText={setInviteEmail} 
            icon={<Search size={18} color={COLORS.textMuted} />}
          />
          <Text style={styles.inviteHint}>The user must have an active account on the One Delhi app to be promoted.</Text>
          
          <TouchableOpacity style={styles.promoteBtn} onPress={promoteUser}>
            <Text style={styles.promoteText}>Grant Admin Access</Text>
          </TouchableOpacity>
        </View>
      </AdminBottomSheet>

      <ConfirmationModal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, adminId: '', action: 'REMOVE' })}
        onConfirm={() => removeAdmin(confirmModal.adminId)}
        title="Revoke Access?"
        message="This user will lose all administrative privileges and be demoted to a regular user."
      />
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.lg },
  searchBox: { paddingHorizontal: SPACING.lg, marginBottom: 10 },
  adminCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  adminHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  adminAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  adminEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  rightsOverview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rightBadge: { backgroundColor: COLORS.surfaceMuted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  rightBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase' },
  moreRights: { fontSize: 10, color: COLORS.accent, fontWeight: '700' },
  noRights: { fontSize: 11, color: COLORS.error, fontWeight: '600', fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerInfo: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  
  rightsScroll: { padding: 20 },
  sheetSection: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 20 },
  permRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  permIcon: { marginTop: 2 },
  permContent: { flex: 1 },
  permLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  permLabelActive: { color: COLORS.primary },
  permDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  saveBtn: { backgroundColor: COLORS.primary, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20, ...SHADOWS.primary },
  saveBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  superAdminNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.successSoft, padding: 12, borderRadius: 12, marginBottom: 20, marginHorizontal: 20 },
  superAdminText: { fontSize: 12, fontWeight: '700', color: COLORS.success },

  inviteBox: { paddingVertical: 10 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, marginBottom: 12 },
  inviteHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 12, lineHeight: 18 },
  promoteBtn: { backgroundColor: COLORS.success, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24, ...SHADOWS.card },
  promoteText: { color: COLORS.white, fontSize: 15, fontWeight: '800' },
});
