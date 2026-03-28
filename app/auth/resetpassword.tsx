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

export default function ResetPasswordScreen() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    code: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const newErrors = { code: "", password: "", confirmPassword: "" };
    if (!code || code.length !== 6)
      newErrors.code = "Please enter a valid 6-digit code";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    if (!confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return !newErrors.code && !newErrors.password && !newErrors.confirmPassword;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert("Success", "Password reset successfully!");
      router.push("/auth/login");
    } catch (error) {
      Alert.alert("Error", "Failed to reset password. Please try again.");
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
          Reset Password
        </Text>

        <TextInput
          label="Reset Code"
          value={code}
          onChangeText={setCode}
          mode="outlined"
          keyboardType="numeric"
          maxLength={6}
          error={!!errors.code}
          style={{ marginBottom: 10 }}
        />
        {errors.code ? (
          <Text style={{ color: "red", marginBottom: 10 }}>{errors.code}</Text>
        ) : null}

        <TextInput
          label="New Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          error={!!errors.password}
          style={{ marginBottom: 10 }}
        />
        {errors.password ? (
          <Text style={{ color: "red", marginBottom: 10 }}>
            {errors.password}
          </Text>
        ) : null}

        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          mode="outlined"
          secureTextEntry
          error={!!errors.confirmPassword}
          style={{ marginBottom: 10 }}
        />
        {errors.confirmPassword ? (
          <Text style={{ color: "red", marginBottom: 20 }}>
            {errors.confirmPassword}
          </Text>
        ) : null}

        {loading ? (
          <ActivityIndicator animating={true} style={{ marginBottom: 20 }} />
        ) : (
          <Button
            mode="contained"
            onPress={handleResetPassword}
            style={{ marginBottom: 20 }}
          >
            Reset Password
          </Button>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Link href="/auth/login">
            <Text style={{ color: "blue" }}>Back to Login</Text>
          </Link>
          <Link href="/auth/verifyemail">
            <Text style={{ color: "blue" }}>Verify Email</Text>
          </Link>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}
