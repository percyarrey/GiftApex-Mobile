import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Dialog,
  Portal,
  RadioButton,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";

const PRIMARY = "rgb(1, 107, 1)";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isBlock: boolean;
  isVerified: boolean;
}

export default function UsersScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | "admin" | "user">("");

  // modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockDialog, setBlockDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [tempRole, setTempRole] = useState<"admin" | "user">("user");

  const buildUrl = (p: number) => {
    const params = new URLSearchParams({
      page: p.toString(),
      limit: "10",
      search: search.trim(),
      role,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    return `${API_URL}/api/admin/users?${params.toString()}`;
  };

  const fetchUsers = async (p = 1, mode: "replace" | "append" = "replace") => {
    try {
      if (mode === "replace") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetch(buildUrl(p), {
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();

      if (mode === "replace") {
        setUsers(data.users);
      } else {
        setUsers((prev) => [...prev, ...data.users]);
      }

      setPage(data.page);
      setLastPage(data.lastPage);
      setHasMore(data.page < data.lastPage);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // debounce search
  useEffect(() => {
    setPage(1);
    setHasMore(true);

    const timer = setTimeout(() => {
      fetchUsers(1, "replace");
    }, 400);

    return () => clearTimeout(timer);
  }, [search, role]);

  useEffect(() => {
    fetchUsers(1, "replace");
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers(1, "replace");
    setRefreshing(false);
  };

  const loadMore = () => {
    if (loading || loadingMore) return;

    if (!hasMore) return;

    if (page >= lastPage) return;

    fetchUsers(page + 1, "append");
  };
  // ================= ACTIONS =================

  const confirmBlock = async () => {
    if (!selectedUser) return;

    await fetch(`${API_URL}/api/admin/users/${selectedUser._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user?.email || "",
      },
      body: JSON.stringify({
        action: "block",
        isBlock: !selectedUser.isBlock,
      }),
    });

    await fetchUsers(1, "replace");
    setBlockDialog(false);
    Toast.show({
      type: "success",
      text1: "User updated succesfully",
    });
  };

  const confirmRole = async () => {
    if (!selectedUser) return;

    await fetch(`${API_URL}/api/admin/users/${selectedUser._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user?.email || "",
      },
      body: JSON.stringify({
        action: "role",
        role: tempRole,
      }),
    });

    await fetchUsers(1, "replace");
    setBlockDialog(false);
    Toast.show({
      type: "success",
      text1: "User updated succesfully",
    });

    setRoleDialog(false);
  };

  // ================= UI =================

  const renderItem = useCallback(({ item }: { item: User }) => {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.roleContainer}>
            <Ionicons
              name={
                item.role === "admin" ? "shield-checkmark" : "person-circle"
              }
              size={18}
              color={item.role === "admin" ? "#f59e0b" : PRIMARY}
            />

            <Text style={styles.role}>
              {item.role === "admin" ? "Admin" : "User"}
            </Text>
          </View>
        </View>

        <View className=" mb-4" style={styles.email}>
          <Text>
            {item.isVerified ? (
              <Ionicons name="checkmark-circle" color="green" size={18} />
            ) : (
              <Ionicons name="close-circle" color="red" size={18} />
            )}
          </Text>
          <Text>{item.email}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            await Clipboard.setStringAsync(item._id);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 3,
          }}
        >
          <Text>
            User ID: <Text>{item._id}</Text>
          </Text>

          <Ionicons name="copy-outline" size={16} color="green" />
        </TouchableOpacity>
        <Text>
          Status:{" "}
          <Text style={[styles.status, item.isBlock && { color: "red" }]}>
            {item.isBlock ? "Blocked" : "Active"}
          </Text>
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.btn,
              { borderColor: item.isBlock ? "green" : "red" },
            ]}
            onPress={() => {
              setSelectedUser(item);
              setBlockDialog(true);
            }}
          >
            <Text style={{ color: item.isBlock ? "green" : "red" }}>
              {item.isBlock ? "Unblock" : "Block"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, { borderColor: PRIMARY }]}
            onPress={() => {
              setSelectedUser(item);
              setTempRole(item.role);
              setRoleDialog(true);
            }}
          >
            <Text style={{ color: PRIMARY }}>Change Role</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <TextInput
          mode="outlined"
          label="Search Users"
          placeholder="Name, email or User ID"
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

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filter by Role</Text>

          <View style={styles.filterRow}>
            {[
              {
                label: "All",
                value: "",
                icon: "people-outline",
              },
              {
                label: "Admins",
                value: "admin",
                icon: "shield-checkmark",
              },
              {
                label: "Users",
                value: "user",
                icon: "person-outline",
              },
            ].map((item) => {
              const active = role === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.roleChip, active && styles.roleChipActive]}
                  onPress={() => setRole(item.value as any)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={active ? "#fff" : PRIMARY}
                  />

                  <Text
                    style={[
                      styles.roleChipText,
                      active && styles.roleChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={PRIMARY} /> : null
          }
        />
      )}

      {/* BLOCK DIALOG */}
      <Portal>
        <Dialog visible={blockDialog} onDismiss={() => setBlockDialog(false)}>
          <Dialog.Title>Confirm Action</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to{" "}
              <Text
                style={{
                  color: selectedUser?.isBlock ? "green" : "red",
                  fontWeight: "700",
                }}
              >
                {selectedUser?.isBlock ? "unblock" : "block"}
              </Text>{" "}
              this user?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBlockDialog(false)}>Cancel</Button>
            <Button onPress={confirmBlock}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>

        {/* ROLE DIALOG */}
        <Dialog visible={roleDialog} onDismiss={() => setRoleDialog(false)}>
          <Dialog.Title>Change Role</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(v) => setTempRole(v as any)}
              value={tempRole}
            >
              <RadioButton.Item label="Admin" value="admin" />
              <RadioButton.Item label="User" value="user" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRoleDialog(false)}>Cancel</Button>
            <Button onPress={confirmRole}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

// ================= STYLES =================

const styles = StyleSheet.create({
  search: {
    backgroundColor: "white",
    marginBottom: 10,
  },
  /* filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  }, */
  chip: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  activeChip: {
    backgroundColor: "#e0ffe0",
  },
  card: {
    padding: 12,
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: { fontSize: 16, fontWeight: "700" },
  email: {
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexDirection: "row",
  },
  status: { marginTop: 4, color: PRIMARY },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  btn: {
    borderWidth: 1,
    padding: 6,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  searchContainer: {
    marginBottom: 16,
  },

  searchInput: {
    backgroundColor: "#fff",
  },

  filterCard: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  filterTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    fontWeight: "600",
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: PRIMARY,

    borderRadius: 12,

    paddingVertical: 10,
    paddingHorizontal: 14,

    flex: 1,
    marginHorizontal: 4,
  },

  roleChipActive: {
    backgroundColor: PRIMARY,
  },

  roleChipText: {
    marginLeft: 6,
    color: PRIMARY,
    fontWeight: "600",
  },

  roleChipTextActive: {
    color: "#fff",
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  role: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
