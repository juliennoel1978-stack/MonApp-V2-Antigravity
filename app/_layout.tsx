import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/contexts/AppContext";

// Polyfill for Reanimated on Web to prevent crashes
if (Platform.OS === 'web') {
  // @ts-ignore
  global.__reanimatedLoggerConfig = {};
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
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
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="assistant" 
        options={{ 
          headerShown: false,
          presentation: "card"
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
