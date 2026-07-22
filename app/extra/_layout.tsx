import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import Toast from "react-native-toast-message";

export default function ExtraLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        /* screenOptions={{
          headerShown: true,
          headerTintColor: "rgb(1, 107, 1)", // or "#016B01"
        }} */
        screenOptions={{
          headerStyle: {
            backgroundColor: "rgb(1, 107, 1)",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "700",
          },
        }}
      >
        <Stack.Screen
          name="notifications"
          options={{ title: "Notifications" }}
        />

        <Stack.Screen name="settings" options={{ title: "Settings" }} />

        <Stack.Screen name="support" options={{ title: "Support Ticket" }} />

        <Stack.Screen name="faq" options={{ title: "FAQ" }} />
      </Stack>
      <Toast />
    </>
  );
}
