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

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "", confirmPassword: "" };
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";
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
    return (
      !newErrors.email && !newErrors.password && !newErrors.confirmPassword
    );
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert(
        "Success",
        "Registration successful! Please check your email for verification.",
      );
      router.push("/auth/verifyemail");
    } catch (error) {
      Alert.alert("Error", "Registration failed. Please try again.");
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
          Register
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
          <Text style={{ color: "red", marginBottom: 10 }}>{errors.email}</Text>
        ) : null}

        <TextInput
          label="Password"
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
          label="Confirm Password"
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
            onPress={handleRegister}
            style={{ marginBottom: 20 }}
          >
            Register
          </Button>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Link href="/auth/login">
            <Text style={{ color: "blue" }}>
              Already have an account? Login
            </Text>
          </Link>
          <Link href="/auth/forgotpassword">
            <Text style={{ color: "blue" }}>Forgot Password?</Text>
          </Link>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}
