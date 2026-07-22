// app/(admin)/index.tsx

import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActivityIndicator, FAB, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "rgb(1, 107, 1)";

export default function AdminDashboard() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const hideFabRoutes = ["/extra", "/messages", "/chat"];

  const pathname = usePathname();

  const shouldShowFab = !hideFabRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const { user } = useAuthStore();

  const [recentRequestCount, setRecentRequestCount] = useState(0);
  const [payoutRequestCount, setPayoutRequestCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      /* setLoading(true); */

      const response = await fetch(`${API_URL}/api/admin`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard");
      }

      const data = await response.json();
      setRecentRequestCount(data.recentRequest ?? 0);
      setPayoutRequestCount(data.payoutRequest ?? 0);
      setUserCount(data.users ?? 0);

      setLastUpdated(new Date());
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, user?.email]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const StatCard = ({
    icon,
    title,
    value,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: number;
    onPress: () => void;
  }) => (
    <Pressable style={styles.statCard} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={26} color={PRIMARY} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" color={PRIMARY} />
        <Text style={{ marginTop: 14 }}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.smallText}>Welcome Back 👋</Text>

          <Text style={styles.bigTitle}>{user?.name || "Administrator"}</Text>

          <Text style={styles.subtitle}>
            Manage GiftApex quickly from one place.
          </Text>

          <Text style={styles.lastUpdated}>
            Last Updated:{" "}
            {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "white",
            padding: 18,
            borderRadius: 20,
            marginBottom: 20,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 16,
              marginBottom: 14,
            }}
          >
            Activity Summary
          </Text>

          <View
            style={{
              height: 12,
              backgroundColor: "#E5E7EB",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${Math.min(
                  100,
                  recentRequestCount + payoutRequestCount + userCount,
                )}%`,
                height: "100%",
                backgroundColor: PRIMARY,
              }}
            />
          </View>

          <Text
            style={{
              marginTop: 10,
              color: "#6B7280",
              fontSize: 13,
            }}
          >
            Total tracked items:{" "}
            {recentRequestCount + payoutRequestCount + userCount}
          </Text>
        </View>

        {/* ================= OVERVIEW ================= */}
        <Text style={styles.sectionTitle}>Overview</Text>

        <View style={styles.overviewContainer}>
          <Pressable
            style={[styles.overviewCard, { backgroundColor: "#0F766E" }]}
            onPress={() => router.push("/(admin)/recent-requests")}
          >
            <Ionicons name="time-outline" size={30} color="#fff" />

            <Text style={styles.overviewValue}>{recentRequestCount}</Text>

            <Text style={styles.overviewLabel}>Recent Requests</Text>
          </Pressable>

          <Pressable
            style={[styles.overviewCard, { backgroundColor: "#7C3AED" }]}
            onPress={() => router.push("/(admin)/payout-requests")}
          >
            <Ionicons name="wallet-outline" size={30} color="#fff" />

            <Text style={styles.overviewValue}>{payoutRequestCount}</Text>

            <Text style={styles.overviewLabel}>Payout Requests</Text>
          </Pressable>

          <Pressable
            style={[styles.overviewCard, { backgroundColor: "#EA580C" }]}
            onPress={() => router.push("/(admin)/users")}
          >
            <Ionicons name="people-outline" size={30} color="#fff" />

            <Text style={styles.overviewValue}>{userCount}</Text>

            <Text style={styles.overviewLabel}>Registered Users</Text>
          </Pressable>

          <Pressable
            style={[styles.overviewCard, { backgroundColor: PRIMARY }]}
            onPress={() => router.push("/(admin)/price-list")}
          >
            <Ionicons name="pricetags-outline" size={30} color="#fff" />

            <Text style={styles.overviewValue}>View</Text>

            <Text style={styles.overviewLabel}>Price List</Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickContainer}>
          <QuickButton
            icon="time"
            title="Recent Requests"
            onPress={() => router.push("/(admin)/recent-requests")}
          />

          <QuickButton
            icon="wallet"
            title="Payouts"
            onPress={() => router.push("/(admin)/payout-requests")}
          />

          <QuickButton
            icon="people"
            title="Users"
            onPress={() => router.push("/(admin)/users")}
          />

          <QuickButton
            icon="pricetags"
            title="Price List"
            onPress={() => router.push("/(admin)/price-list")}
          />
        </View>
      </ScrollView>

      {/* ================= FAB ================= */}
      {shouldShowFab && (
        <Portal>
          <FAB.Group
            open={fabOpen}
            visible
            icon={fabOpen ? "close" : "shield-account"}
            backdropColor="rgba(0,0,0,0.35)"
            fabStyle={styles.mainFab}
            color="white"
            actions={[
              {
                icon: "history",
                label: "Recent Requests",
                color: "white",
                onPress: () => router.push("/(admin)/recent-requests"),
                style: styles.actionFab,
                labelStyle: styles.fabLabel,
              },

              {
                icon: "wallet",
                label: "Payout Requests",
                onPress: () => router.push("/(admin)/payout-requests"),
                style: styles.actionFab,
                labelStyle: styles.fabLabel,
                color: "white",
              },

              {
                icon: "cash-multiple",
                label: "Price List",
                onPress: () => router.push("/(admin)/price-list"),
                style: styles.actionFab,
                labelStyle: styles.fabLabel,
                color: "white",
              },

              {
                icon: "account-group",
                label: "Users",
                onPress: () => router.push("/(admin)/users"),
                style: styles.actionFab,
                labelStyle: styles.fabLabel,
                color: "white",
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
          />
        </Portal>
      )}
    </SafeAreaView>
  );
}

function QuickButton({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickButton} onPress={onPress}>
      <Ionicons name={icon} size={24} color={PRIMARY} />
      <Text style={styles.quickText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    padding: 18,
    paddingBottom: 120,
  },

  header: {
    backgroundColor: PRIMARY,
    padding: 22,
    borderRadius: 24,
    marginBottom: 22,
  },

  smallText: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },

  bigTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },

  subtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
  },

  lastUpdated: {
    marginTop: 14,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 14,
    color: "#111827",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 14,
    elevation: 3,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EDF8ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: PRIMARY,
  },

  statTitle: {
    marginTop: 4,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
  },

  quickContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  quickButton: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 14,
    elevation: 2,
  },

  quickText: {
    marginTop: 8,
    fontWeight: "700",
    color: "#374151",
  },
  overviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  overviewCard: {
    width: "48%",
    minHeight: 145,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    justifyContent: "space-between",
    elevation: 4,
  },

  overviewValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },

  overviewLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  /* ================= FAB ================= */

  mainFab: {
    backgroundColor: PRIMARY,
  },

  actionFab: {
    backgroundColor: PRIMARY,
  },

  fabLabel: {
    backgroundColor: PRIMARY,
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 14,
  },
});
