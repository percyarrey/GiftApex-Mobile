import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Menu, TextInput } from "react-native-paper";

const PRIMARY = "rgb(1,107,1)";

interface PayoutRequest {
  _id: string;
  user: {
    name: string;
    email: string;
  };

  status: "pending" | "completed" | "rejected";
  amount: number;
  new: boolean;

  method:
    | "Orange Money"
    | "MTN Mobile Money"
    | "Binance ID"
    | "USDT TRC20"
    | "BNB Smart Chain (BEP20)"
    | "Bank Transfer";

  accountDetails: {
    mobileNumber?: string;
    accountName?: string;
    binanceId?: string;
    usdtTrc20Address?: string;
    bnbAddress?: string;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    iban?: string;
  };

  createdAt: string;
}

export default function PayoutRequestsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useAuthStore();

  const router = useRouter();

  const [requests, setRequests] = useState<PayoutRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");

  const [onlyNew, setOnlyNew] = useState(false);

  const [statusMenu, setStatusMenu] = useState(false);
  const [methodMenu, setMethodMenu] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      try {
        setError(null);

        if (mode === "append") setLoadingMore(true);
        else setLoading(true);

        const res = await fetch(
          `${API_URL}/api/admin/payout-requests?page=${targetPage}&limit=${limit}&search=${search}&status=${status}&method=${method}&new=${onlyNew}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-user-email": user?.email || "",
            },
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await res.json();

        if (mode === "replace") {
          setRequests(data.requests);
        } else {
          setRequests((prev) => [...prev, ...data.requests]);
        }

        setHasMore(data.requests.length === limit);
        setPage(targetPage);
      } catch (err: any) {
        console.log("Fetch error:", err.message);

        setError("No internet connection or server error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [API_URL, limit, method, onlyNew, search, status, user?.email],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      fetchRequests(1, "replace");
    }, 400);
    fetchRequests(1, "replace");
    return () => clearTimeout(t);
  }, [fetchRequests]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests(1, "replace");
    }, [fetchRequests]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests(1, "replace");
    setRefreshing(false);
  };

  const loadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    fetchRequests(page + 1, "append");
  };

  const Chip = ({ text, onRemove }: { text: string; onRemove: () => void }) => (
    <View style={styles.chip}>
      <Text>{text}</Text>

      <TouchableOpacity onPress={onRemove}>
        <Ionicons name="close-circle" size={16} color={PRIMARY} />
      </TouchableOpacity>
    </View>
  );

  const Card = memo(({ item }: { item: PayoutRequest }) => (
    <View style={styles.card}>
      {item.new && (
        <View style={styles.badge}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>NEW</Text>
        </View>
      )}

      <Text style={styles.name}>{item.user.name}</Text>
      <Text className=" text-gray-800">{item.user.email}</Text>

      <Text className=" text-gray-600" style={{ marginTop: 8 }}>
        💰 ${item.amount.toFixed(2)}
      </Text>

      <Text className=" text-gray-600">💳 {item.method}</Text>

      <Text className=" font-bold">
        <Text className=" text-gray-600"> Status: </Text>

        <Text
          className={
            item.status === "pending"
              ? " text-yellow-500"
              : item.status === "completed"
                ? " text-green-500"
                : "text-red-500"
          }
          style={{ textTransform: "capitalize" }}
        >
          {item.status}
        </Text>
      </Text>

      {item.method === "Orange Money" || item.method === "MTN Mobile Money" ? (
        <>
          <Text>📱 {item.accountDetails.mobileNumber}</Text>
          <Text>👤 {item.accountDetails.accountName}</Text>
        </>
      ) : null}

      {item.method === "Binance ID" ? (
        <Text>🟡 {item.accountDetails.binanceId}</Text>
      ) : null}

      {item.method === "BNB Smart Chain (BEP20)" ? (
        <Text>{item.accountDetails.bnbAddress}</Text>
      ) : null}

      {item.method === "USDT TRC20" ? (
        <Text>🟡 {item.accountDetails.usdtTrc20Address}</Text>
      ) : null}

      {item.method === "Bank Transfer" ? (
        <>
          <Text>{item.accountDetails.bankName}</Text>
          <Text>{item.accountDetails.accountNumber}</Text>
          <Text>{item.accountDetails.accountName}</Text>
        </>
      ) : null}

      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={async () => {
            try {
              await fetch(`${API_URL}/api/admin/payout-requests`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-email": user?.email || "",
                },
                body: JSON.stringify({
                  id: item._id,
                  new: true,
                  action: "markasread",
                }), // Send the new request data
              });
              fetchRequests(1, "replace");
            } catch (error) {
              console.log(error);
            }
          }}
          style={[styles.btn, { borderColor: item.new ? "orange" : "green" }]}
        >
          <Ionicons
            name={item.new ? "checkmark-done" : "refresh-outline"}
            size={18}
            color={item.new ? "orange" : "green"}
          />

          <Text
            style={{
              color: item.new ? "orange" : "green",
              marginLeft: 6,
              fontWeight: "600",
            }}
          >
            Mark as {item.new ? "Read" : "Unread"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            if (item.new) {
              await fetch(`${API_URL}/api/admin/payout-requests`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-email": user?.email || "",
                },
                body: JSON.stringify({
                  id: item._id,
                  action: "markasread",
                }), // Send the new request data
              });
            }
            router.push({
              pathname: "/payout-detail/[id]",
              params: {
                id: String(item._id),
              },
            });
          }}
          style={[styles.approve, { borderColor: PRIMARY }]}
        >
          <Ionicons name="eye-outline" size={18} color={PRIMARY} />
          <Text style={{ color: PRIMARY, marginLeft: 6, fontWeight: "600" }}>
            View details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ));

  Card.displayName = "PayoutRequestCard";

  return (
    <>
      <View style={{ padding: 10 }}>
        <TextInput
          mode="outlined"
          label="Search Payout"
          placeholder="Name, email or ID"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          left={<TextInput.Icon icon="magnify" />}
          right={
            search ? (
              <TextInput.Icon icon="close" onPress={() => setSearch("")} />
            ) : undefined
          }
          style={styles.searchInput}
          outlineStyle={{
            borderRadius: 14,
          }}
        />

        <View style={styles.filters}>
          <Menu
            visible={statusMenu}
            onDismiss={() => setStatusMenu(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setStatusMenu(true)}
                style={styles.filterButton}
              >
                <Text>Status</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setStatus("");
                setStatusMenu(false);
              }}
              title="All"
            />
            <Menu.Item
              onPress={() => {
                setStatus("pending");
                setStatusMenu(false);
              }}
              title="Pending"
            />
            <Menu.Item
              onPress={() => {
                setStatus("completed");
                setStatusMenu(false);
              }}
              title="Completed"
            />
            <Menu.Item
              onPress={() => {
                setStatus("rejected");
                setStatusMenu(false);
              }}
              title="Rejected"
            />
          </Menu>

          <Menu
            visible={methodMenu}
            onDismiss={() => setMethodMenu(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setMethodMenu(true)}
                style={styles.filterButton}
              >
                <Text>Method</Text>
                <Ionicons name="chevron-down" size={16} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setMethod("");
                setMethodMenu(false);
              }}
              title="All"
            />
            <Menu.Item
              onPress={() => {
                setMethod("Orange Money");
                setMethodMenu(false);
              }}
              title="Orange Money"
            />
            <Menu.Item
              onPress={() => {
                setMethod("MTN Mobile Money");
                setMethodMenu(false);
              }}
              title="MTN Mobile Money"
            />
            <Menu.Item
              onPress={() => {
                setMethod("Binance ID");
                setMethodMenu(false);
              }}
              title="Binance ID"
            />
            <Menu.Item
              onPress={() => {
                setMethod("USDT TRC20");
                setMethodMenu(false);
              }}
              title="USDT TRC20"
            />
            <Menu.Item
              onPress={() => {
                setMethod("BNB Smart Chain (BEP20)");
                setMethodMenu(false);
              }}
              title="BNB Smart Chain"
            />
            <Menu.Item
              onPress={() => {
                setMethod("Bank Transfer");
                setMethodMenu(false);
              }}
              title="Bank Transfer"
            />
          </Menu>

          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: onlyNew ? "#ca8a04" : "#f3f4f6" }, // Yellow-600 : Gray-300
            ]}
            onPress={() => setOnlyNew((v) => !v)}
          >
            <Text style={{ color: onlyNew ? "white" : "black" }}>New</Text>
          </TouchableOpacity>

          {/* CLEAR */}
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setSearch("");
              setStatus("");
              setMethod("");
              setOnlyNew(false);
            }}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chips}>
          {status ? (
            <Chip text={`Status: ${status}`} onRemove={() => setStatus("")} />
          ) : null}

          {method ? (
            <Chip text={method} onRemove={() => setMethod("")} />
          ) : null}

          {onlyNew ? (
            <Chip text="New only" onRemove={() => setOnlyNew(false)} />
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={requests}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        renderItem={({ item }) => <Card item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={PRIMARY}
              style={{ marginTop: 40 }}
            />
          ) : (
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No payout requests found.
            </Text>
          )
        }
        ListFooterComponent={() => {
          if (loadingMore && requests.length > 0) {
            return (
              <View style={{ padding: 20 }}>
                <ActivityIndicator color={PRIMARY} />
              </View>
            );
          }

          if (!hasMore && requests.length > 0) {
            return (
              <Text style={{ textAlign: "center", padding: 12, color: "#888" }}>
                No more requests
              </Text>
            );
          }

          return null;
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 2,
  },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "orange",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  name: {
    fontWeight: "700",
    fontSize: 16,
  },

  date: {
    marginTop: 10,
    color: "#777",
    fontSize: 12,
  },

  reject: {
    borderWidth: 1,
    borderColor: "red",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  approve: {
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 2,
  },

  filters: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },

  filterButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  chip: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  /* ================= CLEAR BUTTON ================= */
  clearBtn: {
    marginLeft: "auto",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  clearText: {
    color: "red",
    fontWeight: "700",
    fontSize: 13,
  },
  btn: {
    flexDirection: "row",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 5,
  },
  searchInput: {
    backgroundColor: "white",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
});
