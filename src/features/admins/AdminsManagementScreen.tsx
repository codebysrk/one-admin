import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { FlashList } from '@shopify/flash-list';
import { db } from '../../services/firebase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminHeader, AdminScreen, EmptyState, IconButton, LoadingState, SearchField, AdminBottomSheet, ConfirmationModal } from '../../components/AdminUI';
import { AdminPermission } from '../../services/authService';
import { logActivity } from '../../services/logService';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const UserPlus = IconWrapper('account-plus');
const ShieldCheck = IconWrapper('shield-check');
const ShieldAlert = IconWrapper('shield-alert');
const Trash2 = IconWrapper('trash-can-outline');
const ChevronRight = IconWrapper('chevron-right');
const CheckSquare = IconWrapper('checkbox-marked');
const Square = IconWrapper('checkbox-blank-outline');

const ALL_PERMISSIONS: { key: AdminPermission; label: string; desc: string }[] = [
  { key: 'MANAGE_ROUTES', label: 'Route Management', desc: 'Can create, edit and delete bus lines' },
  { key: 'MANAGE_TICKETS', label: 'Ticket Audit', desc: 'Can view and void passenger tickets' },
  { key: 'MANAGE_LOGS', label: 'Security Logs', desc: 'Can view and prune system audit logs' },
  { key: 'MANAGE_USERS', label: 'User Control', desc: 'Can manage user accounts and deletions' },
  { key: 'MANAGE_ADMINS', label: 'Admin Hub', desc: 'Can manage other admins and their rights' },
  { key: 'FULL_ACCESS', label: 'Full Access', desc: 'Unrestricted access to all system features' },
];

