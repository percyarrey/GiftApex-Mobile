import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
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
  TouchableRipple,
} from "react-native-paper";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!name) newErrors.name = "Name is required";
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
      !newErrors.name &&
      !newErrors.email &&
      !newErrors.password &&
      !newErrors.confirmPassword
    );
  };

  const handleOpenTerms = async () => {
    try {
      await Linking.openURL("https://www.giftapex.net/privacy-policy");
    } catch (error) {
      Alert.alert("Error", "Could not open terms and conditions.");
    }
  };

  const handleRegister = async () => {
    // Perform validation and update error state
    if (!validateForm()) return;

    if (!agreeTerms) {
      Alert.alert(
        "Terms required",
        "Please agree to the terms and conditions.",
      );
      return;
    }

    setLoading(true);
    try {
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

  // Simple check for button state without triggering side-effects (setErrors)
  const isFormEmpty =
    !name || !email || !password || !confirmPassword || !agreeTerms;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Surface
          style={{
            flex: 1,
            padding: 20,
            justifyContent: "center",
          }}
        >
          <Text className="mytxt text-2xl" style={{ textAlign: "center" }}>
            Register
          </Text>

          <Text
            className="opacity-70 text-lg"
            style={{ textAlign: "center", marginBottom: 20, marginTop: 10 }}
          >
            Create your account
          </Text>

          {/* Name Input */}
          <View style={{ marginBottom: 15 }}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoCapitalize="words" // Changed from 'characters' for better UX
              error={!!errors.name}
            />
            {errors.name ? (
              <Text style={{ color: "red", fontSize: 12 }}>{errors.name}</Text>
            ) : null}
          </View>

          {/* Email Input */}
          <View style={{ marginBottom: 15 }}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
            />
            {errors.email ? (
              <Text style={{ color: "red", fontSize: 12 }}>{errors.email}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 15 }}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              error={!!errors.password}
            />
            {errors.password ? (
              <Text style={{ color: "red", fontSize: 12 }}>
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Confirm Password Input */}
          <View style={{ marginBottom: 15 }}>
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              error={!!errors.confirmPassword}
            />
            {errors.confirmPassword ? (
              <Text style={{ color: "red", fontSize: 12 }}>
                {errors.confirmPassword}
              </Text>
            ) : null}
          </View>

          {/* Terms Checkbox */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <TouchableRipple
              onPress={() => setAgreeTerms((v) => !v)}
              style={{ borderRadius: 4 }}
              rippleColor="rgba(1, 107, 1, 0.2)"
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: "rgb(1, 107, 1)",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: agreeTerms ? "rgb(1, 107, 1)" : "white",
                  marginRight: 10,
                }}
              >
                {agreeTerms && (
                  <Text
                    style={{ color: "white", fontWeight: "700", fontSize: 12 }}
                  >
                    ✓
                  </Text>
                )}
              </View>
            </TouchableRipple>
            <Text style={{ flex: 1 }}>
              I agree to the{" "}
              <Text
                onPress={handleOpenTerms}
                style={{ color: "rgb(1, 107, 1)" }}
              >
                Terms and Conditions
              </Text>
            </Text>
          </View>

          <View style={{ marginTop: 25 }}>
            {loading ? (
              <ActivityIndicator
                animating={true}
                style={{ marginBottom: 20 }}
              />
            ) : (
              <>
                <Button
                  disabled={isFormEmpty} // Simplified logic
                  mode="contained"
                  buttonColor="rgb(1, 107, 1)"
                  onPress={handleRegister}
                  style={{ marginBottom: 12, borderRadius: 4 }}
                >
                  Register
                </Button>

                <TouchableRipple
                  onPress={() =>
                    Alert.alert("Coming Soon", "Google login not implemented.")
                  }
                  style={{ borderRadius: 6, marginBottom: 20, height: 52 }}
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
                      <Image
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
                      Sign up with Google
                    </Text>
                  </View>
                </TouchableRipple>
              </>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text>Already have an account?</Text>
            <Link href="/auth/login">
              <Text className="mytxt">Login</Text>
            </Link>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
