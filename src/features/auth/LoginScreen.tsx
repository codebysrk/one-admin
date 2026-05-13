import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginAdmin } from '../../services/authService';
import { useAdminStore } from '../../store/useAdminStore';
import { COLORS, SPACING } from '../../core/theme';
import { Lock, Mail, ShieldCheck } from 'lucide-react-native';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAdmin = useAdminStore((state) => state.setAdmin);
  
  React.useEffect(() => {
    console.log("LoginScreen mounted successfully");
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await loginAdmin(email, password);
    setLoading(false);

    if (result.success) {
      setAdmin(result.userData);
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ShieldCheck size={64} color={COLORS.accent} />
        <Text style={styles.title}>One Admin</Text>
        <Text style={styles.subtitle}>Control Center</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail size={20} color={COLORS.textMuted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Admin Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color={COLORS.textMuted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login to Dashboard</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginTop: 10 },
  subtitle: { fontSize: 16, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  form: { paddingHorizontal: 32 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 12, 
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  button: { 
    backgroundColor: COLORS.primary, 
    height: 56, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
