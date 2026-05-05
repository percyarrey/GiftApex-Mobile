import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import "./global.css";

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const loggedIn = await AsyncStorage.getItem("isLoggedIn");
        setIsLoggedIn(loggedIn === "true");
      } catch {
        setIsLoggedIn(false);
      }
    })();
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>

        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
