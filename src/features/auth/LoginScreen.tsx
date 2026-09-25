import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Dimensions, Modal, Keyboard, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { loginAdmin } from '../../services/authService';
import { useAdminStore } from '../../store/useAdminStore';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS  } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Lock = IconWrapper('lock');
const Mail = IconWrapper('email');
const Eye = IconWrapper('eye');
const EyeOff = IconWrapper('eye-off');
const ArrowRight = IconWrapper('arrow-right');
const ShieldCheck = IconWrapper('shield-check');
const X = IconWrapper('close');
const Send = IconWrapper('send');
const AlertCircle = IconWrapper('alert-circle');
const Fingerprint = IconWrapper('fingerprint');
const Key = IconWrapper('key-variant');
const CheckCircle = IconWrapper('check-circle-outline');
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const { height } = Dimensions.get('window');

export const LoginScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [modalType, setModalType] = useState<'SUCCESS' | 'ERROR'>('SUCCESS');
  const [modalContent, setModalContent] = useState({ title: '', desc: '' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  // Lost Access In-App Recovery State (exact one-delhi algorithm)
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const otpInputRef = useRef<any>(null);

  const setAdmin = useAdminStore((state) => state.setAdmin);

  useEffect(() => {
    checkBiometrics();
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const showPremiumModal = (type: 'SUCCESS' | 'ERROR', title: string, desc: string) => {
    setModalType(type);
    setModalContent({ title, desc });
    setShowResetModal(true);
  };

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const savedCreds = await SecureStore.getItemAsync('admin_creds');
    setIsBiometricAvailable(hasHardware && isEnrolled && !!savedCreds);
  };

  const handleLogin = async () => {
    if (!email) return showPremiumModal('ERROR', 'Identification Required', 'Please enter your registered admin email address to initiate the authentication process.');
    if (!password) return showPremiumModal('ERROR', 'Security Key Missing', 'A valid administrative password is required to access the One Delhi Control Center.');
    
    setLoading(true);
    const result = await loginAdmin(email, password);
    setLoading(false);
    
    if (result.success) {
      // Save credentials for future biometric login
      await SecureStore.setItemAsync('admin_creds', JSON.stringify({ email, password }));
      setAdmin(result.userData);
    } else {
      showPremiumModal('ERROR', 'Access Denied', result.error);
    }
  };

  const handleBiometricLogin = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access Admin Dashboard',
      fallbackLabel: 'Use Password',
    });

    if (result.success) {
      const savedCreds = await SecureStore.getItemAsync('admin_creds');
      if (savedCreds) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(savedCreds);
        setLoading(true);
        const loginResult = await loginAdmin(savedEmail, savedPassword);
        setLoading(false);
        if (loginResult.success) setAdmin(loginResult.userData);
        else showPremiumModal('ERROR', 'Session Expired', 'Please login manually once.');
      }
    }
  };

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOpenLostAccess = () => {
    setRecoveryEmail(email.trim());
    setRecoveryStep('EMAIL');
    setRecoveryOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryError(null);
    setRecoveryModalVisible(true);
  };

  const handleSendRecoveryOtp = async () => {
    const cleanEmail = recoveryEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRecoveryError('Please enter a valid administrative email.');
      return;
    }
    setRecoveryLoading(true);
    setRecoveryError(null);
    try {
      const { data: checkRes, error: checkErr } = await supabase.rpc('check_user_email_exists', {
        lookup_email: cleanEmail,
      });

      if (checkErr) {
        console.warn('[LoginScreen] User check error:', checkErr);
      } else if (checkRes) {
        if (!checkRes.exists) {
          setRecoveryError('This email is not registered. Please enter a valid registered email.');
          setRecoveryLoading(false);
          return;
        }
        if (checkRes.status === 'BANNED' || checkRes.status === 'DELETED') {
          setRecoveryError('This account is restricted. Password recovery is unavailable.');
          setRecoveryLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      setRecoveryStep('OTP');
      setResendCooldown(60);
    } catch (err: any) {
      setRecoveryError(err.message || 'Failed to dispatch recovery code.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async () => {
    const cleanOtp = recoveryOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setRecoveryError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setRecoveryError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match. Please verify.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError(null);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: recoveryEmail.trim(),
        token: cleanOtp,
        type: 'recovery',
      });
      if (otpError) throw otpError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      await supabase.auth.signOut().catch(() => {});
      setEmail(recoveryEmail.trim());
      setPassword('');
      setRecoveryModalVisible(false);
      showPremiumModal(
        'SUCCESS',
        'Password Updated',
        'Your administrative password has been securely updated. Please login with your new credentials.'
      );
    } catch (err: any) {
      setRecoveryError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <LinearGradient 
        colors={isDark ? [colors.background, colors.backgroundAlt] : ['#FFFFFF', '#F6F8FB']} 
        style={styles.backgroundContainer} 
      />
      
      {/* Background Blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          
          <View style={styles.topSection}>
            <Image
              source={require('../../../assets/images/admin-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>One Delhi, One Ride</Text>
          </View>

          <View style={[styles.middleSection, focusedInput && styles.middleSectionKeyboard]}>
            <View style={styles.authPanel}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => emailRef.current?.focus()}
              style={[styles.modernInputWrapper, focusedInput === 'email' && styles.focusedWrapper]}
            >
              <View style={styles.inputIconBox}>
                <Mail size={18} color={focusedInput === 'email' ? colors.accent : colors.textSubtle} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, (focusedInput === 'email' || email) && styles.focusedLabel]}>ADMIN EMAIL</Text>
                <TextInput
                  ref={emailRef}
                  style={styles.modernInput}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSubtle}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  editable={true}
                  keyboardType="email-address"
                  returnKeyType="next"
                  textContentType="emailAddress"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => passwordRef.current?.focus()}
              style={[styles.modernInputWrapper, focusedInput === 'password' && styles.focusedWrapper]}
            >
              <View style={styles.inputIconBox}>
                <Lock size={18} color={focusedInput === 'password' ? colors.accent : colors.textSubtle} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, (focusedInput === 'password' || password) && styles.focusedLabel]}>PASSWORD</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.modernInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSubtle}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={true}
                  keyboardType="default"
                  returnKeyType="done"
                  textContentType="password"
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={20} color={colors.textSubtle} /> : <Eye size={20} color={colors.textSubtle} />}
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleOpenLostAccess} style={styles.forgotBtn} activeOpacity={0.8}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.enterBtn, loading && styles.btnDisabled]} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.enterBtnText}>Authenticate Access</Text>
                  <View style={styles.arrowBox}>
                    <ArrowRight size={16} color={colors.white} />
                  </View>
                </>
              )}
            </TouchableOpacity>
            </View>
          </View>

          { !isKeyboardVisible && (
            <View style={styles.bottomSection}>
              <View style={styles.biometricArea}>
                <View style={styles.line} />
                <TouchableOpacity 
                  style={[styles.bioBtn, !isBiometricAvailable && styles.bioBtnDisabled]} 
                  onPress={handleBiometricLogin}
                  disabled={!isBiometricAvailable}
                >
                  <Fingerprint size={32} color={isBiometricAvailable ? colors.accent : colors.border} />
                </TouchableOpacity>
                <View style={styles.line} />
              </View>
              
              <View style={styles.secureBadge}>
                <ShieldCheck size={14} color={colors.textSubtle} />
                <Text style={styles.secureText}>Secure Server Authentication</Text>
              </View>
            </View>
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Lost Access Recovery Modal */}
      <Modal
        visible={recoveryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!recoveryLoading) setRecoveryModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.recoveryCard}>
            <View style={styles.recoveryHeader}>
              <View style={styles.recoveryIconBox}>
                <Key size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recoveryTitle}>
                  {recoveryStep === 'EMAIL' ? 'Lost Administrative Access' : 'Verify & Set Password'}
                </Text>
                <Text style={styles.recoverySubtitle}>
                  {recoveryStep === 'EMAIL'
                    ? 'Enter your registered email to receive a 6-digit recovery code.'
                    : `Enter code sent to ${recoveryEmail}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setRecoveryModalVisible(false)}
                disabled={recoveryLoading}
                style={styles.recoveryCloseBtn}
              >
                <X size={18} color={colors.textSubtle} />
              </TouchableOpacity>
            </View>

            {recoveryError && (
              <View style={styles.recoveryErrorBox}>
                <AlertCircle size={14} color={colors.error} />
                <Text style={styles.recoveryErrorText}>{recoveryError}</Text>
              </View>
            )}

            {recoveryStep === 'EMAIL' ? (
              <View style={styles.recoveryBody}>
                <View style={styles.recoveryField}>
                  <Text style={styles.recoveryLabel}>ADMIN EMAIL</Text>
                  <View style={styles.recoveryInputWrapper}>
                    <Mail size={16} color={colors.textSubtle} />
                    <TextInput
                      style={styles.recoveryInput}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textSubtle}
                      value={recoveryEmail}
                      onChangeText={(txt) => {
                        setRecoveryEmail(txt);
                        setRecoveryError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      selectionColor={colors.accent}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.recoveryPrimaryBtn, recoveryLoading && styles.btnDisabled]}
                  onPress={handleSendRecoveryOtp}
                  disabled={recoveryLoading}
                  activeOpacity={0.88}
                >
                  {recoveryLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Send size={15} color={colors.white} />
                      <Text style={styles.recoveryPrimaryBtnText}>Send Recovery Code</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recoveryBody}>
                {/* 6-Digit OTP Code (one-delhi style interactive cells) */}
                <View style={styles.recoveryField}>
                  <Text style={styles.recoveryLabel}>6-DIGIT VERIFICATION CODE</Text>
                  <Pressable
                    onPress={() => otpInputRef.current?.focus()}
                    style={styles.otpBoxesRow}
                  >
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const digit = recoveryOtp[idx] || '';
                      const isCurrent = recoveryOtp.length === idx;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.otpCell,
                            digit ? styles.otpCellFilled : null,
                            isCurrent ? styles.otpCellActive : null,
                          ]}
                        >
                          <Text style={styles.otpCellText}>{digit}</Text>
                        </View>
                      );
                    })}
                  </Pressable>

                  <TextInput
                    ref={otpInputRef}
                    style={styles.hiddenOtpInput}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={recoveryOtp}
                    onChangeText={(txt) => {
                      setRecoveryOtp(txt);
                      setRecoveryError(null);
                    }}
                    editable={!recoveryLoading}
                    autoFocus
                  />
                </View>

                {/* New Password */}
                <View style={styles.recoveryField}>
                  <Text style={styles.recoveryLabel}>NEW PASSWORD</Text>
                  <View style={styles.recoveryInputWrapper}>
                    <Lock size={16} color={colors.textSubtle} />
                    <TextInput
                      style={styles.recoveryInput}
                      placeholder="At least 6 characters"
                      placeholderTextColor={colors.textSubtle}
                      value={newPassword}
                      onChangeText={(txt) => {
                        setNewPassword(txt);
                        setRecoveryError(null);
                      }}
                      secureTextEntry={!showNewPassword}
                      selectionColor={colors.accent}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={{ padding: 4 }}
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} color={colors.textSubtle} />
                      ) : (
                        <Eye size={16} color={colors.textSubtle} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.recoveryField}>
                  <Text style={styles.recoveryLabel}>CONFIRM PASSWORD</Text>
                  <View style={styles.recoveryInputWrapper}>
                    <Lock size={16} color={colors.textSubtle} />
                    <TextInput
                      style={styles.recoveryInput}
                      placeholder="Re-enter password"
                      placeholderTextColor={colors.textSubtle}
                      value={confirmPassword}
                      onChangeText={(txt) => {
                        setConfirmPassword(txt);
                        setRecoveryError(null);
                      }}
                      secureTextEntry={!showConfirmPassword}
                      selectionColor={colors.accent}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ padding: 4 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} color={colors.textSubtle} />
                      ) : (
                        <Eye size={16} color={colors.textSubtle} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[styles.recoveryPrimaryBtn, recoveryLoading && styles.btnDisabled]}
                  onPress={handleVerifyAndResetPassword}
                  disabled={recoveryLoading}
                  activeOpacity={0.88}
                >
                  {recoveryLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <CheckCircle size={16} color={colors.white} />
                      <Text style={styles.recoveryPrimaryBtnText}>Update Password</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Resend Cooldown & Change Email */}
                <View style={styles.resendRow}>
                  {resendCooldown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend code in {resendCooldown}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSendRecoveryOtp}
                      disabled={recoveryLoading}
                    >
                      <Text style={styles.resendActionText}>Resend Code</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setRecoveryStep('EMAIL');
                      setRecoveryError(null);
                    }}
                    disabled={recoveryLoading}
                  >
                    <Text style={styles.changeEmailText}>Change Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient 
              colors={isDark ? [colors.surfaceElevated, colors.surface] : ['#FFFFFF', '#F9FAFB']} 
              style={styles.modalGradient}
            >
              <TouchableOpacity style={styles.closeModal} onPress={() => setShowResetModal(false)}>
                <X size={20} color={colors.textSubtle} />
              </TouchableOpacity>
              
              <View style={[styles.statusIconBox, { backgroundColor: modalType === 'SUCCESS' ? colors.accentSoft : colors.errorSoft }]}>
                {modalType === 'SUCCESS' ? (
                  <Send size={30} color={colors.accent} />
                ) : (
                  <AlertCircle size={30} color={colors.error} />
                )}
              </View>
              
              <Text style={styles.modalTitle}>{modalContent.title}</Text>
              
              <View style={styles.descBox}>
                <Text style={styles.modalDesc}>{modalContent.desc}</Text>
              </View>

              {modalType === 'SUCCESS' && (
                <View style={styles.emailBadge}>
                  <Text style={styles.emailBadgeText}>{email}</Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.modalActionBtn, { backgroundColor: modalType === 'SUCCESS' ? colors.accent : colors.error }]} 
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.modalActionText}>
                  {modalType === 'SUCCESS' ? 'Acknowledge' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backgroundContainer: { ...StyleSheet.absoluteFillObject },
  blob1: {
    position: 'absolute',
    top: height * 0.1,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(99, 102, 241, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  blob2: {
    position: 'absolute',
    top: height * 0.4,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.06)' : 'rgba(239, 68, 68, 0.08)',
    transform: [{ rotate: '30deg' }],
  },
  blob3: {
    position: 'absolute',
    bottom: height * 0.2,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.06)',
    transform: [{ rotate: '60deg' }],
  },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 22, justifyContent: 'space-between', paddingVertical: 18 },
  topSection: { alignItems: 'center', marginTop: height * 0.035 },
  logo: { width: 260, height: 112 },
  tagline: { 
    width: 260,
    textAlign: 'center', 
    fontSize: 11, 
    color: colors.textSubtle,
    fontWeight: '800',
    textTransform: 'uppercase', 
    letterSpacing: 0,
    marginTop: -18
  },
  middleSection: { width: '100%', flex: 1, justifyContent: 'center', marginTop: 28 },
  middleSectionKeyboard: { marginTop: 0 },
  authPanel: { 
    backgroundColor: isDark ? colors.surface : colors.surface, 
    borderRadius: RADIUS.md, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: colors.border, 
    ...SHADOWS.card 
  },
  
  // Modern Redesigned Inputs
  modernInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 60,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focusedWrapper: {
    borderColor: colors.accent,
    backgroundColor: isDark ? colors.surfacePressed : colors.surface,
    ...SHADOWS.card,
  },
  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: isDark ? colors.surfacePressed : colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputContent: {
    flex: 1,
    minWidth: 0,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSubtle,
    letterSpacing: 0,
    marginBottom: 2,
  },
  focusedLabel: {
    color: colors.accent,
  },
  modernInput: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
    height: 28,
    padding: 0,
    minWidth: 0,
  },
  eyeBtn: { padding: 4 },
  
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 22, minHeight: 24, justifyContent: 'center' },
  forgotText: { fontSize: 13, color: colors.accent, fontWeight: '800', letterSpacing: 0 },
  enterBtn: { 
    backgroundColor: isDark ? colors.accent : colors.primary, 
    minHeight: 56, 
    borderRadius: RADIUS.md, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...SHADOWS.floating 
  },
  btnDisabled: { opacity: 0.7 },
  enterBtnText: { color: colors.white, fontSize: 16, fontWeight: '800', marginRight: 12 },
  arrowBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  bottomSection: { alignItems: 'center', paddingBottom: 10, marginTop: 14 },
  biometricArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 15, width: '100%' },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  bioBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: isDark ? colors.surfaceElevated : colors.surface, borderWidth: 1, borderColor: colors.border, ...SHADOWS.card },
  bioBtnDisabled: { opacity: 0.5 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontSize: 11, color: colors.textSubtle, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0 },
  
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: RADIUS.xxl, overflow: 'hidden', ...SHADOWS.floating },
  modalGradient: { padding: 28, alignItems: 'center' },
  closeModal: { position: 'absolute', top: 20, right: 20, padding: 8 },
  statusIconBox: { width: 76, height: 76, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...SHADOWS.card },
  modalTitle: { fontSize: 21, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  descBox: { width: '100%', marginBottom: 20 },
  modalDesc: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21, fontWeight: '600' },
  emailBadge: { backgroundColor: colors.accentSoft, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, marginBottom: 20, borderWidth: 1, borderColor: colors.border, maxWidth: '100%' },
  emailBadgeText: { fontSize: 14, fontWeight: '800', color: colors.accent },
  modalActionBtn: { width: '100%', minHeight: 54, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  modalActionText: { color: colors.white, fontSize: 15, fontWeight: '800' },

  // Lost Access Recovery Modal
  recoveryCard: {
    width: '100%',
    backgroundColor: isDark ? colors.surface : colors.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.floating,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  recoveryIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recoveryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  recoverySubtitle: {
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  recoveryCloseBtn: {
    padding: 4,
  },
  recoveryErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 14,
  },
  recoveryErrorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '700',
    flex: 1,
  },
  recoveryBody: {
    width: '100%',
  },
  recoveryField: {
    marginBottom: 12,
  },
  recoveryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSubtle,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recoveryInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceMuted : colors.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  recoveryInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    padding: 0,
  },
  recoveryPrimaryBtn: {
    backgroundColor: colors.accent,
    height: 48,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    ...SHADOWS.card,
  },
  recoveryPrimaryBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  // 6-digit OTP cells (matching one-delhi)
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  otpCell: {
    flex: 1,
    height: 46,
    marginHorizontal: 3,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: isDark ? colors.surfaceMuted : colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellFilled: {
    borderColor: colors.accent,
    backgroundColor: isDark ? colors.surfacePressed : colors.surface,
  },
  otpCellActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  otpCellText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendTimerText: {
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: '600',
  },
  resendActionText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '800',
  },
  changeEmailText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
  }
});
