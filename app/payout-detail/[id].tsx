// payout-detail.tsx

import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const PRIMARY = "rgb(1, 107, 1)";

const withdrawalOptions = [
  { name: "BNB Smart Chain (BEP20)", image: "bnb.png" },
  { name: "Binance ID", image: "binance_id.webp" },
  { name: "USDT TRC20", image: "usdt_trc20.png" },
  { name: "MTN Mobile Money", image: "mtn.jpg" },
  { name: "Orange Money", image: "orange.png" },
  { name: "Bank Transfer", image: "bank_transfer.png" },
];

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: any;
  icon?: any;
}) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <View style={styles.infoRow}>
      <View style={styles.labelRow}>
        <Ionicons
          name={(icon as any) || "ellipse-outline"}
          size={14}
          color="#666"
        />
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

function TimelineStep({
  label,
  status,
}: {
  label: string;
  status: "done" | "active" | "idle" | "failed";
}) {
  const color =
    status === "done"
      ? "#16a34a"
      : status === "active"
        ? "#f59e0b"
        : status === "failed"
          ? "#dc2626"
          : "#9ca3af";

  const icon =
    status === "done"
      ? "checkmark-circle"
      : status === "active"
        ? "time"
        : status === "failed"
          ? "close-circle"
          : "ellipse-outline";

  return (
    <View style={styles.timelineRow}>
      <Ionicons name={icon} size={16} color={color} />

      <Text style={[styles.timelineText, { color }]}>{label}</Text>
    </View>
  );
}
const getIcon = (label: string) => {
  switch (label) {
    case "Amount":
      return "cash-outline";
    case "Status":
      return "pulse-outline";
    case "Method":
      return "card-outline";
    case "Requested":
      return "calendar-outline";
    case "Wallet Address":
    case "USDT TRC20 Wallet Address":
      return "wallet-outline";
    case "Binance ID":
      return "person-outline";
    case "Account Name":
      return "person-circle-outline";
    case "Mobile Number":
      return "call-outline";
    case "Bank Name":
      return "business-outline";
    case "Account Number":
      return "key-outline";
    case "SWIFT Code":
      return "barcode-outline";
    case "IBAN":
      return "document-text-outline";
    default:
      return "ellipse-outline";
  }
};
export default function PayoutDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [approveLoading, setapproveLoading] = useState(false);
  const [payout, setPayout] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/user/payouts/${id}`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
      });

      if (!res.ok) {
        Toast.show({
          type: "error",
          text1: "Request not found",
        });

        router.back();
        return;
      }
      const data = await res.json();
      setPayout(data);
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, id, user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );
  const onRefresh = async () => {
    setRefreshing(true);
    fetchData();
    setRefreshing(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const copyId = async () => {
    await Clipboard.setStringAsync(payout._id);
    Toast.show({ type: "success", text1: "Transaction ID copied" });
  };

  const cancelWithdrawal = () => {
    Alert.alert("Cancel Withdrawal", "Cancel this pending withdrawal?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            setCancelLoading(true);

            const res = await fetch(`${API_URL}/api/user/payouts`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": user?.email || "",
              },
              body: JSON.stringify({
                id: payout._id,
                action: "cancelPayout",
              }),
            });

            const data = await res.json();

            if (res.ok && data?.success) {
              Toast.show({
                type: "success",
                text1: "Cancellation request sent",
              });

              router.setParams({ refresh: Date.now() });
              router.back();
            } else {
              Toast.show({
                type: "error",
                text1: data?.message || "Failed to cancel withdrawal",
              });
            }
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Something went wrong. Refresh and Try again.",
            });
            console.log(error);
          } finally {
            setCancelLoading(false);
          }
        },
      },
    ]);
  };
  const rejectWithdrawal = () => {
    Alert.alert("Reject Withdrawal", "Reject this pending withdrawal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            setCancelLoading(true);

            const res = await fetch(`${API_URL}/api/admin/payout-requests`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": user?.email || "",
              },
              body: JSON.stringify({
                id: payout._id,
                status: "rejected",
              }),
            });

            const data = await res.json();

            if (res.ok && data?.success) {
              Toast.show({
                type: "success",
                text1: "Rejected the request",
              });
            } else {
              Toast.show({
                type: "error",
                text1: data?.message || "Failed to Reject withdrawal",
              });
            }
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Something went wrong. Refresh and Try again.",
            });
            console.log(error);
          } finally {
            setCancelLoading(false);
          }
        },
      },
    ]);
  };
  const approveWithdrawal = () => {
    Alert.alert("Approve Withdrawal", "Confirm this pending withdrawal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        style: "destructive",
        onPress: async () => {
          try {
            setapproveLoading(true);

            const res = await fetch(`${API_URL}/api/admin/payout-requests`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": user?.email || "",
              },
              body: JSON.stringify({
                id: payout._id,
                status: "completed",
              }),
            });

            const data = await res.json();

            if (res.ok && data?.success) {
              Toast.show({
                type: "success",
                text1: "Withrawal Approved",
              });
            } else {
              Toast.show({
                type: "error",
                text1: data?.message || "Failed to approve withdrawal",
              });
            }
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Something went wrong.Refresh and Try again.",
            });
            console.log(error);
          } finally {
            setapproveLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!payout) {
    return (
      <View style={styles.center}>
        <Text>Payout not found.</Text>
      </View>
    );
  }

  const method = withdrawalOptions.find((m) => m.name === payout.method);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <Text style={styles.headerTitle}>
          Payout <Text style={{ color: PRIMARY }}>Details</Text>
        </Text>
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Image
              source={{ uri: `${API_URL}/payout/${method?.image}` }}
              resizeMode="cover"
              style={styles.icon}
            />
          </View>

          <Text style={styles.method}>{payout.method}</Text>
          <Text style={styles.amount}>${payout.amount}</Text>

          <View style={[styles.badge, statusColor(payout.status)]}>
            <Text style={styles.badgeText}>
              {String(payout.status).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* TRANSACTION */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons name="receipt-outline" size={18} color="#111" />
            <Text style={styles.title}>Transaction Details</Text>
          </View>

          <TouchableOpacity style={styles.copyRow} onPress={copyId}>
            <View style={{ flex: 1 }}>
              <View style={styles.labelRow}>
                <Ionicons name="key-outline" size={14} color="#666" />
                <Text style={styles.label}>Transaction ID</Text>
              </View>

              <Text numberOfLines={1} style={styles.value}>
                {payout._id}
              </Text>
            </View>

            <Ionicons name="copy-outline" size={18} color="green" />
          </TouchableOpacity>

          <InfoRow
            label="Amount"
            value={`$${payout.amount}`}
            icon={getIcon("Amount")}
          />
          <InfoRow
            label="Status"
            value={payout.status}
            icon={getIcon("Status")}
          />
          <InfoRow
            label="Method"
            value={payout.method}
            icon={getIcon("Method")}
          />
          <InfoRow
            label="Created"
            value={formatDate(payout.createdAt)}
            icon={getIcon("Requested")}
          />
        </View>

        {/* RECIPIENT */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#111" />
            <Text style={styles.title}>Recipient Details</Text>
          </View>

          {payout.method === "BNB Smart Chain (BEP20)" && (
            <InfoRow
              label="Wallet Address"
              value={payout.accountDetails.bnbAddress}
              icon={getIcon("Wallet Address")}
            />
          )}

          {payout.method === "Binance ID" && (
            <InfoRow
              label="Binance ID"
              value={payout.accountDetails.binanceId}
              icon={getIcon("Binance ID")}
            />
          )}

          {payout.method === "USDT TRC20" && (
            <InfoRow
              label="USDT TRC20 Wallet Address"
              value={payout.accountDetails.usdtTrc20Address}
              icon={getIcon("USDT TRC20 Wallet Address")}
            />
          )}

          {(payout.method === "MTN Mobile Money" ||
            payout.method === "Orange Money") && (
            <>
              <InfoRow
                label="Account Name"
                value={payout.accountDetails.accountName}
                icon={getIcon("Account Name")}
              />
              <InfoRow
                label="Mobile Number"
                value={payout.accountDetails.mobileNumber}
                icon={getIcon("Mobile Number")}
              />
            </>
          )}

          {payout.method === "Bank Transfer" && (
            <>
              <InfoRow
                label="Account Holder"
                value={payout.accountDetails.accountName}
                icon={getIcon("Account Name")}
              />

              <InfoRow
                label="Bank Name"
                value={payout.accountDetails.bankName}
                icon={getIcon("Bank Name")}
              />

              <InfoRow
                label="Account Number"
                value={payout.accountDetails.accountNumber}
                icon={getIcon("Account Number")}
              />

              <InfoRow
                label="SWIFT Code"
                value={payout.accountDetails.swiftCode}
                icon={getIcon("SWIFT Code")}
              />

              <InfoRow
                label="IBAN"
                value={payout.accountDetails.iban}
                icon={getIcon("IBAN")}
              />
            </>
          )}
        </View>

        {/* TIMELINE (VISUAL TOUCH LIKE MOCK) */}
        {/* TIMELINE */}
        <View style={styles.card}>
          <Text style={styles.title}>Timeline</Text>

          <TimelineStep label="Request Submitted" status="done" />

          <TimelineStep
            label="Processing"
            status={
              payout.status === "pending"
                ? "active"
                : payout.status === "completed"
                  ? "done"
                  : payout.status === "rejected" ||
                      payout.status === "Cancelled"
                    ? "failed"
                    : "idle"
            }
          />

          <TimelineStep
            label="Completed"
            status={payout.status === "completed" ? "done" : "idle"}
          />

          {payout.status === "failed" && (
            <TimelineStep label="Failed" status="failed" />
          )}
        </View>
        {/* CANCEL */}
        {payout.status === "pending" &&
          (user?.role === "admin" ? (
            <View className=" flex flex-row justify-between py-4">
              <TouchableOpacity
                style={styles.cancel}
                onPress={rejectWithdrawal}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.cancelText}>Reject</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: PRIMARY,
                  padding: 16,
                  borderRadius: 14,
                  alignItems: "center",
                }}
                onPress={approveWithdrawal}
                disabled={approveLoading}
              >
                {approveLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.cancelText}>Approve Withdrawal</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cancel}
              onPress={cancelWithdrawal}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.cancelText}>Cancel Withdrawal</Text>
              )}
            </TouchableOpacity>
          ))}
      </ScrollView>
    </>
  );
}

/* helper for badge color */
function statusColor(status: string) {
  switch (status) {
    case "pending":
      return { backgroundColor: "#f59e0b" };

    case "completed":
      return { backgroundColor: "#16a34a" };

    case "failed":
    case "rejected":
    case "Cancelled":
    case "cancelled":
      return { backgroundColor: "#dc2626" };

    default:
      return { backgroundColor: "#6b7280" };
  }
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100, paddingTop: 32 },

  /* HERO */
  hero: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  iconWrap: {
    width: 75,
    height: 75,
    borderRadius: 16,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  icon: { width: 70, height: 70, borderRadius: 16 },
  method: { fontSize: 18, fontWeight: "700", marginTop: 10 },
  amount: { fontSize: 34, fontWeight: "800", marginTop: 8 },

  badge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: "#fff", fontWeight: "700" },

  /* CARDS */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },

  row: { marginBottom: 12 },
  label: { color: "#666", fontSize: 12 },

  value: {
    fontWeight: "700",
    fontSize: 14,
    marginTop: 2,
    textTransform: "capitalize",
  },

  copyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  /* ACTION */
  cancel: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 6,
  },
  infoRow: {
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  timelineText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 13,
  },
  headerTitle: {
    fontSize: 30,
    marginTop: 10,
    fontWeight: "900",
    marginBottom: 30,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
