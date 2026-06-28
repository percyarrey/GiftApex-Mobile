import { useAuthStore } from "@/store/useAuthStore";
import { Stack } from "expo-router";
import { Text, View } from "react-native";
import Toast from "react-native-toast-message";

const PRIMARY = "rgb(1, 107, 1)";

export default function PayoutDetailLayout() {
  const { user } = useAuthStore();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,

          headerStyle: {
            backgroundColor: user?.role === "admin" ? PRIMARY : "#FFFFFF",
          },

          headerTintColor: user?.role === "admin" ? "#FFFFFF" : PRIMARY,

          // ✅ reduces space between back button and title

          headerTitle: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              {/* <Ionicons name="document-text-outline" size={22} color={PRIMARY} /> */}

              <Text
                style={{
                  fontSize: 21,
                  fontWeight: "600",
                }}
              >
                {/* Code  */}
                <Text
                  style={{
                    color: user?.role === "admin" ? "#FFFFFF" : PRIMARY,
                  }}
                >
                  Details
                </Text>
              </Text>
            </View>
          ),
        }}
      >
        <Stack.Screen
          name="[id]"
          options={{
            headerBackTitle: "Back",
          }}
        />
      </Stack>
      <Toast />
    </>
  );
}
