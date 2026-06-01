import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "rgb(1, 107, 1)";

interface GiftCode {
  _id: string;
  userId: string;
  status: "pending" | "verified";
  codes: Array<{
    code: string;
    status: "pending" | "verified" | "rejected";
    reward?: string;
  }>;
  currency: string;
  value: number;
  note?: string;
  createdAt: string;
}

export default function CodesScreen() {
  const router = useRouter();
  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;
  const { user } = useAuthStore();

  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const renderRewardSum = (value: number, codes: any[]) => {
    return codes
      .reduce(
        (sum, code) =>
          sum + ((parseFloat(code.reward || "0") * value) / 100 || 0),
        0,
      )
      .toFixed(2);
  };

  const fetchCodes = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/user/codes?page=${currentPage}&limit=10`,
        {
          method: "GET",
          headers: {
            "x-user-email": user?.email || "",
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      setGiftCodes(data.giftCodes || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [currentPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCodes();
  }, [currentPage]);

  const totalPending = giftCodes.filter((i) => i.status === "pending").length;
  const totalVerified = giftCodes.filter((i) => i.status === "verified").length;

  const totalReward = giftCodes
    .reduce(
      (sum, code) => sum + parseFloat(renderRewardSum(code.value, code.codes)),
      0,
    )
    .toFixed(2);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}.${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}.${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={{ paddingHorizontal: 15 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Your Gift <Text style={{ color: PRIMARY }}>Codes</Text>
          </Text>
          <Text style={styles.subtitle}>Track earnings & verification</Text>
        </View>
        {/* SUMMARY */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: "#FFF8E1" }]}>
            <Ionicons name="time-outline" size={18} color="#B7791F" />
            <Text style={styles.summaryValue}>{totalPending}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#E8F5E9" }]}>
            <Ionicons name="checkmark-done-outline" size={18} color={PRIMARY} />
            <Text style={styles.summaryValue}>{totalVerified}</Text>
            <Text style={styles.summaryLabel}>Verified</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#F3E8FF" }]}>
            <Ionicons name="cash-outline" size={18} color="#6B46C1" />
            <Text style={styles.summaryValue}>${totalReward}</Text>
            <Text style={styles.summaryLabel}>Earnings</Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            marginTop: 10,
            marginBottom: 8,
            color: "#111",
          }}
        >
          Recent Codes
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: "#E5E5E5", width: "100%" }} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
          />
        }
      >
        {/* LIST */}
        {giftCodes.map((giftCode) => {
          const pendingCount = giftCode.codes.filter(
            (x) => x.status === "pending",
          ).length;

          const rejectedCount = giftCode.codes.filter(
            (x) => x.status === "rejected",
          ).length;

          return (
            <TouchableOpacity
              key={giftCode._id}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/code-details/[id]",
                  params: {
                    id: String(giftCode._id),
                  },
                })
              }
            >
              <Card style={styles.card}>
                {/* TOP */}
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.currency}>{giftCode.currency}</Text>
                    <Text style={styles.value}>{giftCode.value}</Text>
                  </View>

                  {/* VERIFIED BADGE */}
                  <View
                    style={[
                      styles.badge,
                      giftCode.status === "verified"
                        ? styles.badgeVerified
                        : styles.badgePending,
                    ]}
                  >
                    <Ionicons
                      name={
                        giftCode.status === "verified"
                          ? "checkmark-done"
                          : "time"
                      }
                      size={12}
                      color={
                        giftCode.status === "verified" ? PRIMARY : "#F59E0B"
                      }
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color:
                          giftCode.status === "verified" ? PRIMARY : "#F59E0B",
                      }}
                    >
                      {giftCode.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* DATE */}
                <View style={styles.row}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.rowText}>
                    {formatDate(giftCode.createdAt)}
                  </Text>
                </View>

                {/* STATS */}
                <View style={styles.stats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Codes</Text>
                    <Text style={styles.statValue}>
                      {giftCode.codes.length}
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={[styles.statLabel, { color: "#F59E0B" }]}>
                      Pending
                    </Text>
                    <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                      {pendingCount}
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={[styles.statLabel, { color: "#EF4444" }]}>
                      Rejected
                    </Text>
                    <Text style={[styles.statValue, { color: "#EF4444" }]}>
                      {rejectedCount}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statLabel, { color: PRIMARY }]}>
                      Approved
                    </Text>
                    <Text style={[styles.statValue, { color: PRIMARY }]}>
                      {giftCode.codes.length - pendingCount - rejectedCount}
                    </Text>
                  </View>
                </View>

                {/* REWARD */}
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardText}>Reward</Text>
                  <Text style={styles.rewardAmount}>
                    ${renderRewardSum(giftCode.value, giftCode.codes)}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* PAGINATION */}
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            style={[styles.pageBtn, currentPage === 1 && { opacity: 0.4 }]}
          >
            <Text style={styles.pageText}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            {currentPage} / {totalPages}
          </Text>

          <TouchableOpacity
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            style={[
              styles.pageBtn,
              currentPage === totalPages && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.pageText}>Next</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 150 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },

  container: { padding: 15 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { marginBottom: 20 },

  title: { fontSize: 28, fontWeight: "800" },

  subtitle: { color: "#666", marginTop: 2 },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },

  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
  },

  summaryValue: { fontSize: 18, fontWeight: "800" },

  summaryLabel: { fontSize: 12, color: "#666" },

  hero: {
    backgroundColor: PRIMARY,
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  heroTextSmall: { color: "#fff", fontSize: 12 },

  heroTextBig: { color: "#fff", fontSize: 20, fontWeight: "800" },

  card: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  currency: { color: "#666" },

  value: { fontSize: 24, fontWeight: "800", color: PRIMARY },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 20,
    height: 30,
  },

  badgeVerified: { backgroundColor: "#E8F5E9" },

  badgePending: { backgroundColor: "#FFF7E0" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  rowText: { color: "#666" },

  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statBox: { flex: 1, alignItems: "center" },

  statLabel: { fontSize: 12, color: "#444" },

  statValue: { fontSize: 14, fontWeight: "700" },

  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  rewardText: { fontWeight: "600" },

  rewardAmount: { fontWeight: "800", color: PRIMARY },

  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    alignItems: "center",
  },

  pageBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },

  pageText: { color: "#fff", fontWeight: "700" },

  pageIndicator: { fontWeight: "700" },
});
