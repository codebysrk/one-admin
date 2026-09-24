import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, Platform, ActivityIndicator, ScrollView, Keyboard, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SHADOWS } from '../../core/theme';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Bell = IconWrapper('bell');
const Plus = IconWrapper('plus');
const Trash2 = IconWrapper('trash-can-outline');
const Megaphone = IconWrapper('bullhorn');
const Info = IconWrapper('information-outline');
const AlertTriangle = IconWrapper('alert');
const Bus = IconWrapper('bus');
const Send = IconWrapper('send');
import { AdminBottomSheet, AdminHeader, AdminPressable, AdminScreen, EmptyState, LoadingState } from '../../components/AdminUI';
import { LinearGradient } from 'expo-linear-gradient';

const NOTIFICATION_TYPES = [
  { id: 'general', label: 'General', icon: Bell, tone: '#6366F1', bg: '#EEF2FF' },
  { id: 'alert', label: 'Alert', icon: AlertTriangle, tone: '#EF4444', bg: '#FEF2F2' },
  { id: 'info', label: 'Info', icon: Info, tone: '#3B82F6', bg: '#EFF6FF' },
  { id: 'bus', label: 'Bus', icon: Bus, tone: '#10B981', bg: '#ECFDF5' },
  { id: 'promo', label: 'Promo', icon: Megaphone, tone: '#F59E0B', bg: '#FFFBEB' },
];

