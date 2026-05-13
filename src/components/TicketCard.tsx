import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bus, MapPin, Calendar, Clock, Ticket, Users, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../core/theme';
import { StatusBadge } from './AdminUI';

interface TicketCardProps {
  ticket: any;
  showUserInfo?: boolean;
  /** When set, shown instead of ticket.userName (keeps parent from cloning ticket each render). */
  listUserName?: string;
  onDelete?: (id: string) => void;
}

const TicketCardInner = ({ ticket, showUserInfo = false, listUserName, onDelete }: TicketCardProps) => {
  const userLabel = listUserName ?? ticket.userName;
  return (
    <View style={styles.ticketContainer}>
      <LinearGradient 
        colors={['#6366F1', '#4F46E5']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.routeSection}>
            <Bus size={16} color={COLORS.white} />
            <Text style={styles.routeName}>{ticket.route}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={styles.fareDisplay}>₹{ticket.total || ticket.fare}</Text>
            {onDelete && (
              <TouchableOpacity 
                onPress={() => onDelete(ticket.id)} 
                style={styles.deleteIconBtn}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.ticketContent}>
        {showUserInfo && (
          <>
            <View style={styles.userInfoRow}>
              <View style={styles.userBadge}>
                <Users size={14} color={COLORS.accent} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userNameLabel}>{userLabel}</Text>
              </View>
              <StatusBadge 
                label={ticket.status || 'Active'} 
                tone={ticket.status === 'Active' ? 'success' : ticket.status === 'Expired' ? 'error' : 'info'} 
              />
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.routeDetails}>
          <View style={styles.stopDetail}>
            <View style={[styles.stopIcon, { borderColor: COLORS.success }]}>
              <MapPin size={12} color={COLORS.success} />
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopLabel}>From</Text>
              <Text style={styles.stopName}>{ticket.source}</Text>
            </View>
          </View>

          <View style={styles.connectionLine} />

          <View style={styles.stopDetail}>
            <View style={[styles.stopIcon, { borderColor: COLORS.error }]}>
              <MapPin size={12} color={COLORS.error} />
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopLabel}>To</Text>
              <Text style={styles.stopName}>{ticket.dest}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaInfoRow}>
          <View style={styles.metaItem}>
            <Calendar size={12} color={COLORS.accent} />
            <Text style={styles.metaText}>{ticket.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={12} color={COLORS.accent} />
            <Text style={styles.metaText}>{ticket.time}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ticket size={12} color={COLORS.accent} />
            <Text style={styles.metaText}>Qty: {ticket.qty}</Text>
          </View>
        </View>

        <View style={styles.tidContainer}>
          <Text style={styles.tidLabel}>Transaction ID</Text>
          <Text style={styles.tidValue}>{ticket.tid}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketContainer: { marginBottom: 10, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surface, ...SHADOWS.floating },
  gradientHeader: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeSection: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  routeName: { fontSize: 15, fontWeight: '800', color: COLORS.white, flexShrink: 1 },
  fareDisplay: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  ticketContent: { padding: 10 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  userBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center' },
  userDetails: { flex: 1 },
  userNameLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.surfaceMuted, marginVertical: 6 },
  routeDetails: { marginVertical: 6, gap: 6 },
  stopDetail: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stopIcon: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  stopContent: { flex: 1, justifyContent: 'center' },
  stopLabel: { fontSize: 9, color: COLORS.textSubtle, fontWeight: '600', textTransform: 'uppercase', marginBottom: 1 },
  stopName: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  connectionLine: { width: 1, height: 12, backgroundColor: COLORS.border, marginLeft: 11 },
  metaInfoRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 6, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' },
  metaText: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted },
  tidContainer: { alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: COLORS.surfaceMuted },
  tidLabel: { fontSize: 8, color: COLORS.textSubtle, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  tidValue: { fontSize: 12, fontWeight: '800', color: COLORS.accent, letterSpacing: 0.5 },
  deleteIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export const TicketCard = React.memo(TicketCardInner);
