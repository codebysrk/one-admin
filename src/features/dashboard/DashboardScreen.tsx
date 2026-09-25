import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const IconWrapper = (name: any) => (props: any) => (
  <MaterialCommunityIcons name={name} {...props} />
);

const Bell = IconWrapper("bell");
const Megaphone = IconWrapper("bullhorn");
const Bus = IconWrapper("bus");
const ChevronRight = IconWrapper("chevron-right");
const Smartphone = IconWrapper("cellphone");
const Ticket = IconWrapper("ticket");
const TrendingUp = IconWrapper("trending-up");
const UserCircle = IconWrapper("account-circle");
const Users = IconWrapper("account-group");
const IndianRupee = IconWrapper("currency-inr");
const MapPin = IconWrapper("map-marker");
const ArrowUpRight = IconWrapper("arrow-top-right");
const Cash = IconWrapper("cash-multiple");
const Activity = IconWrapper("pulse");
const ShieldCheck = IconWrapper("shield-check");
import { useAdminStore } from "../../store/useAdminStore";
import { useTheme } from "../../core/ThemeContext";
import { RADIUS, SHADOWS, SPACING } from "../../core/theme";
import { supabase } from "../../services/supabase";
import {
  AdminHeader,
  AdminPressable,
  Card,
  SectionHeader,
  SkeletonBlock,
} from "../../components/AdminUI";

const formatLogTime = (timestamp: any) => {
  if (!timestamp) return "Recent";
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recent";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return isToday
    ? `Today, ${timeStr}`
    : `${date.toLocaleDateString([], { day: "2-digit", month: "short" })}, ${timeStr}`;
};



const StatsGrid = React.memo(
  ({ stats, weeklyRevenue, loading, navigation }: any) => {
    const { colors, isDark } = useTheme();
    const styles = useMemo(
      () => (typeof getStyles === "function" ? getStyles(colors) : ({} as any)),
      [colors]
    );
    const cards = [
      {
        key: "weekly",
        label: "Weekly Earnings",
        icon: TrendingUp,
        value: loading ? "..." : `₹${weeklyRevenue.toLocaleString("en-IN")}`,
        tone: colors.accent,
        bg: colors.accentSoft,
        badge: "Live",
        route: "Tickets",
      },
      {
        key: "revenue",
        label: "Total Revenue",
        icon: IndianRupee,
        value: loading
          ? "..."
          : `₹${stats.revenue > 1000 ? (stats.revenue / 1000).toFixed(1) + "k" : stats.revenue}`,
        tone: colors.success,
        bg: colors.successSoft,
        badge: "Gross",
        route: "Tickets",
      },
      {
        key: "users",
        label: "Active Users",
        icon: Users,
        value: loading ? "..." : stats.users.toLocaleString("en-IN"),
        tone: colors.info,
        bg: colors.infoSoft,
        badge: "Total",
        route: "Users",
      },
      {
        key: "routes",
        label: "Active Routes",
        icon: Bus,
        value: loading ? "..." : stats.routes.toLocaleString("en-IN"),
        tone: colors.warning,
        bg: colors.warningSoft,
        badge: "Lines",
        route: "Routes",
      },
    ];

    return (
      <View style={styles.statsGrid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <AdminPressable
              key={card.key}
              style={styles.statCard}
              onPress={() => card.route && navigation?.navigate(card.route)}
              accessibilityRole="button"
              accessibilityLabel={`${card.label}: ${card.value}`}
            >
              <View style={styles.statCardHeader}>
                <View style={[styles.statIcon, { backgroundColor: card.bg }]}>
                  <Icon size={15} color={card.tone} />
                </View>
                <View style={[styles.statBadge, { backgroundColor: card.bg }]}>
                  <Text style={[styles.statBadgeText, { color: card.tone }]}>
                    {card.badge}
                  </Text>
                </View>
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {card.value}
              </Text>
              <View style={styles.statFooterRow}>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {card.label}
                </Text>
                <ArrowUpRight size={12} color={colors.textSubtle} />
              </View>
            </AdminPressable>
          );
        })}
      </View>
    );
  },
);

