import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, ImageBackground, Pressable, Text, View } from "react-native";
import { useAuth } from "./AuthProvider";
import { validateCredentials, type LoginErrors } from "./validation";
import { useFlow } from "../interfaces/Flow";
import {
  Brand,
  Body,
  Button,
  Card,
  Field,
  Heading,
  Icon,
  Page,
  TextAction,
  s,
} from "../../components/ui";
import { colors } from "../../theme";
export function WelcomeScreen() {
  const flow = useFlow();
  return (
    <Page>
      <Brand large />
      <ImageBackground
        source={require("../../../assets/brand/fondo-login.jpg")}
        resizeMode="cover"
        imageStyle={{ borderRadius: 22 }}
        style={{
          minHeight: 240,
          justifyContent: "flex-end",
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(46,26,14,0.78)",
            padding: 24,
            gap: 10,
          }}
        >
          <Text style={[s.heading, { color: colors.background }]}>
            Tu estilo, en tus manos
          </Text>
          <Text style={[s.body, { color: colors.background }]}>
            Reserva tu momento y encuentra tu próximo favorito. Todo en un solo
            lugar.
          </Text>
        </View>
      </ImageBackground>
      <View style={{ flex: 1, minHeight: 20 }} />
      <Button label="Comenzar" onPress={() => flow.go("register")} />
      <TextAction
        label="Ya tengo cuenta · Iniciar sesión"
        onPress={() => flow.go("sign-in")}
      />
      {__DEV__ && !flow.demo && (
        <TextAction
          label="Recorrer las interfaces de demostración"
          onPress={() => router.push("/preview/welcome")}
        />
      )}
    </Page>
  );
}
export function SignInScreen() {
  const flow = useFlow();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  async function submit() {
    if (pending.current) return;
    const next = validateCredentials({ email, password });
    setErrors(next);
    setMessage(null);
    if (Object.keys(next).length) return;
    if (flow.demo) {
      flow.go("home");
      return;
    }
    pending.current = true;
    setLoading(true);
    try {
      await auth.signIn(email, password);
      setPassword("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "No pudimos iniciar sesión.",
      );
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }
  return (
    <Page back="welcome">
      <Brand />
      <Heading>Bienvenido de nuevo</Heading>
      <Body muted>
        Inicia sesión para reservar tu próximo momento de cuidado.
      </Body>
      <Card>
        <Field
          label="Correo electrónico"
          icon="mail"
          placeholder="nombre@correo.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((old) => ({ ...old, email: undefined }));
            setMessage(null);
          }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading}
        />
        <Field
          label="Contraseña"
          icon="lock"
          secret
          placeholder="Tu contraseña"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((old) => ({ ...old, password: undefined }));
            setMessage(null);
          }}
          error={errors.password}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          editable={!loading}
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        <TextAction
          label="¿Olvidaste tu contraseña?"
          onPress={() =>
            Alert.alert(
              "Recuperar acceso",
              "La web todavía no ofrece recuperación automática. Contacta a la estética para recuperar tu cuenta.",
            )
          }
        />
        {(message || (!flow.demo && auth.notice)) && (
          <Text accessibilityRole="alert" style={s.error}>
            {message || auth.notice}
          </Text>
        )}
        <Button
          label="Iniciar sesión"
          loading={loading}
          onPress={() => void submit()}
        />
      </Card>
      <TextAction
        label="¿No tienes cuenta? · Crear cuenta"
        onPress={() => flow.go("register")}
      />
      {__DEV__ && !flow.demo && (
        <TextAction
          label="Ver las interfaces de demostración"
          onPress={() => router.push("/preview/home")}
        />
      )}
    </Page>
  );
}
export function RegisterScreen() {
  const flow = useFlow();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  function submit() {
    if (
      name.trim().length < 3 ||
      !/^[0-9]{10}$/.test(phone) ||
      Object.keys(validateCredentials({ email, password })).length ||
      password !== confirm ||
      !terms
    ) {
      setError(
        "Revisa tu nombre, correo, teléfono de 10 dígitos, contraseñas y aceptación de términos.",
      );
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      setError(
        "Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.",
      );
      return;
    }
    setError("");
    flow.go("sign-in");
  }
  return (
    <Page back="sign-in">
      <Brand />
      <Heading>Crea tu cuenta</Heading>
      <Body muted>Tu próximo momento de cuidado empieza aquí.</Body>
      <Field
        label="Nombre completo"
        icon="user"
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />
      <Field
        label="Correo electrónico"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Field
        label="Teléfono"
        icon="phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <Field
        label="Contraseña"
        icon="lock"
        secret
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
      />
      <Field
        label="Confirmar contraseña"
        icon="lock"
        secret
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="none"
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: terms }}
        onPress={() => setTerms((old) => !old)}
        style={[s.row, { justifyContent: "flex-start", minHeight: 48 }]}
      >
        <Icon name={terms ? "check-square" : "square"} />
        <Body>Acepto términos y privacidad.</Body>
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      {!flow.demo && (
        <Body muted>
          El registro móvil está en preparación. Por ahora utiliza tu cuenta de
          cliente existente.
        </Body>
      )}
      <Button
        label={flow.demo ? "Crear cuenta de demostración" : "Crear cuenta"}
        disabled={!flow.demo}
        onPress={submit}
      />
      <TextAction
        label="Ya tengo cuenta · Iniciar sesión"
        onPress={() => flow.go("sign-in")}
      />
    </Page>
  );
}
