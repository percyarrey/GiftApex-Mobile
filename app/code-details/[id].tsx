// app/(user)/code-details/[id].tsx

import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Dialog,
  TextInput as PaperInput,
  Portal,
} from "react-native-paper";
import Toast from "react-native-toast-message";
const ImageZoom: any = require("react-native-image-pan-zoom").default;

/* ================= THEME ================= */

const PRIMARY = "rgb(1, 107, 1)";
const BG = "#F7F8FA";
const CARD = "#FFFFFF";
const TEXT = "#111111";
const MUTED = "#666666";
const BORDER = "#E5E7EB";

type Status = "pending" | "approved" | "rejected";

interface GiftCode {
  _id: string;

  user: {
    name: string;
    email: string;
  };

  userId: string;

  status: Status;

  codes: Array<{
    _id: string;

    code: string;

    image: {
      front?: string;
      back?: string;
      receipt?: string;
    };

    status: Status;

    reward?: number;
  }>;

  new: boolean;
  deleted: boolean;

  currency: string;
  value: number;

  note?: string;

  createdAt: string;
  updatedAt: string;
}

export default function CodeDetailsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [giftCode, setGiftCode] = useState<GiftCode | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );
  /* APPROVAL VAR */
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [reward, setReward] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const [selectedImage, setSelectedImage] = useState<{
    title: string;
    uri: string;
  } | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);

  /* ================= FETCH ================= */

  const fetchGiftCode = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/code-detail/${id}`, {
        method: "GET",
        headers: {
          "x-user-email": user?.email || "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        Toast.show({
          type: "error",
          text1: "Request not found",
        });

        router.back();
        return;
      }

      const result = await response.json();
      setGiftCode(result);
    } catch (error) {
      console.log(error);

      Toast.show({
        type: "error",
        text1: "Failed to load details",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGiftCode();
  }, [id]);

  /* ================= TOTALS ================= */

  const totalReward = useMemo(() => {
    return (
      giftCode?.codes.reduce((total, code) => {
        return total + (Number(code.reward) || 0);
      }, 0) || 0
    );
  }, [giftCode]);

  const totalUSD = useMemo(() => {
    if (!giftCode) return 0;

    return (totalReward * giftCode.value) / 100;
  }, [giftCode, totalReward]);

  /* ================= STATUS COLOR ================= */

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "approved":
        return "#16A34A"; // green

      case "rejected":
        return "#DC2626"; // red

      case "pending":
        return "#EAB308"; // yellow

      default:
        return "#6B7280"; // gray fallback
    }
  };

  /* ================= ADMIN ACTIONS ================= */

  const handleApprove = (id: string) => {
    setSelectedId(id);
    setReward("");
    setShowApproveModal(true);
  };

  const handleApproveConfirm = () => {
    const amount = Number(reward);

    if (isNaN(amount) || amount <= 0) {
      Toast.show({
        type: "error",
        text1: "Please enter a valid reward amount",
      });
      return;
    }

    setGiftCode((prev) =>
      prev
        ? {
            ...prev,
            codes: prev.codes.map((code) =>
              code._id === selectedId
                ? {
                    ...code,
                    status: "approved",
                    reward: amount,
                  }
                : code,
            ),
          }
        : prev,
    );

    setShowApproveModal(false);

    Toast.show({
      type: "success",
      text1: "Code approved",
    });
  };

  const handleReject = (id: string) => {
    setGiftCode((prev) => {
      if (!prev) return prev;

      return {
        ...prev,

        codes: prev.codes.map((code) => {
          if (code._id === id) {
            return {
              ...code,
              status: "rejected",
              reward: 0,
            };
          }

          return code;
        }),
      };
    });
  };

  /* ================= SAVE ADMIN CHANGES ================= */

  const handleSave = async () => {
    if (!giftCode) return;

    setSaveLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/recent-requests`, {
        method: "POST",

        headers: {
          "x-user-email": user?.email || "",
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          new: false,
          data: giftCode,
        }),
      });

      if (!response.ok) {
        throw new Error();
      }

      Toast.show({
        type: "success",
        text1: "Changes saved Succesfully ",
      });

      fetchGiftCode();
    } catch (error) {
      console.log(error);

      Toast.show({
        type: "error",
        text1: "Failed to save changes",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />

        <Text style={{ marginTop: 12, color: MUTED }}>Loading details...</Text>
      </View>
    );
  }

  if (!giftCode) {
    return null;
  }

  /* ================= UI ================= */

  return (
    <>
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: BG,
        }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchGiftCode();
            }}
          />
        }
      >
        <StatusBar
          barStyle={user?.role === "admin" ? "light-content" : "dark-content"}
        />
        {/* ================= HEADER ================= */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.title}>
            Code <Text style={{ color: PRIMARY }}>Details</Text>
          </Text>

          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 100,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: BORDER,
            }}
          >
            <Text
              style={{
                color: getStatusColor(giftCode.status),
                fontWeight: "800",
                textTransform: "capitalize",
              }}
            >
              {giftCode.status}
            </Text>
          </View>
        </View>

        {/* ================= USER INFO ================= */}

        {user?.role === "admin" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>User Information</Text>

            <Text style={styles.infoText}>
              Name: <Text style={styles.bold}>{giftCode.user?.name}</Text>
            </Text>

            <Text style={styles.infoText}>
              Email: <Text style={styles.bold}>{giftCode.user?.email}</Text>
            </Text>
          </View>
        )}

        {/* ================= REQUEST INFO ================= */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Request Information</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={async () => {
              await Clipboard.setStringAsync(giftCode._id);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text style={styles.infoText}>
              Request ID: <Text style={styles.bold}>{giftCode._id}</Text>
            </Text>

            <Ionicons name="copy-outline" size={16} color="green" />
          </TouchableOpacity>
          {/* <Text style={styles.infoText}>
            Request ID: <Text style={styles.bold}>{giftCode._id}</Text>
          </Text> */}
          <Text style={styles.infoText}>
            Currency: <Text style={styles.bold}>{giftCode.currency}</Text>
          </Text>

          <Text style={styles.infoText}>
            Rate: <Text style={styles.bold}>{giftCode.value}%</Text>
          </Text>

          <Text style={styles.infoText}>
            Note: <Text style={styles.bold}>{giftCode.note || "N/A"}</Text>
          </Text>
        </View>

        {/* ================= CODES ================= */}

        <Text style={styles.sectionBig}>Gift Codes</Text>

        {giftCode.codes.map((code, index) => {
          const rewardUSD = (
            (Number(code.reward || 0) * giftCode.value) /
            100
          ).toFixed(2);

          const expanded = expandedCards[code._id];

          return (
            <View key={code._id} style={styles.codeCard}>
              {/* ================= COLLAPSE HEADER ================= */}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleCard(code._id)}
                style={styles.collapseHeader}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeIndex}>#{index + 1}</Text>

                  <Text
                    numberOfLines={1}
                    style={{
                      color: TEXT,
                      fontWeight: "700",
                      marginTop: 4,
                    }}
                  >
                    {code.code}
                  </Text>
                </View>

                <View
                  style={{
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: getStatusColor(code.status),
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 100,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 12,
                        textTransform: "capitalize",
                      }}
                    >
                      {code.status}
                    </Text>
                  </View>
                  <View className=" flex flex-row gap-2">
                    <Text
                      className="text-muted font-light"
                      style={{ color: PRIMARY }}
                    >
                      {expanded ? "Show less" : "Show more"}
                    </Text>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={PRIMARY}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* ================= COLLAPSE CONTENT ================= */}

              {expanded && (
                <>
                  {/* REWARD */}
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 18,
                      gap: 12,
                    }}
                  >
                    <View style={styles.smallBox}>
                      <Text style={styles.smallLabel}>Reward</Text>

                      <Text style={styles.smallValue}>{code.reward || 0}</Text>
                    </View>

                    <View style={styles.smallBox}>
                      <Text style={styles.smallLabel}>USD Earned</Text>

                      <Text style={styles.smallValue}>${rewardUSD}</Text>
                    </View>
                  </View>

                  {/* IMAGES */}
                  <Text
                    style={[
                      styles.label,
                      {
                        marginTop: 20,
                        marginBottom: 10,
                      },
                    ]}
                  >
                    Uploaded Images
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                      }}
                    >
                      {[
                        {
                          key: "receipt",
                          title: "Receipt",
                          uri: code?.image?.receipt,
                        },

                        {
                          key: "front",
                          title: "Front",
                          uri: code?.image?.front,
                        },

                        {
                          key: "back",
                          title: "Back",
                          uri: code?.image?.back,
                        },
                      ].map((img) => (
                        <TouchableOpacity
                          key={img.key}
                          disabled={!img.uri}
                          onPress={() => {
                            if (!img.uri) return;

                            setSelectedImage({
                              title: img.title,
                              uri: img.uri,
                            });
                          }}
                          style={styles.imageCard}
                        >
                          {img.uri ? (
                            <Image
                              source={{
                                uri: img.uri,
                              }}
                              style={{
                                width: "100%",
                                height: "100%",
                              }}
                              contentFit="cover"
                            />
                          ) : (
                            <View
                              style={{
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Ionicons
                                name="image-outline"
                                size={28}
                                color={MUTED}
                              />

                              <Text
                                style={{
                                  color: MUTED,
                                  marginTop: 6,
                                  fontSize: 12,
                                }}
                              >
                                No Image
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* ADMIN ACTIONS */}
                  {user?.role === "admin" && (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginTop: 22,
                      }}
                    >
                      {code.status !== "rejected" && (
                        <Button
                          mode="outlined"
                          textColor="#DC2626"
                          style={{
                            flex: 1,
                            borderColor: "#DC2626",
                          }}
                          onPress={() => handleReject(code._id)}
                        >
                          Reject
                        </Button>
                      )}

                      {code.status !== "approved" && (
                        <Button
                          mode="contained"
                          buttonColor={PRIMARY}
                          style={{
                            flex: 1,
                          }}
                          onPress={() => handleApprove(code._id)}
                        >
                          Approve
                        </Button>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}

        {/* ================= SUMMARY ================= */}

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Reward</Text>

            <Text style={styles.summaryValue}>{totalReward}</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Rate</Text>

            <Text style={styles.summaryValue}>{giftCode.value}%</Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total USD</Text>

            <Text style={styles.summaryValue}>${totalUSD.toFixed(2)}</Text>
          </View>
        </View>

        {/* ================= SAVE BUTTON ================= */}

        {user?.role === "admin" && (
          <Button
            mode="contained"
            buttonColor={PRIMARY}
            loading={saveLoading}
            disabled={giftCode.codes.some((e) => e.status === "pending")}
            style={{
              marginTop: 25,
              borderRadius: 14,
              paddingVertical: 5,
            }}
            onPress={handleSave}
          >
            Save All Changes
          </Button>
        )}
      </ScrollView>

      {/* ================= IMAGE MODAL ================= */}

      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "black",
          }}
        >
          {/* HEADER */}
          <View
            style={{
              position: "absolute",
              top: 55,
              left: 20,
              right: 20,
              zIndex: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              {selectedImage?.title}
            </Text>

            <Pressable onPress={() => setSelectedImage(null)}>
              <Ionicons name="close" size={30} color="white" />
            </Pressable>
          </View>

          {selectedImage?.uri && (
            <ImageZoom
              cropWidth={Dimensions.get("window").width}
              cropHeight={Dimensions.get("window").height}
              imageWidth={Dimensions.get("window").width}
              imageHeight={Dimensions.get("window").height}
              minScale={1}
              maxScale={5}
              enableCenterFocus
            >
              <Image
                source={{ uri: selectedImage.uri }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                contentFit="contain"
              />
            </ImageZoom>
          )}
        </View>
      </Modal>

      <Portal>
        <Dialog
          visible={showApproveModal}
          onDismiss={() => setShowApproveModal(false)}
        >
          <Dialog.Title>Enter Reward(USD)</Dialog.Title>

          <Dialog.Content>
            <PaperInput
              mode="outlined"
              label="Reward Amount"
              value={reward}
              onChangeText={setReward}
              keyboardType="numeric"
              outlineColor="#D1D5DB"
              activeOutlineColor={PRIMARY}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setShowApproveModal(false)}>Cancel</Button>

            <Button
              mode="contained"
              style={{ borderRadius: 6 }}
              buttonColor={PRIMARY}
              onPress={handleApproveConfirm}
            >
              Approve
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: TEXT,
    marginTop: 20,
    marginBottom: 20,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 14,
  },

  sectionBig: {
    fontSize: 24,
    fontWeight: "900",
    color: TEXT,
    marginTop: 10,
    marginBottom: 15,
  },

  infoText: {
    color: MUTED,
    marginBottom: 8,
    fontSize: 15,
  },

  bold: {
    color: TEXT,
    fontWeight: "700",
  },

  codeCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 16,
  },

  codeIndex: {
    fontSize: 18,
    fontWeight: "900",
    color: PRIMARY,
  },

  label: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 6,
  },

  codeText: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },

  smallBox: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
  },

  smallLabel: {
    color: MUTED,
    fontSize: 12,
  },

  smallValue: {
    color: TEXT,
    fontWeight: "800",
    fontSize: 18,
    marginTop: 5,
  },

  imageCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
  },

  summaryCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 14,
  },

  summaryBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },

  summaryLabel: {
    color: MUTED,
    fontSize: 13,
  },

  summaryValue: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 20,
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  collapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
