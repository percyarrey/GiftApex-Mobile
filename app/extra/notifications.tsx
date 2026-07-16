import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";

const PRIMARY = "rgb(1,107,1)";

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/notifications`;

type NotificationType =
  | "order"
  | "payout"
  | "transaction"
  | "promotion"
  | "security"
  | "system"
  | "verification"
  | "announcement";

type Notification = {
  _id: string;

  title: string;

  message: string;

  type: NotificationType;

  isRead: boolean;

  createdAt: string;
  referenceId?: string;
  referenceModel?: string;
};

// ================= TYPE THEMES =================

const TYPE_THEME: any = {
  order: {
    icon: "cube-outline",
    color: "#2563EB",
    bg: "#DBEAFE",
  },

  payout: {
    icon: "cash-outline",
    color: "#059669",
    bg: "#D1FAE5",
  },

  transaction: {
    icon: "card-outline",
    color: "#7C3AED",
    bg: "#EDE9FE",
  },

  promotion: {
    icon: "gift-outline",
    color: "#DB2777",
    bg: "#FCE7F3",
  },

  security: {
    icon: "shield-checkmark-outline",
    color: "#DC2626",
    bg: "#FEE2E2",
  },

  system: {
    icon: "settings-outline",
    color: "#475569",
    bg: "#E2E8F0",
  },

  verification: {
    icon: "checkmark-circle-outline",
    color: "#16A34A",
    bg: "#DCFCE7",
  },

  announcement: {
    icon: "megaphone-outline",
    color: "#EA580C",
    bg: "#FFEDD5",
  },
};

function timeAgo(date: string) {
  const now = new Date();

  const past = new Date(date);

  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";

  if (days < 7) return `${days} days ago`;

  return past.toLocaleDateString();
}

export default function NotificationsScreen() {
  const user = useAuthStore((state) => state.user);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const fetchNotifications = async (refresh = false) => {
    try {
      if (loading) return;

      setLoading(true);

      const currentPage = refresh ? 1 : page;

      const response = await fetch(`${API_URL}?page=${currentPage}&limit=20`, {
        headers: {
          "x-user-email": user?.email || "",
        },
      });

      const data = await response.json();

      if (data.success) {
        const newNotifications = data.notifications.filter(
          (item: Notification, index: number, array: Notification[]) =>
            array.findIndex((x) => x._id === item._id) === index,
        );

        if (refresh) {
          setNotifications(newNotifications);

          setPage(2);
        } else {
          setNotifications((prev) => {
            const merged = [...prev, ...newNotifications];

            // remove duplicates
            return merged.filter(
              (item, index, self) =>
                self.findIndex((x) => x._id === item._id) === index,
            );
          });

          setPage((prev) => prev + 1);
        }

        setHasMore(currentPage < data.pagination.pages);
      }
    } catch (error) {
      console.log("Notification error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    await fetchNotifications(true);

    setRefreshing(false);
  }, []);

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((item) => !item.isRead)
      : notifications;

  const openNotification = async (item: Notification) => {
    try {
      await fetch(API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          id: item._id,
        }),
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === item._id
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );

      switch (item.referenceModel) {
        case "Payout":
          router.push({
            pathname: "/payout-detail/[id]",
            params: {
              id: String(item.referenceId),
            },
          });
          break;

        case "GiftCode":
          router.push({
            pathname: "/code-details/[id]",
            params: {
              id: String(item.referenceId),
            },
          });
          break;

        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const theme = TYPE_THEME[item.type] || TYPE_THEME.system;

    return (
      <Pressable
        onPress={() => openNotification(item)}
        style={{
          backgroundColor: "#fff",

          marginHorizontal: 16,

          marginVertical: 3,

          padding: 16,

          borderRadius: 10,

          flexDirection: "row",

          elevation: 2,
        }}
      >
        {!item.isRead && (
          <View
            style={{
              width: 10,

              height: 10,

              borderRadius: 20,

              backgroundColor: PRIMARY,

              marginRight: 10,

              marginTop: 20,
            }}
          />
        )}

        <View
          style={{
            width: 60,

            height: 60,

            borderRadius: 18,

            backgroundColor: theme.bg,

            justifyContent: "center",

            alignItems: "center",
          }}
        >
          <Ionicons name={theme.icon} size={35} color={theme.color} />
        </View>

        <View
          style={{
            flex: 1,

            marginLeft: 14,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 16,

                fontWeight: "700",

                flex: 1,
              }}
            >
              {item.title}
            </Text>
          </View>

          <Text
            style={{
              color: "#555",

              marginTop: 6,
            }}
          >
            {item.message}
          </Text>

          <View
            style={{
              alignSelf: "flex-start",

              marginTop: 10,

              paddingHorizontal: 12,

              paddingVertical: 5,

              borderRadius: 20,

              backgroundColor: theme.bg,
            }}
          >
            <Text
              style={{
                color: theme.color,

                fontWeight: "700",

                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {item.type}
            </Text>
          </View>
        </View>
        <View>
          <Text
            style={{
              fontSize: 12,

              color: "#777",

              marginLeft: 10,
              marginTop: 6,
            }}
          >
            {timeAgo(item.createdAt)}
          </Text>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F7F8FC",
      }}
    >
      <View
        style={{
          padding: 20,
          paddingTop: 0,
        }}
      >
        <View>
          <Text className=" text-gray-400 ">Filter by</Text>
        </View>
        <View
          style={{
            flexDirection: "row",

            backgroundColor: "#E5E7EB",

            borderRadius: 15,

            padding: 5,
          }}
        >
          {["all", "unread"].map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item as any)}
              style={{
                flex: 1,

                padding: 12,

                borderRadius: 12,

                backgroundColor: filter === item ? PRIMARY : "transparent",
              }}
            >
              <Text
                style={{
                  textAlign: "center",

                  fontWeight: "700",

                  color: filter === item ? "#fff" : "#333",
                }}
              >
                {item === "all" ? "All" : "Unread"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            fetchNotifications();
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={PRIMARY} />
          ) : (
            <Text
              style={{
                textAlign: "center",

                marginTop: 50,

                fontSize: 18,

                color: "#777",
              }}
            >
              No notifications found
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}
