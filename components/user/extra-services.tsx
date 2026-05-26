import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const THEME = "rgb(1, 107, 1)";

type ExtraRoute =
  | "/extra/faq"
  | "/extra/support"
  | "/extra/notifications"
  | "/extra/settings";

const extras: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: ExtraRoute;
}[] = [
  { title: "Settings", icon: "settings-outline", route: "/extra/settings" },
  {
    title: "Notifications",
    icon: "notifications-outline",
    route: "/extra/notifications",
  },
  { title: "Support", icon: "chatbox-outline", route: "/extra/support" },

  { title: "FAQ", icon: "help-circle-outline", route: "/extra/faq" },
];

export default function ExtrasServices() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Other Services</Text>

      {/* SINGLE ROW */}
      <View style={styles.row}>
        {extras.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
            ]}
          >
            <View style={styles.iconBox}>
              <Ionicons name={item.icon} size={22} color={THEME} />
            </View>

            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    marginBottom: 50,
  },

  header: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 22,
  },

  // 🔥 ONE ROW SCROLLABLE (important for small screens)
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    flex: 1,
    marginHorizontal: 5, // spacing between items
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(1,107,1,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  title: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
});
