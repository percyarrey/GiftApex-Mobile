import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { useAuthStore } from "@/store/useAuthStore";

const PRIMARY = "rgb(1, 107, 1)";
const categories = [
  "Payment",
  "Selling Codes",
  "Withdrawal",
  "Account",
  "Verification",
  "Bug Report",
  "Feature Request",
  "Other",
];

export default function SupportScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [category, setCategory] = useState("Payment");
  const [subject, setSubject] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const convertToBase64 = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });
    if (!base64) throw new Error("Base64 conversion failed");
    return `data:image/jpeg;base64,${base64}`;
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({
          type: "error",
          text1: "Permission required",
          text2: "Allow photo access to attach an image.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      const imageBase64 = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : await convertToBase64(asset.uri);

      // Keep the JSON request reasonably sized for the support API.
      if ((imageBase64.length * 3) / 4 > 2_500_000) {
        Toast.show({
          type: "error",
          text1: "Image too large",
          text2: "Please choose an image smaller than 2.5 MB.",
        });
        return;
      }
      setImage(imageBase64);
    } catch {
      Toast.show({
        type: "error",
        text1: "Image error",
        text2: "We couldn't process that image. Please try another.",
      });
    }
  };

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Toast.show({
        type: "error",
        text1: "More details needed",
        text2: "Please add a subject and message.",
      });
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/support/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user?.email || "",
          },
          body: JSON.stringify({
            category,
            subject: subject.trim(),
            transactionId: transactionId.trim() || undefined,
            message: message.trim(),
            image: image.trim() || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || data.success === false)
        throw new Error(data.message || "Could not create ticket");
      const ticket = data.ticket || data.data || data;
      Toast.show({
        type: "success",
        text1: "Ticket created",
        text2: "Our support team will get back to you shortly.",
      });
      router.replace({
        pathname: "/(support)/chat/[id]",
        params: {
          id: ticket._id || ticket.id,
          subject: ticket.subject || subject.trim(),
        },
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not create ticket",
        text2: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.icon}>
            <MaterialCommunityIcons
              name="message-question-outline"
              size={29}
              color={PRIMARY}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>How can we help?</Text>
            <Text style={styles.subtitle}>
              Describe your issue and we’ll open a support ticket for you.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.ticketsButton}
          onPress={() => router.push("/(support)/messages")}
        >
          <MaterialCommunityIcons
            name="ticket-confirmation-outline"
            size={20}
            color={PRIMARY}
          />
          <Text style={styles.ticketsText}>View my support tickets</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.chip, category === item && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  category === item && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Briefly describe the issue"
          style={styles.input}
          maxLength={120}
        />
        <Text style={styles.label}>
          Transaction ID <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          value={transactionId}
          onChangeText={setTransactionId}
          placeholder="Gift code or payout ID"
          style={styles.input}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Tell us what happened and include any useful details."
          style={[styles.input, styles.message]}
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />
        <Text style={styles.label}>
          Image <Text style={styles.optional}>(optional)</Text>
        </Text>
        {image ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <TouchableOpacity
              onPress={() => setImage("")}
              style={styles.removeImage}
            >
              <MaterialCommunityIcons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            <MaterialCommunityIcons
              name="image-plus"
              size={23}
              color={PRIMARY}
            />
            <Text style={styles.imagePickerText}>Choose an image</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.hint}>
          Your image is sent securely with this ticket.
        </Text>
        <TouchableOpacity
          disabled={loading}
          onPress={submit}
          style={[styles.submit, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={19} color="#fff" />
              <Text style={styles.submitText}>Create support ticket</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8F6" },
  content: { padding: 16, paddingBottom: 36 },
  hero: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#EAF6EA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#172217" },
  subtitle: { fontSize: 13, color: "#526052", lineHeight: 19, marginTop: 3 },
  ticketsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 13,
    marginBottom: 22,
    elevation: 1,
  },
  ticketsText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#263126" },
  label: { fontSize: 13, fontWeight: "700", color: "#344034", marginBottom: 7 },
  optional: { fontWeight: "400", color: "#7B857B" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 19 },
  chip: {
    borderWidth: 1,
    borderColor: "#D8E1D8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 12, color: "#4B554B" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#D8E1D8",
    backgroundColor: "#fff",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: "#172217",
    marginBottom: 16,
  },
  message: { height: 125 },
  imagePicker: {
    height: 74,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#AFC5AF",
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 16,
  },
  imagePickerText: { fontSize: 13, fontWeight: "700", color: PRIMARY },
  imagePreview: {
    height: 250,
    borderRadius: 11,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#E7ECE7",
    position: "relative",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "center" },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(20,30,20,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { fontSize: 12, color: "#758075", marginTop: -10, marginBottom: 19 },
  submit: {
    height: 50,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
