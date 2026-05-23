// app/(user)/index.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FAB, PaperProvider, Portal } from "react-native-paper";

export default function HomeScreen() {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Text style={styles.text}>Home Page</Text>

        {/* Dark Overlay */}
        {open && <View style={styles.overlay} />}

        {/* Floating Action Button Group */}
        <Portal>
          <FAB.Group
            open={open}
            visible
            icon={open ? "close" : "apps"}
            backdropColor="rgba(0,0,0,0.35)"
            fabStyle={styles.mainFab}
            color="white"
            actions={[
              {
                icon: "cash",
                label: "Sell Code",
                onPress: () => router.push("/(user)/sell-code"),
                style: styles.actionFab,
                labelStyle: styles.labelStyle,
              },

              {
                icon: "file-document",
                label: "Codes",
                onPress: () => router.push("/(user)/codes"),
                style: styles.actionFab,
                labelStyle: styles.labelStyle,
              },

              {
                icon: "wallet",
                label: "Payout",
                onPress: () => router.push("/(user)/payout"),
                style: styles.actionFab,
                labelStyle: styles.labelStyle,
              },
            ]}
            onStateChange={({ open }) => setOpen(open)}
          />
        </Portal>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontSize: 24,
    fontWeight: "bold",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  mainFab: {
    backgroundColor: "#E50914",
  },

  actionFab: {
    backgroundColor: "#E50914",
  },

  labelStyle: {
    backgroundColor: "#111827",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 14,
  },
});
