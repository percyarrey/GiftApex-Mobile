import { Stack } from "expo-router";
import Toast from "react-native-toast-message";

export default function ExtraLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTintColor: "rgb(1, 107, 1)", // or "#016B01"
        }}
      >
        <Stack.Screen
          name="notifications"
          options={{ title: "Notifications" }}
        />

        <Stack.Screen name="settings" options={{ title: "Settings" }} />

        <Stack.Screen name="support" options={{ title: "Support" }} />

        <Stack.Screen name="faq" options={{ title: "FAQ" }} />
      </Stack>
      <Toast />
    </>
  );
}
