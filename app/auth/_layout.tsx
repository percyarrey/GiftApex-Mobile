import { useAuthStore } from "@/store/useAuthStore";
import { Redirect, Slot, usePathname } from "expo-router";

export default function AuthLayout() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  // Prevent redirect loop
  if (user && user.isBlock && pathname !== "/auth/banned-account") {
    return <Redirect href="/auth/banned-account" />;
  }
  // Prevent redirect loop
  if (user && !user.isVerified && pathname !== "/auth/verify-email") {
    return <Redirect href="/auth/verify-email" />;
  }

  return <Slot screenOptions={{ headerShown: false }} />;
}
