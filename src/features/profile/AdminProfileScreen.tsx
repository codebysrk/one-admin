import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { updateEmail, updatePassword, updateProfile, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useAdminStore } from '../../store/useAdminStore';
import { COLORS } from '../../core/theme';
import { User, Mail, Lock, Save, LogOut, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react-native';

const { height } = Dimensions.get('window');

export const AdminProfileScreen = () => {
  const { admin, setAdmin, logout, setActiveTab } = useAdminStore();
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'security'>('info');
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name) return Alert.alert("Error", "Name cannot be empty");
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', admin.id), { name });
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
      setAdmin({ ...admin, name });
      Alert.alert("Success", "Profile updated");
    } catch (error: any) { Alert.alert("Error", error.message); }
    finally { setLoading(false); }
  };

  const handleUpdateSecurity = async () => {
    if (!currentPassword) return Alert.alert("Error", "Current password required");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No user logged in");
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      if (email !== admin.email) {
        await updateEmail(user, email);
        await updateDoc(doc(db, 'users', admin.id), { email });
        setAdmin({ ...admin, email });
      }
      if (newPassword) await updatePassword(user, newPassword);
      Alert.alert("Success", "Security updated");
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) { Alert.alert("Error", error.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setActiveTab('Dashboard')} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile Settings</Text>
        <TouchableOpacity onPress={logout} style={styles.miniLogout}>
          <LogOut size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <ShieldCheck size={24} color="white" />
          </View>
          <View>
            <Text style={styles.adminName} numberOfLines={1}>{admin?.name}</Text>
            <Text style={styles.adminRole}>Super Administrator</Text>
          </View>
        </View>

        <View style={styles.tabSelector}>
          <TouchableOpacity 
            style={[styles.tabItem, activeSubTab === 'info' && styles.tabActive]} 
            onPress={() => setActiveSubTab('info')}
          >
            <Text style={[styles.tabText, activeSubTab === 'info' && styles.tabTextActive]}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, activeSubTab === 'security' && styles.tabActive]} 
            onPress={() => setActiveSubTab('security')}
          >
            <Text style={[styles.tabText, activeSubTab === 'security' && styles.tabTextActive]}>Security</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formArea}>
          {activeSubTab === 'info' ? (
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color={COLORS.textMuted} />
                  <TextInput style={styles.input} value={name} onChangeText={setName} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ADMIN ID</Text>
                <View style={[styles.inputWrapper, { backgroundColor: '#F8FAFC' }]}>
                  <Text style={styles.readOnlyText}>{admin?.id}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.mainBtn} onPress={handleUpdateProfile} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <><Save size={16} color="white" /><Text style={styles.btnText}>Save Changes</Text></>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color={COLORS.textMuted} />
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color={COLORS.textMuted} />
                  <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} placeholder="••••••••" />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CURRENT PASSWORD (RE-AUTH)</Text>
                <View style={[styles.inputWrapper, { borderColor: '#FECACA', borderWidth: 1 }]}>
                  <Lock size={16} color="#EF4444" />
                  <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrentPassword} placeholder="Confirm current password" />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? <EyeOff size={16} color={COLORS.textMuted} /> : <Eye size={16} color={COLORS.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={[styles.mainBtn, { backgroundColor: '#10B981' }]} onPress={handleUpdateSecurity} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <><Lock size={16} color="white" /><Text style={styles.btnText}>Update Security</Text></>}
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.footerText}>One Delhi Admin Panel v2.1.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  topBarTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary },
  backBtn: { padding: 4 },
  miniLogout: { padding: 6, borderRadius: 6, backgroundColor: '#FEE2E2' },
  content: { flex: 1, padding: 16 },
  headerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  adminName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', maxWidth: 200 },
  adminRole: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
  tabSelector: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4, marginBottom: 16 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: 'white', elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: COLORS.primary },
  formArea: { flex: 1 },
  section: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, height: 40 },
  input: { flex: 1, marginLeft: 8, fontSize: 13, color: '#1E293B' },
  readOnlyText: { flex: 1, marginLeft: 8, fontSize: 11, color: '#64748B', fontFamily: 'monospace' },
  mainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, height: 40, borderRadius: 8, gap: 8, marginTop: 4 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  footerText: { textAlign: 'center', fontSize: 10, color: '#CBD5E1', marginTop: 'auto', paddingBottom: 10 }
});
