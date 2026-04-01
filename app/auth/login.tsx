import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Surface,
  TextInput,
  TouchableRipple,
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
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Surface
          style={{
            flex: 1,
            padding: 20,
            justifyContent: "center",
          }}
        >
          <Image
            source={require("@/assets/images/auth/GiftApex_logo.png")}
            style={{ width: 150, height: 150, alignSelf: "center" }}
          />
          <Text
            className="mytxt text-2xl"
            style={{ textAlign: "center", marginBottom: 10, marginTop: 20 }}
          >
            Login to your Account
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
              <Text className="mytxt text-lg">Forgot Password?</Text>
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
            <>
              <Button
                mode="contained"
                buttonColor="rgb(1, 107, 1)"
                onPress={handleLogin}
                style={{ marginBottom: 12, borderRadius: 4 }}
              >
                Login
              </Button>

              <TouchableRipple
                onPress={() =>
                  Alert.alert(
                    "Login with Google",
                    "Google login flow not implemented yet.",
                  )
                }
                style={{
                  borderRadius: 6,
                  overflow: "hidden",
                  marginBottom: 20,
                  marginTop: 10,
                  height: 52,
                }}
                rippleColor="rgba(255,255,255,0.2)"
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#4285F4",
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      marginLeft: 4,
                      borderRadius: 4,
                      backgroundColor: "white",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Image // Google "G" logo
                      source={require("@/assets/images/auth/Google G icon.png")}
                      style={{ width: 28, height: 28 }}
                    />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: "#FFFFFF",
                      fontWeight: "600",
                      textAlign: "center",
                      fontSize: 16,
                      marginRight: 44,
                    }}
                  >
                    Sign in with Google
                  </Text>
                </View>
              </TouchableRipple>
            </>
          )}

          <View
            style={{
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
            }}
          >
            <Text>Don’t have an account yet?</Text>
            <Link href="/auth/register">
              <Text className="mytxt text-lg">Register</Text>
            </Link>
          </View>
        </Surface>
      </KeyboardAvoidingView>
    </>
  );
}
