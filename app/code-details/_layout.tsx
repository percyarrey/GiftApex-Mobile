import { Stack } from "expo-router";
import { Text, View } from "react-native";

const PRIMARY = "rgb(1, 107, 1)";

export default function CodeDetailsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,

        headerStyle: {
          backgroundColor: "#FFFFFF",
        },

        headerTintColor: PRIMARY,

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
                color: "#111827",
              }}
            >
              {/* Code  */}
              <Text style={{ color: PRIMARY }}>Details</Text>
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
  );
}