const RevenueChart = React.memo(
  ({ loading, chartWidth, revenueData, chartConfig }: any) => {
    const { colors, isDark } = useTheme();
    const styles = useMemo(
      () => (typeof getStyles === "function" ? getStyles(colors) : ({} as any)),
      [colors]
    );
    const total7Day = useMemo(
      () =>
        revenueData.reduce(
          (acc: number, v: number) => acc + (Number(v) || 0),
          0,
        ),
      [revenueData],
    );

    return (
      <Card style={styles.chartCard}>
        <SectionHeader
          icon={
            <TrendingUp
              size={17}
              color={isDark ? colors.text : colors.primary}
            />
          }
          title="Revenue Performance"
          caption="Earnings (₹) over the last 7 days"
          action={
            <View
              style={[styles.statBadge, { backgroundColor: colors.accentSoft }]}
            >
              <Text style={[styles.statBadgeText, { color: colors.accent }]}>
                {loading ? "..." : `₹${total7Day.toLocaleString("en-IN")}`}
              </Text>
            </View>
          }
        />
        <View style={styles.chartFrame}>
          {loading ? (
            <SkeletonBlock
              style={{ width: "100%", height: 160, borderRadius: 12 }}
            />
          ) : (
            <LineChart
              data={{
                labels: ["6d", "5d", "4d", "3d", "2d", "1d", "Now"],
                datasets: [{ data: revenueData }],
              }}
              width={chartWidth}
              height={160}
              chartConfig={chartConfig}
              bezier
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
            />
          )}
        </View>
      </Card>
    );
  },
);

const ActivityItem = React.memo(({ log, isLast }: any) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => (typeof getStyles === "function" ? getStyles(colors) : ({} as any)),
    [colors]
  );
  const isSecurity =
    log.action &&
    (log.action.includes("BAN") ||
      log.action.includes("LOGOUT") ||
      log.action.includes("DELETE"));
  return (
    <View style={[styles.activityRow, isLast && styles.activityRowLast]}>
      <View
        style={[
          styles.activityIconBox,
          { backgroundColor: isSecurity ? colors.errorSoft : colors.infoSoft },
        ]}
      >
        <Bell size={16} color={isSecurity ? colors.error : colors.info} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTxt} numberOfLines={1}>
          {log.details || log.action}
        </Text>
        <Text style={styles.activityMeta}>
          {formatLogTime(log.timestamp)} • {log.userName || "System"}
        </Text>
      </View>
    </View>
  );
});

