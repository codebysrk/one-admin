import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SPACING } from '../core/theme';
import { useTheme } from '../core/ThemeContext';
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
  const { colors, radius, shadows, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, radius, shadows, isDark), [colors, radius, shadows, isDark]);
  
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
    <View 
      style={[styles.ticketContainer, expanded && styles.ticketContainerExpanded]}
    >
      <TouchableOpacity 
        style={styles.mainCardButton} 
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.routeBadgeWrapper}>
            <View style={[styles.busBadge, isAC ? styles.acBadge : styles.nonAcBadge]}>
              <Bus size={14} color={isAC ? (isDark ? colors.text : colors.primary) : colors.warning} />
            </View>
            <Text style={styles.routeName}>{ticket.route || 'Route'}</Text>
            <Text style={styles.busTypeText}>{isAC ? 'AC' : 'Non-AC'}</Text>
          </View>
          
          <View style={styles.rightHeader}>
            <StatusBadge 
              label={ticket.status || 'Active'} 
              tone={ticket.status === 'Active' ? 'success' : ticket.status === 'Expired' ? 'neutral' : 'error'} 
            />
            {expanded ? <ChevronUp size={16} color={colors.textSubtle} /> : <ChevronDown size={16} color={colors.textSubtle} />}
          </View>
        </View>

        {/* Journey Route Stops (Stacked vertically to prevent truncation) */}
        <View style={styles.journeyWrapper}>
          <View style={styles.journeyTimeline}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, styles.timelineDotDest]} />
          </View>
          <View style={styles.journeyStops}>
            <Text style={styles.stopText} numberOfLines={1}>
              {ticket.source}
            </Text>
            <Text style={[styles.stopText, styles.destStopText]} numberOfLines={1}>
              {ticket.dest}
            </Text>
          </View>
        </View>

        {/* Quick Info Footer Row */}
        <View style={styles.quickInfoRow}>
          <Text style={styles.dateTimeText}>
            {ticket.date} • {ticket.time}
          </Text>
          <Text style={styles.fareText}>₹{ticket.total || ticket.fare}</Text>
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
    </View>
  );
};

const getStyles = (colors: any, radius: any, shadows: any, isDark: boolean) => StyleSheet.create({
  ticketContainer: { 
    marginBottom: 10, 
    borderRadius: radius.lg, 
    backgroundColor: colors.surface, 
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card 
  },
  ticketContainerExpanded: {
    borderColor: colors.accentMuted,
  },
  mainCardButton: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busBadge: { 
    width: 26, 
    height: 26, 
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
  routeName: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: colors.text 
  },
  busTypeText: { 
    fontSize: 10, 
    color: colors.textMuted, 
    fontWeight: '700',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  journeyWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingLeft: 4,
    gap: 12,
  },
  journeyTimeline: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  timelineDotDest: {
    backgroundColor: colors.success,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    minHeight: 16,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  journeyStops: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  stopText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  destStopText: {
    fontWeight: '600',
    color: colors.textMuted,
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border + '44',
  },
  dateTimeText: { 
    fontSize: 11, 
    color: colors.textSubtle,
    fontWeight: '600'
  },
  fareText: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: colors.accent,
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
