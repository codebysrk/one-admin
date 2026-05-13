import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateEmail, updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useAdminStore } from '../../store/useAdminStore';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../core/theme';
import { User, Mail, Lock, Save, LogOut, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react-native';

export const AdminProfileScreen = () => {
  const admin = useAdminStore((s) => s.admin);
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const logout = useAdminStore((s) => s.logout);
  const setActiveTab = useAdminStore((s) => s.setActiveTab);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'security'>('info');
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', admin.uid), { name: name.trim() });
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name.trim() });
      setAdmin({ ...admin, name: name.trim() });
      Alert.alert('Success', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async () => {
    if (!currentPassword) return Alert.alert('Error', 'Current password required');
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      if (email !== admin.email) {
        await updateEmail(user, email);
        await updateDoc(doc(db, 'users', admin.uid), { email });
        setAdmin({ ...admin, email });
      }
      if (newPassword) await updatePassword(user, newPassword);
      Alert.alert('Success', 'Security updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.topBar}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to dashboard" onPress={() => setActiveTab('Dashboard')} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Profile Settings</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Logout" onPress={logout} style={styles.miniLogout}>
            <LogOut size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              <ShieldCheck size={24} color={COLORS.white} />
            </View>
            <View style={styles.adminCopy}>
              <Text style={styles.adminName} numberOfLines={1}>{admin?.name}</Text>
              <Text style={styles.adminRole}>
                {admin?.email === 'admin@onedelhi.com' ? 'Super Administrator' : 'Administrator'}
              </Text>
            </View>
          </View>

          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabItem, activeSubTab === 'info' && styles.tabActive]}
              onPress={() => setActiveSubTab('info')}
              activeOpacity={0.82}
            >
              <Text style={[styles.tabText, activeSubTab === 'info' && styles.tabTextActive]}>Basic Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeSubTab === 'security' && styles.tabActive]}
              onPress={() => setActiveSubTab('security')}
              activeOpacity={0.82}
            >
              <Text style={[styles.tabText, activeSubTab === 'security' && styles.tabTextActive]}>Security</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            {activeSubTab === 'info' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color={COLORS.textMuted} />
                    <TextInput style={styles.input} value={name} onChangeText={setName} selectionColor={COLORS.accent} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Admin ID</Text>
                  <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                    <Text style={styles.readOnlyText} numberOfLines={1}>{admin?.uid || admin?.id || 'N/A'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.mainBtn} onPress={handleUpdateProfile} disabled={loading} activeOpacity={0.86}>
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <><Save size={16} color={COLORS.white} /><Text style={styles.btnText}>Save Changes</Text></>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={16} color={COLORS.textMuted} />
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" selectionColor={COLORS.accent} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color={COLORS.textMuted} />
                    <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} placeholder="Optional new password" placeholderTextColor={COLORS.textSubtle} selectionColor={COLORS.accent} />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                      {showNewPassword ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={[styles.inputWrapper, styles.dangerInput]}>
                    <Lock size={16} color={COLORS.error} />
                    <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrentPassword} placeholder="Confirm current password" placeholderTextColor={COLORS.textSubtle} selectionColor={COLORS.error} />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeBtn}>
                      {showCurrentPassword ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={[styles.mainBtn, styles.securityBtn]} onPress={handleUpdateSecurity} disabled={loading} activeOpacity={0.86}>
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <><Lock size={16} color={COLORS.white} /><Text style={styles.btnText}>Update Security</Text></>}
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={styles.footerText}>One Delhi Admin Panel v2.1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  keyboard: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md, backgroundColor: COLORS.primary, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  topBarTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  miniLogout: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.errorSoft },
  content: { flex: 1 },
  contentInner: { padding: SPACING.xl, paddingBottom: 44 },
  headerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  avatar: { width: 52, height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  adminCopy: { flex: 1, minWidth: 0 },
  adminName: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: COLORS.text },
  adminRole: { fontSize: 12, color: COLORS.accent, fontWeight: '800', marginTop: 3 },
  tabSelector: { flexDirection: 'row', backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, padding: 4, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  tabItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.surface, ...SHADOWS.card },
  tabText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  section: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, paddingHorizontal: 12, minHeight: 48, borderWidth: 1, borderColor: COLORS.border },
  readOnlyWrapper: { backgroundColor: '#F8FAFC' },
  dangerInput: { borderColor: '#FECACA', backgroundColor: '#FFF7F7' },
  input: { flex: 1, minWidth: 0, marginLeft: 9, fontSize: 14, color: COLORS.text, fontWeight: '700', paddingVertical: 0 },
  eyeBtn: { padding: 8, marginRight: -6 },
  readOnlyText: { flex: 1, fontSize: 12, color: COLORS.textMuted, fontFamily: 'monospace', fontWeight: '700' },
  mainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, minHeight: 50, borderRadius: RADIUS.md, gap: 8, marginTop: 2, ...SHADOWS.floating },
  securityBtn: { backgroundColor: COLORS.success },
  btnText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  footerText: { textAlign: 'center', fontSize: 10, color: COLORS.textSubtle, marginTop: SPACING.xxl, fontWeight: '800' },
});