const TicketItem = React.memo(({ ticket, isLast, onPress }: any) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => (typeof getStyles === "function" ? getStyles(colors) : ({} as any)),
    [colors]
  );
  const isAC =
    String(ticket.busType || ticket.bus_type || "").toUpperCase() === "AC" ||
    (ticket.route && String(ticket.route).toLowerCase().includes("ac"));
  const fareVal = ticket.fare ?? ticket.total ?? ticket.finalFare ?? 0;
  const qtyVal = ticket.passengers ?? ticket.qty ?? 1;
  const fromStop = ticket.source || ticket.from || "Source";
  const toStop =
    ticket.destination || ticket.dest || ticket.to || "Destination";

  return (
    <AdminPressable
      style={[styles.activityRow, isLast && styles.activityRowLast]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ticket ${ticket.route}: ${fromStop} to ${toStop}`}
    >
      <View
        style={[
          styles.activityIconBox,
          { backgroundColor: isAC ? colors.accentSoft : colors.warningSoft },
        ]}
      >
        <Ticket size={16} color={isAC ? colors.accent : colors.warning} />
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeaderRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.activityRouteBadge}>
              {ticket.route || "TRANSIT"}
            </Text>
            <View
              style={[
                styles.busTypePill,
                {
                  backgroundColor: isAC
                    ? colors.accentSoft
                    : colors.surfaceMuted,
                },
              ]}
            >
              <Text
                style={[
                  styles.busTypePillText,
                  { color: isAC ? colors.accent : colors.textSubtle },
                ]}
              >
                {isAC ? "AC" : "Non-AC"}
              </Text>
            </View>
          </View>
          <Text style={styles.activityPrice}>₹{fareVal}</Text>
        </View>
        <Text style={styles.activitySubtitle} numberOfLines={1}>
          {fromStop} → {toStop}
        </Text>
        <Text style={styles.activityMeta}>
          {formatLogTime(ticket.timestamp || ticket.created_at)} • {qtyVal}{" "}
          Ticket{qtyVal !== 1 ? "s" : ""}
        </Text>
      </View>
    </AdminPressable>
  );
});

export const DashboardScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(
    () => (typeof getStyles === "function" ? getStyles(colors) : ({} as any)),
    [colors],
  );
  const admin = useAdminStore((state) => state.admin);
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const [stats, setStats] = useState({ users: 0, revenue: 0, routes: 0 });
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ]);
  const [topRoutes, setTopRoutes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [liveTickets, setLiveTickets] = useState<any[]>([]);
  const [busStats, setBusStats] = useState({ ac: 0, nonAc: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [statsRes, { data: liveTicketsData }, { data: logsData }] =
        await Promise.all([
          supabase.rpc("get_admin_dashboard_stats"),
          supabase
            .from("tickets")
            .select("*, users(name, email)")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("activity_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (statsRes.data) {
        const d = statsRes.data;
        setStats({
          users: Number(d.users_count || 0),
          revenue: Number(d.total_revenue || 0),
          routes: Number(d.routes_count || 0),
        });
        setWeeklyRevenue(Number(d.weekly_revenue || 0));
        setRevenueData(d.daily_revenue || [0, 0, 0, 0, 0, 0, 0]);
        setTopRoutes(d.top_routes || []);
      }

      const liveTickets = (liveTicketsData || []).map((d: any) => {
        const isAC =
          String(d.bus_type || d.busType || "").toUpperCase() === "AC" ||
          (d.route && String(d.route).toLowerCase().includes("ac"));
        return {
          id: d.id,
          ...d,
          busType: isAC ? "AC" : "Non-AC",
          bus_type: isAC ? "AC" : "Non-AC",
          from: d.source,
          to: d.destination,
          timestamp: d.created_at,
        };
      });
      setLiveTickets(liveTickets);
      const acCount = liveTickets.filter((t: any) => t.busType === "AC").length;
      setBusStats({ ac: acCount, nonAc: liveTickets.length - acCount });

      if (logsData) {
        setActivities(
          logsData.map((l: any) => ({
            id: l.id,
            action: l.action,
            details: l.details,
            userName: l.user_name,
            timestamp: l.created_at,
          })),
        );
      }
    } catch (error) {
      if (__DEV__) console.warn("Dashboard stats fetch failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllDashboard();
    }, [fetchAllDashboard]),
  );

  useEffect(() => {
    fetchAllDashboard();

    const channel = supabase
      .channel("dashboard-realtime-sub")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          fetchAllDashboard();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_logs" },
        () => {
          fetchAllDashboard();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          fetchAllDashboard();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "routes" },
        () => {
          fetchAllDashboard();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllDashboard]);

  const handleRefresh = useCallback(() => {
    fetchAllDashboard(true);
  }, [fetchAllDashboard]);

  const chartConfig = useMemo(
    () => ({
      backgroundColor: colors.surface,
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) =>
        isDark
          ? `rgba(96, 165, 250, ${opacity})`
          : `rgba(37, 99, 235, ${opacity})`,
      labelColor: (opacity = 1) =>
        isDark
          ? `rgba(161, 161, 170, ${opacity})`
          : `rgba(100, 116, 139, ${opacity})`,
      propsForDots: { r: "3", strokeWidth: "1.5", stroke: colors.surface },
      propsForBackgroundLines: {
        strokeDasharray: "",
        stroke: colors.border,
        opacity: 0.6,
      },
    }),
    [colors, isDark],
  );

  const maxRouteVolume = useMemo(() => {
    if (!topRoutes || topRoutes.length === 0) return 1;
    return Math.max(...topRoutes.map((r: any) => Number(r.count) || 1), 1);
  }, [topRoutes]);

  const chartWidth = Math.max(260, width - 64);

  const isSuperAdmin = admin?.email === 'admin@onedelhi.com' || admin?.permissions?.includes('FULL_ACCESS');
  const canManageAdmins = isSuperAdmin || admin?.permissions?.includes('MANAGE_ADMINS');

  return (
    <View style={styles.container}>
      <AdminHeader
        eyebrow="ONE DELHI • ADMIN PANEL"
        title={admin?.name || "Administrator"}
        subtitle="Real-time transit command & fleet overview"
        action={(
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AdminPressable
              accessibilityRole="button"
              accessibilityLabel="Open broadcast alerts"
              onPress={() => navigation.navigate("Alerts")}
              style={styles.profileBtn}
            >
              <Megaphone size={18} color={colors.text} />
            </AdminPressable>
            {canManageAdmins && (
              <AdminPressable
                accessibilityRole="button"
                accessibilityLabel="Open admin team management"
                onPress={() => navigation.navigate("Admins")}
                style={styles.profileBtn}
              >
                <ShieldCheck size={18} color={colors.text} />
              </AdminPressable>
            )}
            <AdminPressable
              accessibilityRole="button"
              accessibilityLabel="Open profile settings"
              onPress={() => navigation.navigate("Profile")}
              style={styles.profileBtn}
            >
              <UserCircle size={20} color={colors.text} />
            </AdminPressable>
          </View>
        )}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <StatsGrid
          stats={stats}
          weeklyRevenue={weeklyRevenue}
          loading={loading}
          navigation={navigation}
        />
        <RevenueChart
          loading={loading}
          chartWidth={chartWidth}
          revenueData={revenueData}
          chartConfig={chartConfig}
        />

        <SectionHeader
          icon={<MapPin size={16} color={colors.accent} />}
          title="Top Performing Routes"
          caption="Routes generating highest ticket volume"
          action={
            <AdminPressable
              style={styles.viewAll}
              onPress={() => navigation.navigate("Routes")}
            >
              <Text style={styles.viewAllText}>Manage</Text>
              <ChevronRight size={14} color={colors.accent} />
            </AdminPressable>
          }
        />

        <View style={styles.routesGrid}>
          {loading ? (
            [0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[styles.routeRow, idx === 2 && styles.routeRowLast]}
              >
                <SkeletonBlock
                  style={{ width: 28, height: 28, borderRadius: RADIUS.sm }}
                />
                <View style={{ flex: 1, marginLeft: 12, gap: 5 }}>
                  <SkeletonBlock
                    style={{
                      width: "50%",
                      height: 13,
                      borderRadius: RADIUS.xs,
                    }}
                  />
                  <SkeletonBlock
                    style={{
                      width: "32%",
                      height: 10,
                      borderRadius: RADIUS.xs,
                    }}
                  />
                </View>
                <SkeletonBlock
                  style={{ width: 48, height: 13, borderRadius: RADIUS.xs }}
                />
              </View>
            ))
          ) : topRoutes.length === 0 ? (
            <Text style={styles.noData}>No route activity recorded yet</Text>
          ) : (
            topRoutes.map((route, idx) => (
              <AdminPressable
                key={route.name}
                style={[
                  styles.routeRow,
                  idx === topRoutes.length - 1 && styles.routeRowLast,
                ]}
                onPress={() => navigation.navigate("Routes")}
              >
                <View
                  style={[
                    styles.routeRank,
                    {
                      backgroundColor:
                        idx === 0 ? colors.accentSoft : colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      { color: idx === 0 ? colors.accent : colors.textMuted },
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <View style={styles.routeProgressContainer}>
                    <View
                      style={[
                        styles.routeProgressBar,
                        {
                          width: `${Math.min(100, Math.max(8, Math.round(((Number(route.count) || 0) / maxRouteVolume) * 100)))}%`,
                          backgroundColor:
                            idx === 0 ? colors.accent : colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.routeVolume}>
                    {route.count} ticket{route.count !== 1 ? "s" : ""} issued
                  </Text>
                </View>
                <View
                  style={[
                    styles.routeMetrics,
                    { flexDirection: "row", alignItems: "center", gap: 6 },
                  ]}
                >
                  {route.originalRevenue > route.revenue && (
                    <Text
                      style={[
                        styles.routeVolume,
                        {
                          textDecorationLine: "line-through",
                          fontSize: 11,
                          opacity: 0.5,
                        },
                      ]}
                    >
                      ₹{route.originalRevenue.toLocaleString("en-IN")}
                    </Text>
                  )}
                  <Text style={styles.routeRev}>
                    ₹{route.revenue.toLocaleString("en-IN")}
                  </Text>
                </View>
              </AdminPressable>
            ))
          )}
        </View>

        <SectionHeader
          icon={<Smartphone size={16} color={colors.accent} />}
          title="Fleet Performance"
          caption="Ticket distribution by bus type"
        />

        <View style={styles.fleetGrid}>
          <Card style={styles.fleetCard}>
            <View style={styles.fleetCardHeader}>
              <Text style={styles.fleetLabel}>AC FLEET</Text>
              <View
                style={[styles.fleetDot, { backgroundColor: colors.accent }]}
              />
            </View>
            <Text style={[styles.fleetValue, { color: colors.accent }]}>
              {busStats.ac}
            </Text>
            <Text style={styles.fleetSub}>Buses operational</Text>
          </Card>
          <Card style={styles.fleetCard}>
            <View style={styles.fleetCardHeader}>
              <Text style={styles.fleetLabel}>NON-AC FLEET</Text>
              <View
                style={[styles.fleetDot, { backgroundColor: colors.warning }]}
              />
            </View>
            <Text style={[styles.fleetValue, { color: colors.warning }]}>
              {busStats.nonAc}
            </Text>
            <Text style={styles.fleetSub}>Buses operational</Text>
          </Card>
        </View>

        <SectionHeader
          icon={<Ticket size={16} color={colors.accent} />}
          title="Live Ticket Feed"
          caption="Real-time passenger bookings"
          action={
            <AdminPressable
              style={styles.viewAll}
              onPress={() => navigation.navigate("Tickets")}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={colors.accent} />
            </AdminPressable>
          }
        />

        <Card style={styles.activityFeed}>
          {loading ? (
            [0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.activityRow,
                  idx === 2 && styles.activityRowLast,
                ]}
              >
                <SkeletonBlock
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: RADIUS.sm,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1, gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <SkeletonBlock
                      style={{ width: 64, height: 13, borderRadius: RADIUS.xs }}
                    />
                    <SkeletonBlock
                      style={{ width: 42, height: 13, borderRadius: RADIUS.xs }}
                    />
                  </View>
                  <SkeletonBlock
                    style={{
                      width: "70%",
                      height: 11,
                      borderRadius: RADIUS.xs,
                    }}
                  />
                  <SkeletonBlock
                    style={{ width: "45%", height: 9, borderRadius: RADIUS.xs }}
                  />
                </View>
              </View>
            ))
          ) : liveTickets.length === 0 ? (
            <Text style={styles.noData}>No recent ticket bookings</Text>
          ) : (
            liveTickets.map((ticket, index) => (
              <TicketItem
                key={ticket.id}
                ticket={ticket}
                isLast={index === liveTickets.length - 1}
                onPress={() => navigation.navigate("Tickets")}
              />
            ))
          )}
        </Card>

        <SectionHeader
          icon={<Bell size={16} color={colors.accent} />}
          title="Security Feed"
          caption="Latest critical system activities"
          action={
            <AdminPressable
              style={styles.viewAll}
              onPress={() => navigation.navigate("Logs")}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={colors.accent} />
            </AdminPressable>
          }
        />

        <Card style={styles.activityFeed}>
          {loading
            ? [0, 1, 2].map((idx) => (
                <View
                  key={idx}
                  style={[
                    styles.activityRow,
                    idx === 2 && styles.activityRowLast,
                  ]}
                >
                  <SkeletonBlock
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: RADIUS.sm,
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBlock
                      style={{
                        width: "65%",
                        height: 13,
                        borderRadius: RADIUS.xs,
                      }}
                    />
                    <SkeletonBlock
                      style={{
                        width: "40%",
                        height: 10,
                        borderRadius: RADIUS.xs,
                      }}
                    />
                  </View>
                </View>
              ))
            : activities.length === 0 ? (
                <Text style={styles.noData}>No recent security activity</Text>
              ) : (
                activities.map((log: any, index) => (
                  <ActivityItem
                    key={log.id}
                    log={log}
                    isLast={index === activities.length - 1}
                  />
                ))
              )}
        </Card>
      </ScrollView>
    </View>
  );
};

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerShell: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
    },
    headerCopy: { flex: 1 },
    statusIndicatorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 3,
    },
    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.success,
    },
    greeting: {
      fontSize: 10,
      color: colors.textSubtle,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    adminName: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.4,
    },
    profileBtn: {
      width: 38,
      height: 38,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surfacePressed,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    content: { flex: 1 },
    contentInner: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: 40,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      width: "47%",
      flexGrow: 1,
      marginBottom: 0,
      padding: 16,
      borderRadius: RADIUS.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      ...SHADOWS.card,
    },
    statCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
    },
    statBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: RADIUS.pill,
    },
    statBadgeText: {
      fontSize: 9,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    statValue: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.5,
      marginBottom: 3,
    },
    statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
    statFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
    },
    chartCard: {
      padding: 16,
      marginBottom: 20,
      borderRadius: RADIUS.card,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.card,
    },
    chartFrame: { marginTop: 12 },
    chart: { marginLeft: -15 },
    routesGrid: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.card,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      ...SHADOWS.card,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    routeRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    routeRank: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    rankText: { fontSize: 11, fontWeight: "700" },
    routeInfo: { flex: 1, marginLeft: 12 },
    routeName: { fontSize: 13, fontWeight: "700", color: colors.text },
    routeVolume: {
      fontSize: 11,
      color: colors.textSubtle,
      marginTop: 2,
      fontWeight: "500",
    },
    routeProgressContainer: {
      height: 4,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 2,
      marginTop: 4,
      marginBottom: 3,
      overflow: "hidden",
    },
    routeProgressBar: {
      height: "100%",
      borderRadius: 2,
    },
    routeMetrics: { alignItems: "flex-end" },
    routeRev: { fontSize: 13, fontWeight: "700", color: colors.success },
    noData: {
      textAlign: "center",
      color: colors.textMuted,
      fontSize: 12,
      paddingVertical: 12,
    },
    viewAll: { flexDirection: "row", alignItems: "center", gap: 4 },
    viewAllText: { fontSize: 11, fontWeight: "700", color: colors.accent },
    activityFeed: {
      padding: 0,
      overflow: "hidden",
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activityRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityRowLast: { borderBottomWidth: 0 },
    activityIconBox: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.sm,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    activityContent: { flex: 1 },
    activityHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    activityRouteBadge: { fontSize: 13, fontWeight: "700", color: colors.text },
    busTypePill: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: RADIUS.xs,
    },
    busTypePillText: { fontSize: 9, fontWeight: "700" },
    activityPrice: { fontSize: 13, fontWeight: "700", color: colors.success },
    activitySubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 2,
    },
    activityTxt: { fontSize: 13, color: colors.text, fontWeight: "600" },
    activityMeta: { fontSize: 10, color: colors.textSubtle, fontWeight: "500" },
    fleetGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
    fleetCard: {
      flex: 1,
      padding: 14,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 0,
    },
    fleetCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    fleetLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    fleetDot: { width: 6, height: 6, borderRadius: 3 },
    fleetValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
    fleetSub: {
      fontSize: 10,
      color: colors.textSubtle,
      marginTop: 2,
      fontWeight: "500",
    },
  });
}
