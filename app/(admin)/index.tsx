import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "rgb(1, 107, 1)";

export default function AdminDashboard() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerCard}>
          <Text style={styles.welcome}>Welcome Back 👋</Text>

          <Text style={styles.title}>Admin Dashboard</Text>

          <Text style={styles.subtitle}>
            Manage requests, users, payouts and price lists easily.
          </Text>
        </View>

        {/* QUICK STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Requests</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Payouts</Text>
          </View>
        </View>

        <View style={styles.largeCard}>
          <Text style={styles.largeCardTitle}>Admin Panel</Text>

          <Text style={styles.largeCardText}>
            Use the floating action button below to navigate through admin
            services quickly.
          </Text>
        </View>
      </View>

      {/* ================= FAB ================= */}
      <Portal>
        <FAB.Group
          open={open}
          visible
          icon={open ? "close" : "shield-account"}
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
          onStateChange={({ open }) => setOpen(open)}
        />
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  container: {
    flex: 1,
    padding: 18,
  },

  /* ================= HEADER ================= */

  headerCard: {
    backgroundColor: PRIMARY,
    borderRadius: 28,
    padding: 24,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  welcome: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "white",
    marginBottom: 10,
  },

  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 22,
  },

  /* ================= STATS ================= */

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 22,
    paddingVertical: 24,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  statNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: PRIMARY,
    marginBottom: 6,
  },

  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },

  /* ================= INFO CARD ================= */

  largeCard: {
    marginTop: 22,
    backgroundColor: "white",
    borderRadius: 24,
    padding: 22,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  largeCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  largeCardText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 22,
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
