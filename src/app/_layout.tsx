import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { colors } from '../theme';

function Navigator() {
  const { token, restoring } = useAuth();
  if (restoring) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator accessibilityLabel="Recuperando sesión" color={colors.accent} /></View>;
  return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink }}>
    <Stack.Protected guard={!token}><Stack.Screen name="sign-in" options={{ headerShown: false }} /></Stack.Protected>
    <Stack.Protected guard={!!token}><Stack.Screen name="(client)" options={{ headerShown: false }} /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><Navigator /></AuthProvider></SafeAreaProvider>;
}