export const AdminsManagementScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = typeof getStyles === 'function' ? getStyles(colors) : {} as any;
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
      if (__DEV__) console.error(error);
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
      if (__DEV__) console.error(error);
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
      if (__DEV__) console.error(error);
    }
  };

  const renderAdminItem = ({ item }: any) => (
    <TouchableOpacity style={styles.adminCard} onPress={() => setEditingAdmin(item)} activeOpacity={0.8}>
      <View style={styles.adminHeader}>
        <View style={styles.adminAvatar}>
          <ShieldCheck size={20} color={isDark ? colors.text : colors.primary} />
        </View>
        <View style={styles.adminInfo}>
          <Text style={styles.adminName}>{item.name || 'Admin User'}</Text>
          <Text style={styles.adminEmail}>{item.email}</Text>
        </View>
        <TouchableOpacity 
          accessibilityRole="button" 
          accessibilityLabel={`Remove admin ${item.name || 'user'}`}
          onPress={() => {
            if (item.email === 'admin@onedelhi.com') {
              Alert.alert('Restricted', 'Super Admin account cannot be removed.');
              return;
            }
            setConfirmModal({ visible: true, adminId: item.id, action: 'REMOVE' });
          }}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={item.email === 'admin@onedelhi.com' ? colors.textSubtle : colors.error} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightsOverview}>
        {(item.permissions || []).slice(0, 3).map((p: string) => (
          <View key={p} style={styles.rightBadge}>
            <Text style={styles.rightBadgeText}>{p.replace('MANAGE_', '').replace('_', ' ')}</Text>
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
         <ChevronRight size={14} color={colors.accent} />
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminScreen>
      <AdminHeader 
        title="Admin Hub" 
        subtitle="Manage system access & rights"
        action={(
          <IconButton tone="success" accessibilityLabel="Add new administrator" onPress={() => setShowInviteModal(true)}>
            <UserPlus size={18} color={colors.white} />
          </IconButton>
        )}
      />

      <View style={styles.searchBoxContainer}>
        <SearchField placeholder="Find an administrator..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {loading ? (
        <LoadingState label="Verifying access..." />
      ) : (
        <FlashList
          data={admins.filter(a => a.email?.toLowerCase().includes(searchQuery.toLowerCase()) || a.name?.toLowerCase().includes(searchQuery.toLowerCase()))}
          keyExtractor={(item) => item.id}
          renderItem={renderAdminItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon={<ShieldAlert size={30} color={colors.textSubtle} />} title="No admins found" message="Add a new administrator to help manage the system." />}
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
              <ShieldCheck size={16} color={colors.success} />
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
                activeOpacity={0.7}
              >
                <View style={styles.permIcon}>
                  {hasPerm ? <CheckSquare size={20} color={isDark ? colors.text : colors.primary} /> : <Square size={20} color={colors.textSubtle} />}
                </View>
                <View style={styles.permContent}>
                  <Text style={[styles.permLabel, hasPerm && styles.permLabelActive]}>{perm.label}</Text>
                  <Text style={styles.permDesc}>{perm.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {editingAdmin?.email !== 'admin@onedelhi.com' && (
            <TouchableOpacity style={styles.saveBtn} onPress={savePermissions} activeOpacity={0.8}>
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
          />
          <Text style={styles.inviteHint}>The user must have an active account on the One Delhi app to be promoted.</Text>
          
          <TouchableOpacity style={styles.promoteBtn} onPress={promoteUser} activeOpacity={0.8}>
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

const getStyles = (colors: any) => StyleSheet.create({
  list: { padding: SPACING.xl, paddingBottom: 40 },
  searchBoxContainer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, marginBottom: 12 },
  adminCard: { 
    backgroundColor: colors.surface, 
    borderRadius: RADIUS.lg, 
    padding: 14, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.border, 
    ...SHADOWS.card 
  },
  adminHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  adminAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: RADIUS.md, 
    backgroundColor: colors.primarySoft, 
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.15)',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  adminInfo: { flex: 1, minWidth: 0 },
  adminName: { fontSize: 14, fontWeight: '800', color: colors.text },
  adminEmail: { fontSize: 11, color: colors.textMuted, marginTop: 1, fontWeight: '600' },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FECDD3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightsOverview: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    alignItems: 'center',
    gap: 6, 
    marginBottom: 12, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  rightBadge: { 
    backgroundColor: colors.surfaceMuted, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: RADIUS.sm, 
    borderWidth: 1, 
    borderColor: colors.border 
  },
  rightBadgeText: { fontSize: 9, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' },
  moreRights: { fontSize: 10, color: colors.accent, fontWeight: '700' },
  noRights: { fontSize: 11, color: colors.error, fontWeight: '600', fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerInfo: { fontSize: 11, fontWeight: '800', color: colors.accent },
  
  rightsScroll: { paddingHorizontal: 20, paddingTop: 16 },
  sheetSection: { fontSize: 10, fontWeight: '800', color: colors.textSubtle, letterSpacing: 0.5, marginBottom: 16 },
  permRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  permIcon: { marginTop: 1 },
  permContent: { flex: 1 },
  permLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  permLabelActive: { color: colors.background === '#000000' ? colors.text : colors.primary, fontWeight: '800' },
  permDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  saveBtn: { 
    backgroundColor: colors.primary, 
    height: 44, 
    borderRadius: RADIUS.md, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20, 
  },
  saveBtnText: { color: colors.white, fontSize: 13, fontWeight: '800' },

  superAdminNotice: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: colors.successSoft, 
    padding: 10, 
    borderRadius: RADIUS.md, 
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16, 
  },
  superAdminText: { fontSize: 11, fontWeight: '700', color: colors.success },

  inviteBox: { paddingVertical: 10 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: colors.textSubtle, marginBottom: 8 },
  inviteHint: { fontSize: 11, color: colors.textMuted, marginTop: 8, lineHeight: 16 },
  promoteBtn: { 
    backgroundColor: colors.success, 
    height: 44, 
    borderRadius: RADIUS.md, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20, 
  },
  promoteText: { color: colors.white, fontSize: 13, fontWeight: '800' },
});
