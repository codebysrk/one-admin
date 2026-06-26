import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  PressableProps,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Search = IconWrapper('magnify');
const X = IconWrapper('close');
const MessageSquare = IconWrapper('message-reply-text');
const AlertCircle = IconWrapper('alert-circle');
import { Modal } from 'react-native';
import { useTheme } from '../core/ThemeContext';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../core/theme';
export { AdminBottomSheet } from './BottomSheet';
export { ConfirmationModal } from './ConfirmationModal';

type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type HeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  compact?: boolean;
};

type SearchFieldProps = TextInputProps & {
  value: string;
  onChangeText: (value: string) => void;
};

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
};

type AdminPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  icon?: React.ReactNode;
  loading?: boolean;
  tone?: 'primary' | 'accent' | 'success' | 'danger' | 'neutral';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

type SectionHeaderProps = {
  icon?: React.ReactNode;
  title: string;
  caption?: string;
  action?: React.ReactNode;
};

type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

function useToneMap() {
  const { colors } = useTheme();
  return {
    success: { bg: colors.successSoft, fg: colors.success, border: colors.success + '44' },
    warning: { bg: colors.warningSoft, fg: colors.warning, border: colors.warning + '44' },
    error: { bg: colors.errorSoft, fg: colors.error, border: colors.error + '44' },
    info: { bg: colors.infoSoft, fg: colors.info, border: colors.info + '44' },
    neutral: { bg: colors.surfaceMuted, fg: colors.textMuted, border: colors.border },
  };
}

function useButtonTones() {
  const { colors } = useTheme();
  return {
    primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
    accent: { bg: colors.accent, fg: colors.white, border: colors.accent },
    success: { bg: colors.success, fg: colors.white, border: colors.success },
    danger: { bg: colors.error, fg: colors.white, border: colors.error },
    neutral: { bg: colors.surface, fg: colors.text, border: colors.border },
  };
}

export const AdminPressable = ({
  children,
  style,
  disabled,
  ...props
}: AdminPressableProps) => (
  <Pressable
    {...props}
    disabled={disabled}
    style={({ pressed }) => [
      style,
      pressed && !disabled ? styles.pressed : null,
      disabled ? styles.disabled : null,
    ]}
  >
    {children}
  </Pressable>
);

export const AdminScreen = ({ children, style }: ScreenProps) => {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
};

export const AdminHeader = ({ title, subtitle, action, compact }: HeaderProps) => {
  const { colors } = useTheme();
  const s = useAdminUIStyles();
  return (
  <LinearGradient colors={['#4F46E5', '#3730A3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.headerShell}>
    <StatusBar barStyle="light-content" />
    <SafeAreaView edges={['top']}>
      <View style={[s.header, compact && s.headerCompact]}>
        <View style={s.headerCopy}>
          <View style={s.eyebrowPill}>
            <Text style={s.eyebrow}>One Delhi • Admin System</Text>
          </View>
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={s.headerSubtitle} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {action ? <View style={s.headerAction}>{action}</View> : null}
      </View>
    </SafeAreaView>
  </LinearGradient>
  );
};

export const SearchField = ({ placeholderTextColor, style, value, onChangeText, ...props }: SearchFieldProps) => {
  const s = useAdminUIStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[s.searchBox, focused && s.searchBoxFocused]}>
      <Search size={18} color={focused ? colors.accent : colors.textSubtle} />
      <TextInput
        {...props}
        value={value}
        onChangeText={onChangeText}
        style={[s.searchInput, style]}
        placeholderTextColor={placeholderTextColor || colors.textSubtle}
        autoCapitalize="none"
        selectionColor={colors.accent}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
      />
      {value ? (
        <AdminPressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')} style={s.clearSearch}>
          <X size={14} color={colors.textMuted} />
        </AdminPressable>
      ) : null}
    </View>
  );
};

export const Card = ({ children, style }: ScreenProps) => {
  const s = useAdminUIStyles();
  return <View style={[s.card, style]}>{children}</View>;
};

