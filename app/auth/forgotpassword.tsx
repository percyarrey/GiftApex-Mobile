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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "" });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "" };
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";
    setErrors(newErrors);
    return !newErrors.email;
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert("Success", "Password reset link sent to your email.");
      router.push("/auth/resetpassword");
    } catch (error) {
      Alert.alert("Error", "Failed to send reset email. Please try again.");
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
          Forgot Password
        </Text>

        <Text style={{ textAlign: "center", marginBottom: 20 }}>
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
          style={{ marginBottom: 10 }}
        />
        {errors.email ? (
          <Text style={{ color: "red", marginBottom: 20 }}>{errors.email}</Text>
        ) : null}

        {loading ? (
          <ActivityIndicator animating={true} style={{ marginBottom: 20 }} />
        ) : (
          <Button
            mode="contained"
            onPress={handleForgotPassword}
            style={{ marginBottom: 20 }}
          >
            Send Reset Link
          </Button>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Link href="/auth/login">
            <Text style={{ color: "blue" }}>Back to Login</Text>
          </Link>
          <Link href="/auth/resetpassword">
            <Text style={{ color: "blue" }}>
              Already have a code? Reset Password
            </Text>
          </Link>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}
