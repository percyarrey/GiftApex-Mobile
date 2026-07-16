import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Linking, View } from "react-native";
import { Button, Divider, Surface, Text } from "react-native-paper";

export default function BannedAccountScreen() {
  const supportEmail = process.env.EMAIL_USER || "giftapex247@gmail.com";
  const router = useRouter();
  const supportWebsite = "https://www.giftapex.net/support";

  // ================= EMAIL SUPPORT =================
  const handleContactSupport = async () => {
    try {
      await Linking.openURL(
        `mailto:${supportEmail}?subject=Account Ban Appeal`,
      );
    } catch (error) {
      Alert.alert("Error", "No email application found on your device.");
    }
  };

  // ================= WEBSITE SUPPORT =================
  const handleOpenSupportWebsite = async () => {
    try {
      await Linking.openURL(supportWebsite);
    } catch (error) {
      Alert.alert("Error", "Unable to open support website.");
    }
  };

  const { logout } = useAuthStore();
  return (
    <Surface
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* TITLE */}
      <Text
        variant="headlineMedium"
        style={{
          color: "red",
          fontWeight: "bold",
          marginBottom: 15,
          textAlign: "center",
        }}
      >
        Account Banned
      </Text>

      {/* DESCRIPTION */}
      <Text
        style={{
          textAlign: "center",
          fontSize: 16,
          opacity: 0.7,
          marginBottom: 35,
          lineHeight: 24,
        }}
      >
        Your account has been banned. If you believe this is a mistake, please
        contact support.
      </Text>

      {/* EMAIL BUTTON */}
      <Button
        mode="contained"
        buttonColor="#016B01"
        onPress={handleContactSupport}
        style={{
          width: "100%",
          borderRadius: 10,
        }}
        contentStyle={{
          paddingVertical: 6,
        }}
      >
        Email Support
      </Button>

      {/* OR */}
      <View
        style={{
          width: "100%",
          marginVertical: 25,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Divider style={{ flex: 1 }} />

        <Text
          style={{
            opacity: 0.6,
            fontWeight: "bold",
          }}
        >
          OR
        </Text>

        <Divider style={{ flex: 1 }} />
      </View>

      {/* WEBSITE BUTTON */}
      <Button
        mode="outlined"
        textColor="#016B01"
        onPress={handleOpenSupportWebsite}
        style={{
          width: "100%",
          borderRadius: 10,
        }}
        contentStyle={{
          paddingVertical: 6,
        }}
      >
        Visit Support Website
      </Button>

      {/* FOOTER */}
      <View
        style={{
          marginTop: 35,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            opacity: 0.6,
            marginBottom: 5,
          }}
        >
          Support Email
        </Text>

        <Text
          style={{
            fontWeight: "bold",
            color: "#016B01",
          }}
        >
          {supportEmail}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 50,
        }}
      >
        <Text
          style={{ color: "rgb(1, 107, 1)", fontWeight: "bold" }}
          onPress={async () => {
            await logout(null);
            router.push("/auth/login");
          }}
        >
          Back to Login
        </Text>
      </View>
    </Surface>
  );
}
