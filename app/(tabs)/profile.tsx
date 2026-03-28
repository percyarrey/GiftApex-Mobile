import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Surface,
  Text,
} from "react-native-paper";

export default function ProfileScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserEmail = async () => {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (userEmail) setEmail(userEmail);
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          setLoading(true);
          try {
            await AsyncStorage.removeItem("isLoggedIn");
            await AsyncStorage.removeItem("userEmail");
            router.replace("/auth/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Surface style={{ flex: 1, padding: 20 }}>
      <Card style={{ padding: 20, marginTop: 50 }}>
        <Card.Title title="Profile" />
        <Card.Content>
          <Text variant="bodyLarge" style={{ marginBottom: 20 }}>
            Email: {email || "Not available"}
          </Text>
          {loading ? (
            <ActivityIndicator animating={true} />
          ) : (
            <Button
              mode="contained"
              onPress={handleLogout}
              style={{ marginTop: 20 }}
            >
              Logout
            </Button>
          )}
        </Card.Content>
      </Card>
    </Surface>
  );
}
