import { useAuthStore } from "@/store/useAuthStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const PRIMARY = "rgb(1, 107, 1)";
type Ticket = {
  _id: string;
  id?: string;
  subject: string;
  category: string;
  status: string;
  priority?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt?: string;
  unreadByUser?: boolean;
  unreadByAdmin?: boolean;
};
const statusColor = (s: string) =>
  ({
    Waiting: "#B45309",
    Open: "#1769AA",
    Resolved: "#16753A",
    Closed: "#667085",
  })[s] || "#667085";

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const isAdmin = user?.role === "admin";
  const load = useCallback(
    async (refresh = false) => {
      try {
        refresh ? setRefreshing(true) : setLoading(true);
        const query = new URLSearchParams({ page: "1", limit: "50" });
        if (search.trim()) query.set("search", search.trim());
        if (status !== "All") query.set("status", status);
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/support/tickets?${query}`,
          { headers: { "x-user-email": user?.email || "" } },
        );
        const data = await response.json();
        if (!response.ok || data.success === false)
          throw new Error(data.message || "Unable to load tickets");
        setTickets(data.tickets || data.data?.tickets || data.data || []);
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Could not load tickets",
          text2: error.message,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status, user?.email],
  );
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const renderTicket = ({ item }: { item: Ticket }) => {
    const unread = isAdmin ? item.unreadByAdmin : item.unreadByUser;
    const date = item.lastMessageAt || item.updatedAt;
    return (
      <>
        <TouchableOpacity
          style={[styles.card, unread && styles.unread]}
          onPress={() =>
            router.push({
              pathname: "/(support)/chat/[id]",
              params: { id: item._id || item.id!, subject: item.subject },
            })
          }
        >
          <View style={styles.cardHeader}>
            <Text numberOfLines={1} style={styles.subject}>
              {item.subject}
            </Text>
            {!!unread && <View style={styles.dot} />}
          </View>
          <View style={styles.meta}>
            <Text
              style={[
                styles.badge,
                {
                  color: statusColor(item.status),
                  backgroundColor: `${statusColor(item.status)}18`,
                },
              ]}
            >
              {item.status}
            </Text>
            <Text style={styles.category}>{item.category}</Text>
            {item.priority && (
              <Text style={styles.category}>{item.priority}</Text>
            )}
          </View>
          <Text numberOfLines={2} style={styles.preview}>
            {item.lastMessage || "No messages yet"}
          </Text>
          <Text style={styles.date}>
            {date ? new Date(date).toLocaleDateString() : ""}
          </Text>
        </TouchableOpacity>
      </>
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.heading}>
          {isAdmin ? "Support tickets" : "My tickets"}
        </Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push("/extra/support")}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={styles.newText}>New</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={20} color="#7A857A" />
        <TextInput
          placeholder="Search tickets"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load()}
          style={styles.searchInput}
        />
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={["All", "Waiting", "Open", "Resolved", "Closed"]}
        keyExtractor={(x) => x}
        style={styles.filters}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setStatus(item)}
            style={[styles.filter, status === item && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                status === item && styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id || item.id!}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[PRIMARY]}
            />
          }
          contentContainerStyle={
            tickets.length
              ? [styles.list, { paddingBottom: insets.bottom + 20 }]
              : styles.empty
          }
          renderItem={renderTicket}
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons
                name="ticket-outline"
                size={54}
                color="#A1AAA1"
              />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptySub}>
                {isAdmin
                  ? "New support requests will appear here."
                  : "Need help? Create a ticket and we'll be in touch."}
              </Text>
              {!isAdmin && (
                <TouchableOpacity
                  onPress={() => router.push("/extra/support")}
                  style={styles.emptyAction}
                >
                  <Text style={styles.newText}>Create ticket</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F6", padding: 16 },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  heading: { fontSize: 22, fontWeight: "800", color: "#1C281C", flex: 1 },
  newButton: {
    backgroundColor: PRIMARY,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  newText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  search: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DEE5DE",
  },
  searchInput: { flex: 1, height: "100%", marginLeft: 7, fontSize: 14 },
  filters: { flexGrow: 0, marginVertical: 13 },
  filter: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE5DC",
  },
  filterActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  filterText: { fontSize: 12, color: "#536053" },
  filterTextActive: { color: "#fff", fontWeight: "700" },
  list: { gap: 10, paddingBottom: 25 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E4EAE4",
  },
  unread: { borderLeftWidth: 4, borderLeftColor: PRIMARY },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  subject: { fontSize: 15, fontWeight: "800", color: "#1F2A1F", flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY },
  meta: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 9 },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  category: { fontSize: 11, color: "#667066" },
  preview: { fontSize: 13, color: "#637063", marginTop: 10, lineHeight: 18 },
  date: { fontSize: 11, color: "#919B91", marginTop: 9 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },
  empty: { flexGrow: 1, justifyContent: "center" },
  emptyTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: "#344034",
    marginTop: 13,
  },
  emptySub: {
    fontSize: 13,
    color: "#707A70",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 5,
  },
  emptyAction: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 17,
  },
});
