import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import "./global.css";

import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Text, View } from "react-native";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
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
        }

        if (data.referenceModel === "GiftCode") {
          router.push({
            pathname: "/code-details/[id]",
            params: {
              id: String(data.referenceId),
            },
          });
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
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
