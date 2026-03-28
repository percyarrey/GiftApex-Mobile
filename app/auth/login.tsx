import AsyncStorage from "@react-native-async-storage/async-storage";
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
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // For demo, accept any email/password
      await AsyncStorage.setItem("isLoggedIn", "true");
      await AsyncStorage.setItem("userEmail", email);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View>
        <Text className="mytxt">Hello</Text>
      </View>
      <Surface
        style={{
          flex: 1,
          padding: 20,
          justifyContent: "center",
        }}
      >
        <Text
          variant="headlineMedium"
          style={{ textAlign: "center", marginBottom: 30 }}
        >
          Login
        </Text>

        <View style={{ marginBottom: 15 }}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            style={{ marginBottom: 5 }}
          />
          {errors.email ? (
            <Text style={{ color: "red" }}>{errors.email}</Text>
          ) : null}
        </View>

        <View style={{ marginBottom: 10 }}>
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            error={!!errors.password}
            style={{ marginBottom: 5 }}
          />
          {errors.password ? (
            <Text style={{ color: "red" }}>{errors.password}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Link href="/auth/forgotpassword">
            <Text className="mytxt">Forgot Password?</Text>
          </Link>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        ></View>

        {loading ? (
          <ActivityIndicator animating={true} style={{ marginBottom: 20 }} />
        ) : (
          <Button
            mode="contained"
            onPress={handleLogin}
            style={{ marginBottom: 20 }}
          >
            Login
          </Button>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Link href="/auth/register">
            <Text className="mytxt text-green-500">Register</Text>
          </Link>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}
