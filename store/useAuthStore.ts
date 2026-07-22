/*import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Toast from "react-native-toast-message";
import { create } from "zustand";

// ================= TYPES =================
type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  isVerified: boolean;
  isBlock: boolean;
  balance?: {
    available: number;
    pending: number;
  };
};

// ================= API =================
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/auth`;

// ================= STORE TYPES =================
type AuthState = {
  user: User | null;
  isHydrated: boolean;

  // actions
  loadUser: () => Promise<void>;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
};

// ================= STORE =================
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,

  // ================= LOAD USER =================
  loadUser: async () => {
    try {
      // ================= GOOGLE CONFIG =================
      GoogleSignin.configure({
        iosClientId:
          "955977184779-c0vqs0hh4a65kfin1ufr84dj7h615ddm.apps.googleusercontent.com",

        webClientId:
          "955977184779-gk25a82ml02l7v7lnehl40vuptqmppc5.apps.googleusercontent.com",

        profileImageSize: 150,
      });

      // ================= GET STORED USER =================
      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        set({
          user: null,
          isHydrated: true,
        });

        return;
      }

      const parsedUser: User = JSON.parse(storedUser);

      // ================= VERIFY USER =================
      const res = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: parsedUser.email,
          action: "verify-user",
        }),
      });

      const data = await res.json();

      // ================= INVALID USER =================
      if (!res.ok || !data.success) {
        // Blocked user
        if (data?.isBlock) {
          set({
            user: {
              ...parsedUser,
              isBlock: true,
            },
          });
        } else {
          // remove invalid local data
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("resetPasswordData");

          set({
            user: null,
          });
        }

        return;
      }

      // ================= SAVE UPDATED USER =================
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      set({
        user: data.user,
      });
    } catch (error: any) {
      console.log("❌ Error loading user:", error);

      // ================= NETWORK ERROR =================
      if (error?.message?.toLowerCase()?.includes("network")) {
        Toast.show({
          type: "error",
          text1: "Network Error",
          text2: "Check your internet connection.",
        });
      }

      /* set({
        user: null,
      }); 
    } finally {
      set({
        isHydrated: true,
      });
    }
  },

  // ================= LOGIN =================
  login: async (user) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));

      set({
        user,
      });
    } catch (error) {
      console.log("❌ Error saving user:", error);
    }
  },

  // ================= LOGOUT =================
  logout: async () => {
    try {
      await AsyncStorage.removeItem("user");

      await AsyncStorage.removeItem("resetPasswordData");

      // Safe Google logout
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        console.log("Google signout skipped");
      }
    } catch (error) {
      console.log("❌ Logout error:", error);
    } finally {
      set({
        user: null,
      });
    }
  },
}));*/

import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Toast from "react-native-toast-message";
import { create } from "zustand";

import { registerForPushNotifications } from "@/utils/registerPushNotifications";

// ================= TYPES =================
type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  isVerified: boolean;
  isBlock: boolean;
  balance?: {
    available: number;
    pending: number;
  };
  unreadNotifications: number;
  unreadSupportTickets: number;
};

// ================= API =================
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/auth`;

// ================= STORE TYPES =================
type AuthState = {
  user: User | null;
  isHydrated: boolean;

  loadUser: () => Promise<void>;
  login: (user: User) => Promise<void>;
  logout: (user: User | null) => Promise<void>;
};

// ================= STORE =================
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrated: false,

  // ================= LOAD USER =================
  loadUser: async () => {
    try {
      // ================= GOOGLE CONFIG =================
      GoogleSignin.configure({
        iosClientId:
          "955977184779-c0vqs0hh4a65kfin1ufr84dj7h615ddm.apps.googleusercontent.com",

        webClientId:
          "955977184779-gk25a82ml02l7v7lnehl40vuptqmppc5.apps.googleusercontent.com",

        profileImageSize: 150,
      });

      // ================= GET STORED USER =================
      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        set({
          user: null,
          isHydrated: true,
        });
        return;
      }

      const parsedUser: User = JSON.parse(storedUser);

      // =====================================================
      // RESTORE USER IMMEDIATELY (WORKS EVEN WITHOUT INTERNET)
      // =====================================================
      set({
        user: parsedUser,
        isHydrated: true,
      });

      // =====================================================
      // VERIFY USER IN BACKGROUND
      // =====================================================
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: parsedUser.email,
            action: "verify-user",
          }),
        });

        const data = await res.json();

        // ================= BLOCKED USER =================
        if (data?.isBlock) {
          const blockedUser = {
            ...parsedUser,
            isBlock: true,
          };

          await AsyncStorage.setItem("user", JSON.stringify(blockedUser));

          set({
            user: blockedUser,
          });

          return;
        }

        // ================= INVALID USER =================
        if (!res.ok || !data.success) {
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("resetPasswordData");

          set({
            user: null,
          });

          return;
        }

        // ================= UPDATE LOCAL USER =================
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        set({
          user: data.user,
        });
      } catch (error: any) {
        console.log("⚠️ Offline mode:", error?.message);

        // ================= OFFLINE =================
        Toast.show({
          type: "error",
          text1: "Network Error",
          text2: "Check your internet connection.",
        });

        // IMPORTANT:
        // Do NOT logout.
        // Keep the locally saved user.
      }
    } catch (error: any) {
      console.log("❌ Error loading user:", error);

      // Only clear the session if the local storage itself is corrupted.
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("resetPasswordData");

      set({
        user: null,
        isHydrated: true,
      });
    }
  },

  // ================= LOGIN =================
  login: async (user) => {
    try {
      const token = await registerForPushNotifications();
      await AsyncStorage.setItem("user", JSON.stringify(user));
      if (token) {
        await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/save-push-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-email": user.email,
            },
            body: JSON.stringify({
              action: "save",
              pushToken: token,
            }),
          },
        );
      }
      set({
        user,
      });
    } catch (error) {
      console.log("❌ Error saving user:", error);
    }
  },

  // ================= LOGOUT =================
  logout: async (user) => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("resetPasswordData");

      try {
        if (user?.email) {
          await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/mobile/save-push-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-email": user?.email,
              },
              body: JSON.stringify({
                action: "remove",
              }),
            },
          );
        }
        await GoogleSignin.signOut();
      } catch {
        console.log("Google signout skipped");
      }
    } catch (error) {
      console.log("❌ Logout error:", error);
    } finally {
      set({
        user: null,
      });
    }
  },
}));
