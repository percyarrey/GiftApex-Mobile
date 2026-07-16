import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Modal, Pressable } from "react-native";

import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ActivityIndicator, Button, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/auth`;

  const authUser = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const router = useRouter();

  if (!authUser) return null;

  // ================= STATE =================
  const [name, setName] = useState(authUser.name);
  const [email, setEmail] = useState(authUser.email);
  const [image, setImage] = useState(authUser.image);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [emailConfirmVisible, setEmailConfirmVisible] = useState(false);
  const original = {
    name: authUser.name,
    email: authUser.email,
    image: authUser.image,
  };
  const isDirty =
    name !== original.name ||
    email !== original.email ||
    image !== original.image ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const isPasswordValid =
    newPassword.length === 0 ||
    (hasMinLength && hasUppercase && hasLowercase && passwordsMatch);

  const canSave =
    isDirty && name.trim().length >= 2 && isEmailValid && isPasswordValid;
  const [loading, setLoading] = useState(false);

  const emailChanged = email !== authUser.email;

  // ================= IMAGE PICKER (SINGLE BUTTON) =================
  const pickImage = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Toast.show({
          type: "error",
          text1: "Permission Required",
          text2: "Please allow access to continue",
        });
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.6,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.6,
            base64: true,
          });

      if (result.canceled) return;

      const asset = result.assets[0];

      let base64Image = asset.base64;

      // fallback conversion (VERY IMPORTANT)
      if (!base64Image && asset.uri) {
        base64Image = await convertToBase64(asset.uri);
      }

      if (!base64Image) {
        throw new Error("Image conversion failed");
      }

      // size check (~2.5MB limit)
      if ((base64Image.length * 3) / 4 > 2_500_000) {
        Toast.show({
          type: "error",
          text1: "Image too large",
          text2: "Please choose a smaller image",
        });
        return;
      }

      const finalImage = `data:image/jpeg;base64,${base64Image}`;

      setImage(finalImage);
    } catch (err) {
      console.log(err);

      /* setImage(""); */

      Toast.show({
        type: "error",
        text1: "Image Error",
        text2: "Failed to process image. Try again.",
      });
    }
  };
  const convertToBase64 = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      if (!base64) throw new Error("Base64 conversion failed");

      return base64;
    } catch (error) {
      throw error;
    }
  };

  // ================= SAVE =================
  const saveProfile = async () => {
    try {
      setLoading(true);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": authUser?.email || "",
        },
        body: JSON.stringify({
          action: "update-profile",
          id: authUser.id,
          name,
          email,
          image,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }
      await login(data.user);
      if (emailChanged) {
        await logout(null);
        router.push("/auth/login");
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: data.message || "Profile updated",
      });

      // reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
  const handleSavePress = () => {
    if (emailChanged) {
      setEmailConfirmVisible(true);
      return;
    }

    saveProfile();
  };

  // ================= UI DIVIDER =================
  const SectionTitle = ({ title }: { title: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        overflow: "hidden",
      }}
    >
      <Text
        style={{
          fontWeight: "600",
          color: "#444",
          marginRight: 10,
          flexShrink: 0,
        }}
      >
        {title}
      </Text>

      {/* LINE (takes remaining space safely) */}
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: "#ccc",
        }}
      />
    </View>
  );

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            {/* ================= PROFILE IMAGE ================= */}
            <View style={{ alignSelf: "center", marginBottom: 10 }}>
              {image ? (
                <Image
                  source={{ uri: image }}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                />
              ) : (
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "rgb(1, 107, 1)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 48, fontWeight: "bold" }}
                  >
                    {(name?.trim()?.charAt(0) || "?").toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* SINGLE IMAGE BUTTON */}
            <Button
              mode="outlined"
              onPress={() => setImageModalVisible(true)}
              style={{ marginBottom: 20 }}
            >
              Update Profile Image
            </Button>

            {/* ================= NAME ================= */}
            <SectionTitle title="Name" />
            <TextInput
              mode="outlined"
              value={name}
              onChangeText={setName}
              style={{ marginBottom: 10 }}
            />

            {/* ================= EMAIL ================= */}
            <SectionTitle title="Email" />
            <TextInput
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ marginBottom: 5 }}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#666",
                marginBottom: 10,
              }}
            >
              Changing email will require re-verification and you will be{" "}
              <Text className="font-bold text-red-500">Log Out</Text>.
            </Text>

            {/* ================= PASSWORD ================= */}
            <SectionTitle title="Change Password" />

            <TextInput
              mode="outlined"
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={{ marginBottom: 5 }}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#666",
                marginBottom: 10,
              }}
            >
              Leave blank if you signed in with Google
            </Text>

            <TextInput
              mode="outlined"
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={{ marginBottom: 5 }}
            />
            {newPassword.length > 0 && (
              <View style={{}}>
                {!hasMinLength && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    • Password must be at least 8 characters
                  </Text>
                )}

                {!hasUppercase && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    • Must contain at least 1 uppercase letter
                  </Text>
                )}

                {!hasLowercase && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    • Must contain at least 1 lowercase letter
                  </Text>
                )}
              </View>
            )}

            <TextInput
              mode="outlined"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={{ marginBottom: 5, marginTop: 10 }}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
                • Passwords do not match
              </Text>
            )}

            {/* ================= SAVE ================= */}
            <Button
              mode="contained"
              buttonColor={canSave ? "rgb(1, 107, 1)" : "#ccc"}
              disabled={!canSave || loading}
              onPress={handleSavePress}
              style={{
                marginTop: 10,
                opacity: canSave ? 1 : 0.6,
              }}
            >
              {loading ? (
                <ActivityIndicator animating={true} color="white" />
              ) : (
                "Save All Changes"
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <Pressable
          onPress={() => setImageModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                marginBottom: 15,
                textAlign: "center",
              }}
            >
              Update Profile Image
            </Text>

            <Button
              icon="camera"
              mode="text"
              onPress={() => {
                setImageModalVisible(false);
                pickImage(true);
              }}
            >
              Take Photo
            </Button>

            <Button
              icon="image"
              mode="text"
              onPress={() => {
                setImageModalVisible(false);
                pickImage(false);
              }}
            >
              Choose from Gallery
            </Button>

            <Button
              icon="close"
              mode="text"
              onPress={() => setImageModalVisible(false)}
              textColor="red"
            >
              Cancel
            </Button>
          </View>
        </Pressable>
      </Modal>
      <Modal visible={emailConfirmVisible} transparent animationType="fade">
        <Pressable
          onPress={() => setEmailConfirmVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 10,
              }}
            >
              Confirm Email Change
            </Text>

            <Text
              className="text-gray-600"
              style={{
                marginBottom: 15,
                fontWeight: "600",
                lineHeight: 20,
              }}
            >
              ⚠️ You are changing your email to{" "}
              <Text className="font-extrabold">{email}</Text>. This will{" "}
              <Text className="text-red-500 font-bold">Log You Out</Text> and{" "}
              <Text className="text-red-500 font-bold">cannot be undone</Text>.{" "}
              You will need to verify your new email again.
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                mode="outlined"
                onPress={() => setEmailConfirmVisible(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                buttonColor="red"
                onPress={() => {
                  setEmailConfirmVisible(false);
                  saveProfile(); // proceed
                }}
                style={{ flex: 1 }}
              >
                Continue
              </Button>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
