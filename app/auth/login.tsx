import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  ActivityIndicator,
  Button,
  Surface,
  TextInput,
  TouchableRipple,
} from "react-native-paper";

/*   GOOGLE AUTH */

import { useAuthStore } from "@/store/useAuthStore";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import Toast from "react-native-toast-message";
export default function LoginScreen() {
  const router = useRouter();
  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/auth`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({ email: "", password: "" });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };

    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";

    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  // ================= EMAIL LOGIN =================
  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          action: "login",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.log("Login error response:", data);
        if (res.status === 500) {
          throw new Error("Something went wrong");
        } else if (res.status === 403 && data.user.isBlock) {
          /* router.push("/auth/banned-account"); */
          await loginStore(data.user);
        }
        throw new Error(data.message);
      }

      // 🔥 THIS IS THE MAGIC LINE
      await loginStore(data.user);

      router.replace("/(user)");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= GOOGLE LOGIN =================

  const loginStore = useAuthStore((state) => state.login);

  const handleGoogleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (isSuccessResponse(userInfo)) {
        const { user } = userInfo.data;
        const { email, name, photo } = user;
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name,
            image: photo,
            action: "google",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 500) {
            throw new Error("Something went wrong");
          }
          throw new Error(data.message);
        }

        // 🔥 THIS IS THE MAGIC LINE
        await loginStore(data.user);

        router.replace("/(user)");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormEmpty = !email || !password;

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
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
              <ActivityIndicator
                animating={true}
                style={{ marginBottom: 20 }}
              />
            ) : (
              <>
                <Button
                  disabled={isFormEmpty}
                  mode="contained"
                  buttonColor="rgb(1, 107, 1)"
                  onPress={handleLogin}
                  style={{
                    marginBottom: 12,
                    borderRadius: 4,
                  }}
                >
                  Login
                </Button>

                <TouchableRipple
                  onPress={handleGoogleLogin}
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
        </KeyboardAwareScrollView>
      </ScrollView>
    </>
  );
}
