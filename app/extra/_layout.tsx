import { Stack } from "expo-router";

export default function ExtraLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "[#016B01]",
      }}
    >
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />

      <Stack.Screen name="settings" options={{ title: "Settings" }} />

      <Stack.Screen name="support" options={{ title: "Support" }} />

      <Stack.Screen name="faq" options={{ title: "FAQ" }} />
    </Stack>
  );
}
