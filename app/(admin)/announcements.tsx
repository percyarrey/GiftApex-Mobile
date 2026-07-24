import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

type Priority = "info" | "success" | "warning" | "important";
type AnnouncementType = "text" | "image";

type Announcement = {
  _id: string;
  title?: string;
  message?: string;
  imageUrl?: string;
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
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("info");
  const [announcementType, setAnnouncementType] =
    useState<AnnouncementType>("text");
  const [imageUrl, setImageUrl] = useState("");
  const [durationDays, setDurationDays] = useState<number>(7); // default 7 days
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-user-email": user?.email || "",
    }),
    [user?.email],
  );

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
      if (!imageUrl.trim()) {
        Toast.show({
          type: "error",
          text1: "Add an image URL for image announcements",
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
        payload.imageUrl = imageUrl.trim();
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
      setImageUrl("");
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
            try {
              const response = await fetch(
                `${API_URL}/api/admin/announcements/${item._id}`,
                { method: "DELETE", headers },
              );
              if (!response.ok)
                throw new Error("Unable to delete announcement");
              setAnnouncements((current) =>
                current.filter((announcement) => announcement._id !== item._id),
              );
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
    return (
      <View style={styles.announcementCard}>
        <View
          style={[
            styles.announcementIcon,
            { backgroundColor: `${meta.color}18` },
          ]}
        >
          <Ionicons
            name={isImage ? "image-outline" : "megaphone-outline"}
            size={21}
            color={meta.color}
          />
        </View>
        <View style={styles.announcementText}>
          {isImage ? (
            <>
              <Text style={styles.announcementTitle}>
                📷 Image Announcement
              </Text>
              {item.imageUrl && (
                <Text style={styles.announcementMessage} numberOfLines={2}>
                  {item.imageUrl}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementMessage}>{item.message}</Text>
            </>
          )}
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
    <FlatList
      data={announcements}
      keyExtractor={(item) => item._id}
      renderItem={renderAnnouncement}
      contentContainerStyle={styles.container}
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
                    announcementType === "text" && styles.typeToggleTextActive,
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
                    announcementType === "image" && styles.typeToggleTextActive,
                  ]}
                >
                  Image
                </Text>
              </TouchableOpacity>
            </View>

            {announcementType === "image" && (
              <TextInput
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://example.com/image.jpg"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="url"
              />
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
                  <Ionicons name="paper-plane-outline" size={18} color="#fff" />
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
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
