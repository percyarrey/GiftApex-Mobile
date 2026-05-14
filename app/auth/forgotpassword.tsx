import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
import Toast from "react-native-toast-message";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/auth`;

  // Navigation & UI State
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);

  // Input State
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  // Timer State
  const [timer, setTimer] = useState(0);
  const [errors, setErrors] = useState({ email: "", code: "" });

  // Countdown Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    const newErrors = { email: "", code: "" };

    if (!email) {
      newErrors.email = "Email is required";
      setErrors(newErrors);
      return;
    }

    if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          action: "forgot-password",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          res.status === 500 ? "Something went wrong" : data.message,
        );
      }
      await AsyncStorage.setItem(
        "resetPasswordData",
        JSON.stringify({ email: data.email, code: "" }),
      );

      setStep("code");
      setTimer(90);

      Toast.show({
        type: "success",
        text1: "Sent",
        text2: "Verification code sent to your email.",
      });
    } catch (error: any) {
      console.log("❌ Forgot password error:", error.message);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setErrors({
        ...errors,
        code: "Please enter a 6-digit code",
      });
      return;
    }

    setLoading(true);
    const Userdata = await AsyncStorage.getItem("resetPasswordData");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: Userdata ? JSON.parse(Userdata).email : "",
          code,
          action: "verify-forgot-password-code",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          res.status === 500 ? "Something went wrong" : data.message,
        );
      }
      if (data.success) {
        await AsyncStorage.setItem(
          "resetPasswordData",
          JSON.stringify({ email: data.email, code: data.code }),
        );
        router.push("/auth/resetpassword");
      }
    } catch (error: any) {
      console.log("❌ Verify code error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Something went wrong",
      });

      setErrors({
        ...errors,
        code: "Invalid code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep("email");
    setTimer(0);
    setCode("");
  };

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
            className="mytxt text-2xl "
            style={{
              textAlign: "center",
              marginBottom: 10,
              fontWeight: "bold",
            }}
          >
            {step === "email" ? "Forgot Password" : "Verify Code"}
          </Text>

          <Text
            className="opacity-70"
            style={{ textAlign: "center", marginBottom: 30 }}
          >
            {step === "email" ? (
              "Enter your email address to receive a 6-digit verification code."
            ) : (
              <>
                Enter the code sent to{" "}
                <Text className="font-bold">{email}</Text>
              </>
            )}
          </Text>

          {/* STEP 1: EMAIL INPUT */}
          {step === "email" && (
            <View>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: "" });
                }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                activeOutlineColor="rgb(1, 107, 1)"
                style={{ marginBottom: 5 }}
              />
              {errors.email && (
                <Text style={{ color: "red", fontSize: 12, marginBottom: 15 }}>
                  {errors.email}
                </Text>
              )}

              {loading ? (
                <ActivityIndicator
                  animating={true}
                  color="rgb(1, 107, 1)"
                  style={{ marginTop: 20 }}
                />
              ) : (
                <Button
                  disabled={!email}
                  mode="contained"
                  buttonColor="rgb(1, 107, 1)"
                  onPress={handleSendCode}
                  style={{ marginTop: 20, borderRadius: 8, paddingVertical: 4 }}
                >
                  Send Verification Code
                </Button>
              )}
            </View>
          )}

          {/* STEP 2: CODE INPUT */}
          {step === "code" && (
            <View>
              <TextInput
                label="6-Digit Code"
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setErrors({ ...errors, code: "" });
                }}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={6}
                error={!!errors.code}
                activeOutlineColor="rgb(1, 107, 1)"
                style={{ marginBottom: 5 }}
              />
              {errors.code && (
                <Text style={{ color: "red", fontSize: 12, marginBottom: 15 }}>
                  {errors.code}
                </Text>
              )}

              {loading ? (
                <ActivityIndicator
                  animating={true}
                  color="rgb(1, 107, 1)"
                  style={{ marginTop: 20 }}
                />
              ) : (
                <Button
                  disabled={code.length < 6}
                  mode="contained"
                  buttonColor="rgb(1, 107, 1)"
                  onPress={handleVerifyCode}
                  style={{ marginTop: 20, borderRadius: 8, paddingVertical: 4 }}
                >
                  Verify Code
                </Button>
              )}

              <View style={{ marginTop: 25, alignItems: "center" }}>
                <Text style={{ opacity: 0.7 }}>Didn't receive code?</Text>
                {timer > 0 ? (
                  <Text
                    style={{
                      color: "rgb(1, 107, 1)",
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    Retry in {timer}s
                  </Text>
                ) : (
                  <Text
                    onPress={handleRetry}
                    style={{
                      color: "rgb(1, 107, 1)",
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    Retry
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* BACK TO LOGIN */}
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <Link href="/auth/login">
              <Text
                className="mytxt text-lg"
                style={{ color: "rgb(1, 107, 1)" }}
              >
                Back to Login
              </Text>
            </Link>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
