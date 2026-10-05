import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../features/auth/AuthProvider';
import { validateCredentials, type LoginErrors } from '../features/auth/validation';
import { colors } from '../theme';

export default function SignIn() {
  const { signIn, notice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const passwordInput = useRef<TextInput>(null);
  async function submit() {
    if (submitting.current) return;
    const next = validateCredentials({ email, password });
    setErrors(next); setMessage(null);
    if (Object.keys(next).length) return;
    submitting.current = true; setLoading(true);
    try { await signIn(email, password); setPassword(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No pudimos iniciar sesión.'); }
    finally { submitting.current = false; setLoading(false); }
  }
  return <SafeAreaView style={styles.page}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.brand}><Text style={styles.monogram}>EC</Text><Text style={styles.name}>EZEQUIEL CASTILLO</Text><Text style={styles.tagline}>HAIR DESIGNER</Text></View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.description}>Inicia sesión para consultar servicios y gestionar tus citas.</Text>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput accessibilityLabel="Correo electrónico" style={[styles.input, errors.email && styles.invalid]} value={email} onChangeText={value => { setEmail(value); setErrors(previous => ({ ...previous, email: undefined })); setMessage(null); }} placeholder="nombre@correo.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" editable={!loading} returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} />
          {errors.email && <Text accessibilityRole="alert" style={styles.error}>{errors.email}</Text>}
          <Text style={styles.label}>Contraseña</Text>
          <TextInput ref={passwordInput} accessibilityLabel="Contraseña" style={[styles.input, errors.password && styles.invalid]} value={password} onChangeText={value => { setPassword(value); setErrors(previous => ({ ...previous, password: undefined })); setMessage(null); }} placeholder="Tu contraseña" placeholderTextColor={colors.muted} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" editable={!loading} returnKeyType="go" onSubmitEditing={() => void submit()} />
          {errors.password && <Text accessibilityRole="alert" style={styles.error}>{errors.password}</Text>}
          <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} disabled={loading} onPress={() => setVisible(value => !value)} style={styles.show}><Text style={styles.link}>{visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Text></Pressable>
          {(message || notice) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{message || notice}</Text>}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void submit()} style={({ pressed }) => [styles.button, (pressed || loading) && { opacity: 0.75 }]}>
            {loading ? <ActivityIndicator color="#FFFFFF" accessibilityLabel="Iniciando sesión" /> : <Text style={styles.buttonText}>Iniciar sesión</Text>}
          </Pressable>
          <Text style={styles.help}>Usa la cuenta de cliente que ya tienes en la estética.</Text>
        </View>
        <Text style={styles.footer}>Tu próximo momento de cuidado empieza aquí.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background }, scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 36 },
  brand: { alignItems: 'center', marginBottom: 28 }, monogram: { fontSize: 34, color: colors.accent, fontWeight: '600', marginBottom: 10 }, name: { fontSize: 15, fontWeight: '700', letterSpacing: 2, color: colors.ink }, tagline: { fontSize: 11, letterSpacing: 3, color: colors.muted, marginTop: 5 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: colors.surface, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 25, fontWeight: '600', color: colors.ink }, description: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 8, marginTop: 16 }, input: { minHeight: 52, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.ink, fontSize: 16 }, invalid: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 14, marginTop: 8, lineHeight: 20 }, show: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end' }, link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: colors.accent, minHeight: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 }, help: { textAlign: 'center', color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 18 }, footer: { color: colors.muted, textAlign: 'center', fontSize: 13, lineHeight: 20, marginTop: 26 },
});