export const SectionHeader = ({ icon, title, caption, action }: SectionHeaderProps) => {
  const s = useAdminUIStyles();
  return (
    <View style={s.sectionHeader}>
      {icon ? <View style={s.sectionIcon}>{icon}</View> : null}
      <View style={s.sectionCopy}>
        <Text style={s.sectionTitle}>{title}</Text>
        {caption ? <Text style={s.sectionCaption}>{caption}</Text> : null}
      </View>
      {action ? <View style={s.sectionAction}>{action}</View> : null}
    </View>
  );
};

export const Button = ({
  title,
  icon,
  loading,
  tone = 'primary',
  fullWidth,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const s = useAdminUIStyles();
  const buttonTones = useButtonTones();
  const colors = buttonTones[tone];

  return (
    <AdminPressable
      {...props}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={[
        s.button,
        fullWidth ? s.buttonFull : null,
        { backgroundColor: colors.bg, borderColor: colors.border },
        tone === 'accent' ? SHADOWS.accent : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : (
        <>
          {icon}
          <Text style={[s.buttonText, { color: colors.fg }]} numberOfLines={1}>{title}</Text>
        </>
      )}
    </AdminPressable>
  );
};

export const IconButton = ({
  children,
  onPress,
  tone = 'primary',
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: 'primary' | 'success' | 'danger' | 'neutral';
  accessibilityLabel: string;
}) => {
  const s = useAdminUIStyles();
  const toneStyle = {
    primary: s.iconPrimary,
    success: s.iconSuccess,
    danger: s.iconDanger,
    neutral: s.iconNeutral,
  }[tone];

  return (
    <AdminPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[s.iconButton, toneStyle]}
    >
      {children}
    </AdminPressable>
  );
};

export const FormField = ({
  label,
  icon,
  error,
  containerStyle,
  inputStyle,
  right,
  ...props
}: TextInputProps & {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
  right?: React.ReactNode;
}) => {
  const s = useAdminUIStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <Text style={[s.formLabel, focused && s.formLabelFocused]}>{label}</Text>
      <View style={[s.inputFrame, focused && s.inputFrameFocused, error ? s.inputFrameError : null]}>
        {icon ? <View style={s.inputIcon}>{icon}</View> : null}
        <TextInput
          {...props}
          style={[s.formInput, inputStyle]}
          placeholderTextColor={props.placeholderTextColor || colors.textSubtle}
          selectionColor={error ? colors.error : colors.accent}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {right}
      </View>
      {error ? <Text style={s.formError}>{error}</Text> : null}
    </View>
  );
};

