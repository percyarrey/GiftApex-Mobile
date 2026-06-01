// app/(user)/sell-code.tsx

import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { Button, Card, Divider, Modal, Portal } from "react-native-paper";

import { useAuthStore } from "@/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";

import * as FileSystem from "expo-file-system";
/* ================= THEME ================= */

const PRIMARY = "rgb(1, 107, 1)";
const PRIMARY_LIGHT = "rgba(1, 107, 1, 0.08)";
const BG = "#F7F8FA";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";

/* ================= IMAGE HELPER ================= */

const getGiftCardImage = (name: string) =>
  `https://giftapex.net/home/giftcards/${name.toLowerCase()}.svg`;

/* ================= TYPES ================= */

interface Currency {
  [key: string]: number;
}

interface GiftCard {
  name: string;
  currencies: Currency;
}

interface ImageData {
  front: string;
  back: string;
  receipt: string;
}

interface CodeEntry {
  id: string;
  image: ImageData;
  code: string;
}

interface DataState {
  codes: CodeEntry[];
  note: string;
  currency: {
    currency: string;
    value: number;
  };
}

/* ================= SCREEN ================= */

export default function SellCodeScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(
    null,
  );
  const { user } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);

  const [amount, setAmount] = useState("100");

  const [error, setError] = useState("");
  const router = useRouter();

  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [data, setData] = useState<DataState>({
    codes: [],
    note: "",
    currency: {
      currency: "",
      value: 0,
    },
  });

  const [newCode, setNewCode] = useState<CodeEntry>({
    id: "",
    code: "",
    image: {
      front: "",
      back: "",
      receipt: "",
    },
  });

  /* ================= FETCH ================= */

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/price-list`);

        const json = await res.json();

        if (Array.isArray(json)) {
          setGiftCards(json);
        }
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  /* ================= STORAGE ================= */

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("sellCodeData");

      if (saved) {
        setData(JSON.parse(saved));
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("sellCodeData", JSON.stringify(data));
  }, [data]);

  /* ================= DEFAULT CARD ================= */

  useEffect(() => {
    if (giftCards.length > 0) {
      const steam = giftCards.find((e) => e.name.toLowerCase() === "steam");

      setSelectedGiftCard(steam || giftCards[0]);
    }
  }, [giftCards]);

  /* ================= IMAGE PICKER ================= */

  const openPicker = (type: "receipt" | "front" | "back") => {
    Alert.alert("Select Image", "Choose image source", [
      {
        text: "Camera",
        onPress: () => pickImage(type, true),
      },
      {
        text: "Gallery",
        onPress: () => pickImage(type, false),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const pickImage = async (
    type: "receipt" | "front" | "back",
    useCamera: boolean,
  ) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow access");
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.6, // reduced for performance
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.6,
            base64: true,
          });

      if (result.canceled) return;

      const asset = result.assets[0];

      let base64Image = asset.base64;

      // fallback if base64 not provided (prevents silent failures)
      if (!base64Image && asset.uri) {
        base64Image = await convertToBase64(asset.uri);
      }

      if (!base64Image) {
        throw new Error("Image conversion failed");
      }
      if ((base64Image.length * 3) / 4 > 2_500_000) {
        Toast.show({
          type: "error",
          text1: "Image is too Large. Please re-upload different image.",
        });
        throw new Error("Image is too large");
      }
      const finalImage = `data:image/jpeg;base64,${base64Image}`;
      setNewCode((prev) => ({
        ...prev,
        image: {
          ...prev.image,
          [type]: finalImage,
        },
      }));
    } catch (err) {
      console.log(err);

      // 🔴 reset ONLY images so user retries cleanly
      setNewCode((prev) => ({
        ...prev,
        image: {
          receipt: "",
          front: "",
          back: "",
        },
      }));

      Toast.show({
        type: "error",
        text1: "Image failed to process. Please re-upload.",
      });
    }
  };
  /* ================= IMAGE CONVERTER================= */
  const convertToBase64 = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      if (!base64) throw new Error("Base64 conversion failed");

      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      throw error;
    }
  };

  /* ================= CLEAR IMAGES ================= */

  const clearImages = () => {
    setNewCode((prev) => ({
      ...prev,
      image: {
        front: "",
        back: "",
        receipt: "",
      },
    }));

    Toast.show({
      type: "info",
      text1: "Images Cleared",
    });
  };

  /* ================= VALIDATIONS ================= */

  const hasUploadedImage =
    !!newCode.image.front || !!newCode.image.back || !!newCode.image.receipt;

  /* ================= ADD CODE ================= */

  const handleAddCode = () => {
    if (!newCode.code.trim()) {
      setError("Please enter a gift card code");

      return;
    }

    if (
      !newCode.image.receipt &&
      (!newCode.image.front || !newCode.image.back)
    ) {
      Toast.show({
        type: "error",
        text1: "Upload receipt OR front & back images",
      });

      return;
    }

    const payload: CodeEntry = {
      ...newCode,
      id: Date.now().toString(),
    };

    setData((prev) => ({
      ...prev,
      codes: [...prev.codes, payload],
    }));

    setNewCode({
      id: "",
      code: "",
      image: {
        front: "",
        back: "",
        receipt: "",
      },
    });

    setError("");

    Toast.show({
      type: "success",
      text1: "Code Added",
    });
  };

  /* ================= DELETE ================= */

  const handleDelete = (id: string) => {
    setData((prev) => ({
      ...prev,
      codes: prev.codes.filter((item) => item.id !== id),
    }));

    Toast.show({
      type: "info",
      text1: "Code Deleted",
    });
  };
  /* IMAGE SANITIZER */
  const sanitizeImages = (imageObj: ImageData): ImageData => {
    return {
      receipt: imageObj.receipt || "",
      front: imageObj.front || "",
      back: imageObj.back || "",
    };
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!data.currency.currency) {
      Toast.show({ type: "error", text1: "Please select a currency" });
      return;
    }

    if (data.codes.length === 0) {
      Toast.show({ type: "error", text1: "Please add at least one code" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/user/sell-code`, {
        method: "POST",
        headers: {
          "x-user-email": user?.email || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          giftCard: selectedGiftCard?.name,
          codes: data.codes.map((c) => ({
            ...c,
            image: sanitizeImages(c.image),
          })),
          currency: data.currency,
          note: data.note,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message);
      }

      Toast.show({ type: "success", text1: "Submitted Successfully" });

      await AsyncStorage.removeItem("sellCodeData");

      setData({
        codes: [],
        note: "",
        currency: { currency: "", value: 0 },
      });

      router.push({
        pathname: "/code-details/[id]",
        params: {
          id: String(result.id),
        },
      });
    } catch (err) {
      console.log(err);
      Toast.show({ type: "error", text1: "Submission Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= RATE ================= */

  const calculateOutput = () => {
    if (!selectedGiftCard) return 0;

    const rate = selectedGiftCard.currencies[data.currency.currency] || 0;

    return (Number(amount) * rate) / 100;
  };

  /* ================= GIFT CARD IMAGE ================= */

  const GiftCardImage = ({ name }: { name: string }) => {
    const uri = getGiftCardImage(name);

    if (!name || imageError[name]) {
      return <Ionicons name="gift-outline" size={26} color={PRIMARY} />;
    }

    return (
      <Image
        source={{ uri }}
        style={{
          width: 26,
          height: 26,
        }}
        contentFit="contain"
        onError={() =>
          setImageError((prev) => ({
            ...prev,
            [name]: true,
          }))
        }
      />
    );
  };

  /* ================= IMAGE BOX ================= */

  const UploadBox = ({
    type,
    label,
  }: {
    type: "receipt" | "front" | "back";
    label: string;
  }) => {
    const image = newCode.image[type];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openPicker(type)}
        style={{
          flex: 1,
        }}
      >
        <View
          style={{
            height: 120,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: BORDER,
            borderRadius: 18,
            backgroundColor: CARD,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {image ? (
            <Image
              source={{
                uri: image,
              }}
              style={{
                width: "100%",
                height: "100%",
              }}
              contentFit="cover"
            />
          ) : (
            <>
              <Ionicons name="image-outline" size={28} color={PRIMARY} />

              <Text
                style={{
                  marginTop: 10,
                  color: MUTED,
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                {label}
              </Text>
            </>
          )}
        </View>

        <Text
          style={{
            marginTop: 8,
            textAlign: "center",
            fontSize: 12,
            color: image ? PRIMARY : MUTED,
            fontWeight: "600",
          }}
        >
          {image ? `${label} Uploaded` : label}
        </Text>
      </TouchableOpacity>
    );
  };

  /* ================= UI ================= */

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAwareScrollView
        style={{
          flex: 1,
          backgroundColor: BG,
        }}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HEADER ================= */}

        <Text
          style={{
            fontSize: 32,
            fontWeight: "900",
            color: TEXT,
            marginTop: 40,
          }}
        >
          Sell Your{" "}
          <Text
            style={{
              color: PRIMARY,
            }}
          >
            Code
          </Text>
        </Text>

        {/* ================= SELECT CARD ================= */}

        <Text
          style={{
            marginTop: 35,
            marginBottom: 10,
            color: MUTED,
            fontWeight: "600",
          }}
        >
          Select Gift Card
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: CARD,
            borderWidth: 1,
            borderColor: BORDER,
            padding: 16,
            borderRadius: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <GiftCardImage name={selectedGiftCard?.name || ""} />

            <Text
              style={{
                color: TEXT,
                fontWeight: "700",
              }}
            >
              {selectedGiftCard?.name || "Select Gift Card"}
            </Text>
          </View>

          <Ionicons name="chevron-down" size={20} color={PRIMARY} />
        </TouchableOpacity>

        {/* ================= CURRENCY ================= */}

        <Text
          style={{
            marginTop: 35,
            color: MUTED,
            fontWeight: "600",
          }}
        >
          Select Currency
        </Text>

        <View
          style={{
            gap: 5,
            marginTop: 15,
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          {selectedGiftCard &&
            Object.entries(selectedGiftCard.currencies).map(([key, value]) => {
              if (key === "_id") return null;

              const active = data.currency?.currency === key;

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.9}
                  onPress={() =>
                    setData((p) => ({
                      ...p,
                      currency: {
                        currency: key,
                        value,
                      },
                    }))
                  }
                  style={{
                    minWidth: 60,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    elevation: active ? 4 : 1,
                    alignItems: "center",
                    borderColor: active ? "lightgreen" : BORDER,
                    backgroundColor: active ? PRIMARY : CARD,
                  }}
                >
                  <Text
                    style={{
                      color: active ? "#fff" : TEXT,
                      fontWeight: "800",
                    }}
                  >
                    {key}
                  </Text>

                  <Text
                    style={{
                      marginTop: 4,
                      color: active ? "#fff" : MUTED,
                      fontSize: 12,
                    }}
                  >
                    {value}%
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* ================= CALCULATOR ================= */}

        {data.currency.currency && (
          <Card
            style={{
              marginTop: 24,
              backgroundColor: CARD,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 20,
            }}
          >
            <Card.Content
              style={{
                padding: 18,
              }}
            >
              <Text
                style={{
                  color: MUTED,
                  marginBottom: 14,
                  fontWeight: "600",
                }}
              >
                Rate Calculator
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 50,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRightWidth: 1,
                        borderRightColor: BORDER,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: TEXT,
                        }}
                      >
                        Amt
                      </Text>
                    </View>

                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={MUTED}
                      style={{
                        flex: 1,
                        paddingHorizontal: 12,
                        color: TEXT,
                      }}
                    />
                  </View>
                </View>

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 50,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRightWidth: 1,
                        borderRightColor: BORDER,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "900",
                          color: PRIMARY,
                          fontSize: 18,
                        }}
                      >
                        $
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        paddingHorizontal: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: TEXT,
                          fontWeight: "700",
                        }}
                      >
                        {calculateOutput().toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* ================= ADD CODE ================= */}

        <View
          style={{
            marginTop: 35,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: TEXT,
                fontWeight: "800",
                fontSize: 18,
              }}
            >
              Add{" "}
              {data.codes.length > 0 ? (
                <Text style={{ color: PRIMARY }}>Another Code To Table</Text>
              ) : (
                "Code"
              )}
            </Text>

            {hasUploadedImage && (
              <TouchableOpacity
                onPress={clearImages}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#E50914" />

                <Text
                  style={{
                    color: "#E50914",
                    fontWeight: "700",
                  }}
                >
                  Clear Image(s)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text
            style={{
              color: MUTED,
              marginBottom: 18,
            }}
          >
            Please upload Receipt OR a front & back image
          </Text>

          {/* IMAGE BOXES */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <UploadBox type="receipt" label="Gift Card Receipt" />

            <View style={{ alignItems: "center", gap: 6 }}>
              {/* <Text
              style={{
                color: "#64748B",
                fontWeight: "700",
                letterSpacing: 0.2,
              }}
            >
              And
            </Text>
            <View
              style={{ width: 28, height: 2, backgroundColor: "#E2E8F0" }}
            /> */}
              <Text
                style={{
                  color: "#64748B",
                  fontWeight: "700",
                  letterSpacing: 0.2,
                }}
              >
                OR
              </Text>
            </View>

            <UploadBox type="front" label="Front Image" />

            <UploadBox type="back" label="Back Image" />
          </View>

          {/* SHOW ONLY AFTER IMAGE */}

          {hasUploadedImage && (
            <>
              <TextInput
                value={newCode.code}
                onChangeText={(t) => {
                  setNewCode((prev) => ({
                    ...prev,
                    code: t,
                  }));

                  setError("");
                }}
                placeholder="Enter your gift card code"
                placeholderTextColor="#9CA3AF"
                style={{
                  marginTop: 24,
                  backgroundColor: CARD,
                  height: 56,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: error ? "red" : BORDER,
                  paddingHorizontal: 16,
                  color: TEXT,
                  fontSize: 16,
                }}
              />

              {error ? (
                <Text
                  style={{
                    color: "red",
                    marginTop: 6,
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <Button
                mode="contained"
                buttonColor={PRIMARY}
                style={{
                  marginTop: 14,
                  borderRadius: 14,
                  height: 52,
                  justifyContent: "center",
                }}
                contentStyle={{
                  height: 52,
                }}
                labelStyle={{
                  fontWeight: "800",
                  fontSize: 16,
                }}
                onPress={handleAddCode}
              >
                + Add Code
              </Button>
            </>
          )}
        </View>

        {/* ================= TABLE ================= */}

        {data.codes.length > 0 && (
          <View
            style={{
              marginTop: 75,
            }}
          >
            <Text
              style={{
                color: TEXT,
                fontWeight: "800",
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              Code Table
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* HEADER */}

                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: PRIMARY_LIGHT,
                    paddingVertical: 12,
                    borderRadius: 14,
                    marginBottom: 8,
                  }}
                >
                  {[
                    "RECEIPT",
                    "FRONT IMAGE",
                    "BACK IMAGE",
                    "CODE",
                    "ACTIONS",
                  ].map((item) => (
                    <Text
                      key={item}
                      style={{
                        width: 110,
                        paddingHorizontal: 10,
                        fontWeight: "800",
                        color: TEXT,
                        fontSize: 12,
                      }}
                    >
                      {item}
                    </Text>
                  ))}
                </View>

                {/* ROWS */}

                {data.codes.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: CARD,
                      borderWidth: 1,
                      borderColor: BORDER,
                      borderRadius: 14,
                      paddingVertical: 12,
                      marginBottom: 10,
                    }}
                  >
                    {/* RECEIPT */}

                    <View
                      style={{
                        width: 110,
                        paddingHorizontal: 10,
                      }}
                    >
                      {item.image.receipt ? (
                        <Image
                          source={{
                            uri: item.image.receipt,
                          }}
                          style={{
                            width: 55,
                            height: 40,
                            borderRadius: 8,
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text
                          style={{
                            color: MUTED,
                            fontSize: 12,
                          }}
                        >
                          No Image
                        </Text>
                      )}
                    </View>

                    {/* FRONT */}

                    <View
                      style={{
                        width: 110,
                        paddingHorizontal: 10,
                      }}
                    >
                      {item.image.front ? (
                        <Image
                          source={{
                            uri: item.image.front,
                          }}
                          style={{
                            width: 55,
                            height: 40,
                            borderRadius: 8,
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text
                          style={{
                            color: MUTED,
                            fontSize: 12,
                          }}
                        >
                          No Image
                        </Text>
                      )}
                    </View>

                    {/* BACK */}

                    <View
                      style={{
                        width: 110,
                        paddingHorizontal: 10,
                      }}
                    >
                      {item.image.back ? (
                        <Image
                          source={{
                            uri: item.image.back,
                          }}
                          style={{
                            width: 55,
                            height: 40,
                            borderRadius: 8,
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text
                          style={{
                            color: MUTED,
                            fontSize: 12,
                          }}
                        >
                          No Image
                        </Text>
                      )}
                    </View>

                    {/* CODE */}

                    <View
                      style={{
                        width: 110,
                        paddingHorizontal: 10,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: TEXT,
                          fontWeight: "700",
                        }}
                      >
                        {item.code}
                      </Text>
                    </View>

                    {/* ACTION */}

                    <View
                      style={{
                        width: 110,
                        paddingHorizontal: 10,
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleDelete(item.id)}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: BORDER,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#fff",
                        }}
                      >
                        <Ionicons name="trash" size={18} color="red" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {data.codes.length > 0 && (
          <>
            {/* ================= NOTE ================= */}

            <TextInput
              value={data.note}
              onChangeText={(t) =>
                setData((p) => ({
                  ...p,
                  note: t,
                }))
              }
              placeholder="Optional note..."
              placeholderTextColor="#9CA3AF"
              multiline
              style={{
                marginTop: 10,
                backgroundColor: CARD,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: BORDER,
                minHeight: 60,
                color: TEXT,
                textAlignVertical: "top",
              }}
            />
            {/* ================= SUBMIT ================= */}
            <Button
              mode="contained"
              style={{
                marginTop: 10,
                borderRadius: 16,
                height: 56,
                justifyContent: "center",
              }}
              contentStyle={{ height: 56 }}
              labelStyle={{ fontWeight: "800", fontSize: 16 }}
              onPress={handleSubmit}
              loading={isSubmitting}
            >
              {isSubmitting ? "Submitting" : "Submit"}
            </Button>
          </>
        )}

        {/* ================= MODAL ================= */}

        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={{
              backgroundColor: CARD,
              margin: 20,
              borderRadius: 20,
              padding: 20,
              maxHeight: "75%",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: TEXT,
                marginBottom: 14,
              }}
            >
              Select Gift Card
            </Text>

            <FlatList
              data={giftCards}
              keyExtractor={(i) => i.name}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedGiftCard(item);

                    setModalVisible(false);

                    setData((p) => ({
                      ...p,
                      currency: {
                        currency: "",
                        value: 0,
                      },
                    }));
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <GiftCardImage name={item.name} />

                    <Text
                      style={{
                        color: TEXT,
                        fontWeight: "700",
                      }}
                    >
                      {item.name}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={PRIMARY} />
                </TouchableOpacity>
              )}
            />
          </Modal>
        </Portal>
      </KeyboardAwareScrollView>
    </ScrollView>
  );
}
