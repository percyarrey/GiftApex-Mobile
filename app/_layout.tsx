import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "./global.css";

import { getActiveSupportChatId } from "@/utils/activeSupportChat";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Text, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data || {};
    const activeTicketId = getActiveSupportChatId();
    const isSupportNotification = [
      "Support",
      "SupportTicket",
      "Ticket",
      "SupportChat",
    ].includes(String(data.referenceModel));
    const isSameTicket =
      isSupportNotification &&
      data.referenceId &&
      String(data.referenceId) === activeTicketId;

    const shouldShow = !isSameTicket;
    return {
      shouldShowBanner: shouldShow,
      shouldShowList: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: shouldShow,
    };
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, isHydrated, loadUser } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      await loadUser();
    };

    initialize();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data.referenceModel === "Payout") {
          router.push({
            pathname: "/payout-detail/[id]",
            params: {
              id: String(data.referenceId),
            },
          });
          return;
        }

        if (data.referenceModel === "GiftCode") {
          router.push({
            pathname: "/code-details/[id]",
            params: {
              id: String(data.referenceId),
            },
          });
          return;
        }

        if (
          data.referenceModel === "Support" ||
          data.referenceModel === "SupportTicket" ||
          data.referenceModel === "Ticket" ||
          data.referenceModel === "SupportChat"
        ) {
          if (data.referenceId) {
            router.push({
              pathname: "/(support)/chat/[id]",
              params: {
                id: String(data.referenceId),
              },
            });
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: "#016B01",
    },
  };
  if (!isHydrated) {
    return (
      <PaperProvider theme={paperTheme}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
            }}
          >
            <ActivityIndicator size="large" color="#016B01" />

            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                color: "#555",
                fontWeight: "500",
              }}
            >
              Loading...
            </Text>
          </View>
        </ThemeProvider>
      </PaperProvider>
    );
  }
  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            {/* AUTH */}
            <Stack.Protected
              guard={(!!user && !user.isVerified) || !user || user?.isBlock}
            >
              <Stack.Screen name="auth" />
            </Stack.Protected>

            {/* USER */}
            <Stack.Protected guard={!!user && user.isVerified && !user.isBlock}>
              <Stack.Screen name="(user)" />
            </Stack.Protected>

            {/* EXTRA (with clean header titles + back button) */}
            <Stack.Protected guard={!!user && user.isVerified && !user.isBlock}>
              <Stack.Screen name="extra" />
            </Stack.Protected>

            {/* ADMIN */}
            <Stack.Protected
              guard={
                !!user &&
                user.isVerified &&
                !user.isBlock &&
                user.role === "admin"
              }
            >
              <Stack.Screen name="(admin)" />
            </Stack.Protected>
          </Stack>

          <Toast />
          {/* <StatusBar style={colorScheme === "dark" ? "light" : "dark"} /> */}
        </ThemeProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
