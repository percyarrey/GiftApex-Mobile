import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function supportSscreen() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="progress-wrench" size={85} color="green" />

      <Text style={styles.title}>Work in Progress</Text>

      <Text style={styles.subtitle}>
        We are building this feature. Please check back soon 🚧
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB", // soft modern light background
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    marginTop: 15,
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 20,
  },
});
