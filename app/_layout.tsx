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
import "./global.css";
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, isHydrated, loadUser } = useAuthStore();

  useEffect(() => {
    (async () => {
      loadUser();
    })();
  }, []);
  if (!isHydrated) return null;
  // 🔥 CUSTOM PAPER THEME
  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,

      primary: "#016B01",
      secondary: "#016B01",

      onPrimary: "#ffffff",
      primaryContainer: "#d4f8d4",
      onPrimaryContainer: "#014A01",

      outline: "#D0D0D0",
      background: "#ffffff",
      surface: "#ffffff",

      error: "#B00020",
    },
  };
  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* NOT VERIFIED || NOT LOGGED IN*/}
          <Stack.Protected
            guard={
              (!!user && !user.isVerified) || !user || (!!user && user.isBlock)
            }
          >
            <Stack.Screen name="auth" />
          </Stack.Protected>

          {/* VERIFIED */}
          <Stack.Protected guard={!!user && user.isVerified && !user.isBlock}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
        </Stack>
        <Toast />
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
