import { registerClient } from "./registration";

import { useRef, useState } from "react";
import { Alert, Pressable, Text } from "react-native";
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
    <Page back="home">
      <Brand />
      <Heading>Bienvenido de nuevo</Heading>
      <Body muted>
        Inicia sesión para reservar tu próximo momento de cuidado.
      </Body>
      {!!flow.pending && (
        <Card>
          <Body>{flow.pending.reason}</Body>
          <TextAction
            label="Crear una cuenta de cliente"
            onPress={() => flow.go("register")}
          />
        </Card>
      )}
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
        {(message || auth.notice) && (
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
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  async function submit() {
    if (pending.current) return;
    if (
      name.trim().length < 3 ||
      !/^[0-9]{10}$/.test(phone) ||
      Object.keys(validateCredentials({ email, password })).length ||
      password !== confirm ||
      !terms
    ) {
      setError(
        "Revisa tu nombre, correo, teléfono de 10 dígitos, contraseñas y confirmación de datos.",
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
    pending.current = true;
    setLoading(true);
    try {
      await registerClient({ name, email, phone, password });
      setPassword("");
      setConfirm("");
      setRegistered(true);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "No pudimos crear tu cuenta.",
      );
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }
  if (registered)
    return (
      <Page back="home">
        <Brand />
        <Heading>Tu cuenta está lista</Heading>
        <Card>
          <Body>
            El registro se completó correctamente. Ya puedes iniciar sesión con
            tu correo y contraseña.
          </Body>
          <Button
            label="Iniciar sesión con mi cuenta"
            onPress={() => flow.go("sign-in")}
          />
        </Card>
      </Page>
    );
  return (
    <Page back="sign-in">
      <Brand />
      <Heading>Crea tu cuenta</Heading>
      <Body muted>Tu próximo momento de cuidado empieza aquí.</Body>
      {!!flow.pending && (
        <Card>
          <Body>{flow.pending.reason}</Body>
        </Card>
      )}
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
        <Body>He revisado que mis datos son correctos.</Body>
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        label="Crear cuenta"
        loading={loading}
        onPress={() => void submit()}
      />
      <TextAction
        label="Ya tengo cuenta · Iniciar sesión"
        onPress={() => flow.go("sign-in")}
      />
    </Page>
  );
}
