import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../features/auth/AuthProvider';
import { colors } from '../../theme';

export default function ClientHome() {
  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  async function leave() {
    setLeaving(true); setError(null);
    try { await signOut(); }
    catch { setError('No pudimos cerrar la sesión. Inténtalo nuevamente.'); }
    finally { setLeaving(false); }
  }
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>EZEQUIEL CASTILLO</Text>
    <Text accessibilityRole="header" style={styles.title}>Tu espacio de cuidado</Text>
    <Text style={styles.description}>Aquí encontrarás las opciones de tu cuenta.</Text>
    <View style={styles.links}>
      <Link href="/services" style={styles.link}>Consultar servicios →</Link>
      <Link href="/products" style={styles.link}>Productos →</Link>
      <Link href="/appointments" style={styles.link}>Mis citas →</Link>
      <Link href="/cart" style={styles.link}>Mi carrito →</Link>
    </View>
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Pressable accessibilityRole="button" disabled={leaving} onPress={() => void leave()} style={styles.logout}><Text style={styles.logoutText}>{leaving ? 'Cerrando sesión…' : 'Cerrar sesión'}</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: colors.background, padding: 24 }, eyebrow: { fontSize: 12, letterSpacing: 2, color: colors.accent, marginTop: 16 }, title: { fontSize: 30, fontWeight: '600', color: colors.ink, marginTop: 14 }, description: { color: colors.muted, fontSize: 16, lineHeight: 24, marginVertical: 16 }, links: { gap: 12 }, link: { backgroundColor: colors.surface, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 17, color: colors.ink }, logout: { marginTop: 32, minHeight: 48, justifyContent: 'center' }, logoutText: { color: colors.accent, fontSize: 16, fontWeight: '600' }, error: { color: colors.error, marginTop: 16 },
});
