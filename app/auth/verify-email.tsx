import { useAuthStore } from "@/store/useAuthStore";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Surface,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";

export default function VerifyEmail() {
  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/auth`;

  const { user, logout } = useAuthStore();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(90);

  const [errors, setErrors] = useState({
    code: "",
  });

  // ================= COUNTDOWN =================
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  // ================= FORMAT TIMER =================
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ================= VALIDATE =================
  const validateForm = () => {
    const newErrors = { code: "" };

    if (!code || code.length !== 6) {
      newErrors.code = "Please enter a valid 6-digit code";
    }

    setErrors(newErrors);

    return !newErrors.code;
  };

  // ================= VERIFY EMAIL =================
  const handleVerify = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          code,
          action: "verify-email",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          res.status === 500 ? "Something went wrong" : data.message,
        );
      }

      await logout();

      Toast.show({
        type: "success",
        text1: "Success",
        autoHide: false,
        swipeable: true,
        text2: "Email verified successfully. Please login to continue.",
      });

      setTimeout(() => {
        router.replace("/auth/login");
      }, 2000);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Verification failed",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= RESEND CODE =================
  const handleResend = async () => {
    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          action: "resend-verification",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          res.status === 500 ? "Something went wrong" : data.message,
        );
      }

      // Restart countdown
      setTimer(90);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Verification code resent successfully",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to resend code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <Surface
        style={{
          flex: 1,
          padding: 20,
          justifyContent: "center",
          backgroundColor: "white",
        }}
      >
        {/* TITLE */}
        <Text
          className="mytxt text-2xl"
          style={{
            textAlign: "center",
            marginBottom: 15,
          }}
        >
          Verify Email
        </Text>

        {/* DESCRIPTION */}
        <Text
          style={{
            textAlign: "center",
            marginBottom: 30,
            opacity: 0.7,
          }}
        >
          Enter the 6-digit verification code sent to your email.
        </Text>

        {/* CODE INPUT */}
        <TextInput
          label="Verification Code"
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setErrors({ code: "" });
          }}
          mode="outlined"
          keyboardType="number-pad"
          maxLength={6}
          error={!!errors.code}
          activeOutlineColor="rgb(1, 107, 1)"
          style={{ marginBottom: 8 }}
        />

        {!!errors.code && (
          <Text
            style={{
              color: "red",
              marginBottom: 20,
              fontSize: 12,
            }}
          >
            {errors.code}
          </Text>
        )}

        {/* LOADING */}
        {loading ? (
          <ActivityIndicator
            animating
            color="rgb(1, 107, 1)"
            style={{ marginTop: 20 }}
          />
        ) : (
          <>
            {/* VERIFY BUTTON */}
            <Button
              mode="contained"
              buttonColor="rgb(1, 107, 1)"
              disabled={code.length !== 6}
              onPress={handleVerify}
              style={{
                borderRadius: 8,
                paddingVertical: 4,
              }}
            >
              Verify Email
            </Button>

            {/* RESEND */}
            <View
              style={{
                marginTop: 30,
                alignItems: "center",
              }}
            >
              <Text style={{ opacity: 0.7 }}>Didn't receive code?</Text>
              {timer > 0 ? (
                <Text
                  style={{
                    color: "rgb(1, 107, 1)",
                    fontWeight: "bold",
                  }}
                >
                  Retry in {formatTime(timer)}
                </Text>
              ) : (
                <Text
                  onPress={handleResend}
                  style={{
                    color: "rgb(1, 107, 1)",
                    fontWeight: "bold",
                  }}
                >
                  Resend Code
                </Text>
              )}
            </View>
          </>
        )}

        {/* BACK TO LOGIN */}
        <View
          style={{
            alignItems: "center",
            marginTop: 50,
          }}
        >
          <Link href="/auth/login">
            <Text style={{ color: "rgb(1, 107, 1)" }}>Back to Login</Text>
          </Link>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
}
