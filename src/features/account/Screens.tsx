import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import {
  Body,
  Brand,
  Button,
  Card,
  Empty,
  Icon,
  Page,
  Row,
  TextAction,
  s,
} from "../../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { useFlow } from "../interfaces/Flow";
import { useRemote } from "../api/useRemote";
import { decodeProfile } from "./model";
import { colors } from "../../theme";
import {
  useAppointments,
  displayedStatus,
  isUpcoming,
  appointmentDate,
} from "../appointments/data";
export function HomeScreen() {
  const flow = useFlow(),
    auth = useAuth();
  const profile = useRemote(
    auth.token ? "/users/profile" : null,
    auth.token,
    decodeProfile,
  );
  const appointments = useAppointments();
  const upcoming = appointments.data?.find(isUpcoming);
  return (
    <Page screen="home">
      <View style={s.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[s.label, { color: colors.roseDeep }]}>
            EZEQUIEL CASTILLO
          </Text>
          <Text style={s.heading}>
            {profile.data
              ? "Hola, " + profile.data.name.split(" ")[0]
              : "Bienvenido a tu espacio"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir carrito"
          onPress={() => flow.go("cart")}
          style={{
            minWidth: 48,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.cream,
            borderRadius: 24,
          }}
        >
          <Icon name="shopping-bag" />
        </Pressable>
      </View>
      <View
        style={{
          backgroundColor: colors.cream,
          borderRadius: 22,
          padding: 24,
          gap: 16,
        }}
      >
        <Image
          source={require("../../../assets/brand/emblema.png")}
          accessibilityLabel="Logo original de Ezequiel Castillo Hair Designer"
          resizeMode="contain"
          style={{ width: 72, height: 76 }}
        />
        <Text style={s.heading}>Belleza que inspira</Text>
        <Body>
          Conoce nuestros servicios y productos. Encuentra el cuidado que te
          hace sentir tú.
        </Body>
        <Button
          label="Ver nuestros servicios"
          icon="scissors"
          onPress={() => flow.go("services")}
        />
      </View>
      {!auth.token && (
        <Card>
          <Text style={s.subheading}>Explora libremente</Text>
          <Body>
            Puedes consultar el catálogo sin cuenta. Para agendar una cita o
            usar el carrito, inicia sesión o regístrate.
          </Body>
          <Button label="Iniciar sesión" onPress={() => flow.go("sign-in")} />
          <TextAction
            label="Crear una cuenta de cliente"
            onPress={() => flow.go("register")}
          />
        </Card>
      )}
      <Text style={s.subheading}>Descubre tu próximo favorito</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          {
            title: "Servicios",
            description: "Cortes, color y cuidados",
            icon: "scissors" as const,
            screen: "services" as const,
          },
          {
            title: "Productos",
            description: "Tu rutina profesional",
            icon: "shopping-bag" as const,
            screen: "products" as const,
          },
        ].map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            accessibilityLabel={"Explorar " + item.title.toLowerCase()}
            style={{ flex: 1 }}
            onPress={() => flow.go(item.screen)}
          >
            <Card>
              <Icon name={item.icon} color={colors.roseDeep} />
              <Text style={s.subheading}>{item.title}</Text>
              <Body muted>{item.description}</Body>
              <Icon name="arrow-right" color={colors.roseDeep} />
            </Card>
          </Pressable>
        ))}
      </View>
      {!!auth.token && (
        <>
          <Text style={s.subheading}>Tu próxima cita</Text>
          {appointments.loading ? (
            <ActivityIndicator
              accessibilityLabel="Cargando tus citas"
              color={colors.roseDeep}
            />
          ) : appointments.error ? (
            <Card>
              <Body>{appointments.error}</Body>
              <Button label="Actualizar citas" onPress={appointments.refresh} />
            </Card>
          ) : upcoming ? (
            <Card>
              <Text style={s.subheading}>{upcoming.service}</Text>
              <Row label="Fecha" value={appointmentDate(upcoming.date)} />
              <Row label="Estado" value={displayedStatus(upcoming)} />
              <Button
                label="Ver mis citas"
                secondary
                onPress={() => flow.go("appointments")}
              />
            </Card>
          ) : (
            <Empty
              title="Aún no tienes citas pendientes"
              description="Consulta los servicios y elige tu próximo cuidado."
              icon="calendar"
            />
          )}
          <Button
            label="Consultar mi perfil"
            secondary
            onPress={() => flow.go("profile")}
          />
        </>
      )}
    </Page>
  );
}
export function ProfileScreen() {
  const flow = useFlow(),
    auth = useAuth();
  const profile = useRemote(
    auth.token ? "/users/profile" : null,
    auth.token,
    decodeProfile,
  );
  const [leaving, setLeaving] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function leave() {
    setLeaving(true);
    try {
      await auth.signOut();
    } catch {
      setError("No pudimos cerrar tu sesión. Inténtalo nuevamente.");
    } finally {
      setLeaving(false);
    }
  }
  return (
    <Page title="Mi perfil" subtitle="Tus datos de cliente." screen="profile">
      <Brand />
      {profile.loading ? (
        <ActivityIndicator
          accessibilityLabel="Cargando perfil"
          color={colors.roseDeep}
        />
      ) : profile.error ? (
        <Card>
          <Text accessibilityRole="alert" style={s.error}>
            {profile.error}
          </Text>
          <Button label="Actualizar perfil" onPress={profile.refresh} />
        </Card>
      ) : profile.data ? (
        <>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Icon name="user" size={42} color={colors.roseDeep} />
            <Text style={s.subheading}>{profile.data.name}</Text>
            <Body muted>{profile.data.email}</Body>
          </View>
          <Card>
            <Row label="Nombre" value={profile.data.name} />
            <Row label="Correo" value={profile.data.email} />
            <Row
              label="Teléfono"
              value={profile.data.phone || "Sin registrar"}
            />
            <Body muted>
              Si necesitas corregir tus datos, contacta a la estética.
            </Body>
          </Card>
        </>
      ) : null}
      <Button
        label="Mis citas"
        secondary
        icon="calendar"
        onPress={() => flow.go("appointments")}
      />
      <Button
        label="Mi carrito"
        secondary
        icon="shopping-bag"
        onPress={() => flow.go("cart")}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        label="Cerrar sesión"
        secondary
        loading={leaving}
        icon="log-out"
        onPress={() => void leave()}
      />
    </Page>
  );
}
