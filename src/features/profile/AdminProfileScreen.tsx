import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { useAdminStore } from '../../store/useAdminStore';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS, SPACING  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const User = IconWrapper('account');
const Mail = IconWrapper('email');
const Lock = IconWrapper('lock');
const Save = IconWrapper('content-save-outline');
const LogOut = IconWrapper('logout');
const Eye = IconWrapper('eye');
const EyeOff = IconWrapper('eye-off');
const ArrowLeft = IconWrapper('arrow-left');
const ShieldCheck = IconWrapper('shield-check');
import { AdminHeader } from '../../components/AdminUI';

export const AdminProfileScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const admin = useAdminStore((s) => s.admin);
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const logout = useAdminStore((s) => s.logout);
  const navigation = useNavigation<any>();
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
      const adminId = admin?.id || admin?.uid;
      const { error } = await supabase.from('users').update({ name: name.trim() }).eq('id', adminId);
      if (error) throw error;
      await supabase.auth.updateUser({ data: { name: name.trim() } });
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
      const adminEmail = admin?.email;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: currentPassword,
      });
      if (signInError) throw new Error('Incorrect current password');

      const adminId = admin?.id || admin?.uid;
      if (email && email !== adminEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        await supabase.from('users').update({ email }).eq('id', adminId);
        setAdmin({ ...admin, email });
      }
      if (newPassword) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwdError) throw pwdError;
      }
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
    <View style={styles.container}>
      <AdminHeader
        title="Profile Settings"
        subtitle={admin?.email || "Account & security preferences"}
        onBack={() => navigation.goBack()}
        action={(
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Logout" onPress={logout} style={styles.miniLogout}>
            <LogOut size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled">
          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              <ShieldCheck size={24} color={colors.accent} />
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
              <User size={15} color={activeSubTab === 'info' ? colors.accent : colors.textMuted} />
              <Text style={[styles.tabText, activeSubTab === 'info' && styles.tabTextActive]}>Basic Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeSubTab === 'security' && styles.tabActive]}
              onPress={() => setActiveSubTab('security')}
              activeOpacity={0.82}
            >
              <Lock size={15} color={activeSubTab === 'security' ? colors.accent : colors.textMuted} />
              <Text style={[styles.tabText, activeSubTab === 'security' && styles.tabTextActive]}>Security</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            {activeSubTab === 'info' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color={colors.textMuted} />
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your full name" placeholderTextColor={colors.textSubtle} selectionColor={colors.accent} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Admin ID</Text>
                  <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                    <Text style={styles.readOnlyText} numberOfLines={1}>{admin?.uid || admin?.id || 'N/A'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.mainBtn} onPress={handleUpdateProfile} disabled={loading} activeOpacity={0.86}>
                  {loading ? <ActivityIndicator color={colors.white} /> : <><Save size={16} color={colors.white} /><Text style={styles.btnText}>Save Changes</Text></>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={16} color={colors.textMuted} />
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="admin@onedelhi.com" placeholderTextColor={colors.textSubtle} keyboardType="email-address" autoCapitalize="none" selectionColor={colors.accent} />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color={colors.textMuted} />
                    <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} placeholder="Enter new password (optional)" placeholderTextColor={colors.textSubtle} selectionColor={colors.accent} />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                      {showNewPassword ? <EyeOff size={16} color={colors.textMuted} /> : <Eye size={16} color={colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={[styles.inputWrapper, styles.dangerInput]}>
                    <Lock size={16} color={colors.error} />
                    <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrentPassword} placeholder="Enter current password to confirm" placeholderTextColor={colors.textSubtle} selectionColor={colors.error} />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.eyeBtn}>
                      {showCurrentPassword ? <EyeOff size={16} color={colors.textMuted} /> : <Eye size={16} color={colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={[styles.mainBtn, styles.securityBtn]} onPress={handleUpdateSecurity} disabled={loading} activeOpacity={0.86}>
                  {loading ? <ActivityIndicator color={colors.white} /> : <><Lock size={16} color={colors.white} /><Text style={styles.btnText}>Update Security</Text></>}
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.footerText}>One Delhi Admin Panel v1.2.1</Text>
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }} />
      </KeyboardAvoidingView>
    </View>
  );
};

function getStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    keyboard: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBarTitle: { fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.md,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    miniLogout: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.md,
      backgroundColor: colors.errorSoft,
    },
    content: { flex: 1 },
    contentInner: { padding: SPACING.xl, paddingBottom: 44 },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: SPACING.lg,
      borderRadius: RADIUS.card,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.card,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.accentSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    adminCopy: { flex: 1, minWidth: 0 },
    adminName: { fontSize: 18, lineHeight: 24, fontWeight: '900', color: colors.text },
    adminRole: { fontSize: 12, color: colors.accent, fontWeight: '800', marginTop: 3 },
    tabSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceMuted,
      borderRadius: RADIUS.pill,
      padding: 4,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabItem: {
      flex: 1,
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: RADIUS.pill,
    },
    tabActive: {
      backgroundColor: isDark ? colors.surfacePressed : colors.surface,
      borderWidth: 1,
      borderColor: isDark ? colors.borderStrong : colors.border,
      ...SHADOWS.card,
    },
    tabText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
    tabTextActive: { color: colors.accent, fontWeight: '800' },
    section: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.card,
    },
    inputGroup: { marginBottom: SPACING.lg },
    label: { fontSize: 10, fontWeight: '700', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: RADIUS.lg,
      paddingHorizontal: 14,
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
    },
    readOnlyWrapper: {
      backgroundColor: colors.surfacePressed || colors.surfaceMuted,
      borderColor: colors.border,
    },
    dangerInput: {
      borderColor: colors.error + '44',
      backgroundColor: colors.errorSoft,
    },
    input: { flex: 1, minWidth: 0, marginLeft: 9, fontSize: 14, color: colors.text, fontWeight: '700', paddingVertical: 0 },
    eyeBtn: { padding: 8, marginRight: -6 },
    readOnlyText: { flex: 1, fontSize: 12, color: colors.textMuted, fontFamily: 'monospace', fontWeight: '700' },
    mainBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      minHeight: 48,
      borderRadius: RADIUS.lg,
      gap: 8,
      marginTop: 2,
      ...SHADOWS.subtle,
    },
    securityBtn: { backgroundColor: colors.success },
    btnText: { color: colors.white, fontWeight: '800', fontSize: 14 },
    footerText: { textAlign: 'center', fontSize: 10, color: colors.textSubtle, marginTop: SPACING.xxl, fontWeight: '800' },
  });
}
