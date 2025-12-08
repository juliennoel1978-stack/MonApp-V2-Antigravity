import '../polyfill';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TouchableOpacity, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { AppProvider } from "@/contexts/AppContext";

try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.log('SplashScreen warning:', e);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();

  return (
    <Stack screenOptions={{ headerBackTitle: "Retour" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="select-user" options={{ headerShown: false }} />
      <Stack.Screen name="user-form" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="tables" options={{ headerShown: false }} />
      <Stack.Screen
        name="discovery/[tableNumber]"
        options={{
          headerShown: false,
          presentation: "card"
        }}
      />
      <Stack.Screen
        name="practice/[tableNumber]"
        options={{
          headerShown: false,
          presentation: "card"
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Paramètres",
          presentation: "modal",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                router.dismissAll();
                router.replace('/');
              }}
              style={{ marginRight: 8 }}
            >
              <X size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="challenge"
        options={{
          headerShown: false,
          presentation: "card"
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen immediately since we rely on system fonts now
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