export const StatusBadge = React.memo(({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) => {
  const s = useAdminUIStyles();
  const toneMap = useToneMap();
  const colors = toneMap[tone];
  return (
    <View style={[s.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[s.badgeText, { color: colors.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
});

export const KeyValueRow = React.memo(({ label, value }: { label: string; value?: string | number | null }) => {
  const s = useAdminUIStyles();
  return (
    <View style={s.keyValueRow}>
      <Text style={s.keyLabel}>{label}</Text>
      <Text style={s.keyValue} numberOfLines={1}>{value || 'Unknown'}</Text>
    </View>
  );
});

export const EmptyState = React.memo(({ icon, title, message, action }: EmptyStateProps) => {
  const s = useAdminUIStyles();
  return (
    <View style={s.empty}>
      {icon ? <View style={s.emptyIcon}>{icon}</View> : null}
      <Text style={s.emptyTitle}>{title}</Text>
      {message ? <Text style={s.emptyMessage}>{message}</Text> : null}
      {action ? <View style={s.emptyAction}>{action}</View> : null}
    </View>
  );
});

export const SkeletonBlock = React.memo(({ style }: { style?: StyleProp<ViewStyle> }) => {
  const s = useAdminUIStyles();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[s.skeleton, { opacity }, style]} />;
});

export const LoadingState = React.memo(({
  label = 'Loading data...',
  compact,
}: {
  label?: string;
  compact?: boolean;
}) => {
  const s = useAdminUIStyles();
  const { colors } = useTheme();
  return (
  <View style={[s.loading, compact && s.loadingCompact]}>
    <View style={s.loadingCard}>
      <View style={s.loadingHeader}>
        <ActivityIndicator color={colors.accent} />
        <Text style={s.loadingText}>{label}</Text>
      </View>
      <SkeletonBlock style={s.skeletonTitle} />
      <SkeletonBlock style={s.skeletonLine} />
      <SkeletonBlock style={s.skeletonShort} />
    </View>
    {!compact ? (
      <View style={s.loadingCard}>
        <SkeletonBlock style={s.skeletonTitle} />
        <SkeletonBlock style={s.skeletonLine} />
        <SkeletonBlock style={s.skeletonShort} />
      </View>
    ) : null}
  </View>
  );
});

export const ReasonModal = ({ 
  visible, 
  onClose, 
  onSubmit, 
  title, 
  placeholder = "Provide additional details..." 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSubmit: (reason: string) => void; 
  title: string;
  placeholder?: string;
}) => {
  const s = useAdminUIStyles();
  const { colors } = useTheme();
  const PRESET_REASONS = [
    "Test Data / Debugging",
    "Duplicate Record",
    "Incorrect Route / Fare",
    "User Requested",
    "Security Policy Violation",
    "Other"
  ];

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    const finalReason = selectedPreset === 'Other' ? reason.trim() : selectedPreset;
    if (!finalReason) {
      setError(true);
      return;
    }
    onSubmit(finalReason);
    reset();
    onClose();
  };

  const reset = () => {
    setReason('');
    setSelectedPreset(null);
    setError(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <View style={s.modalIconBox}>
              <MessageSquare size={20} color={colors.primary} />
            </View>
            <Text style={s.modalTitle}>{title}</Text>
          </View>
          
          <View style={s.modalBody}>
            <Text style={s.modalLabel}>Select Reason</Text>
            <View style={s.chipGrid}>
              {PRESET_REASONS.map((preset) => (
                <TouchableOpacity 
                  key={preset}
                  onPress={() => {
                    setSelectedPreset(preset);
                    setError(false);
                  }}
                  style={[
                    s.reasonChip,
                    selectedPreset === preset && s.reasonChipActive
                  ]}
                >
                  <Text style={[
                    s.reasonChipText,
                    selectedPreset === preset && s.reasonChipTextActive
                  ]}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedPreset === 'Other' && (
              <View style={{ marginTop: 16 }}>
                <Text style={s.modalLabel}>Details</Text>
                <TextInput
                  style={[s.modalInput, error && s.modalInputError]}
                  placeholder={placeholder}
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  numberOfLines={3}
                  value={reason}
                  onChangeText={(txt) => {
                    setReason(txt);
                    setError(false);
                  }}
                />
              </View>
            )}
            
            {error && <Text style={s.modalError}>Please select or provide a reason.</Text>}
          </View>

          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancel} onPress={() => { reset(); onClose(); }}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.modalConfirm, (!selectedPreset || (selectedPreset === 'Other' && !reason.trim())) && { opacity: 0.5 }]} 
              onPress={handleConfirm}
              disabled={!selectedPreset || (selectedPreset === 'Other' && !reason.trim())}
            >
              <Text style={s.modalConfirmText}>Confirm Action</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- Dynamic styles hook ---
function useAdminUIStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
    disabled: { opacity: 0.62 },
    headerShell: { borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, ...SHADOWS.floating },
    header: { minHeight: 118, paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
    headerCompact: { minHeight: 94, paddingBottom: SPACING.lg },
    headerCopy: { flex: 1, minWidth: 0 },
    eyebrowPill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.pill, backgroundColor: colors.glass, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 10 },
    eyebrow: { color: '#E0E7FF', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { color: colors.white, fontSize: 24, lineHeight: 30, fontWeight: '800' },
    headerSubtitle: { color: '#C7D2FE', fontSize: 12, lineHeight: 18, fontWeight: '600', marginTop: 4 },
    headerAction: { flexShrink: 0 },
    searchBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: SPACING.md, gap: SPACING.sm, ...SHADOWS.card },
    searchBoxFocused: { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
    searchInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: TYPOGRAPHY.body, fontWeight: '600', paddingVertical: 0, minHeight: 46 },
    clearSearch: { width: 28, height: 28, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
    card: { backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOWS.card },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.md, gap: SPACING.md },
    sectionIcon: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    sectionCopy: { flex: 1, minWidth: 0 },
    sectionTitle: { color: colors.text, fontSize: TYPOGRAPHY.section, lineHeight: 22, fontWeight: '800' },
    sectionCaption: { color: colors.textMuted, fontSize: TYPOGRAPHY.caption, lineHeight: 16, fontWeight: '600', marginTop: 2 },
    sectionAction: { flexShrink: 0 },
    button: { minHeight: 50, borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
    buttonFull: { width: '100%' },
    buttonText: { fontSize: TYPOGRAPHY.body, lineHeight: 18, fontWeight: '800' },
    iconButton: { width: 46, height: 46, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
    iconPrimary: { backgroundColor: colors.accent, ...SHADOWS.accent },
    iconSuccess: { backgroundColor: colors.success },
    iconDanger: { backgroundColor: colors.errorSoft, borderWidth: 1, borderColor: colors.error + '44' },
    iconNeutral: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    formLabel: { fontSize: TYPOGRAPHY.caption, lineHeight: 15, fontWeight: '800', color: colors.textMuted, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0 },
    formLabelFocused: { color: colors.accent },
    inputFrame: { minHeight: 50, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: SPACING.md, gap: SPACING.sm },
    inputFrameFocused: { borderColor: colors.accent },
    inputFrameError: { borderColor: colors.error, backgroundColor: colors.errorSoft },
    inputIcon: { width: 22, alignItems: 'center' },
    formInput: { flex: 1, minWidth: 0, minHeight: 48, color: colors.text, fontSize: TYPOGRAPHY.body, fontWeight: '700', paddingVertical: 0 },
    formError: { color: colors.error, fontSize: TYPOGRAPHY.caption, lineHeight: 16, fontWeight: '700', marginTop: 6 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.pill, borderWidth: 1, maxWidth: '100%' },
    badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0 },
    keyValueRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
    keyLabel: { color: colors.textMuted, fontSize: TYPOGRAPHY.caption, fontWeight: '800', textTransform: 'uppercase' },
    keyValue: { color: colors.text, flex: 1, textAlign: 'right', fontSize: TYPOGRAPHY.bodySmall, fontWeight: '700' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingTop: 72, paddingBottom: 40 },
    emptyIcon: { width: 72, height: 72, borderRadius: RADIUS.xxl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg, ...SHADOWS.card },
    emptyTitle: { color: colors.text, fontSize: TYPOGRAPHY.section, lineHeight: 23, fontWeight: '800', textAlign: 'center' },
    emptyMessage: { color: colors.textMuted, fontSize: TYPOGRAPHY.bodySmall, lineHeight: 19, textAlign: 'center', marginTop: 6, fontWeight: '600' },
    emptyAction: { marginTop: SPACING.lg },
    loading: { flex: 1, padding: SPACING.xl, gap: SPACING.lg, justifyContent: 'center' },
    loadingCompact: { paddingVertical: SPACING.lg },
    loadingCard: { backgroundColor: colors.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, padding: SPACING.lg, gap: SPACING.md, ...SHADOWS.card },
    loadingHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xs },
    loadingText: { color: colors.textMuted, fontSize: TYPOGRAPHY.bodySmall, fontWeight: '800' },
    skeleton: { backgroundColor: colors.surfacePressed, borderRadius: RADIUS.sm },
    skeletonTitle: { width: '48%', height: 16 },
    skeletonLine: { width: '100%', height: 12 },
    skeletonShort: { width: '72%', height: 12 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    modalCard: { width: '100%', backgroundColor: colors.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, ...SHADOWS.floating },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    modalIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '800', color: colors.text, flex: 1 },
    modalBody: { marginBottom: 24 },
    modalLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 8 },
    modalInput: { backgroundColor: colors.surfaceMuted, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: colors.text, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border },
    modalInputError: { borderColor: colors.error, backgroundColor: colors.errorSoft },
    modalError: { color: colors.error, fontSize: 11, fontWeight: '700', marginTop: 6 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
    modalCancelText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
    modalConfirm: { flex: 2, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
    modalConfirmText: { fontSize: 14, fontWeight: '800', color: colors.white },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    reasonChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
    reasonChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong },
    reasonChipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
    reasonChipTextActive: { color: colors.text },
  }), [colors]);
}

// Keep legacy export for any direct style imports
export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.62,
  },
  headerShell: {
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    ...SHADOWS.floating,
  },
  header: {
    minHeight: 118,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  headerCompact: {
    minHeight: 94,
    paddingBottom: SPACING.lg,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 10,
  },
  eyebrow: {
    color: '#E0E7FF',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#C7D2FE',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  headerAction: {
    flexShrink: 0,
  },
  searchBox: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  searchBoxFocused: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    paddingVertical: 0,
    minHeight: 46,
  },
  clearSearch: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.section,
    lineHeight: 22,
    fontWeight: '800',
  },
  sectionCaption: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.caption,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionAction: {
    flexShrink: 0,
  },
  button: {
    minHeight: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  buttonFull: {
    width: '100%',
  },
  buttonText: {
    fontSize: TYPOGRAPHY.body,
    lineHeight: 18,
    fontWeight: '800',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPrimary: {
    backgroundColor: COLORS.accent,
    ...SHADOWS.accent,
  },
  iconSuccess: {
    backgroundColor: COLORS.success,
  },
  iconDanger: {
    backgroundColor: COLORS.errorSoft,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  iconNeutral: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.caption,
    lineHeight: 15,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  formLabelFocused: {
    color: COLORS.accent,
  },
  inputFrame: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  inputFrameFocused: {
    borderColor: COLORS.accent,
    ...SHADOWS.card,
  },
  inputFrameError: {
    borderColor: '#FDA4AF',
    backgroundColor: COLORS.errorSoft,
  },
  inputIcon: {
    width: 22,
    alignItems: 'center',
  },
  formInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    color: COLORS.text,
    fontSize: TYPOGRAPHY.body,
    fontWeight: '700',
    paddingVertical: 0,
  },
  formError: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.caption,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  keyValueRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  keyLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  keyValue: {
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 72,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.section,
    lineHeight: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyMessage: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.bodySmall,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },
  emptyAction: {
    marginTop: SPACING.lg,
  },
  loading: {
    flex: 1,
    padding: SPACING.xl,
    gap: SPACING.lg,
    justifyContent: 'center',
  },
  loadingCompact: {
    paddingVertical: SPACING.lg,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.bodySmall,
    fontWeight: '800',
  },
  skeleton: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.sm,
  },
  skeletonTitle: {
    width: '48%',
    height: 16,
  },
  skeletonLine: {
    width: '100%',
    height: 12,
  },
  skeletonShort: {
    width: '72%',
    height: 12,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: { width: '100%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, ...SHADOWS.floating },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  modalIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, flex: 1 },
  modalBody: { marginBottom: 24 },
  modalLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  modalInput: { backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: COLORS.text, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  modalInputError: { borderColor: COLORS.error, backgroundColor: COLORS.errorSoft },
  modalError: { color: COLORS.error, fontSize: 11, fontWeight: '700', marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceMuted },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  modalConfirm: { flex: 2, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  modalConfirmText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceMuted, borderWidth: 1, borderColor: COLORS.border },
  reasonChipActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  reasonChipText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  reasonChipTextActive: { color: COLORS.primary },
});
