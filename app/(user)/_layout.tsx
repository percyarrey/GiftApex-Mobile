// app/(user)/_layout.tsx

import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React from "react";
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
import Toast from "react-native-toast-message";

/* ================= HEADER RIGHT ================= */
function HeaderRight() {
  const router = useRouter();

  return (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        onPress={() => router.push("/extra/support")}
        style={styles.iconWrapper}
      >
        <Ionicons name="headset-outline" size={24} color="black" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/extra/notifications")}
        style={styles.iconWrapper}
      >
        <Ionicons name="notifications-outline" size={24} color="black" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>5</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ================= CUSTOM DRAWER ================= */
function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const firstLetter = (user?.name || "U").charAt(0).toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <DrawerContentScrollView {...props}>
        {/* USER SECTION */}
        <View style={styles.userContainer}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.profileImage} />
          ) : (
            <View style={styles.fallbackAvatar}>
              <Text style={styles.fallbackText}>{firstLetter}</Text>
            </View>
          )}

          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userEmail}>{user?.email || "No email"}</Text>
        </View>

        {/* MAIN DRAWER ITEMS */}
        <DrawerItemList {...props} />
        {/* ================= ADMIN ================= */}
        {user?.role === "admin" && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>ADMIN PANEL</Text>

            <TouchableOpacity
              style={styles.extraItem}
              onPress={() => router.replace("/(admin)")}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="rgb(1, 107, 1)"
              />
              <Text style={styles.extraText}>Dashboard</Text>
            </TouchableOpacity>
          </>
        )}

        {/* <TouchableOpacity
          style={styles.extraItem}
          onPress={() => router.push("/(admin)/recent-requests")}
        >
          <Ionicons name="time-outline" size={20} color="#1E88E5" />
          <Text style={styles.extraText}>Recent Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.extraItem}
          onPress={() => router.push("/(admin)/payout-requests")}
        >
          <Ionicons name="cash-outline" size={20} color="#1E88E5" />
          <Text style={styles.extraText}>Payout Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.extraItem}
          onPress={() => router.push("/(admin)/users")}
        >
          <Ionicons name="people-outline" size={20} color="#1E88E5" />
          <Text style={styles.extraText}>Users</Text>
        </TouchableOpacity> */}

        {/* ================= EXTRAS ================= */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>EXTRAS</Text>

        <TouchableOpacity
          style={styles.extraItem}
          onPress={() => router.push("/extra/faq")}
        >
          <Ionicons name="help-circle-outline" size={20} color="#333" />
          <Text style={styles.extraText}>FAQ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.extraItem}
          onPress={() => router.push("/extra/support")}
        >
          <Ionicons name="chatbox-outline" size={20} color="#333" />
          <Text style={styles.extraText}>Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.extraItem}
          onPress={() => router.push("/extra/notifications")}
        >
          <Ionicons name="notifications-outline" size={20} color="#333" />
          <Text style={styles.extraText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.extraItem}
          onPress={() => router.push("/extra/settings")}
        >
          <Ionicons name="settings-outline" size={20} color="#333" />
          <Text style={styles.extraText}>Settings</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutContainer}
        onPress={() => {
          Alert.alert(
            "Confirm Logout",
            "Do you wish to logout?",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                  await logout();
                  router.push("/auth/login");
                },
              },
            ],
            { cancelable: true },
          );
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="red" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= MAIN LAYOUT ================= */
export default function UserLayout() {
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => {
            // Routes you DON'T want in drawer
            const Routes = ["index", "sell-code", "codes", "payout"];

            return <CustomDrawerContent {...props} />;
          }}
          screenOptions={{
            drawerActiveTintColor: "#00C853",
            drawerInactiveTintColor: "#222",
            headerTintColor: "green",
            drawerStyle: {
              backgroundColor: "#F3F4F6",
              width: 280,
            },
            headerRight: () => <HeaderRight />,

            headerTitle: () => (
              <View style={styles.headerTitleContainer}>
                <Image
                  source={require("@/assets/images/splash-icon.png")}
                  style={styles.logo}
                />
                <Text style={styles.headerTitle}>GiftApex</Text>
              </View>
            ),
          }}
        >
          <Drawer.Screen
            name="index"
            options={{
              title: "Home",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="sell-code"
            options={{
              title: "Sell Code",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="cash-outline" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="codes"
            options={{
              title: "Codes",
              drawerIcon: ({ color, size }) => (
                <Ionicons
                  name="document-text-outline"
                  size={size}
                  color={color}
                />
              ),
            }}
          />

          <Drawer.Screen
            name="payout"
            options={{
              title: "Payout",
              drawerIcon: ({ color, size }) => (
                <Ionicons name="wallet-outline" size={size} color={color} />
              ),
            }}
          />
          {/* <Drawer.Screen
            name="code-details"
            options={{
              drawerItemStyle: { display: "none" }, // Hides from drawer
            }}
          /> */}
        </Drawer>
      </GestureHandlerRootView>
      <Toast />
    </>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginRight: 15,
  },

  iconWrapper: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "red",
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },

  userContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
    alignItems: "center",
  },

  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 999,
    marginBottom: 10,
  },

  fallbackAvatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: "#00C853",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  fallbackText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },

  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },

  userEmail: {
    fontSize: 13,
    color: "gray",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
    marginHorizontal: 15,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "gray",
    marginLeft: 20,
    marginBottom: 10,
  },

  extraItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 10,
  },

  extraText: {
    fontSize: 15,
    color: "#333",
  },

  logoutContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    gap: 10,
  },

  logoutText: {
    marginStart: 10,
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  logo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "green",
  },
});
