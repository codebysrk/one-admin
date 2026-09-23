import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SPACING } from '../../core/theme';
import { AdminBottomSheet } from '../../components/AdminUI';
import { createClientUser } from '../../services/userCreationService';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const UserPlus = IconWrapper('account-plus');
const Key = IconWrapper('key');
const ContentCopy = IconWrapper('content-copy');
const Check = IconWrapper('check');
const ShareVariant = IconWrapper('share-variant');
const Eye = IconWrapper('eye');
const EyeOff = IconWrapper('eye-off');
const Refresh = IconWrapper('refresh');

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  visible,
  onClose,
  onUserCreated,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setShowPassword(false);
    setLoading(false);
    setCreatedUser(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateRandomPassword = () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter Full Name first to generate a personalized password.');
      return;
    }

    const cleanName = fullName.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '');
    const formattedName = cleanName
      ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()
      : 'User';

    const randomDigits = formattedName.length <= 3
      ? Math.floor(1000 + Math.random() * 9000)
      : Math.floor(100 + Math.random() * 900);

    setPassword(`${formattedName}@${randomDigits}`);
  };

  const handleCreate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter user full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const result = await createClientUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      setCreatedUser(result);
      if (onUserCreated) onUserCreated();
    } catch (error: any) {
      let msg = error?.message || 'Failed to create user account.';
      if (error?.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered.';
      } else if (error?.code === 'auth/invalid-email') {
        msg = 'The email address is badly formatted.';
      } else if (error?.code === 'auth/weak-password') {
        msg = 'The password is too weak. Please use a stronger password.';
      }
      Alert.alert('Creation Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const getShareText = () => {
    if (!createdUser) return '';
    return `One Delhi App Login Credentials:\nName: ${createdUser.name}\nEmail: ${createdUser.email}\nPhone: ${createdUser.phone}\nPassword: ${createdUser.password}\n\nPlease keep these credentials secure.`;
  };

  const handleCopyCredentials = async () => {
    if (!createdUser) return;
    await Clipboard.setStringAsync(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareCredentials = async () => {
    if (!createdUser) return;
    try {
      await Share.share({
        message: getShareText(),
        title: 'One Delhi Login Credentials',
      });
    } catch (error: any) {
      Alert.alert('Share Failed', error?.message || 'Could not open share dialog.');
    }
  };

  return (
    <AdminBottomSheet
      visible={visible}
      onClose={handleClose}
      title={createdUser ? 'Account Created' : 'Create User Account'}
      subtitle={
        createdUser
          ? 'Share these login credentials with the user'
          : 'Generate credentials for a new client user'
      }
    >
      {createdUser ? (
        <View style={styles.successContainer}>
          <View style={styles.successBadge}>
            <Check size={28} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Account Successfully Created!</Text>
          <Text style={styles.successSubtitle}>
            The user can now log in to the One Delhi app using the credentials below:
          </Text>

          <View style={styles.credentialsCard}>
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Full Name</Text>
              <Text style={styles.credValue}>{createdUser.name}</Text>
            </View>
            <View style={styles.credDivider} />
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Email</Text>
              <Text style={styles.credValue}>{createdUser.email}</Text>
            </View>
            <View style={styles.credDivider} />
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Mobile</Text>
              <Text style={styles.credValue}>{createdUser.phone}</Text>
            </View>
            <View style={styles.credDivider} />
            <View style={styles.credRow}>
              <Text style={styles.credLabel}>Password</Text>
              <Text style={[styles.credValue, styles.credPassword]}>
                {createdUser.password}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, styles.copyBtn]}
              onPress={handleCopyCredentials}
              activeOpacity={0.8}
            >
              {copied ? (
                <Check size={18} color="#ffffff" />
              ) : (
                <ContentCopy size={18} color="#ffffff" />
              )}
              <Text style={styles.btnText}>{copied ? 'Copied!' : 'Copy Info'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.shareBtn]}
              onPress={handleShareCredentials}
              activeOpacity={0.8}
            >
              <ShareVariant size={18} color="#ffffff" />
              <Text style={styles.btnText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.doneBtn]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flexShrink: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formContainer}
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.textSubtle}
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. rahul@example.com"
              placeholderTextColor={colors.textSubtle}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>MOBILE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor={colors.textSubtle}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>PASSWORD</Text>
              <TouchableOpacity
                onPress={generateRandomPassword}
                style={styles.generateBtn}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Refresh size={14} color={colors.accent} />
                <Text style={styles.generateBtnText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter or generate password"
                placeholderTextColor={colors.textSubtle}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textSubtle} />
                ) : (
                  <Eye size={18} color={colors.textSubtle} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createSubmitBtn, loading && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <UserPlus size={18} color="#ffffff" />
                <Text style={styles.createSubmitBtnText}>Create User Account</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </AdminBottomSheet>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    formContainer: {
      gap: 14,
      paddingBottom: 24,
    },
    fieldGroup: {
      gap: 6,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSubtle,
      letterSpacing: 0.8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      fontSize: 14,
      color: colors.text,
    },
    passwordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    generateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    generateBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },
    passwordInputContainer: {
      position: 'relative',
      justifyContent: 'center',
    },
    passwordInput: {
      paddingRight: 40,
    },
    eyeBtn: {
      position: 'absolute',
      right: 12,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    createSubmitBtn: {
      backgroundColor: colors.accent,
      borderRadius: RADIUS.md,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
    },
    createSubmitBtnText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.6,
    },
    successContainer: {
      alignItems: 'center',
      gap: 12,
      paddingBottom: 24,
    },
    successBadge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    successTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    successSubtitle: {
      fontSize: 13,
      color: colors.textSubtle,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
    credentialsCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      marginVertical: 8,
    },
    credRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    credLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSubtle,
    },
    credValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    credPassword: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      color: colors.accent,
      backgroundColor: colors.accent + '15',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    credDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    btn: {
      flex: 1,
      height: 44,
      borderRadius: RADIUS.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    copyBtn: {
      backgroundColor: colors.accent,
    },
    shareBtn: {
      backgroundColor: colors.success || '#10B981',
    },
    btnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    doneBtn: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
    },
    doneBtnText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
  });
