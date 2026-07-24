// app/(user)/index.tsx

import BestDealsScreen from "@/components/user/best-deals";
import ExtrasServices from "@/components/user/extra-services";
import RecentActivities from "@/components/user/recent-activities";
import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

type AnnouncementType = "text" | "image";

type Announcement = {
  _id: string;
  title?: string;
  message?: string;
  imageBase64?: string; // Base64 encoded image
  type: AnnouncementType;
  createdAt?: string;
  expiresAt?: string;
  duration?: number;
  priority?: "info" | "success" | "warning" | "important";
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselRef = useRef<FlatList<Announcement>>(null);
  const { width: screenWidth } = Dimensions.get("window");
  const CAROUSEL_WIDTH = screenWidth - 32; // 16px padding on each side
  const CAROUSEL_GAP = 12;

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

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mobile/announcements`, {
        headers: { "x-user-email": user?.email || "" },
      });
      const data = await response.json();

      if (response.ok) {
        setAnnouncements(
          Array.isArray(data) ? data : data.announcements || data.data || [],
        );
      }
    } catch (error) {
      console.log("Announcement fetch error:", error);
    }
  };
  // ================= LOAD ACTIVITIES =================
  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);

      await Promise.all([
        fetchPayouts(),
        fetchGiftCodes(),
        fetchAnnouncements(),
      ]);
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

  // ================= CAROUSEL AUTOPLAY =================
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % announcements.length;
        carouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 15000); // 4 seconds autoplay

    return () => clearInterval(interval);
  }, [announcements.length]);

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

        {/* ================= ANOUNCEMENT CARD ================= */}

        {announcements.length > 0 && (
          <View style={styles.announcementSection}>
            <View style={styles.announcementHeading}>
              <View style={styles.announcementHeadingIcon}>
                <Ionicons name="megaphone" size={18} color="#EA580C" />
              </View>
              <Text style={styles.announcementSectionTitle}>Announcements</Text>
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </View>

            {/* ================= CAROUSEL (FlatList horizontal) ================= */}
            <FlatList
              ref={carouselRef}
              data={announcements}
              keyExtractor={(item) => item._id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={CAROUSEL_WIDTH + CAROUSEL_GAP}
              decelerationRate="fast"
              snapToAlignment="start"
              contentContainerStyle={{ paddingRight: 16, gap: CAROUSEL_GAP }}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(
                event: NativeSyntheticEvent<NativeScrollEvent>,
              ) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x /
                    (CAROUSEL_WIDTH + CAROUSEL_GAP),
                );
                setActiveIndex(index);
              }}
              renderItem={({ item }) => {
                const isImage = item.type === "image";
                const important = item.priority === "important";

                if (isImage && item.imageBase64) {
                  // Full-width image card with base64 image
                  return (
                    <View style={{ width: CAROUSEL_WIDTH }}>
                      <Image
                        source={{
                          uri: `data:image/jpeg;base64,${item.imageBase64}`,
                        }}
                        style={styles.carouselImage}
                        resizeMode="cover"
                      />
                    </View>
                  );
                }

                // Text card - improved design with better centering
                return (
                  <View style={{ width: CAROUSEL_WIDTH }}>
                    <View
                      style={[
                        styles.announcementCard,
                        important && styles.announcementCardImportant,
                      ]}
                    >
                      <View
                        style={[
                          styles.announcementIcon,
                          important && styles.announcementIconImportant,
                        ]}
                      >
                        <Ionicons
                          name={
                            important ? "alert-circle" : "megaphone-outline"
                          }
                          size={28}
                          color={important ? "#DC2626" : "#EA580C"}
                        />
                      </View>
                      <View style={styles.announcementContent}>
                        <Text
                          style={styles.announcementTitle}
                          numberOfLines={2}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={styles.announcementMessage}
                          numberOfLines={3}
                        >
                          {item.message}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {/* ================= PAGINATION DOTS ================= */}
            {announcements.length > 1 && (
              <View style={styles.paginationDots}>
                {announcements.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      carouselRef.current?.scrollToIndex({ index });
                      setActiveIndex(index);
                    }}
                    style={[
                      styles.dot,
                      activeIndex === index && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
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

  announcementSection: {
    marginBottom: 22,
  },

  announcementHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  announcementHeadingIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    marginRight: 9,
  },

  announcementSectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
  },

  livePill: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  livePillText: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  announcementCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    gap: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FED7AA",
    shadowColor: "#EA580C",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 180,
  },

  announcementCardImportant: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF9F9",
  },

  announcementIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
    marginBottom: 14,
  },

  announcementIconImportant: { backgroundColor: "#FEF2F2" },

  announcementContent: { flex: 1, width: "100%", height: "100%" },
  announcementTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  announcementMessage: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 21,
  },

  carouselImage: {
    width: "100%",
    height: 190,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },

  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },

  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: "#EA580C",
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
