import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "rgb(1, 107, 1)";

/* =========================================================
   DUMMY CHATS
========================================================= */

const chats = [
  {
    id: "1",
    name: "John Doe",
    message: "I haven't received my payout yet",
    image: "https://i.pravatar.cc/150?img=1",
    time: "2m",
    unread: 2,
  },
  {
    id: "2",
    name: "Sarah Kim",
    message: "Please check my account status",
    image: "https://i.pravatar.cc/150?img=5",
    time: "10m",
    unread: 1,
  },
  {
    id: "3",
    name: "Michael Scott",
    message: "Thanks for the update 👍",
    image: "https://i.pravatar.cc/150?img=3",
    time: "1h",
    unread: 0,
  },
];

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* LIST */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(support)/chat/[id]",
                params: {
                  id: item.id,
                  name: item.name,
                  image: item.image,
                },
              })
            }
          >
            {/* AVATAR */}
            <Image source={{ uri: item.image }} style={styles.avatar} />

            {/* CENTER */}
            <View style={styles.middle}>
              <Text style={styles.name}>{item.name}</Text>
              <Text numberOfLines={1} style={styles.message}>
                {item.message}
              </Text>
            </View>

            {/* RIGHT */}
            <View style={styles.right}>
              <Text style={styles.time}>{item.time}</Text>

              {item.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4FFF4",
  },

  header: {
    padding: 16,
    backgroundColor: PRIMARY,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  chatItem: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
  },

  middle: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  message: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
  },

  right: {
    alignItems: "flex-end",
  },

  time: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 6,
  },

  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
