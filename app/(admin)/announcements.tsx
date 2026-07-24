import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const PRIMARY = "rgb(1, 107, 1)";
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;
const SCREEN_WIDTH = Dimensions.get("window").width;

type Priority = "info" | "success" | "warning" | "important";
type AnnouncementType = "text" | "image";

type Announcement = {
  _id: string;
  title?: string;
  message?: string;
  imageBase64?: string; // Base64 encoded image
  type: AnnouncementType;
  priority?: Priority;
  duration?: number; // in days, 0 means never expires
  expiresAt?: string;
  createdAt: string;
};

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: "info", label: "Info", color: "#2563EB" },
  { value: "success", label: "Good news", color: "#16A34A" },
  { value: "warning", label: "Notice", color: "#EA580C" },
  { value: "important", label: "Important", color: "#DC2626" },
];

export default function AnnouncementsScreen() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Text announcement state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [announcementType, setAnnouncementType] =
    useState<AnnouncementType>("text");
  const [priority, setPriority] = useState<Priority>("info");
  const [durationDays, setDurationDays] = useState(7);

  // Image announcement state
  const [selectedImageBase64, setSelectedImageBase64] = useState<string>("");
  const [selectedImagePreview, setSelectedImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Email state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // Carousel state
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-user-email": user?.email || "",
    }),
    [user?.email],
  );

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const asset = result.assets[0];

        // Read and convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        setSelectedImageBase64(base64);
        setSelectedImagePreview(asset.uri);
        Toast.show({
          type: "success",
          text1: "Image selected",
          text2: "Ready to publish",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not pick image",
        text2: error.message,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/announcements`, {
        headers,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load announcements");
      setAnnouncements(
        Array.isArray(data) ? data : data.announcements || data.data || [],
      );
    } catch (error) {
      console.log("Admin announcement fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const postAnnouncement = async () => {
    if (announcementType === "text") {
      if (!title.trim() || !message.trim()) {
        Toast.show({
          type: "error",
          text1: "Add a title and message for text announcements",
        });
        return;
      }
    } else {
      if (!selectedImageBase64.trim()) {
        Toast.show({
          type: "error",
          text1: "Upload an image for image announcements",
        });
        return;
      }
    }
    try {
      setPosting(true);
      const payload: any = {
        type: announcementType,
        priority,
        duration: durationDays,
      };
      if (announcementType === "text") {
        payload.title = title.trim();
        payload.message = message.trim();
      } else {
        payload.imageBase64 = selectedImageBase64;
      }
      const response = await fetch(`${API_URL}/api/admin/announcements`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || data.success === false)
        throw new Error(data.message || "Unable to publish announcement");
      setTitle("");
      setMessage("");
      setSelectedImageBase64("");
      setSelectedImagePreview("");
      setPriority("info");
      setAnnouncementType("text");
      setDurationDays(7);
      Toast.show({
        type: "success",
        text1: "Announcement published",
        text2: "Users have been notified.",
      });
      fetchAnnouncements();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not publish",
        text2: error.message,
      });
    } finally {
      setPosting(false);
    }
  };

  const sendEmail = async () => {
    if (
      !recipientEmail.trim() ||
      !emailSubject.trim() ||
      !emailMessage.trim()
    ) {
      Toast.show({
        type: "error",
        text1: "Complete the recipient, subject, and message",
      });
      return;
    }
    try {
      setSendingEmail(true);
      const response = await fetch(`${API_URL}/api/admin/announcements/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim().toLowerCase(),
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.success === false)
        throw new Error(data.message || "Unable to send email");
      setRecipientEmail("");
      setEmailSubject("");
      setEmailMessage("");
      Toast.show({ type: "success", text1: "Email sent successfully" });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Could not send email",
        text2: error.message,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const deleteAnnouncement = (item: Announcement) => {
    Alert.alert(
      "Delete announcement?",
      "This will remove it from the user home screen.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!item._id) {
              Toast.show({
                type: "error",
                text1: "Unable to delete announcement",
                text2: "Missing announcement ID",
              });
              return;
            }

            try {
              const response = await fetch(
                `${API_URL}/api/admin/announcements/${item._id}`,
                { method: "DELETE", headers },
              );
              const data = await response.json().catch(() => null);

              if (!response.ok || data?.success === false) {
                throw new Error(
                  data?.message || "Unable to delete announcement",
                );
              }

              setAnnouncements((current) =>
                current.filter((announcement) => announcement._id !== item._id),
              );
              Toast.show({
                type: "success",
                text1: "Announcement deleted",
              });
              fetchAnnouncements();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: error.message || "Could not delete announcement",
              });
            }
          },
        },
      ],
    );
  };

  const renderAnnouncement = ({ item }: { item: Announcement }) => {
    const meta =
      priorities.find((entry) => entry.value === item.priority) ||
      priorities[0];
    const isImage = item.type === "image";
    const expiresDate = item.expiresAt
      ? new Date(item.expiresAt).toLocaleDateString()
      : null;
    const durationLabel =
      item.duration && item.duration > 0
        ? `${item.duration} day${item.duration > 1 ? "s" : ""}`
        : item.duration === 0
          ? "Never expires"
          : null;

    if (isImage) {
      return (
        <View style={styles.announcementImageContainer}>
          {item.imageBase64 && (
            <Image
              source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }}
              style={styles.announcementImageFull}
            />
          )}
          <View style={styles.announcementImageOverlay}>
            <View style={styles.announcementImageMeta}>
              <View
                style={[
                  styles.announcementImagePriority,
                  { backgroundColor: `${meta.color}` },
                ]}
              >
                <Text style={styles.announcementImagePriorityText}>
                  {meta.label}
                </Text>
              </View>
              {durationLabel && (
                <Text style={styles.announcementImageDuration}>
                  {durationLabel}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => deleteAnnouncement(item)}
              style={styles.announcementImageDeleteBtn}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.announcementCard}>
        <View
          style={[
            styles.announcementIcon,
            { backgroundColor: `${meta.color}18` },
          ]}
        >
          <Ionicons name="megaphone-outline" size={21} color={meta.color} />
        </View>
        <View style={styles.announcementText}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementMessage}>{item.message}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.priorityText, { color: meta.color }]}>
              {meta.label}
            </Text>
            {durationLabel && (
              <Text style={styles.durationText}> • {durationLabel}</Text>
            )}
            {expiresDate && (
              <Text style={styles.durationText}> • Expires {expiresDate}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => deleteAnnouncement(item)} hitSlop={10}>
          <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        data={announcements}
        keyExtractor={(item) => item._id}
        renderItem={renderAnnouncement}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAnnouncements();
            }}
            colors={[PRIMARY]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons name="megaphone" size={28} color="#fff" />
              </View>
              <View>
                <Text style={styles.heroTitle}>Announcements</Text>
                <Text style={styles.heroText}>
                  Keep every GiftApex user informed.
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Post an announcement</Text>
              <Text style={styles.formHint}>
                Publishing also creates an in-app notification for users.
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Announcement title"
                style={styles.input}
                maxLength={100}
              />
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Write your announcement..."
                style={[styles.input, styles.textarea]}
                multiline
                textAlignVertical="top"
                maxLength={600}
              />
              {/* Announcement Type Toggle */}
              <Text style={styles.fieldLabel}>Announcement type</Text>
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  onPress={() => setAnnouncementType("text")}
                  style={[
                    styles.typeToggleBtn,
                    announcementType === "text" && styles.typeToggleActive,
                  ]}
                >
                  <Ionicons
                    name="text"
                    size={16}
                    color={announcementType === "text" ? "#fff" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.typeToggleText,
                      announcementType === "text" &&
                        styles.typeToggleTextActive,
                    ]}
                  >
                    Text
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAnnouncementType("image")}
                  style={[
                    styles.typeToggleBtn,
                    announcementType === "image" && styles.typeToggleActiveImg,
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={16}
                    color={announcementType === "image" ? "#fff" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.typeToggleText,
                      announcementType === "image" &&
                        styles.typeToggleTextActive,
                    ]}
                  >
                    Image
                  </Text>
                </TouchableOpacity>
              </View>

              {announcementType === "image" && (
                <View>
                  <TouchableOpacity
                    disabled={uploadingImage}
                    onPress={pickImage}
                    style={[
                      styles.imagePickerButton,
                      uploadingImage && styles.disabledButton,
                    ]}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator color="#fff" />
                    ) : selectedImagePreview ? (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.primaryButtonText}>
                          Image selected
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>
                          Pick an image
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {selectedImagePreview && (
                    <Image
                      source={{ uri: selectedImagePreview }}
                      style={styles.imagePreview}
                    />
                  )}
                </View>
              )}

              {/* Duration Selector */}
              <Text style={styles.fieldLabel}>Duration</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.priorityRow}
              >
                {[
                  { label: "1 day", value: 1 },
                  { label: "3 days", value: 3 },
                  { label: "7 days", value: 7 },
                  { label: "14 days", value: 14 },
                  { label: "30 days", value: 30 },
                  { label: "Never", value: 0 },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setDurationDays(opt.value)}
                    style={[
                      styles.priorityChip,
                      durationDays === opt.value && {
                        backgroundColor: PRIMARY,
                        borderColor: PRIMARY,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        durationDays === opt.value && { color: "#fff" },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Display style</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.priorityRow}
              >
                {priorities.map((entry) => (
                  <TouchableOpacity
                    key={entry.value}
                    onPress={() => setPriority(entry.value)}
                    style={[
                      styles.priorityChip,
                      priority === entry.value && {
                        backgroundColor: entry.color,
                        borderColor: entry.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        priority === entry.value && { color: "#fff" },
                      ]}
                    >
                      {entry.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                disabled={posting}
                onPress={postAnnouncement}
                style={[styles.primaryButton, posting && styles.disabledButton]}
              >
                {posting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>
                      Publish & notify users
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formCard}>
              <View style={styles.emailTitleRow}>
                <View style={styles.emailIcon}>
                  <Ionicons name="mail" size={20} color="#7C3AED" />
                </View>
                <View>
                  <Text style={styles.formTitle}>Send a direct email</Text>
                  <Text style={styles.formHint}>
                    Send a message to one specific user.
                  </Text>
                </View>
              </View>
              <TextInput
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                placeholder="User email address"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <TextInput
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder="Email subject"
                style={styles.input}
                maxLength={140}
              />
              <TextInput
                value={emailMessage}
                onChangeText={setEmailMessage}
                placeholder="Write your email..."
                style={[styles.input, styles.textarea]}
                multiline
                textAlignVertical="top"
                maxLength={3000}
              />
              <TouchableOpacity
                disabled={sendingEmail}
                onPress={sendEmail}
                style={[
                  styles.emailButton,
                  sendingEmail && styles.disabledButton,
                ]}
              >
                {sendingEmail ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="paper-plane-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.primaryButtonText}>Send email</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.listTitle}>Published announcements</Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={PRIMARY} size="large" />
          ) : (
            <Text style={styles.empty}>No announcements yet.</Text>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  container: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: "#F5F7FA",
    flexGrow: 1,
  },
  hero: {
    backgroundColor: PRIMARY,
    padding: 20,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  heroTitle: { color: "#fff", fontSize: 23, fontWeight: "900" },
  heroText: { color: "#DCFCE7", marginTop: 3 },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  formTitle: { color: "#111827", fontSize: 18, fontWeight: "800" },
  formHint: { color: "#6B7280", fontSize: 13, marginTop: 4, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FAFAFA",
    marginBottom: 10,
  },
  textarea: { minHeight: 100 },
  fieldLabel: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  priorityRow: { paddingVertical: 10, gap: 8 },
  priorityChip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  priorityChipText: { color: "#4B5563", fontSize: 13, fontWeight: "700" },
  primaryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 13,
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  imagePickerButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 13,
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  emailButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 13,
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  emailTitleRow: { flexDirection: "row", alignItems: "center" },
  emailIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  announcementCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    elevation: 1,
  },
  announcementIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  announcementText: { flex: 1, paddingRight: 8 },
  announcementTitle: { color: "#111827", fontSize: 15, fontWeight: "800" },
  announcementMessage: {
    color: "#6B7280",
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  announcementImageContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 2,
    height: 280,
  },
  announcementImageFull: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  announcementImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  announcementImageMeta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flex: 1,
  },
  announcementImagePriority: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  announcementImagePriorityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  announcementImageDuration: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  announcementImageDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 10,
    resizeMode: "contain",
  },
  priorityText: { marginTop: 7, fontSize: 12, fontWeight: "800" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    flexWrap: "wrap",
  },
  durationText: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  typeToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 10,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FAFAFA",
  },
  typeToggleActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  typeToggleActiveImg: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  typeToggleTextActive: {
    color: "#fff",
  },
  empty: { color: "#6B7280", textAlign: "center", marginTop: 20 },
});
