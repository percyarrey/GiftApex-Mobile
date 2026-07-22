import { Stack } from "expo-router";
import { StatusBar } from "react-native";

type ChatParams = {
  id: string;
  name?: string;
  image?: string;
};

export default function SupportLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "rgb(1, 107, 1)",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "700",
          },
        }}

        /* screenOptions={{
        headerShown: true,
        headerTintColor: "rgb(1, 107, 1)", // or "#016B01"
      }} */
      >
        <Stack.Screen
          name="messages"
          options={{
            title: "Support Messages",
          }}
        />

        <Stack.Screen
          name="chat/[id]"
          options={({ route }) => {
            const params = route.params as ChatParams;

            return {
              title: params?.name ?? "Chat",
            };
          }}
        />
      </Stack>
    </>
  );
}
