import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  Menu,
  Modal,
  Portal,
} from "react-native-paper";
import Toast from "react-native-toast-message";

const PRIMARY = "#016B01";

const currencyOptions = [
  "USD",
  "CAD",
  "UK",
  "AUD",
  "EUR",
  "CHF",
  "NZD",
  "GBP",
  "CFA",
];

export default function PriceListScreen() {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // ================= SEARCH + FILTER =================
  const [search, setSearch] = useState("");
  const [filterCurrencies, setFilterCurrencies] = useState<string[]>([]);
  const [filterMenu, setFilterMenu] = useState(false);

  // ================= MODAL =================
  const [visible, setVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState("");

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  /* Modal Giftcade */
  const [ModalMenu, setModalMenu] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGiftCards();
    setRefreshing(false);
  };

  const confirmDelete = (item: any) => {
    setSelectedItem(item);
    setDeleteDialogVisible(true);
  };

  const [data, setData] = useState({
    name: "",
    currencies: [] as { currency: string; value: number }[],
  });

  const [currency, setCurrency] = useState({
    currency: "",
    value: 0,
  });

  const addCurrency = () => {
    if (!currency.currency || currency.value > 100) return;

    const exists = data.currencies.some(
      (c) => c.currency === currency.currency,
    );

    if (exists) return;

    setData((prev) => ({
      ...prev,
      currencies: [...prev.currencies, currency],
    }));

    setCurrency({ currency: "", value: 0 });
  };

  const removeCurrency = (cur: any) => {
    setData((prev) => ({
      ...prev,
      currencies: prev.currencies.filter((c) => c.currency !== cur.currency),
    }));
  };

  // ================= FETCH =================
  const fetchGiftCards = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/price-list`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
      });

      const json = await res.json();
      setGiftCards(json);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
  }, []);
  const toggleCurrencyFilter = (currency: string) => {
    setFilterCurrencies((prev) => {
      if (prev.includes(currency)) {
        return prev.filter((c) => c !== currency);
      }
      return [...prev, currency];
    });
  };
  // ================= FILTER LOGIC =================
  const filteredGiftCards = useMemo(() => {
    return giftCards.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCurrency =
        filterCurrencies.length === 0
          ? true
          : filterCurrencies.some(
              (cur) => item.currencies?.[cur] !== undefined,
            );

      return matchesSearch && matchesCurrency;
    });
  }, [giftCards, search, filterCurrencies]);

  // ================= MODAL =================
  const openModal = (id?: string) => {
    setIsEdit(!!id);

    const giftCard = id ? giftCards.find((g) => g._id === id) : null;

    const currencies = giftCard
      ? Object.entries(giftCard.currencies || {})
          .filter(([k]) => k !== "_id")
          .map(([k, v]) => ({
            currency: k,
            value: v as number,
          }))
      : [];

    setData({
      name: giftCard?.name || "",
      currencies,
    });

    setCurrency({ currency: "", value: 0 });
    setCurrentId(id || "");
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setData({ name: "", currencies: [] });
    setCurrency({ currency: "", value: 0 });
    setCurrentId("");
    setIsEdit(false);
  };

  // ================= SUBMIT =================
  const submit = async () => {
    if (!data.name || data.currencies.length < 1) return;

    const payload = {
      name: data.name,
      currencies: Object.fromEntries(
        data.currencies.map((c) => [c.currency, c.value]),
      ),
    };

    const url = isEdit
      ? `${API_URL}/api/admin/price-list/${currentId}`
      : `${API_URL}/api/admin/price-list`;

    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        console.log("❌ Submit failed:", {
          status: res.status,
          error: result,
        });

        Toast.show({
          type: "error",
          text1: result?.message || "Something went wrong",
        });

        return;
      }

      setGiftCards((prev) =>
        isEdit
          ? prev.map((g) => (g._id === currentId ? result : g))
          : [...prev, result],
      );

      Toast.show({
        type: "success",
        text1: isEdit
          ? "Giftcard Updated Successfully"
          : "Giftcard Created Successfully",
      });

      closeModal();
    } catch (error) {
      console.log("🔥 Network/Server error:", error);

      Toast.show({
        type: "error",
        text1: "Something went wrong",
      });
    }
  };

  // ================= DELETE =================
  const deleteGiftCard = async (id: string) => {
    await fetch(`${API_URL}/api/admin/price-list/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": user?.email || "",
      },
    });

    setGiftCards((prev) => prev.filter((g) => g._id !== id));
  };

  // ================= RENDER =================
  const renderItem = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{item.name}</Text>

        <View style={styles.chipContainer}>
          {Object.entries(item.currencies || {})
            .filter(([k]) => k !== "_id")
            .map(([k, v]) => (
              <Chip key={k} style={styles.chip}>
                {k}: {String(v)}
              </Chip>
            ))}
        </View>

        <Divider style={{ marginVertical: 10 }} />

        <View style={styles.row}>
          <Button
            mode="contained"
            buttonColor={PRIMARY}
            onPress={() => openModal(item._id)}
          >
            Edit
          </Button>

          <Button
            mode="outlined"
            textColor="red"
            buttonColor="transparent"
            style={{ borderColor: "red" }}
            onPress={() => confirmDelete(item)}
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <View style={styles.container}>
        {/* ================= SEARCH ================= */}
        <TextInput
          placeholder="Search gift card..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        {/* ================= FILTER ================= */}
        <View style={styles.filterRow}>
          <Menu
            visible={filterMenu}
            onDismiss={() => setFilterMenu(false)}
            anchor={
              <Button onPress={() => setFilterMenu(true)}>
                Filter ({filterCurrencies.length})
              </Button>
            }
          >
            {currencyOptions.map((c) => {
              const selected = filterCurrencies.includes(c);

              return (
                <Menu.Item
                  key={c}
                  onPress={() => toggleCurrencyFilter(c)}
                  title={selected ? `✓ ${c}` : c}
                />
              );
            })}
          </Menu>

          <Button
            mode="contained"
            icon={() => <Ionicons name="add" size={18} color="white" />}
            buttonColor={PRIMARY}
            onPress={() => openModal()}
            style={{ marginLeft: 10, borderRadius: 10 }}
          >
            Add Gift Card
          </Button>
        </View>

        {/* ================= ACTIVE FILTER ================= */}
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View style={styles.activeFilters}>
            {filterCurrencies.map((cur) => (
              <View key={cur} style={styles.filterChip}>
                <Text style={{ color: PRIMARY }}>{cur}</Text>

                <TouchableOpacity
                  onPress={() =>
                    setFilterCurrencies((prev) => prev.filter((c) => c !== cur))
                  }
                >
                  <Ionicons name="close-circle" size={18} color={PRIMARY} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {filterCurrencies.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setFilterCurrencies([]);
              }}
            >
              <Text style={{ color: PRIMARY }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ================= LIST ================= */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={{ marginTop: 10, color: PRIMARY, fontWeight: "600" }}>
              Loading gift cards...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredGiftCards}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}

        {/* ================= MODAL ================= */}
        <Portal>
          <Modal
            visible={visible}
            onDismiss={closeModal}
            contentContainerStyle={{ flex: 1, margin: 0 }}
          >
            <KeyboardAvoidingView behavior={"position"}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modal}
              >
                <View className="mb-8 flex items-center flex-row justify-between">
                  <Text className=" text-xl font-bold  ">
                    {isEdit ? "Update Gift Card" : "Create Gift Card"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      closeModal();
                    }}
                    className="px-5 py-2 "
                  >
                    <Text className=" text-xl font-bold  text-red-500">X</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="Gift Card Name"
                  value={data.name}
                  onChangeText={(t) => setData((p) => ({ ...p, name: t }))}
                  style={styles.input}
                />

                {/* ================= EXISTING CURRENCIES ================= */}
                <Text className=" text-md" style={{ marginTop: 20 }}>
                  Currency list:{" "}
                  {data.currencies.length < 1 && (
                    <Text className=" text-gray-400">
                      Add currencies below{" "}
                    </Text>
                  )}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 4,
                    marginBottom: 10,
                  }}
                >
                  {data.currencies.map((c) => (
                    <TouchableOpacity
                      key={c.currency}
                      onPress={() => removeCurrency(c)}
                      style={{
                        borderWidth: 1,
                        borderColor: PRIMARY,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        margin: 3,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={{ color: PRIMARY }}>
                        {c.currency}: {c.value}
                      </Text>

                      <Ionicons name="close-circle" size={18} color={"red"} />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ================= ADD CURRENCY ================= */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Menu
                    visible={ModalMenu}
                    onDismiss={() => {
                      setModalMenu(false);
                    }}
                    anchorPosition="bottom"
                    anchor={
                      <TouchableOpacity
                        style={{
                          borderWidth: 1,
                          borderColor: PRIMARY,
                          padding: 10,
                          borderRadius: 10,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                        }}
                        onPress={() => {
                          setModalMenu(true);
                        }}
                      >
                        <Text>{currency.currency || "Select Currency"}</Text>
                      </TouchableOpacity>
                    }
                  >
                    {currencyOptions.map((c) => (
                      <Menu.Item
                        key={c}
                        title={c}
                        onPress={() => {
                          setCurrency((p) => ({ ...p, currency: c }));
                          setModalMenu(false);
                        }}
                      />
                    ))}
                  </Menu>

                  <TextInput
                    placeholder="Value in percent < 100"
                    keyboardType="numeric"
                    value={currency.value > 0 ? String(currency.value) : ""}
                    onChangeText={(t) =>
                      setCurrency((p) => ({ ...p, value: Number(t) }))
                    }
                    style={[
                      styles.input,
                      {
                        flex: 1,
                      },
                    ]}
                  />

                  <Button
                    mode="contained"
                    onPress={addCurrency}
                    buttonColor={PRIMARY}
                    disabled={!currency.currency || currency.value < 1}
                    textColor="white"
                    style={{
                      borderRadius: 0,
                      borderBottomRightRadius: 10,
                      borderTopRightRadius: 10,
                    }}
                  >
                    Add
                  </Button>
                </View>

                {/* ================= SUBMIT ================= */}
                <Button
                  mode="contained"
                  onPress={submit}
                  buttonColor={PRIMARY}
                  disabled={!data.name || data.currencies.length < 1}
                  textColor="white"
                  style={{
                    marginTop: 20,
                  }}
                >
                  {isEdit ? "Update Gift Card" : "Create Gift Card"}
                </Button>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>
        </Portal>
      </View>
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Confirm Delete</Dialog.Title>

          <Dialog.Content>
            <Text>
              Are you sure you want to delete{" "}
              <Text style={{ fontWeight: "bold" }}>{selectedItem?.name}</Text>{" "}
              GiftCard?
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>

            <Button
              textColor="red"
              onPress={async () => {
                await deleteGiftCard(selectedItem._id);
                setDeleteDialogVisible(false);
                setSelectedItem(null);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  activeFilters: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRIMARY,
    padding: 5,
    borderRadius: 10,
    gap: 5,
  },
  card: { marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap" },
  chip: { margin: 3 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  modal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
