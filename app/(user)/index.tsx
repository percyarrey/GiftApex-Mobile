// app/(user)/index.tsx

import BestDealsScreen from "@/components/user/best-deals";
import ExtrasServices from "@/components/user/extra-services";
import RecentActivities from "@/components/user/recent-activities";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FAB, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

// ================= TYPES =================
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
  codes: {
    status: string;
  }[];
};

const THEME = "rgb(1, 107, 1)";
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;

export default function HomeScreen() {
  const router = useRouter();
  const hideFabRoutes = ["/extra", "/messages", "/chat"];

  const pathname = usePathname();

  const shouldShowFab = !hideFabRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const [open, setOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ payouts state
  const [payouts, setPayouts] = useState<any[]>([]);
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good Morning 👋"
      : currentHour < 18
        ? "Good Afternoon ☀️"
        : "Good Evening 🌙";

  const { user, loadUser } = useAuthStore();

  // ================= FETCH PAYOUTS =================
  const fetchPayouts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/payouts`, {
        headers: {
          "x-user-email": user?.email || "",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setPayouts(data);
      }
    } catch (error) {
      console.log("Payout fetch error:", error);
    }
  };
  // ================= FETCH GIFT CODES =================
  const fetchGiftCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/codes`, {
        headers: {
          "x-user-email": user?.email || "",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (Array.isArray(data?.giftCodes)) {
        setGiftCodes(data.giftCodes);
      }
    } catch (error) {
      console.log("GiftCode fetch error:", error);
    }
  };
  // ================= LOAD ACTIVITIES =================
  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);

      await Promise.all([fetchPayouts(), fetchGiftCodes()]);
    } catch (error) {
      console.log(error);
    } finally {
      setActivitiesLoading(false);
    }
  };
  useEffect(() => {
    loadActivities();
  }, []);

  // ================= REFRESH =================
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setShowBalance(false);

      await loadUser();

      await loadActivities();
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        loadUser();
        loadActivities();
      };

      run();
    }, []),
  );
  const formatAmount = (amount?: number | null) => {
    if (amount == null) {
      return "--";
    }

    if (!showBalance) {
      return "••••••••";
    }

    return `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <StatusBar backgroundColor={THEME} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME]}
            tintColor={THEME}
          />
        }
      >
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>

            <Text
              style={styles.userName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.name || "User"}
            </Text>
          </View>

          {/* Avatar */}
          <View style={styles.avatar}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            )}
          </View>
        </View>

        {/* ================= BALANCE CARD ================= */}
        <View style={styles.balanceCard}>
          {/* Top Row */}
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceTitleContainer}>
              <View style={styles.balanceIcon}>
                <Ionicons name="wallet-outline" size={18} color="white" />
              </View>

              <Text style={styles.totalBalanceLabel}>Total Balance</Text>
            </View>

            <Pressable
              onPress={() => setShowBalance(!showBalance)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showBalance ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="white"
              />
            </Pressable>
          </View>

          {/* Main Balance */}
          <Text style={styles.mainBalance}>
            {formatAmount(
              (user?.balance?.available ?? 0) + (user?.balance?.pending ?? 0),
            )}
          </Text>

          {/* Bottom Row */}
          <View style={styles.bottomBalanceSection}>
            {/* Available */}
            <View style={styles.balanceInfoBox}>
              <Text style={styles.availableLabel}>Available withrawal</Text>

              <Text style={styles.balanceAmount}>
                {formatAmount(user?.balance?.available ?? 0)}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Pending */}
            <View style={styles.balanceInfoBox}>
              <Text style={styles.pendingLabel}>Pending Withrawal</Text>

              <Text style={styles.balanceAmount}>
                {formatAmount(user?.balance?.pending ?? 0)}
              </Text>
            </View>
          </View>

          {/* Transaction Link */}
          <TouchableOpacity
            onPress={() => router.push("/(user)/payout")}
            style={styles.transactionButton}
          >
            <Text style={styles.transactionText}>My Transactions</Text>

            <Ionicons name="chevron-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* ================= BEST DEALS ================= */}
        <BestDealsScreen />

        {/* ================= EXTRA SERVICES ================= */}
        <ExtrasServices />

        {/* ================= RECENT ACTIVITIES ================= */}
        <RecentActivities
          payouts={payouts}
          giftCodes={giftCodes}
          loading={activitiesLoading}
        />
      </ScrollView>

      {/* ================= FAB ================= */}
      {shouldShowFab && (
        <Portal>
          <FAB.Group
            open={open}
            visible
            icon={open ? "close" : "apps"}
            backdropColor="rgba(0,0,0,0.3)"
            fabStyle={styles.mainFab}
            color="white"
            actions={[
              {
                icon: "cash",
                label: "Sell Code",
                onPress: () => router.push("/(user)/sell-code"),
                style: styles.actionFab,
                labelStyle: styles.fabLabel,
              },

              {
                icon: "file-document",
                label: "Codes",
                onPress: () => router.push("/(user)/codes"),
                style: styles.actionFab,
                labelStyle: styles.fabLabel,
              },

              {
                icon: "wallet",
                label: "Payout",
                onPress: () => router.push("/(user)/payout"),
                style: styles.actionFab,
                labelStyle: styles.fabLabel,
              },
            ]}
            onStateChange={({ open }) => setOpen(open)}
          />
        </Portal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 120,
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  greeting: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 4,
  },

  userName: {
    maxWidth: 220,
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  /* ================= AVATAR ================= */

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: THEME,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "white",
    shadowColor: THEME,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
  },

  /* ================= BALANCE CARD ================= */

  balanceCard: {
    backgroundColor: THEME,
    borderRadius: 28,
    padding: 22,
    marginBottom: 60,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },

  balanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  balanceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  totalBalanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "600",
  },

  eyeButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 14,
  },

  mainBalance: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 26,
  },

  bottomBalanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceInfoBox: {
    flex: 1,
  },

  availableLabel: {
    color: "#BBF7D0",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  pendingLabel: {
    color: "#FED7AA",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },

  balanceAmount: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },

  divider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 20,
  },

  transactionButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },

  transactionText: {
    color: "white",
    fontWeight: "700",
    marginRight: 4,
  },

  /* ================= FAB ================= */

  mainFab: {
    backgroundColor: "#E50914",
  },

  actionFab: {
    backgroundColor: "#E50914",
  },

  fabLabel: {
    backgroundColor: "#111827",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 14,
  },
});
