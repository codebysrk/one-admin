import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform, Image, Dimensions, Modal, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { loginAdmin } from '../../services/authService';
import { useAdminStore } from '../../store/useAdminStore';
import { COLORS, RADIUS, SHADOWS } from '../../core/theme';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, X, Send, AlertCircle, Fingerprint } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [modalType, setModalType] = useState<'SUCCESS' | 'ERROR'>('SUCCESS');
  const [modalContent, setModalContent] = useState({ title: '', desc: '' });
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  const setAdmin = useAdminStore((state) => state.setAdmin);

  useEffect(() => {
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

  const handleLogin = async () => {
    if (!email) return showPremiumModal('ERROR', 'Identification Required', 'Please enter your registered admin email address to initiate the authentication process.');
    if (!password) return showPremiumModal('ERROR', 'Security Key Missing', 'A valid administrative password is required to access the One Delhi Control Center.');
    
    setLoading(true);
    const result = await loginAdmin(email, password);
    setLoading(false);
    
    if (result.success) setAdmin(result.userData);
    else showPremiumModal('ERROR', 'Access Denied', result.error);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showPremiumModal('ERROR', 'Email Required', 'To reset your credentials, please provide your admin email in the input field above.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showPremiumModal('SUCCESS', 'Recovery Initiated', 'A secure verification link has been dispatched. Please follow the instructions sent to your email to reset your administrative access.');
    } catch (error: any) { 
      showPremiumModal('ERROR', 'Request Failed', error.message); 
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <LinearGradient colors={['#FFFFFF', '#F6F8FB']} style={styles.backgroundContainer} />
      
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
                <Mail size={18} color={focusedInput === 'email' ? '#6366F1' : '#94A3B8'} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, (focusedInput === 'email' || email) && styles.focusedLabel]}>ADMIN EMAIL</Text>
                <TextInput
                  ref={emailRef}
                  style={styles.modernInput}
                  placeholder="Enter registered email"
                  placeholderTextColor="#CBD5E1"
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
                <Lock size={18} color={focusedInput === 'password' ? '#6366F1' : '#94A3B8'} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, (focusedInput === 'password' || password) && styles.focusedLabel]}>SECURITY KEY</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.modernInput}
                  placeholder="Enter password"
                  placeholderTextColor="#CBD5E1"
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
                {showPassword ? <EyeOff size={20} color="#CBD5E1" /> : <Eye size={20} color="#CBD5E1" />}
              </TouchableOpacity>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn} disabled={resetLoading}>
              {resetLoading ? <ActivityIndicator size="small" color="#6366F1" /> : <Text style={styles.forgotText}>Lost access?</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.enterBtn, loading && styles.btnDisabled]} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.enterBtnText}>Authenticate Access</Text>
                  <View style={styles.arrowBox}>
                    <ArrowRight size={16} color="white" />
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
                <View style={styles.bioBtn}>
                  <Fingerprint size={32} color="#E2E8F0" />
                </View>
                <View style={styles.line} />
              </View>
              
              <View style={styles.secureBadge}>
                <ShieldCheck size={14} color="#94A3B8" />
                <Text style={styles.secureText}>Secure Server Authentication</Text>
              </View>
            </View>
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={styles.modalGradient}>
              <TouchableOpacity style={styles.closeModal} onPress={() => setShowResetModal(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
              
              <View style={[styles.statusIconBox, { backgroundColor: modalType === 'SUCCESS' ? '#EEF2FF' : '#FFF1F2' }]}>
                {modalType === 'SUCCESS' ? (
                  <Send size={30} color="#6366F1" />
                ) : (
                  <AlertCircle size={30} color="#F43F5E" />
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
                style={[styles.modalActionBtn, { backgroundColor: modalType === 'SUCCESS' ? '#1E293B' : '#F43F5E' }]} 
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  backgroundContainer: { ...StyleSheet.absoluteFillObject },
  blob1: {
    position: 'absolute',
    top: height * 0.1,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  blob2: {
    position: 'absolute',
    top: height * 0.4,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    transform: [{ rotate: '30deg' }],
  },
  blob3: {
    position: 'absolute',
    bottom: height * 0.2,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
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
    color: COLORS.textSubtle,
    fontWeight: '800',
    textTransform: 'uppercase', 
    letterSpacing: 0,
    marginTop: -18
  },
  middleSection: { width: '100%', flex: 1, justifyContent: 'center', marginTop: 28 },
  middleSectionKeyboard: { marginTop: 0 },
  authPanel: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
  
  // Modern Redesigned Inputs
  modernInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 60,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  focusedWrapper: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
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
    color: COLORS.textSubtle,
    letterSpacing: 0,
    marginBottom: 2,
  },
  focusedLabel: {
    color: COLORS.accent,
  },
  modernInput: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
    height: 28,
    padding: 0,
    minWidth: 0,
  },
  eyeBtn: { padding: 4 },
  
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 22, minHeight: 24, justifyContent: 'center' },
  forgotText: { fontSize: 13, color: COLORS.accent, fontWeight: '800', letterSpacing: 0 },
  enterBtn: { backgroundColor: COLORS.primary, minHeight: 56, borderRadius: RADIUS.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', ...SHADOWS.floating },
  btnDisabled: { opacity: 0.7 },
  enterBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800', marginRight: 12 },
  arrowBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  bottomSection: { alignItems: 'center', paddingBottom: 10, marginTop: 14 },
  biometricArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 15, width: '100%' },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  bioBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontSize: 11, color: COLORS.textSubtle, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0 },
  
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: RADIUS.xxl, overflow: 'hidden', ...SHADOWS.floating },
  modalGradient: { padding: 28, alignItems: 'center' },
  closeModal: { position: 'absolute', top: 20, right: 20, padding: 8 },
  statusIconBox: { width: 76, height: 76, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...SHADOWS.card },
  modalTitle: { fontSize: 21, fontWeight: '800', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  descBox: { width: '100%', marginBottom: 20 },
  modalDesc: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 21, fontWeight: '600' },
  emailBadge: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.md, marginBottom: 20, borderWidth: 1, borderColor: '#E0E7FF', maxWidth: '100%' },
  emailBadgeText: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
  modalActionBtn: { width: '100%', minHeight: 54, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  modalActionText: { color: COLORS.white, fontSize: 15, fontWeight: '800' }
});
