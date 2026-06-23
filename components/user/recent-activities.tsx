import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const THEME = "rgb(1, 107, 1)";

type Payout = {
  _id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
};

type GiftCode = {
  _id: string;
  status: string;
  currency: string;
  value: number;
  createdAt: string;
  note?: string;
  codes: {
    status: string;
  }[];
};

type ActivityItem =
  | {
      type: "payout";
      data: Payout;
      createdAt: string;
    }
  | {
      type: "giftcode";
      data: GiftCode;
      createdAt: string;
    };

type Props = {
  payouts: Payout[];
  giftCodes: GiftCode[];
  loading?: boolean;
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year}, ${hours}:${mins}`;
};

export default function RecentActivities({
  payouts,
  giftCodes,
  loading = false,
}: Props) {
  const router = useRouter();

  // ================= SHARE =================
  const shareId = async (id: string) => {
    try {
      await Share.share({
        message: `Transaction ID: ${id}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // ================= MERGE + SORT =================
  const mergedActivities: ActivityItem[] = [
    ...payouts.map((item) => ({
      type: "payout" as const,
      data: item,
      createdAt: item.createdAt,
    })),

    ...giftCodes.map((item) => ({
      type: "giftcode" as const,
      data: item,
      createdAt: item.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  // ================= STATUS COLOR =================
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();

    if (s === "pending") {
      return {
        background: "#FFF7ED",
      };
    }

    if (s === "rejected" || s === "cancelled") {
      return {
        background: "#FEF2F2",
      };
    }

    return {
      background: "rgba(1,107,1,0.12)",
    };
  };

  // ================= RENDER =================
  const renderItem = ({ item }: { item: ActivityItem }) => {
    // ================= PAYOUT =================
    if (item.type === "payout") {
      const payout = item.data;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: "/payout-detail/[id]",
              params: {
                id: payout._id,
              },
            })
          }
        >
          {/* TOP */}
          <View style={styles.topRow}>
            <View style={styles.leftContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet-outline" size={20} color={THEME} />
              </View>

              <View>
                <Text style={styles.amount}>${payout.amount.toFixed(2)}</Text>

                <Text style={styles.method}>{payout.method}</Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusStyle(payout.status).background,
                },
              ]}
            >
              <Text style={styles.statusText}>
                {payout.status === "completed" ? "success" : payout.status}
              </Text>
            </View>
          </View>

          {/* DATE */}
          <Text style={styles.date}>{formatDate(payout.createdAt)}</Text>

          {/* ID */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.idContainer}
            onPress={() => shareId(payout._id)}
          >
            <Text style={styles.idText} numberOfLines={1}>
              {payout._id}
            </Text>

            <Ionicons name="share-social-outline" size={18} color="#6B7280" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    // ================= GIFT CODE =================
    const giftCode = item.data;

    const pendingCount = giftCode.codes.filter(
      (e) => e.status === "pending",
    ).length;

    const rejectedCount = giftCode.codes.filter(
      (e) => e.status === "rejected",
    ).length;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          if (item.type === "giftcode") {
            router.push({
              pathname: "/code-details/[id]",
              params: {
                id: String(giftCode._id),
              },
            });
          } else {
            router.push({
              pathname: "/(user)/codes",
            });
          }
        }}
      >
        {/* TOP */}
        <View style={styles.topRow}>
          <View style={styles.leftContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="gift-outline"
                size={20}
                color={THEME}
              />
            </View>

            <View>
              <Text style={styles.amount}>
                {giftCode.currency} ${giftCode.value}
              </Text>

              <Text style={styles.method}>
                {giftCode.codes.length} code{giftCode.codes.length > 1 && "'s"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusStyle(giftCode.status).background,
              },
            ]}
          >
            <Text style={styles.statusText}>{giftCode.status}</Text>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.codeInfo}>
          <Text style={{ ...styles.codeInfoText, color: "#8B8000" }}>
            Pending ({pendingCount})
          </Text>

          <Text style={{ ...styles.codeInfoText, color: "red" }}>
            Rejected ({rejectedCount})
          </Text>
        </View>

        {/* DATE */}
        <Text style={styles.date}>{formatDate(giftCode.createdAt)}</Text>

        {/* ID */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.idContainer}
          onPress={() => shareId(giftCode._id)}
        >
          <Text style={styles.idText} numberOfLines={1}>
            {giftCode._id}
          </Text>

          <Ionicons name="share-social-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        <TouchableOpacity onPress={() => router.push("/(user)/codes")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* ================= LOADING ================= */}
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={THEME} />

          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : mergedActivities.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={42} color="#9CA3AF" />

          <Text style={styles.emptyText}>No recent activities yet</Text>
        </View>
      ) : (
        <FlatList
          data={mergedActivities}
          keyExtractor={(item) => `${item.type}-${item.data._id}`}
          renderItem={renderItem}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    marginBottom: 20,
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },

  seeAll: {
    color: THEME,
    fontWeight: "700",
  },

  /* ================= CARD ================= */

  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(1,107,1,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  amount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },

  method: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  date: {
    marginTop: 12,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },

  /* ================= STATUS ================= */

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 10,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
    color: "#111827",
  },

  /* ================= CODE INFO ================= */

  codeInfo: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },

  codeInfoText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  /* ================= ID ================= */

  idContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  idText: {
    flex: 1,
    marginRight: 10,
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  /* ================= EMPTY ================= */

  emptyCard: {
    backgroundColor: "white",
    borderRadius: 22,
    paddingVertical: 45,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  emptyText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
  },

  /* ================= LOADING ================= */

  loadingCard: {
    backgroundColor: "white",
    borderRadius: 22,
    paddingVertical: 45,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
});
