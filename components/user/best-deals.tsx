import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const THEME = "rgb(1, 107, 1)";
const { width } = Dimensions.get("window");

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}`;

const giftCardImages: any = {
  Amazon: "https://cdn-icons-png.flaticon.com/512/5968/5968870.png",
  Apple: "https://cdn-icons-png.flaticon.com/512/0/747.png",
  "Google Play": "https://cdn-icons-png.flaticon.com/512/300/300221.png",
  Steam: "https://cdn-icons-png.flaticon.com/512/3670/3670382.png",
  "Razer Gold": "https://img.icons8.com/color/96/razer.png",
};

export default function BestDeals() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState(true);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const response = await fetch(API_URL + "/api/admin/price-list");
      const responseData = await response.json();

      const data = Array.isArray(responseData) ? responseData : [];

      const order = ["Amazon", "Google Play", "Steam", "Razer Gold", "Apple"];

      const filtered = data
        .filter((e: any) => order.includes(e.name))
        .sort(
          (a: any, b: any) => order.indexOf(a.name) - order.indexOf(b.name),
        );

      const formatted = filtered.map((e: any) => ({
        ...e,
        image: giftCardImages[e.name],
      }));

      setGiftCards(formatted);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ================= AUTO SLIDE (SLOW) =================
  useEffect(() => {
    if (!giftCards.length) return;

    const interval = setInterval(() => {
      const nextIndex =
        activeIndex === giftCards.length - 1 ? 0 : activeIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeIndex, giftCards]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Best Deals</Text>
        <TouchableOpacity onPress={() => router.push("/(user)/sell-code")}>
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentRow}>
        {/* LEFT */}
        <View style={styles.carouselColumn}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={THEME} />
              <Text style={styles.loadingText}>Loading best deals...</Text>
            </View>
          ) : (
            <>
              {/* CAROUSEL WRAPPER */}
              <View style={styles.carouselWrapper}>
                <FlatList
                  ref={flatListRef}
                  horizontal
                  pagingEnabled
                  data={giftCards}
                  keyExtractor={(_, index) => index.toString()}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={width * 0.5}
                  decelerationRate="normal"
                  contentContainerStyle={{ paddingRight: 0 }}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(
                      event.nativeEvent.contentOffset.x / (width * 0.5),
                    );
                    setActiveIndex(index);
                  }}
                  renderItem={({ item: card }) => (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => router.push("/(user)/sell-code")}
                    >
                      <View style={styles.carouselCard}>
                        <View style={styles.cardGlow} />

                        <Image
                          source={{ uri: card.image }}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />

                        <Text style={styles.cardTitle}>{card.name}</Text>

                        <View style={styles.line} />

                        <Text style={styles.rateText}>
                          USD Rate:{" "}
                          <Text style={styles.boldRate}>
                            {card?.currencies?.USD || "--"}%
                          </Text>
                        </Text>

                        <View style={styles.line} />

                        <Text style={styles.rateText}>
                          CAD Rate:{" "}
                          <Text style={styles.boldRate}>
                            {card?.currencies?.CAD || "--"}%
                          </Text>
                        </Text>

                        <View style={styles.line} />

                        <Text style={styles.rateText}>
                          UK Rate:{" "}
                          <Text style={styles.boldRate}>
                            {card?.currencies?.UK || "--"}%
                          </Text>
                        </Text>

                        <View style={styles.line} />

                        <Text style={styles.rateText}>
                          EUR Rate:{" "}
                          <Text style={styles.boldRate}>
                            {card?.currencies?.EUR || "--"}%
                          </Text>
                        </Text>

                        {/* DOTS */}
                        <View style={styles.overlayDots}>
                          {giftCards.map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.dot,
                                activeIndex === index && styles.activeDot,
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </>
          )}
        </View>

        {/* RIGHT */}
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(user)/sell-code")}
          >
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="cash-fast"
                size={26}
                color={THEME}
              />
            </View>
            <Text style={styles.actionText}>Sell Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(user)/codes")}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="document-text" size={24} color={THEME} />
            </View>
            <Text style={styles.actionText}>Codes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(user)/payout")}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="wallet" size={24} color={THEME} />
            </View>
            <Text style={styles.actionText}>Payout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/extra/support")}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="help-circle" size={24} color={THEME} />
            </View>
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sellText}>
        Sell for <Text style={styles.bold}>100 USD</Text> Gift Card and receive
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  seeAll: {
    color: THEME,
    fontWeight: "700",
  },

  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  carouselColumn: {
    width: "58%",
    minHeight: 320,
  },

  loaderContainer: {
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  carouselWrapper: {
    position: "relative",
  },

  carouselCard: {
    width: width * 0.5,
    borderRadius: 26,
    padding: 18,
    paddingBottom: 30,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(1,107,1,0.15)",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
  },

  cardGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(1,107,1,0.08)",
  },

  cardImage: {
    width: "100%",
    height: 85,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },

  line: {
    height: 1,
    backgroundColor: "rgba(1,107,1,0.15)",
    marginVertical: 8,
  },

  rateText: {
    fontSize: 14,
    textAlign: "center",
    color: "#374151",
    fontWeight: "600",
  },

  boldRate: {
    fontWeight: "800",
    color: THEME,
  },

  overlayDots: {
    position: "absolute",
    bottom: 5,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 40,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 3,
  },

  activeDot: {
    width: 18,
    backgroundColor: "#fff",
  },

  sellText: {
    marginTop: 25,
    textAlign: "center",
    fontSize: 13,
    color: "#374151",
  },

  bold: {
    fontWeight: "800",
  },

  actionsColumn: {
    width: "48%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },

  actionCard: {
    width: "40%",
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(1,107,1,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  actionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
});
