import { Stack } from 'expo-router';
import { colors } from '../../theme';

export default function ClientLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink }}>
    <Stack.Screen name="index" options={{ title: 'Mi cuenta' }} />
    <Stack.Screen name="services" options={{ title: 'Servicios' }} />
    <Stack.Screen name="products" options={{ title: 'Productos' }} />
    <Stack.Screen name="appointments" options={{ title: 'Mis citas' }} />
    <Stack.Screen name="cart" options={{ title: 'Mi carrito' }} />
  </Stack>;
}
