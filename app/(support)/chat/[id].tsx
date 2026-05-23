import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "rgb(1, 107, 1)";

/* =========================================================
   DUMMY CHAT DATA
========================================================= */

const initialMessages = [
  { id: "1", sender: "user", text: "Hello Admin 👋" },
  { id: "2", sender: "admin", text: "Hi! How can I help you?" },
  { id: "3", sender: "user", text: "My payout is delayed" },
];

export default function ChatScreen() {
  const { name, image } = useLocalSearchParams();

  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "admin",
        text,
      },
    ]);

    setText("");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={{ uri: image as string }} style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
      </View>

      {/* CHAT LIST */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === "admin" ? styles.adminMsg : styles.userMsg,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.sender === "admin" && { color: "#fff" },
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type message..."
          style={styles.input}
        />

        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: PRIMARY,
    gap: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
  },

  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  messageBubble: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: "75%",
  },

  userMsg: {
    backgroundColor: "#E5E7EB",
    alignSelf: "flex-start",
  },

  adminMsg: {
    backgroundColor: PRIMARY,
    alignSelf: "flex-end",
  },

  messageText: {
    fontSize: 14,
    color: "#111827",
  },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    gap: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
});
