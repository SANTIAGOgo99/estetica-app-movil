import { Text } from "react-native";
import { Body, Button, Card, Page, s } from "../../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { useFlow } from "../interfaces/Flow";
import { PRIVACY_NOTICE_VERSION } from "./notice";

export function PrivacyNoticeContent() {
  return (
    <>
      <Text style={s.subheading}>Quién utiliza tus datos</Text>
      <Body>
        Ezequiel Castillo Ángeles Hair Designer utiliza la información que
        proporcionas para atenderte como cliente de la estética.
      </Body>
      <Text style={s.subheading}>Qué información proporcionas</Text>
      <Body>
        Al registrarte proporcionas nombre, correo electrónico, teléfono y una
        contraseña. Al agendar se registra el servicio, la fecha y el horario de
        tu cita. No solicitamos datos bancarios en el registro.
      </Body>
      <Text style={s.subheading}>Para qué la utilizamos</Text>
      <Body>
        Para crear tu cuenta, verificar tu acceso, identificar tus citas y
        atender asuntos relacionados con los servicios que solicitas. La app
        no ofrece actualmente suscripciones a mensajes promocionales.
      </Body>
      <Text style={s.subheading}>Tu sesión y tus datos</Text>
      <Body>
        Conservamos una credencial de sesión en tu dispositivo para reconocer
        tu acceso. Puedes cerrar sesión desde Mi perfil. Tu cuenta y tus citas
        se consultan en el servidor de la estética; cerrar sesión no elimina
        esa información.
      </Body>
      <Text style={s.subheading}>Acceso, rectificación, cancelación y oposición</Text>
      <Body>
        Puedes consultar tus datos desde Mi perfil. Para solicitar una
        corrección, la cancelación de tu cuenta o manifestar oposición a un
        uso de tus datos, solicita atención directamente en la recepción de la
        estética. Se verificará tu identidad antes de atender la solicitud.
        La cancelación de una cuenta y la cancelación de una cita son trámites
        distintos.
      </Body>
      <Text style={s.subheading}>Tu decisión</Text>
      <Body>
        Puedes explorar los servicios y productos sin crear una cuenta. Para
        registrarte debes leer este aviso y marcar personalmente la casilla de
        aceptación. Consultar el aviso no marca la casilla por ti.
      </Body>
      <Body muted>Versión del aviso: {PRIVACY_NOTICE_VERSION}.</Body>
    </>
  );
}

export function PrivacyScreen() {
  const auth = useAuth();
  const flow = useFlow();
  return (
    <Page title="Aviso de privacidad" subtitle="Conoce cómo se utiliza tu información." back="home">
      <Card><PrivacyNoticeContent /></Card>
      {!!auth.token && <Button label="Consultar mis datos" onPress={() => flow.go("profile")} />}
    </Page>
  );
}
