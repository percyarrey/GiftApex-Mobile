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
import { MD3LightTheme, Provider as PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, isHydrated, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  if (!isHydrated) return null;

  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: "#016B01",
    },
  };

  const extraScreenOptions = {
    headerShown: true,
    headerBackTitleVisible: false,
    headerTintColor: "[#016B01]",
  };

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
            <Stack.Screen
              name="extra/faq"
              options={{ ...extraScreenOptions, title: "FAQ" }}
            />
            <Stack.Screen
              name="extra/support"
              options={{ ...extraScreenOptions, title: "Support" }}
            />
            <Stack.Screen
              name="extra/notifications"
              options={{ ...extraScreenOptions, title: "Notifications" }}
            />
            <Stack.Screen
              name="extra/settings"
              options={{ ...extraScreenOptions, title: "Settings" }}
            />
          </Stack.Protected>

          {/* ADMIN */}
          <Stack.Protected guard={!!user && user.isVerified && !user.isBlock}>
            <Stack.Screen name="(admin)" />
          </Stack.Protected>
        </Stack>

        <Toast />
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