export const NotificationsScreen = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = typeof getStyles === 'function' ? getStyles(colors, isDark) : {} as any;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');

  const fetchNotifications = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setNotifications(data);
      }
    } catch (_) {}
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const fetchUserCount = async () => {
      try {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        setTotalUsers(count || 0);
      } catch (_) {}
    };

    fetchUserCount();
  }, [fetchNotifications]);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', 'Provide title & message.');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        sent_by: 'Admin Hub',
        target_count: totalUsers
      };


      await supabase.from('notifications').insert(payload);
      setModalVisible(false);
      setTitle('');
      setMessage('');
      setType('general');
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to dispatch');
    } finally {
      setSending(false);
    }
  };

  const renderNotification = ({ item }: any) => {
    const typeInfo = NOTIFICATION_TYPES.find(t => t.id === item.type) || NOTIFICATION_TYPES[0];
    const dateVal = item.created_at || item.timestamp;
    return (
      <View style={styles.notifCard}>
        <View style={styles.cardHeader}>
          <View style={styles.typeInfo}>
            <View style={[styles.typeIcon, { backgroundColor: typeInfo.bg }]}>
              <typeInfo.icon size={14} color={typeInfo.tone} />
            </View>
            <Text style={styles.dateText}>{dateVal ? new Date(dateVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}</Text>
          </View>
          <TouchableOpacity onPress={async () => { await supabase.from('notifications').delete().eq('id', item.id); fetchNotifications(); }} style={styles.deleteBtn}>
            <Trash2 size={14} color={colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={1}>{item.message}</Text>
      </View>
    );
  };

  const selectedType = NOTIFICATION_TYPES.find(t => t.id === type) || NOTIFICATION_TYPES[0];

  return (
    <AdminScreen>
      <AdminHeader title="Broadcast" subtitle={`${totalUsers} active users`} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Loading broadcasts..." compact />
          ) : (
            <EmptyState 
              title="No Broadcast History" 
              message="Sent announcements and global alerts will appear here." 
            />
          )
        }
      />

      <AdminPressable
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="New Broadcast"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={['#4F46E5', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGrad}
        >
          <Megaphone size={24} color="#FFFFFF" />
        </LinearGradient>
      </AdminPressable>

      <AdminBottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Dispatch Hub"
        subtitle={`Instant push to ${totalUsers.toLocaleString('en-IN')} active users`}
        headerIcon={
          <View style={[styles.sheetIconBox, { backgroundColor: isDark ? colors.accent + '25' : colors.accentSoft }]}>
            <Megaphone size={18} color={colors.accent} />
          </View>
        }
      >
        <ScrollView 
          style={{ flexShrink: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.formBody}
        >
          {/* Live Channel Status Pill */}
          <View style={styles.channelBanner}>
            <View style={styles.liveDot} />
            <Text style={styles.channelText}>
              BROADCAST READY • {totalUsers.toLocaleString('en-IN')} RECIPIENTS TARGETED
            </Text>
          </View>

          {/* Category Selector */}
          <View>
            <Text style={styles.sectionLabel}>BROADCAST CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
              keyboardShouldPersistTaps="handled"
            >
              {NOTIFICATION_TYPES.map((t) => {
                const isSelected = type === t.id;
                const IconComponent = t.icon;
                return (
                  <AdminPressable
                    key={t.id}
                    style={[
                      styles.categoryChip,
                      isSelected && {
                        borderColor: t.tone,
                        backgroundColor: isDark ? t.tone + '22' : t.bg,
                      },
                    ]}
                    onPress={() => setType(t.id)}
                  >
                    <IconComponent
                      size={15}
                      color={isSelected ? t.tone : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && { color: t.tone, fontWeight: '800' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </AdminPressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Form Fields */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Text style={styles.sectionLabel}>ANNOUNCEMENT TITLE</Text>
              <Text style={styles.charCount}>{title.length}/45</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Route 419 Schedule Update"
              placeholderTextColor={colors.textSubtle}
              maxLength={45}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldHeader}>
              <Text style={styles.sectionLabel}>ANNOUNCEMENT MESSAGE</Text>
              <Text style={styles.charCount}>{message.length}/250</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              placeholder="Enter announcement details for passengers..."
              placeholderTextColor={colors.textSubtle}
              maxLength={250}
            />
          </View>

          {/* Real-world Lockscreen Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>LIVE NOTIFICATION PREVIEW</Text>
            <View style={styles.lockscreenCard}>
              <View style={styles.previewTopRow}>
                <View style={styles.previewAppBadge}>
                  <Bus size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.previewAppName}>ONE DELHI</Text>
                <Text style={styles.previewTimeDot}>•</Text>
                <Text style={styles.previewTime}>Now</Text>

                <View
                  style={[
                    styles.previewTypeTag,
                    { backgroundColor: isDark ? selectedType.tone + '25' : selectedType.bg },
                  ]}
                >
                  <Text style={[styles.previewTypeTagText, { color: selectedType.tone }]}>
                    {selectedType.label.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.previewHeadline} numberOfLines={1}>
                {title.trim() || 'Headline will appear here'}
              </Text>
              <Text style={styles.previewBody} numberOfLines={2}>
                {message.trim() || 'Announcement details will be delivered live to passenger devices...'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {(title.length > 0 || message.length > 0) && (
              <AdminPressable
                style={styles.clearBtn}
                onPress={() => {
                  setTitle('');
                  setMessage('');
                }}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </AdminPressable>
            )}

            <AdminPressable
              style={[
                styles.dispatchBtn,
                (!title.trim() || !message.trim()) && { opacity: 0.5 },
              ]}
              disabled={sending || !title.trim() || !message.trim()}
              onPress={handleBroadcast}
            >
              <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dispatchGrad}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.dispatchInner}>
                    <Send size={15} color="#FFFFFF" />
                    <Text style={styles.dispatchText}>
                      Dispatch to {totalUsers.toLocaleString('en-IN')} Users
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </AdminPressable>
          </View>
        </ScrollView>
      </AdminBottomSheet>
    </AdminScreen>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 90 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    ...SHADOWS.floating,
    elevation: 6,
    zIndex: 10,
  },
  fabGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notifCard: { backgroundColor: colors.surface, borderRadius: RADIUS.card, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...SHADOWS.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeIcon: { width: 30, height: 30, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 10, color: colors.textSubtle, fontWeight: '700' },
  deleteBtn: { padding: 6, backgroundColor: colors.errorSoft, borderRadius: RADIUS.sm },
  notifTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 3 },
  notifMessage: { fontSize: 12, color: colors.textMuted, fontWeight: '600', lineHeight: 18 },
  sheetIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formBody: { gap: 14, paddingBottom: 16 },
  channelBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceMuted, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  channelText: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  categoryScroll: { flexDirection: 'row', gap: 8, paddingTop: 8, paddingBottom: 2 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  categoryChipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  fieldGroup: { gap: 6 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { fontSize: 11, fontWeight: '600', color: colors.textSubtle },
  textInput: { backgroundColor: colors.surfaceMuted, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: colors.text, borderWidth: 1, borderColor: colors.border },
  textArea: { height: 85, textAlignVertical: 'top' },
  previewSection: { gap: 8, marginTop: 2 },
  lockscreenCard: { backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, ...SHADOWS.card },
  previewTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  previewAppBadge: { width: 18, height: 18, borderRadius: 5, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  previewAppName: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  previewTimeDot: { fontSize: 10, color: colors.textSubtle },
  previewTime: { fontSize: 11, fontWeight: '600', color: colors.textSubtle, flex: 1 },
  previewTypeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  previewTypeTagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  previewHeadline: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 3 },
  previewBody: { fontSize: 12, color: colors.textMuted, lineHeight: 18, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  clearBtn: { height: 48, paddingHorizontal: 16, borderRadius: RADIUS.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  dispatchBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.card },
  dispatchGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dispatchInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dispatchText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
