import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAppTheme, SPACING } from '../core/theme';
import { StatusBadge } from './AdminUI';

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Bus = IconWrapper('bus');
const Users = IconWrapper('account-group');
const Trash2 = IconWrapper('trash-can-outline');
const ChevronDown = IconWrapper('chevron-down');
const ChevronUp = IconWrapper('chevron-up');
const ContentCopy = IconWrapper('content-copy');

interface TicketCardProps {
  ticket: any;
  showUserInfo?: boolean;
  listUserName?: string;
  onDelete?: (id: string) => void;
}

const TicketCardInner = ({ ticket, showUserInfo = false, listUserName, onDelete }: TicketCardProps) => {
  const { colors, radius, shadows } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, radius, shadows), [colors, radius, shadows]);
  
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const userLabel = listUserName ?? ticket.userName;

  const handleCopyTid = async () => {
    if (ticket.tid) {
      await Clipboard.setStringAsync(ticket.tid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isAC = ticket.busType === 'AC' || (ticket.route && ticket.route.toLowerCase().includes('ac'));

  return (
    <Animated.View 
      layout={LinearTransition.springify().damping(22).stiffness(200).mass(0.5)}
      style={[styles.ticketContainer, expanded && styles.ticketContainerExpanded]}
    >
      {/* Collapsed Header / Main Row */}
      <TouchableOpacity 
        style={styles.mainRow} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.leftSection}>
          <View style={[styles.busBadge, isAC ? styles.acBadge : styles.nonAcBadge]}>
            <Bus size={14} color={isAC ? colors.primary : colors.warning} />
          </View>
          <View style={styles.routeCol}>
            <Text style={styles.routeName}>{ticket.route || 'Route'}</Text>
            <Text style={styles.busTypeText}>{isAC ? 'AC' : 'Non-AC'}</Text>
          </View>
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.directionText} numberOfLines={1}>
            {ticket.source} ➔ {ticket.dest}
          </Text>
          <Text style={styles.dateTimeText}>
            {ticket.date} • {ticket.time}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.fareText}>₹{ticket.total || ticket.fare}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge 
              label={ticket.status || 'Active'} 
              tone={ticket.status === 'Active' ? 'success' : ticket.status === 'Expired' ? 'neutral' : 'error'} 
            />
            {expanded ? <ChevronUp size={16} color={colors.textSubtle} /> : <ChevronDown size={16} color={colors.textSubtle} />}
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Detail Panel */}
      {expanded && (
        <View style={styles.detailPanel}>
          <View style={styles.divider} />
          
          {showUserInfo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Passenger</Text>
              <View style={styles.userValueContainer}>
                <Users size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={styles.detailValue}>{userLabel}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>{ticket.qty} Ticket(s)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Original Fare</Text>
            <Text style={styles.detailValue}>₹{ticket.fare}</Text>
          </View>

          {Number(ticket.fare) > Number(ticket.total || ticket.finalFare) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Discounted Fare</Text>
              <Text style={[styles.detailValue, { color: colors.success, fontWeight: '800' }]}>
                ₹{ticket.total || ticket.finalFare}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <TouchableOpacity onPress={handleCopyTid} style={styles.copyButton} activeOpacity={0.6}>
              <Text style={styles.tidText}>{ticket.tid}</Text>
              <ContentCopy size={11} color={copied ? colors.success : colors.accent} />
              {copied && <Text style={styles.copiedText}>Copied!</Text>}
            </TouchableOpacity>
          </View>

          {onDelete && (
            <TouchableOpacity 
              onPress={() => onDelete(ticket.id)} 
              style={styles.deleteButton}
              activeOpacity={0.8}
            >
              <Trash2 size={14} color={colors.error} />
              <Text style={styles.deleteButtonText}>Void & Remove Ticket Record</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const getStyles = (colors: any, radius: any, shadows: any) => StyleSheet.create({
  ticketContainer: { 
    marginBottom: 8, 
    borderRadius: radius.md, 
    backgroundColor: colors.surface, 
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card 
  },
  ticketContainerExpanded: {
    borderColor: colors.accentMuted,
  },
  mainRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12, 
    paddingHorizontal: 12 
  },
  leftSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    width: '25%'
  },
  busBadge: { 
    width: 28, 
    height: 28, 
    borderRadius: radius.sm, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
  },
  acBadge: {
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(79, 70, 229, 0.1)',
  },
  nonAcBadge: {
    backgroundColor: colors.warningSoft,
    borderColor: 'rgba(217, 119, 6, 0.1)',
  },
  routeCol: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  routeName: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: colors.text 
  },
  busTypeText: { 
    fontSize: 9, 
    color: colors.textMuted, 
    fontWeight: '700',
    marginTop: 1 
  },
  centerSection: { 
    flex: 1, 
    paddingHorizontal: 6,
    justifyContent: 'center'
  },
  directionText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: colors.text,
    marginBottom: 2
  },
  dateTimeText: { 
    fontSize: 10, 
    color: colors.textSubtle,
    fontWeight: '600'
  },
  rightSection: { 
    alignItems: 'flex-end',
    width: '32%',
    gap: 4
  },
  fareText: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: colors.text 
  },
  badgeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  detailPanel: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: colors.surfaceMuted,
  },
  divider: { 
    height: 1, 
    backgroundColor: colors.border, 
    marginBottom: 10 
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  userValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  tidText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.5
  },
  copiedText: {
    fontSize: 9,
    color: colors.success,
    fontWeight: '800',
    marginLeft: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: radius.sm,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.error,
  },
});

export const TicketCard = React.memo(TicketCardInner);
