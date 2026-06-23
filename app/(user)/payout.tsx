import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
const PRIMARY = "rgb(1, 107, 1)";

interface Payout {
  _id: string;
  method: string;
  createdAt: string;
  amount: number;
  status: "pending" | "completed" | "rejected" | "Cancelled";
}

const withdrawalOptions = [
  {
    id: "bnb",
    name: "BNB Smart Chain (BEP20)",
    image: "bnb.png",
  },
  {
    id: "binance_id",
    name: "Binance ID",
    image: "binance_id.webp",
  },
  {
    id: "mtn",
    name: "MTN Mobile Money",
    image: "mtn.jpg",
  },
  {
    id: "orange",
    name: "Orange Money",
    image: "orange.png",
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    image: "bank_transfer.png",
  },
];
export default function PayoutScreen() {
  const [countryCode, setCountryCode] = useState<CountryCode>("CM"); // Defaults to Cameroon
  const [callingCode, setCallingCode] = useState("237"); // Defaults to +237
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);

  const { user } = useAuthStore();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        await fetchData();
      };

      run();
    }, []),
  );
  const router = useRouter();
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
      case "Cancelled":
      case "cancelled":
        return "#ef4444";

      case "completed":
        return "#16a34a";

      default:
        return PRIMARY;
    }
  };

  const handleWithdraw = async () => {
    if (Number(data.amount) < 10) {
      setError("Minimum withdrawal amount is $10");
      return;
    }

    if (Number(data.amount) > available.available) {
      setError("Insufficient funds");
      return;
    }

    try {
      setSaveLoading(true);

      const res = await fetch(`${API_URL}/api/user/payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          ...data,
          mobileNumber: callingCode + data.mobileNumber,
          method:
            withdrawalOptions.find((e) => e.id === selectedOption)?.name || "",
        }),
      });

      const result = await res.json();

      if (result.success) {
        setModalVisible(false);
        Toast.show({
          type: "success",
          text1: "Withdrawal request submitted successfully.",
        });
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

        setSelectedOption(null);
        setError("");

        fetchData();
      } else {
        Toast.show({
          type: "error",
          text1: "Request failed",
        });
      }
    } catch (err) {
      console.log(err);
      Toast.show({
        type: "error",
        text1: "Something went wrong. Please try again.",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const disableSubmit = () => {
    if (!selectedOption) return true;

    if (selectedOption === "bnb" && !data.bnbAddress) {
      return true;
    }

    if (selectedOption === "binance_id" && !data.binanceId) {
      return true;
    }

    if (
      (selectedOption === "mtn" || selectedOption === "orange") &&
      (!data.accountName || !data.mobileNumber)
    ) {
      return true;
    }

    if (
      selectedOption === "bank_transfer" &&
      (!data.bankName || !data.accountNumber || !data.accountName)
    ) {
      return true;
    }

    if (!data.amount) {
      return true;
    }

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
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>
        <Text style={{ color: PRIMARY }}>P</Text>ayouts
      </Text>

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
          <TouchableOpacity
            key={p._id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/payout-detail/[id]",
                params: {
                  id: p._id,
                },
              })
            }
          >
            <View style={styles.card}>
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
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
                onPress={async () => {
                  await Clipboard.setStringAsync(p._id);

                  Toast.show({
                    type: "success",
                    text1: "Transaction ID copied",
                  });
                }}
              >
                <Ionicons name="copy-outline" size={14} color="#666" />
                <Text
                  style={{
                    color: "#666",
                    fontSize: 12,
                    flex: 1,
                    marginRight: 8,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {p._id}
                </Text>

                <Ionicons name="copy-outline" size={16} color="green" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        {payouts.length === 0 && (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
              <Ionicons name="receipt-outline" size={34} color="#9CA3AF" />
            </View>

            <Text className="text-gray-800 font-semibold text-base mt-4">
              No payout requests yet
            </Text>

            <Text className="text-gray-500 text-sm text-center mt-1 px-10">
              Your withdrawal history will appear here once you make a request.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={100}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: keyboardHeight + 80,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              paddingTop: 30,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "800",
              }}
            >
              Withdrawal
            </Text>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#444" />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              color: "#666",
              marginBottom: 25,
            }}
          >
            Select Withdrawal Method
          </Text>
          {/* OPTIONS */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {withdrawalOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedOption(option.id)}
                style={{
                  width: "30%",
                  marginBottom: 12,
                  borderRadius: 14,
                  borderWidth: selectedOption === option.id ? 2 : 1,
                  borderColor: selectedOption === option.id ? PRIMARY : "#ddd",
                  elevation: selectedOption === option.id ? 10 : 1,
                  padding: 5,
                  backgroundColor:
                    selectedOption === option.id ? "#f0fff4" : "#fff",
                }}
              >
                <Image
                  source={{
                    uri: `${API_URL}/payout/${option.image}`,
                  }}
                  style={{
                    width: "100%",
                    height: 70,
                    borderRadius: 10,
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
          {/* Selected Method */}
          {selectedOption && (
            <>
              <Divider style={{ marginVertical: 20 }} />
              <View
                style={{
                  padding: 15,
                  borderRadius: 12,
                  marginBottom: 0,
                  backgroundColor: "#f7f7f7",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View className="w-6 h-6 mr-2 border-2 border-gray-300 rounded-full flex items-center justify-center relative">
                  <View className="w-4 h-4 bg-green-500 rounded-full absolute"></View>
                </View>
                <Text
                  style={{
                    fontWeight: "700",
                  }}
                >
                  {withdrawalOptions.find((e) => e.id === selectedOption)?.name}
                </Text>
              </View>
            </>
          )}
          {/* BNB */}
          {selectedOption === "bnb" && (
            <>
              <Text
                style={{
                  marginTop: 20,
                  marginBottom: 0,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                BNB Wallet Address
              </Text>

              <TextInput
                placeholder="Enter BNB Wallet Address"
                value={data.bnbAddress}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    bnbAddress: text,
                  }))
                }
                style={[
                  styles.input,
                  {
                    marginBottom: 12,
                  },
                ]}
              />
            </>
          )}
          {/* BINANCE ID */}
          {selectedOption === "binance_id" && (
            <>
              <Text
                style={{
                  marginTop: 20,
                  marginBottom: 0,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Binance ID
              </Text>

              <TextInput
                placeholder="Enter Binance ID"
                value={data.binanceId}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    binanceId: text,
                  }))
                }
                style={[
                  styles.input,
                  {
                    marginBottom: 12,
                  },
                ]}
              />
            </>
          )}
          {/*MTN / ORANGE*/}
          {(selectedOption === "mtn" || selectedOption === "orange") && (
            <>
              <Text
                style={{
                  marginTop: 20,
                  marginBottom: 5,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Mobile Number
              </Text>

              {/* Row Container for Picker + Input */}
              <View style={styles.phoneInputContainer}>
                {/* Trigger Button for Country Picker */}
                <TouchableOpacity
                  style={styles.countryPickerTrigger}
                  onPress={() => setCountryPickerVisible(true)}
                >
                  <CountryPicker
                    countryCode={countryCode}
                    withFilter
                    withFlag
                    withCallingCode
                    withAlphaFilter={false}
                    visible={countryPickerVisible}
                    onSelect={(country: Country) => {
                      setCountryCode(country.cca2);
                      setCallingCode(country.callingCode[0] || "");
                      setCountryPickerVisible(false);
                    }}
                    onClose={() => setCountryPickerVisible(false)}
                    modalProps={{
                      animationType: "slide",
                      presentationStyle: "pageSheet",
                    }}
                    filterProps={{
                      style: {
                        marginVertical: 20,
                        marginTop: 30,
                      },
                    }}
                    // FIX 2: Safeguards against top overlapping on Android devices
                    containerButtonStyle={{ display: "none" }} // Hides the default button
                    /* containerButonStyle={{ display: 'none' }} */ // Hides default text styling
                  />
                  <Text style={styles.callingCodeText}>+{callingCode}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#666"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>

                {/* Actual Phone Number Input Field */}
                <TextInput
                  placeholder="Enter Mobile Number"
                  keyboardType="phone-pad"
                  value={data.mobileNumber}
                  onChangeText={(text) =>
                    setData((p) => ({
                      ...p,
                      mobileNumber: text,
                    }))
                  }
                  style={styles.phoneNumberInput}
                />
              </View>

              <Text
                style={{
                  marginTop: 4,
                  marginBottom: 5,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Account Name
              </Text>

              <TextInput
                placeholder="Enter Account Name"
                value={data.accountName}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    accountName: text,
                  }))
                }
                style={[styles.input, { marginBottom: 12 }]}
              />
            </>
          )}

          {/*BANK TRANSFER*/}
          {selectedOption === "bank_transfer" && (
            <>
              <Text
                style={{
                  marginTop: 20,

                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Bank Name
              </Text>

              <TextInput
                placeholder="Enter Bank Name"
                value={data.bankName}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    bankName: text,
                  }))
                }
                style={[
                  styles.input,
                  {
                    marginBottom: 12,
                  },
                ]}
              />

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Account Number
              </Text>

              <TextInput
                placeholder="Enter Account Number"
                value={data.accountNumber}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    accountNumber: text,
                  }))
                }
                style={[
                  styles.input,
                  {
                    marginBottom: 12,
                  },
                ]}
              />

              <Text
                style={{
                  marginTop: 6,

                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                Account Holder Name
              </Text>

              <TextInput
                placeholder="Enter Account Holder Name"
                value={data.accountName}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    accountName: text,
                  }))
                }
                style={[
                  styles.input,
                  {
                    marginBottom: 12,
                  },
                ]}
              />

              <Text
                style={{
                  marginTop: 6,

                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                SWIFT Code (Optional)
              </Text>

              <TextInput
                placeholder="Enter SWIFT Code"
                value={data.swiftCode}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    swiftCode: text,
                  }))
                }
                style={[
                  styles.input,
                  {
                    marginBottom: 12,
                  },
                ]}
              />

              <Text
                style={{
                  marginTop: 6,

                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                IBAN (Optional)
              </Text>

              <TextInput
                placeholder="Enter IBAN"
                value={data.iban}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    iban: text,
                  }))
                }
                style={[
                  styles.input,
                  {
                    marginBottom: 12,
                  },
                ]}
              />
            </>
          )}
          {/*AMOUNT*/}
          {selectedOption && (
            <>
              <Text
                className="mt-6 text-lg"
                style={{
                  fontWeight: "600",
                }}
              >
                Withdrawal Amount
              </Text>
              <View className="flex flex-row items-center gap-2 mb-3 mt-2">
                <Text className=" text-gray-600">Available</Text>

                <Text
                  style={{
                    color: PRIMARY,
                    fontWeight: "700",
                  }}
                >
                  ${available.available}
                </Text>
              </View>

              <TextInput
                placeholder="Enter amount to withdraw"
                keyboardType="numeric"
                value={data.amount}
                onChangeText={(text) =>
                  setData((p) => ({
                    ...p,
                    amount: text,
                  }))
                }
                style={styles.input}
              />

              <Text
                style={{
                  color: "#777",
                  fontSize: 13,
                  fontStyle: "italic",
                  marginTop: 6,
                }}
              >
                You can withdraw a{" "}
                <Text style={{ fontWeight: "700" }}>minimum of $10</Text> from
                your available balance.
              </Text>
            </>
          )}
          {!!error && (
            <Text
              style={{
                color: "red",
                marginTop: 6,
              }}
            >
              {error}
            </Text>
          )}
          {selectedOption && (
            <TouchableOpacity
              disabled={disableSubmit() || saveLoading}
              onPress={handleWithdraw}
              style={[
                styles.submit,
                {
                  marginTop: 25,
                  opacity: disableSubmit() || saveLoading ? 0.5 : 1,
                },
              ]}
            >
              {saveLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  Request Withdrawal
                </Text>
              )}
            </TouchableOpacity>
          )}
        </KeyboardAwareScrollView>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: { fontSize: 26, fontWeight: "800", marginBottom: 20, marginTop: 0 },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
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
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgb(1, 107, 1)", // Matching your primary green border
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  countryPickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#f5f5f5",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  callingCodeText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 6,
    color: "#333",
  },
  phoneNumberInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#000",
  },

  error: { color: "red", marginTop: 5 },
});
