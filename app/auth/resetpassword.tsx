import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Surface,
  TextInput,
} from "react-native-paper";

export default function ResetPasswordScreen() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const newErrors = { password: "", confirmPassword: "" };

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert("Success", "Password reset successfully!");
      router.replace("/auth/login");
    } catch (error) {
      Alert.alert("Error", "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Consistent logic for button state
  const isFormEmpty = !code || !password || !confirmPassword;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Surface
          style={{
            flex: 1,
            padding: 25,
            justifyContent: "center",
            backgroundColor: "white",
          }}
        >
          <Text
            className="mytxt text-2xl"
            style={{
              textAlign: "center",
              marginBottom: 10,
              fontWeight: "bold",
            }}
          >
            Reset Password
          </Text>

          <Text style={{ textAlign: "center", marginBottom: 30, opacity: 0.6 }}>
            Enter your new password.
          </Text>

          {/* New Password Input */}
          <View style={{ marginBottom: 15 }}>
            <TextInput
              label="New Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              mode="outlined"
              secureTextEntry
              error={!!errors.password}
              activeOutlineColor="rgb(1, 107, 1)"
            />
            {errors.password ? (
              <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Confirm Password Input */}
          <View style={{ marginBottom: 25 }}>
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: "" });
              }}
              mode="outlined"
              secureTextEntry
              error={!!errors.confirmPassword}
              activeOutlineColor="rgb(1, 107, 1)"
            />
            {errors.confirmPassword ? (
              <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                {errors.confirmPassword}
              </Text>
            ) : null}
          </View>

          {loading ? (
            <ActivityIndicator
              animating={true}
              color="rgb(1, 107, 1)"
              style={{ marginBottom: 20 }}
            />
          ) : (
            <Button
              disabled={isFormEmpty}
              mode="contained"
              buttonColor="rgb(1, 107, 1)"
              onPress={handleResetPassword}
              style={{ marginBottom: 20, borderRadius: 8, paddingVertical: 4 }}
              labelStyle={{ fontSize: 16, fontWeight: "bold" }}
            >
              Reset Password
            </Button>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 10,
            }}
          >
            <Link href="/auth/login">
              <Text style={{ color: "rgb(1, 107, 1)", fontWeight: "bold" }}>
                Back to Login
              </Text>
            </Link>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
