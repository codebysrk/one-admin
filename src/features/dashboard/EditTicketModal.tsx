import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../core/ThemeContext';
import { RADIUS, SPACING } from '../../core/theme';
import { AdminBottomSheet } from '../../components/AdminUI';
import { supabase } from '../../services/supabase';
import { logActivity } from '../../services/logService';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Pencil = IconWrapper('pencil-outline');
const MapMarker = IconWrapper('map-marker');
const CircleOutline = IconWrapper('circle-outline');
const CurrencyInr = IconWrapper('currency-inr');
const AccountGroup = IconWrapper('account-group');

interface EditTicketModalProps {
  visible: boolean;
  ticket: any | null;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  visible,
  ticket,
  onClose,
  onTicketUpdated,
}) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fare, setFare] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFrom(ticket.source || ticket.from || '');
      setTo(ticket.destination || ticket.dest || ticket.to || '');
      setFare(ticket.fare !== undefined && ticket.fare !== null ? String(ticket.fare) : '');
      setPassengers(
        ticket.passengers !== undefined && ticket.passengers !== null
          ? String(ticket.passengers)
          : ticket.qty !== undefined && ticket.qty !== null
          ? String(ticket.qty)
          : '1'
      );
    }
  }, [ticket]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSave = async () => {
    if (!ticket?.id) return;

    const trimmedFrom = from.trim();
    const trimmedTo = to.trim();
    const parsedFare = parseFloat(fare);
    const parsedPassengers = parseInt(passengers, 10);

    if (!trimmedFrom) {
      Alert.alert('Validation Error', 'Please enter a source stop (From).');
      return;
    }
    if (!trimmedTo) {
      Alert.alert('Validation Error', 'Please enter a destination stop (To).');
      return;
    }
    if (isNaN(parsedFare) || parsedFare < 0) {
      Alert.alert('Validation Error', 'Please enter a valid fare amount.');
      return;
    }
    if (isNaN(parsedPassengers) || parsedPassengers < 1) {
      Alert.alert('Validation Error', 'Passengers count must be at least 1.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          source: trimmedFrom,
          destination: trimmedTo,
          fare: parsedFare,
          passengers: parsedPassengers,
        })
        .eq('id', ticket.id);

      if (error) throw error;

      await logActivity({
        type: 'ADMIN',
        action: 'TICKET_UPDATED',
        details: `Ticket ${ticket.id} was updated: From "${trimmedFrom}", To "${trimmedTo}", Fare ₹${parsedFare}, Passengers ${parsedPassengers}`,
        targetId: ticket.id,
        targetType: 'TICKET',
      });

      onTicketUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update ticket details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminBottomSheet
      visible={visible}
      onClose={handleClose}
      title="Edit Ticket Details"
      subtitle={ticket ? `Route ${ticket.route || ''} • Ticket #${ticket.id?.slice(0, 8)}...` : undefined}
    >
      <ScrollView
        style={{ flexShrink: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.formContainer}
      >
        {/* From (Source Stop) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>From (Boarding Stop)</Text>
          <View style={styles.inputWrapper}>
            <CircleOutline size={18} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={from}
              onChangeText={setFrom}
              placeholder="e.g. Anand Vihar ISBT"
              placeholderTextColor={colors.textMuted}
              editable={!loading}
            />
          </View>
        </View>

        {/* To (Destination Stop) */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>To (Destination Stop)</Text>
          <View style={styles.inputWrapper}>
            <MapMarker size={18} color={colors.accent} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={to}
              onChangeText={setTo}
              placeholder="e.g. Dhaula Kuan"
              placeholderTextColor={colors.textMuted}
              editable={!loading}
            />
          </View>
        </View>

        {/* Fare & Passengers Row */}
        <View style={styles.row}>
          {/* Fare */}
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.inputLabel}>Fare (₹)</Text>
            <View style={styles.inputWrapper}>
              <CurrencyInr size={18} color={colors.success} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={fare}
                onChangeText={setFare}
                placeholder="Fare"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>

          {/* Passengers Count */}
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.inputLabel}>Passengers</Text>
            <View style={styles.inputWrapper}>
              <AccountGroup size={18} color={colors.text} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={passengers}
                onChangeText={setPassengers}
                placeholder="Qty"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Quick Passenger Selector Chips */}
        <View style={styles.passengerChipsRow}>
          {[1, 2, 3].map((count) => {
            const isSelected = passengers === String(count);
            return (
              <TouchableOpacity
                key={count}
                style={[styles.passengerChip, isSelected && styles.passengerChipActive]}
                onPress={() => setPassengers(String(count))}
                disabled={loading}
              >
                <Text style={[styles.passengerChipText, isSelected && styles.passengerChipTextActive]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Pencil size={18} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AdminBottomSheet>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    formContainer: {
      paddingTop: 8,
      paddingBottom: 16,
    },
    inputGroup: {
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSubtle,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.surface : colors.surfaceSubtle,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 48,
    },
    inputIcon: {
      marginRight: 10,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    passengerChipsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 8,
      marginBottom: 20,
    },
    passengerChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: RADIUS.sm,
      backgroundColor: isDark ? colors.surface : colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passengerChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    passengerChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    passengerChipTextActive: {
      color: colors.white,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.surface : colors.surfaceSubtle,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSubtle,
    },
    saveBtn: {
      flex: 2,
      height: 48,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.6,
    },
    saveBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.white,
    },
  });
