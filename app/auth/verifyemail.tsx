import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";

export default function VerifyEmailScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ code: "" });

  const validateForm = () => {
    const newErrors = { code: "" };
    if (!code || code.length !== 6)
      newErrors.code = "Please enter a valid 6-digit code";
    setErrors(newErrors);
    return !newErrors.code;
  };

  const handleVerify = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert("Success", "Email verified successfully!");
      router.push("/auth/login");
    } catch (error) {
      Alert.alert("Error", "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert("Success", "Verification code resent to your email.");
    } catch (error) {
      Alert.alert("Error", "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Surface style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        <Text
          variant="headlineMedium"
          style={{ textAlign: "center", marginBottom: 30 }}
        >
          Verify Email
        </Text>

        <Text style={{ textAlign: "center", marginBottom: 20 }}>
          Enter the 6-digit code sent to your email to verify your account.
        </Text>

        <TextInput
          label="Verification Code"
          value={code}
          onChangeText={setCode}
          mode="outlined"
          keyboardType="numeric"
          maxLength={6}
          error={!!errors.code}
          style={{ marginBottom: 10 }}
        />
        {errors.code ? (
          <Text style={{ color: "red", marginBottom: 20 }}>{errors.code}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator animating={true} style={{ marginBottom: 20 }} />
        ) : (
          <View>
            <Button
              mode="contained"
              onPress={handleVerify}
              style={{ marginBottom: 10 }}
            >
              Verify Email
            </Button>
            <Button mode="outlined" onPress={handleResend}>
              Resend Code
            </Button>
          </View>
        )}

        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Link href="/auth/login">
            <Text style={{ color: "blue" }}>Back to Login</Text>
          </Link>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}
