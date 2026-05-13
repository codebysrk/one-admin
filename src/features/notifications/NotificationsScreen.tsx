import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLORS, SPACING } from '../../core/theme';
import { Send, Bell, Info, AlertCircle } from 'lucide-react-native';

export const NotificationsScreen = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title,
        message,
        timestamp: Date.now(), // or serverTimestamp()
        status: 'SENT',
        targetRoute: 'ALL',
        readBy: {}
      });

      Alert.alert("Success", "Notification sent to all users!");
      setTitle('');
      setMessage('');
    } catch (error) {
      Alert.alert("Error", "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Broadcast Center</Text>
        <Text style={styles.headerSubtitle}>Send updates to all One Delhi users</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notification Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Route 434 Delayed"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message Body</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the update in detail..."
            value={message}
            onChangeText={setMessage}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.disabledButton]} 
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Send size={20} color="white" />
              <Text style={styles.sendButtonText}>Send Broadcast</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Info size={18} color="#0284C7" />
        <Text style={styles.infoText}>
          Notifications will appear in the user app immediately after sending.
        </Text>
      </View>
    </ScrollView>
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
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  form: { padding: 24, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  input: { 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16,
    color: COLORS.text
  },
  textArea: { height: 120 },
  sendButton: { 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 12, 
    gap: 8,
    marginTop: 10,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  disabledButton: { opacity: 0.7 },
  sendButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  infoBox: { 
    margin: 24, 
    padding: 16, 
    backgroundColor: '#F0F9FF', 
    borderRadius: 12, 
    flexDirection: 'row', 
    gap: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  infoText: { flex: 1, fontSize: 12, color: '#0369A1', lineHeight: 18 }
});
