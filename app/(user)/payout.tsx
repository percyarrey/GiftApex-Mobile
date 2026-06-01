import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "rgb(1, 107, 1)";

interface Payout {
  _id: string;
  method: string;
  createdAt: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
}

const withdrawalOptions = [
  { id: "bnb", name: "BNB Smart Chain", icon: "logo-bitcoin" },
  { id: "binance_id", name: "Binance ID", icon: "wallet-outline" },
  { id: "mtn", name: "MTN Mobile Money", icon: "phone-portrait-outline" },
  { id: "orange", name: "Orange Money", icon: "cash-outline" },
  { id: "bank_transfer", name: "Bank Transfer", icon: "business-outline" },
];

export default function PayoutScreen() {
  const { user } = useAuthStore();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [available, setAvailable] = useState({
    pending: 0,
    withdraw: 0,
    available: 0,
  });

  const [data, setData] = useState({
    amount: "",
    bnbAddress: "",
    binanceId: "",
    mobileNumber: "",
    accountName: "",
    bankName: "",
    accountNumber: "",
    swiftCode: "",
    iban: "",
  });

  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-email": user?.email || "",
      };

      const [balRes, payoutRes] = await Promise.all([
        fetch(`${API_URL}/api/user/balance`, { headers }),
        fetch(`${API_URL}/api/user/payouts`, { headers }),
      ]);

      const bal = await balRes.json();
      const pay = await payoutRes.json();

      setAvailable(bal);
      setPayouts(pay);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, "0")}.${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${date.getFullYear()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return PRIMARY;
    }
  };

  const handleWithdraw = async () => {
    if (Number(data.amount) < 10) {
      setError("Minimum withdrawal is $10");
      return;
    }

    if (Number(data.amount) > available.available) {
      setError("Insufficient balance");
      return;
    }

    await fetch(`${API_URL}/api/user/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user?.email || "",
      },
      body: JSON.stringify({
        ...data,
        method:
          withdrawalOptions.find((o) => o.id === selectedOption)?.name ||
          "Manual",
      }),
    });

    setModalVisible(false);
    setData({
      amount: "",
      bnbAddress: "",
      binanceId: "",
      mobileNumber: "",
      accountName: "",
      bankName: "",
      accountNumber: "",
      swiftCode: "",
      iban: "",
    });

    fetchData();
  };

  const disableSubmit = () => {
    if (!selectedOption) return true;
    if (!data.amount) return true;
    return false;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Payouts</Text>

      {/* BALANCE CARDS */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Ionicons name="wallet-outline" size={20} color={PRIMARY} />
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceValue}>${available.available}</Text>
        </View>

        <View style={styles.balanceCard}>
          <Ionicons name="time-outline" size={20} color="#f59e0b" />
          <Text style={styles.balanceLabel}>Pending</Text>
          <Text style={styles.balanceValue}>${available.pending}</Text>
        </View>

        <View style={styles.balanceCard}>
          <Ionicons name="cash-outline" size={20} color="#ef4444" />
          <Text style={styles.balanceLabel}>Withdrawn</Text>
          <Text style={styles.balanceValue}>${available.withdraw}</Text>
        </View>
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="arrow-down-circle-outline" size={20} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>
          Withdraw Funds
        </Text>
      </TouchableOpacity>

      {/* TRANSACTIONS */}
      <Text style={styles.sectionTitle}>Transaction History</Text>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {payouts.map((p) => (
          <View key={p._id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.amount}>${p.amount}</Text>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(p.status) },
                ]}
              >
                <Text style={styles.statusText}>{p.status}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Ionicons name="card-outline" size={14} color="#666" />
              <Text style={styles.meta}>{p.method}</Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.meta}>{formatDate(p.createdAt)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Withdraw</Text>

          <View style={styles.optionRow}>
            {withdrawalOptions.map((o) => (
              <TouchableOpacity
                key={o.id}
                onPress={() => setSelectedOption(o.id)}
                style={[
                  styles.option,
                  selectedOption === o.id && styles.optionActive,
                ]}
              >
                <Ionicons
                  name={o.icon as any}
                  size={18}
                  color={selectedOption === o.id ? PRIMARY : "#666"}
                />
                <Text style={styles.optionText}>{o.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Amount"
            value={data.amount}
            keyboardType="numeric"
            onChangeText={(t) => setData((p) => ({ ...p, amount: t }))}
            style={styles.input}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            disabled={disableSubmit()}
            onPress={handleWithdraw}
            style={[styles.submit, disableSubmit() && { opacity: 0.5 }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Request Withdrawal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={{ textAlign: "center", marginTop: 10 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: { fontSize: 26, fontWeight: "800", marginBottom: 10 },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  balanceCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },

  balanceLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  balanceValue: { fontSize: 16, fontWeight: "800" },

  btn: {
    flexDirection: "row",
    backgroundColor: PRIMARY,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginVertical: 10 },

  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },

  cardTop: { flexDirection: "row", justifyContent: "space-between" },

  amount: { fontSize: 18, fontWeight: "800" },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", marginTop: 4 },

  meta: { marginLeft: 6, color: "#666", fontSize: 12 },

  modal: { flex: 1, padding: 16, backgroundColor: "#fff" },

  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },

  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    margin: 4,
  },

  optionActive: {
    borderColor: PRIMARY,
    backgroundColor: "#e8f5e9",
  },

  optionText: { marginLeft: 6, fontSize: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  submit: {
    backgroundColor: PRIMARY,
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
  },

  error: { color: "red", marginTop: 5 },
});
