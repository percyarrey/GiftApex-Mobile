import { useAuthStore } from "@/store/useAuthStore";
import { setActiveSupportChatId } from "@/utils/activeSupportChat";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImageZoom from "react-native-image-pan-zoom";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const ZoomView = ImageZoom as any;

const PRIMARY = "rgb(1, 107, 1)";
const getInitials = (name?: string) =>
  name
    ? name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("")
    : "";
type Ticket = {
  _id: string;
  subject: string;
  category: string;
  status: string;
  priority?: string;
  transactionId?: string;
  assignedAdmin?: {
    _id?: string;
    email?: string;
    name?: string;
    avatar?: string;
    image?: string;
  };
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string;
    image?: string;
  };
  createdAt?: string;
};
type Message = {
  _id: string;
  senderId?: string | { _id?: string };
  senderRole: "user" | "admin" | "system";
  type: "text" | "image" | "system";
  message?: string;
  image?: string;
  createdAt?: string;
};
const idOf = (value: any) => (typeof value === "string" ? value : value?._id);

export default function ChatScreen() {
  const { id, subject } = useLocalSearchParams<{
    id: string;
    subject?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [attachedImage, setAttachedImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const headers = {
    "Content-Type": "application/json",
    "x-user-email": user?.email || "",
  };
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const dedupeMessages = (items: Message[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key =
        item._id ||
        `${item.senderRole}-${item.createdAt || ""}-${item.message || ""}-${item.image || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const load = useCallback(
    async (opts: { showLoading?: boolean } = { showLoading: true }) => {
      const { showLoading = true } = opts || {};
      if (!id) return;
      try {
        if (showLoading) setLoading(true);
        const [ticketRes, messageRes] = await Promise.all([
          fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/support/tickets/${id}`,
            {
              headers,
            },
          ),
          fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/support/tickets/${id}/messages`,
            { headers },
          ),
        ]);
        const td = await ticketRes.json();
        const md = await messageRes.json();
        if (!ticketRes.ok)
          throw new Error(td.message || "Unable to load ticket");
        setTicket(td.ticket || td.data || td);
        if (messageRes.ok)
          setMessages(
            dedupeMessages(md.messages || md.data?.messages || md.data || []),
          );
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Could not load conversation",
          text2: e.message,
        });
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id, user?.email],
  );
  const setViewing = async (viewing: boolean) => {
    if (!id) return;
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/support/tickets/${id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ viewing }),
        },
      );
    } catch (e) {
      // ignore
    }
  };
  useFocusEffect(
    useCallback(() => {
      load();
      // mark ticket as being viewed while this screen is focused so backend
      // can suppress push notifications
      setViewing(true);
      setActiveSupportChatId(id || null);
      return () => {
        setViewing(false);
        setActiveSupportChatId(null);
      };
    }, [id, load]),
  );

  // keep a ref of last message id to avoid duplicates when receiving realtime
  const lastMessageIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    lastMessageIdRef.current = messages[messages.length - 1]?._id || null;
  }, [messages]);

  // realtime updates: prefer WebSocket (if WS url provided), otherwise poll
  React.useEffect(() => {
    if (!id) return;
    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const WS_URL = process.env.EXPO_PUBLIC_WS_URL;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    if (WS_URL) {
      try {
        ws = new WebSocket(
          `${WS_URL.replace(/\/$/, "")}/support/tickets/${id}`,
        );
        ws.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            // expecting payload.message to be the new message object
            const incoming = payload.message;
            if (!incoming) return;
            // avoid duplicate
            if (incoming._id && incoming._id === lastMessageIdRef.current)
              return;
            setMessages((p) => {
              if (p.some((m) => m._id === incoming._id)) return p;
              return [...p, incoming];
            });
          } catch (err) {
            // ignore parse errors
          }
        };
      } catch (err) {
        ws = null;
      }
    } else {
      // polling fallback every 3s
      timer = setInterval(async () => {
        try {
          const res = await fetch(
            `${API_URL}/api/mobile/support/tickets/${id}/messages`,
            { headers },
          );
          const md = await res.json();
          const newMessages = dedupeMessages(
            md.messages || md.data?.messages || md.data || [],
          );
          const lastId = newMessages[newMessages.length - 1]?._id || null;
          if (lastId && lastId !== lastMessageIdRef.current) {
            setMessages(newMessages);
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 3000);
    }

    return () => {
      if (ws)
        try {
          ws.close();
        } catch {}
      if (timer) clearInterval(timer);
      // ensure we unset viewing on unmount
      setViewing(false);
    };
  }, [id]);
  const copyTransactionId = async () => {
    const transactionId = ticket?.transactionId;
    if (!transactionId) return;
    await Clipboard.setStringAsync(transactionId);
    Toast.show({
      type: "success",
      text1: "Copied to clipboard",
      text2: "Transaction ID copied",
    });
    setMenuVisible(false);
  };

  const copyTicketId = async () => {
    const ticketId = ticket?._id;
    if (!ticketId) return;
    await Clipboard.setStringAsync(ticketId);
    Toast.show({
      type: "success",
      text1: "Copied to clipboard",
      text2: "Ticket ID copied",
    });
    setMenuVisible(false);
  };

  const handleTicketAction = async (action: string) => {
    await updateTicket(action);
    setMenuVisible(false);
  };

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const imageBase64 = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : await convertToBase64(asset.uri);

      if ((imageBase64.length * 3) / 4 > 2_500_000) {
        Toast.show({
          type: "error",
          text1: "Image too large",
          text2: "Please choose an image smaller than 2.5 MB.",
        });
        return;
      }
      setAttachedImage(imageBase64);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Image error",
        text2: "We couldn't process that image. Please try another.",
      });
    }
  };

  const send = async () => {
    const messageText = text.trim();
    const imageToSend = attachedImage;
    if (!messageText && !imageToSend) return;
    const payload: Record<string, any> = {
      type: imageToSend ? "image" : "text",
      message: messageText || undefined,
    };
    if (imageToSend) {
      payload.image = imageToSend;
    }
    setText("");
    setAttachedImage("");
    try {
      setSending(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/support/tickets/${id}/messages`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || data.success === false)
        throw new Error(data.message || "Message was not sent");
      setMessages((p) => [...p, data.message || data.data || data]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 40);
    } catch (e: any) {
      setText(messageText);
      if (imageToSend) setAttachedImage(imageToSend);
      Toast.show({
        type: "error",
        text1: "Message not sent",
        text2: e.message,
      });
    } finally {
      setSending(false);
    }
  };
  const updateTicket = async (action: string, priority?: string) => {
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/support/tickets/${id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(priority ? { priority } : { action }),
        },
      );
      const data = await res.json();
      if (!res.ok || data.success === false)
        throw new Error(data.message || "Update failed");
      setTicket(data.ticket || data.data || data);
      await load({ showLoading: false });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Could not update ticket",
        text2: e.message,
      });
    }
  };
  const isAdmin = user?.role === "admin";
  const closed = ticket?.status === "Closed";
  const resolved = ticket?.status === "Resolved";
  const currentAdminId = user?.id || user?.email || user?.name;
  const assignedAdminId =
    ticket?.assignedAdmin?._id ||
    ticket?.assignedAdmin?.email ||
    ticket?.assignedAdmin?.name;
  const isAssignedToCurrentAdmin =
    isAdmin &&
    !!assignedAdminId &&
    (assignedAdminId === currentAdminId ||
      assignedAdminId === user?.email ||
      assignedAdminId === user?.id ||
      assignedAdminId === user?.name);
  const assignedToOtherAdmin =
    isAdmin && ticket?.assignedAdmin && !isAssignedToCurrentAdmin;
  const canUserReply = !closed;
  const canAdminReply =
    !closed && ticket?.status === "Open" && isAssignedToCurrentAdmin;
  const canReply = isAdmin ? canAdminReply : canUserReply;
  const showAdminTransferNotice = isAdmin && assignedToOtherAdmin;
  const showResolvedNotice = isAdmin && ticket?.status === "Resolved";
  const isUnassigned = !!ticket && !ticket?.assignedAdmin;
  const profileUser = isAdmin ? ticket?.userId : ticket?.assignedAdmin;
  const profileName = isAdmin
    ? profileUser?.name || "Unknown"
    : profileUser?.name || "Not yet assigned";
  const profileAvatar = profileUser?.avatar || profileUser?.image;
  const ticketTitle = ticket?.subject || subject || "Support ticket";
  const ticketMeta = `${ticket?.category || "Support"} · ${ticket?.status || "Waiting"}${ticket?.priority ? ` · ${ticket.priority}` : ""}`;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ticketTitle}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {ticketMeta}
          </Text>
        </View>
      ),
    });
  }, [navigation, ticketTitle, ticketMeta]);
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F7F5" }}
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS === "ios" ? insets.top + 90 : insets.top + 60
        }
      >
        <View style={styles.info}>
          <View style={{ flex: 1 }}>
            <View style={styles.infoRow}>
              {profileName ? (
                <View style={styles.adminInfo}>
                  <View style={styles.avatar}>
                    {profileAvatar ? (
                      <Image
                        source={{ uri: profileAvatar }}
                        style={styles.avatarImage}
                      />
                    ) : isUnassigned ? (
                      <MaterialCommunityIcons
                        name="account-question"
                        size={18}
                        color={PRIMARY}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {getInitials(profileName)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.adminName} numberOfLines={1}>
                    {profileName}
                  </Text>
                </View>
              ) : null}
              <Pressable
                onPress={() => setMenuVisible((prev) => !prev)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.pressedButton,
                ]}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={24}
                  color={PRIMARY}
                />
              </Pressable>
            </View>
            {ticket?.transactionId ? (
              <TouchableOpacity
                onPress={copyTransactionId}
                activeOpacity={0.7}
                style={styles.transactionButton}
              >
                <Text style={styles.transaction} numberOfLines={1}>
                  Transaction ID: {ticket.transactionId}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <View style={styles.body}>
          <FlatList
            ref={listRef}
            style={styles.list}
            data={messages}
            keyExtractor={(item, index) =>
              `support-message-${index}-${String(item._id ?? item.createdAt ?? item.message ?? "")}`
            }
            contentContainerStyle={[
              styles.messages,
              { paddingBottom: insets.bottom + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => {
              const mine = isAdmin
                ? item.senderRole === "admin"
                : item.senderRole === "user";
              if (item.type === "system" || item.senderRole === "system")
                return <Text style={styles.system}>{item.message}</Text>;
              return (
                <View
                  style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                >
                  {item.image ? (
                    <Pressable
                      onPress={() => setPreviewImage(item.image || "")}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.messageImage}
                      />
                    </Pressable>
                  ) : null}
                  {item.message ? (
                    <Text style={[styles.messageText, mine && styles.mineText]}>
                      {item.message}
                    </Text>
                  ) : null}
                  <Text style={[styles.time, mine && styles.mineTime]}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons
                  name="message-outline"
                  size={45}
                  color="#A3ACA3"
                />
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            }
            ListFooterComponent={<View style={styles.footerSpacer} />}
          />
        </View>
        {showAdminTransferNotice ? (
          <View style={styles.closed}>
            <MaterialCommunityIcons
              name="transfer-right"
              size={18}
              color="#667066"
            />
            <Text style={styles.closedText}>
              This ticket is assigned to another admin. Transfer it to yourself
              before replying.
            </Text>
          </View>
        ) : showResolvedNotice ? (
          <View style={styles.closed}>
            <MaterialCommunityIcons name="restore" size={18} color="#667066" />
            <Text style={styles.closedText}>
              This ticket is resolved. Reopen it from the menu before replying.
            </Text>
          </View>
        ) : canReply ? (
          <>
            {attachedImage ? (
              <View style={styles.attachmentPreview}>
                <Image
                  source={{ uri: attachedImage }}
                  style={styles.attachedImagePreview}
                />
                <TouchableOpacity
                  onPress={() => setAttachedImage("")}
                  style={styles.removeAttachment}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.attachmentNote} numberOfLines={1}>
                  Image attached. Add a caption or send it now.
                </Text>
              </View>
            ) : null}
            <View style={styles.inputRow}>
              <TouchableOpacity
                onPress={pickImage}
                style={styles.imageButton}
                disabled={sending}
              >
                <Ionicons name="image-outline" size={22} color={PRIMARY} />
              </TouchableOpacity>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={
                  attachedImage
                    ? "Add image caption (optional)"
                    : "Write a message"
                }
                multiline
                style={styles.input}
              />
              <TouchableOpacity
                disabled={(!text.trim() && !attachedImage) || sending}
                onPress={send}
                style={[
                  styles.send,
                  !text.trim() && !attachedImage && styles.disabled,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={19} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.closed}>
            <MaterialCommunityIcons
              name={closed ? "lock-outline" : "clock-outline"}
              size={18}
              color="#667066"
            />
            <Text style={styles.closedText}>
              {closed
                ? "This ticket is closed."
                : isAdmin
                  ? "Assign or transfer this ticket before replying."
                  : "This ticket is awaiting a response."}
            </Text>
          </View>
        )}
        {menuVisible ? (
          <Pressable
            style={styles.menuOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              {ticket?.transactionId ? (
                <TouchableOpacity
                  onPress={copyTransactionId}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemText}>Copy transaction ID</Text>
                </TouchableOpacity>
              ) : null}
              {ticket?._id ? (
                <TouchableOpacity
                  onPress={copyTicketId}
                  style={styles.menuItem}
                >
                  <Text style={styles.menuItemText}>Copy ticket ID</Text>
                </TouchableOpacity>
              ) : null}
              {isAdmin ? (
                <>
                  {isUnassigned ? (
                    <TouchableOpacity
                      onPress={() => handleTicketAction("accept")}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuItemText}>Accept ticket</Text>
                    </TouchableOpacity>
                  ) : null}
                  {ticket?.assignedAdmin && !isAssignedToCurrentAdmin ? (
                    <TouchableOpacity
                      onPress={() => handleTicketAction("transfer")}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuItemText}>
                        Transfer ticket to me
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {ticket?.status === "Open" && isAssignedToCurrentAdmin ? (
                    <TouchableOpacity
                      onPress={() => handleTicketAction("resolve")}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuItemText}>Resolve ticket</Text>
                    </TouchableOpacity>
                  ) : null}
                  {ticket?.status === "Open" && isAssignedToCurrentAdmin ? (
                    <TouchableOpacity
                      onPress={() => handleTicketAction("close")}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuItemText}>Close ticket</Text>
                    </TouchableOpacity>
                  ) : null}
                  {ticket?.status === "Resolved" ||
                  ticket?.status === "Closed" ? (
                    <TouchableOpacity
                      onPress={() => handleTicketAction("reopen")}
                      style={styles.menuItem}
                    >
                      <Text style={styles.menuItemText}>Reopen ticket</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                style={styles.menuCancel}
              >
                <Text style={styles.menuCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        ) : null}
        <Modal
          visible={!!previewImage}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage("")}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalCloseArea}
              onPress={() => setPreviewImage("")}
            />
            <ZoomView
              cropWidth={screenWidth}
              cropHeight={screenHeight}
              imageWidth={screenWidth - 40}
              imageHeight={screenHeight - 140}
              minScale={1}
              maxScale={3}
            >
              <Image
                source={{ uri: previewImage }}
                style={styles.previewFullImage}
              />
            </ZoomView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  info: {
    padding: 13,
    paddingTop: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E1E7E1",
    flexDirection: "row",
  },
  ticketTitle: { fontSize: 15, fontWeight: "800", color: "#202A20" },
  ticketMeta: { fontSize: 12, color: "#667066", marginTop: 4 },
  transaction: { fontSize: 11, color: PRIMARY, marginTop: 4 },
  transactionButton: {
    marginTop: 4,
  },
  messages: { padding: 13, gap: 8, flexGrow: 1 },
  bubble: { maxWidth: "80%", padding: 10, borderRadius: 14 },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: PRIMARY,
    borderBottomRightRadius: 3,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 3,
  },
  messageText: { fontSize: 14, lineHeight: 20, color: "#293329" },
  mineText: { color: "#fff" },
  time: { fontSize: 10, color: "#839083", marginTop: 5, alignSelf: "flex-end" },
  mineTime: { color: "#D7F0D7" },
  system: {
    alignSelf: "center",
    fontSize: 11,
    color: "#667066",
    backgroundColor: "#E7ECE7",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginVertical: 5,
    textAlign: "center",
  },
  messageImage: { width: 190, height: 150, borderRadius: 9, marginBottom: 7 },
  body: { flex: 1 },
  list: { flex: 1 },
  adminInfo: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D8E4D8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },
  avatarImage: { width: 32, height: 32 },
  adminName: {
    fontSize: 13,
    color: "#344034",
    fontWeight: "700",
    maxWidth: "80%",
  },
  footerSpacer: { height: 18 },
  infoRow: {
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 16,
  },
  pressedButton: {
    opacity: 0.7,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    marginTop: Platform.OS === "ios" ? 90 : 70,
    marginRight: 12,
    width: 190,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F2",
  },
  menuItemText: {
    color: "#202A20",
    fontSize: 14,
    fontWeight: "600",
  },
  menuCancel: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuCancelText: {
    color: "#667066",
    fontSize: 14,
    fontWeight: "600",
  },
  attachmentPreview: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E1E7E1",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  attachedImagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    resizeMode: "cover",
  },
  removeAttachment: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentNote: {
    marginTop: 8,
    color: "#667066",
    fontSize: 12,
    textAlign: "center",
  },
  inputRow: {
    backgroundColor: "#fff",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#E1E7E1",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  imageButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F2",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 42,
    borderWidth: 1,
    borderColor: "#DCE4DC",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.45 },
  closed: {
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E1E7E1",
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    alignItems: "center",
  },
  closedText: { color: "#667066", fontSize: 13 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: { marginTop: 9, color: "#7B857B", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCloseArea: {
    ...StyleSheet.absoluteFillObject,
  },
  previewFullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
