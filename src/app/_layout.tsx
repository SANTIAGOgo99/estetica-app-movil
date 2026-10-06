import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Feather } from "@expo/vector-icons";
import { CormorantGaramond_600SemiBold } from "@expo-google-fonts/cormorant-garamond/600SemiBold";
import { Outfit_400Regular } from "@expo-google-fonts/outfit/400Regular";
import { Outfit_500Medium } from "@expo-google-fonts/outfit/500Medium";
import { Outfit_600SemiBold } from "@expo-google-fonts/outfit/600SemiBold";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { FlowProvider } from "../features/interfaces/Flow";
import { colors } from "../theme";
function Navigator() {
  const { token, restoring } = useAuth();
  if (restoring)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator
          accessibilityLabel="Recuperando sesión"
          color={colors.roseDeep}
        />
      </View>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="services" />
      <Stack.Screen name="products" />
      <Stack.Screen name="service-detail" />
      <Stack.Screen name="product-detail" />
      <Stack.Protected guard={!token}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(client)" />
      </Stack.Protected>
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="preview" />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_600SemiBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    ...Feather.font,
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          accessibilityLabel="Preparando interfaz"
          color={colors.roseDeep}
        />
      </View>
    );
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FlowProvider>
          <StatusBar style="dark" />
          <Navigator />
        </FlowProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
