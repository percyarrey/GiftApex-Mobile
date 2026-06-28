import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Menu, TextInput } from "react-native-paper";

const PRIMARY = "rgb(1, 107, 1)";

interface Request {
  _id: string;
  user: { name: string; email: string };
  status: "pending" | "verified";
  codes: any[];
  new: boolean;
  currency: string;
  value: number;
  note?: string;
  createdAt: string;
}

export default function RecentRequestsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user } = useAuthStore();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ================= NEW FEATURES =================
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "pending" | "verified">("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [sortOption, setSortOption] = useState<"new" | "status" | "date">(
    "new",
  );
  const [statusMenu, setStatusMenu] = useState(false);
  const [sortMenu, setSortMenu] = useState(false);

  // ================= FETCH =================
  const fetchRequests = async (
    targetPage: number,
    mode: "replace" | "append",
  ) => {
    try {
      if (mode === "append") setLoadingMore(true);
      else if (mode === "replace" && targetPage === 1 && !refreshing)
        setLoading(true);

      const url = `${API_URL}/api/admin/recent-requests?page=${targetPage}&limit=${limit}&sort=${sortOption}&search=${search}&status=${status}&new=${onlyNew}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
      });

      const data = await res.json();

      if (mode === "replace") {
        setRequests(data.requests);
      } else {
        setRequests((prev) => [...prev, ...data.requests]);
      }

      setHasMore(data.requests.length === limit);
      setPage(targetPage);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRequests(1, "replace");
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, status, onlyNew, sortOption]);
  // ================= INITIAL LOAD =================
  useFocusEffect(
    useCallback(() => {
      fetchRequests(1, "replace");
    }, []),
  );

  // ================= REFRESH =================
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests(1, "replace");
    setRefreshing(false);
  };

  // ================= LOAD MORE (LOCKED) =================
  const loadMore = () => {
    if (loadingMore || loading || !hasMore) return;
    fetchRequests(page + 1, "append");
  };

  // ================= CARD =================
  const RequestCard = memo(({ item, router }: any) => {
    // ================= DELETE =================
    const handleDelete = (id: string) => {
      Alert.alert(
        "Mark Request",
        "Are you sure you want to Mark this request? ",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Mark",
            style: "destructive",
            onPress: async () => {
              try {
                await fetch(`${API_URL}/api/admin/recent-requests`, {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    "x-user-email": user?.email || "",
                  },
                  body: JSON.stringify({ id }),
                });

                await fetchRequests(1, "replace");
              } catch (err) {
                console.log(err);
              }
            },
          },
        ],
        { cancelable: true },
      );
    };
    return (
      <View style={styles.card}>
        {item.new && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}

        <Text style={styles.name}>👤 {item.user.name}</Text>
        <Text style={styles.email}>📧 {item.user.email}</Text>

        <Text style={styles.amount}>
          💰 {item.currency} (${item.value})
        </Text>

        <Text style={styles.status}>
          🟡 {item.status} ({item.codes.length})
        </Text>

        {item.note ? <Text style={styles.note}>📝 {item.note}</Text> : null}

        <Text style={styles.date}>
          🕒 {new Date(item.createdAt).toLocaleString()}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
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
              try {
                if (item.new) {
                  await fetch(`${API_URL}/api/admin/recent-requests`, {
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
                  pathname: "/code-details/[id]",
                  params: {
                    id: String(item._id),
                  },
                });
              } catch (error) {
                console.log(error);
              }
            }}
            style={[styles.btn, { borderColor: PRIMARY }]}
          >
            <Ionicons name="eye-outline" size={18} color={PRIMARY} />
            <Text style={{ color: PRIMARY, marginLeft: 6 }}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  });
  const renderChip = (label: string, onRemove: () => void) => (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons name="close-circle" size={16} color={PRIMARY} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <View style={styles.controlBar}>
        {/* ================= SEARCH ================= */}

        <TextInput
          mode="outlined"
          label="Search Request"
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

        {/* ================= FILTER ROW ================= */}
        <View style={styles.filterRow}>
          {/* STATUS DROPDOWN */}
          <Menu
            visible={statusMenu}
            onDismiss={() => setStatusMenu(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setStatusMenu(true)}
                style={styles.dropdownClean}
              >
                <Text style={styles.dropdownCleanText}>
                  Status: {status || "All"}
                </Text>

                <Ionicons name="chevron-down" size={16} color="#333" />
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
                setStatus("verified");
                setStatusMenu(false);
              }}
              title="Verified"
            />
          </Menu>

          {/* SORT DROPDOWN */}
          <Menu
            visible={sortMenu}
            onDismiss={() => setSortMenu(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setSortMenu(true)}
                style={styles.dropdownClean}
              >
                <Text style={styles.dropdownCleanText}>Sort: {sortOption}</Text>

                <Ionicons name="chevron-down" size={16} color="#333" />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortOption("new");
                setSortMenu(false);
              }}
              title="New"
            />
            <Menu.Item
              onPress={() => {
                setSortOption("date");
                setSortMenu(false);
              }}
              title="Date"
            />
            <Menu.Item
              onPress={() => {
                setSortOption("status");
                setSortMenu(false);
              }}
              title="Status"
            />
          </Menu>

          {/* NEW TOGGLE (YELLOW THEME) */}
          <TouchableOpacity
            onPress={() => setOnlyNew((v) => !v)}
            style={[styles.newBtn, onlyNew && styles.newBtnActive]}
          >
            <Text
              style={[styles.newBtnText, onlyNew && styles.newBtnTextActive]}
            >
              New
            </Text>
          </TouchableOpacity>

          {/* CLEAR */}
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setSearch("");
              setStatus("");
              setSortOption("new");
              setOnlyNew(false);
            }}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
        {/* ================= ACTIVE FILTER CHIPS ================= */}
        <View style={styles.activeFilters}>
          {status ? renderChip(`Status: ${status}`, () => setStatus("")) : null}

          {onlyNew ? renderChip("New only", () => setOnlyNew(false)) : null}

          {sortOption !== "new"
            ? renderChip(`Sort: ${sortOption}`, () => setSortOption("new"))
            : null}
        </View>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        renderItem={({ item }) => <RequestCard item={item} router={router} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={{ marginTop: 10 }}>Loading requests...</Text>
            </View>
          ) : (
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No requests found.
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

// ================= STYLES =================
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },

  newBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "orange",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  newText: {
    color: "white",
    fontWeight: "800",
    fontSize: 10,
  },

  name: { fontSize: 16, fontWeight: "800" },
  email: { color: "#666" },
  amount: { marginTop: 6, fontWeight: "700" },
  status: { marginTop: 4 },
  note: { marginTop: 6 },
  date: { marginTop: 6, fontSize: 12, color: "#888" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  btn: {
    flexDirection: "row",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  controlBar: {
    padding: 10,
    gap: 10,
  },

  searchInput: {
    backgroundColor: "white",
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },

  filterBtn: {
    borderRadius: 10,
  },

  activeFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },

  chip: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    display: "flex",
    flexDirection: "row",
  },

  chipText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: "600",
  },

  /* ================= DROPDOWN BUTTON ================= */
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  dropdownText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  /* ================= NEW BUTTON (YELLOW) ================= */
  newBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  newBtnActive: {
    backgroundColor: "#FBBF24", // yellow
  },

  newBtnText: {
    fontWeight: "700",
    color: "#111827",
  },

  newBtnTextActive: {
    color: "#111827",
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
  dropdownMenu: {
    position: "absolute",
    top: 45,
    left: 0,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 6,
    elevation: 5,
    zIndex: 999,
    width: 120,
  },

  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  dropdownClean: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#F3F4F6",
    borderRadius: 10,

    paddingHorizontal: 10, // minimal padding (clean look)
    paddingVertical: 6, // reduced height
  },

  dropdownCleanText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginRight: 6,
  },
});
