// app/(admin)/_layout.tsx

import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useNavigation, useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

/* =========================================================
   THEME COLORS
========================================================= */

const PRIMARY = "rgb(1, 107, 1)";
const PRIMARY_DARK = "rgb(0, 85, 0)";

/* =========================================================
   HEADER RIGHT
========================================================= */

function HeaderRight({ recentRequestCount }: { recentRequestCount: number }) {
  const router = useRouter();

  return (
    <View style={styles.headerRightContainer}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/(admin)/recent-requests")}
        style={styles.headerIcon}
      >
        <Ionicons name="time-outline" size={22} color="#FFFFFF" />
        {recentRequestCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{recentRequestCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/(support)/messages")}
        style={styles.headerIcon}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={22}
          color="#FFFFFF"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>5</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
   CUSTOM DRAWER
========================================================= */

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const firstLetter = (user?.name || "A").charAt(0).toUpperCase();

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView
        {...props}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 50, paddingBottom: 20 }}
      >
        {/* PROFILE */}
        <View style={styles.profileWrapper}>
          <View style={styles.profileSection}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{firstLetter}</Text>
              </View>
            )}

            <Text numberOfLines={1} style={styles.userName}>
              {user?.name || "Admin User"}
            </Text>

            <Text numberOfLines={1} style={styles.userEmail}>
              {user?.email || "No email"}
            </Text>

            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.adminBadgeText}>Administrator</Text>
            </View>
          </View>
        </View>

        {/* DRAWER ITEMS */}
        <View style={styles.drawerItemsContainer}>
          <DrawerItemList {...props} />
        </View>

        <View style={styles.divider} />

        {/* QUICK ACCESS */}
        <Text style={styles.sectionTitle}>QUICK ACCESS</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.customItem}
          onPress={() => router.replace("/(user)")}
        >
          <View style={styles.customItemLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={20} color={PRIMARY} />
            </View>
            <Text style={styles.customItemText}>Return to User Side</Text>
          </View>

          <Ionicons
            name="chevron-forward-outline"
            size={18}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* LOGOUT */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.logoutButton}
        onPress={() => {
          Alert.alert("Confirm Logout", "Do you wish to logout?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Logout",
              style: "destructive",
              onPress: async () => {
                await logout();
                router.push("/auth/login");
              },
            },
          ]);
        }}
      >
        <Ionicons name="log-out-outline" size={22} color="#FCA5A5" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
   MAIN LAYOUT
========================================================= */

export default function AdminLayout() {
  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;
  const { user } = useAuthStore();

  const [recentRequestCount, setRecentRequestCount] = useState(0);
  const [payoutRequestCount, setPayoutRequestCount] = useState(0);
  const segments = useSegments();

  const currentPage = segments[segments.length - 1];
  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();

      setRecentRequestCount(data.recentRequest || 0);
      setPayoutRequestCount(data.payoutRequest || 0);
    } catch (e) {
      console.log("Dashboard fetch error:", e);
    }
  };

  const navigation = useNavigation();

  useEffect(() => {
    const parent = navigation.getParent();

    if (!parent) return;

    const unsubscribe = parent.addListener("state", () => {
      fetchDashboard();
    });

    return unsubscribe;
  }, [navigation]);

  const pageTitles: Record<string, string> = {
    index: "Dashboard",
    "recent-requests": "Recent Requests",
    "payout-requests": "Payout Requests",
    users: "Users List",
    "price-list": "Price Lists",
  };

  const currentTitle = pageTitles[currentPage] || "GiftApex Management";
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: PRIMARY },
          headerTintColor: "#fff",
          sceneStyle: { backgroundColor: "#F4FFF4" },
          drawerStyle: {
            backgroundColor: PRIMARY,
            width: 300,
          },
          overlayColor: "rgba(0,0,0,0.45)",
          drawerActiveTintColor: "#fff",
          drawerInactiveTintColor: "rgba(255,255,255,0.75)",
          drawerActiveBackgroundColor: "rgba(255,255,255,0.16)",
          headerRight: () => (
            <HeaderRight recentRequestCount={recentRequestCount} />
          ),
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerLogo}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={PRIMARY}
                />
              </View>

              <View>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <Text style={styles.headerSubtitle}>{currentTitle}</Text>
              </View>
            </View>
          ),
        }}
      >
        {/* DASHBOARD */}
        <Drawer.Screen
          name="index"
          options={{
            title: "Dashboard",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />

        {/* RECENT REQUESTS */}
        <Drawer.Screen
          name="recent-requests"
          options={{
            title: "Recent Requests",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
            drawerLabel: ({ color }) => (
              <View style={badgeStyles.labelRow}>
                <Text style={[badgeStyles.labelText, { color }]}>
                  Recent Requests
                </Text>

                {recentRequestCount > 0 && (
                  <View style={badgeStyles.badge}>
                    <Text style={badgeStyles.badgeText}>
                      {recentRequestCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />

        {/* PAYOUT REQUESTS */}
        <Drawer.Screen
          name="payout-requests"
          options={{
            title: "Payout Requests",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
            drawerLabel: ({ color }) => (
              <View style={badgeStyles.labelRow}>
                <Text style={[badgeStyles.labelText, { color }]}>
                  Payout Requests
                </Text>

                {payoutRequestCount > 0 && (
                  <View style={badgeStyles.badge}>
                    <Text style={badgeStyles.badgeText}>
                      {payoutRequestCount}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />

        {/* USERS */}
        <Drawer.Screen
          name="users"
          options={{
            title: "Users",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />

        {/* PRICE LIST */}
        <Drawer.Screen
          name="price-list"
          options={{
            title: "Price List",
            drawerIcon: ({ color, size }) => (
              <Ionicons name="pricetags-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: PRIMARY },

  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    gap: 12,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 99,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  profileWrapper: { paddingHorizontal: 8 },

  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: PRIMARY_DARK,
  },

  profileImage: { width: 84, height: 84, borderRadius: 999 },

  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  avatarText: { fontSize: 30, fontWeight: "700", color: PRIMARY },

  userName: { marginTop: 12, color: "#fff", fontSize: 20, fontWeight: "700" },

  userEmail: { color: "rgba(255,255,255,0.8)", fontSize: 13 },

  adminBadge: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  adminBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  drawerItemsContainer: { marginTop: 24, paddingHorizontal: 10 },

  divider: {
    height: 1,
    marginVertical: 20,
    marginHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  sectionTitle: {
    marginHorizontal: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
  },

  customItem: {
    marginHorizontal: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  customItemLeft: { flexDirection: "row", gap: 12, alignItems: "center" },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },

  customItemText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    margin: 16,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  logoutText: { color: "#FCA5A5", fontSize: 16, fontWeight: "700" },

  headerTitleContainer: { flexDirection: "row", gap: 10, alignItems: "center" },

  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  headerSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 11 },
});

/* =========================================================
   BADGE STYLES (DRAWER LABEL)
========================================================= */

const badgeStyles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },

  labelText: {
    fontSize: 15,
    fontWeight: "600",
  },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    marginLeft: 8,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
