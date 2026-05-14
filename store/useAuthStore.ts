import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { create } from "zustand";

// ================= TYPES =================
type User = {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role?: string;
  isVerified: boolean;
  isBlock: boolean;
};
// ================= API =================
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/auth`;

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
  // 🔥 Load user from storage (run once in RootLayout)
  // ================= LOAD USER =================
  loadUser: async () => {
    try {
      GoogleSignin.configure({
        iosClientId:
          "955977184779-c0vqs0hh4a65kfin1ufr84dj7h615ddm.apps.googleusercontent.com",
        webClientId:
          "955977184779-gk25a82ml02l7v7lnehl40vuptqmppc5.apps.googleusercontent.com",
        profileImageSize: 150,
      });

      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        set({ user: null });
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      // 🔥 VERIFY USER FROM BACKEND
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
      // ❌ Invalid user
      if (!res.ok || !data.success) {
        if (data.isBlock) {
          set({
            user: { ...parsedUser, isBlock: data.isBlock || false },
          });
        } else {
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("resetPasswordData"); // Clear any temp data
        }
        return;
      }

      // ✅ Save fresh backend user
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      set({
        user: data.user,
      });
    } catch (error) {
      console.log("❌ Error loading user:", error);

      set({
        user: null,
      });
    } finally {
      set({
        isHydrated: true,
      });
    }
  },

  // 🔥 Login (store + update state)
  login: async (user) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.log("❌ Error saving user:", error);
    }
  },

  // 🔥 Logout (clear everything)
  logout: async () => {
    try {
      await AsyncStorage.removeItem("user");

      await GoogleSignin.signOut(); // safe even if not signed in
      await AsyncStorage.removeItem("resetPasswordData"); // Clear any temp data
    } catch (error) {
      console.log("❌ Logout error:", error);
    } finally {
      set({ user: null });
    }
  },
}));
