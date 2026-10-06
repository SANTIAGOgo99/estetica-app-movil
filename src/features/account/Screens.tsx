import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  Body,
  Brand,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  Page,
  Row,
  TextAction,
  s,
} from "../../components/ui";
import { useAuth } from "../auth/AuthProvider";
import { colors } from "../../theme";
import { useFlow } from "../interfaces/Flow";
export function HomeScreen() {
  const flow = useFlow();
  return (
    <Page screen="home">
      <View style={s.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[s.label, { color: colors.roseDeep }]}>
            EZEQUIEL CASTILLO
          </Text>
          <Text style={s.heading}>¿Qué deseas hoy?</Text>
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
          accessibilityLabel="Emblema original de Ezequiel Castillo"
          resizeMode="contain"
          style={{ width: 64, height: 68 }}
        />
        <Text style={s.heading}>Belleza que inspira</Text>
        <Body>Encuentra el cuidado que te hace sentir tú.</Body>
        <Button
          label="Agendar una cita"
          icon="calendar"
          onPress={() => flow.go("services")}
        />
      </View>
      <Text style={s.subheading}>Explora</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          {
            title: "Servicios",
            description: "Tu próximo cuidado",
            icon: "scissors" as const,
            screen: "services" as const,
          },
          {
            title: "Productos",
            description: "Tus favoritos",
            icon: "shopping-bag" as const,
            screen: "products" as const,
          },
        ].map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            accessibilityLabel={item.title}
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
      <Text style={s.subheading}>Próxima cita</Text>
      {flow.demo && flow.booking ? (
        <Card>
          <Text style={s.subheading}>{flow.booking.service.name}</Text>
          <Row label={flow.booking.date} value={flow.booking.time} />
          <TextAction
            label="Consultar mi cita"
            onPress={() => flow.go("appointments")}
          />
        </Card>
      ) : (
        <Empty
          title="Tu agenda, en un solo lugar"
          description="Próximamente podrás consultar aquí tu siguiente cita."
          icon="calendar"
        />
      )}
      <TextAction label="Ver mis compras" onPress={() => flow.go("orders")} />
    </Page>
  );
}
export function ProfileScreen() {
  const flow = useFlow();
  const auth = useAuth();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("Cliente de ejemplo");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  async function leave() {
    if (flow.demo) {
      flow.go("sign-in");
      return;
    }
    setLeaving(true);
    try {
      await auth.signOut();
    } catch {
      setError("No pudimos cerrar la sesión. Inténtalo nuevamente.");
    } finally {
      setLeaving(false);
    }
  }
  function save() {
    if (name.trim().length < 3 || !/^[0-9]{10}$/.test(phone)) {
      setError("Escribe un nombre válido y un teléfono de 10 dígitos.");
      return;
    }
    setError("");
    setEdit(false);
  }
  return (
    <Page
      title="Mi perfil"
      subtitle="Tu espacio personal de cuidado."
      screen="profile"
    >
      <Brand />
      <View style={{ alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.cream,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="user" size={32} color={colors.roseDeep} />
        </View>
        <Text style={s.subheading}>
          {flow.demo ? name : "Mi cuenta de cliente"}
        </Text>
        <Body muted>
          {flow.demo ? "cliente@example.com" : "Sesión de cliente activa"}
        </Body>
      </View>
      {flow.demo ? (
        <Card>
          {edit ? (
            <>
              <Field
                label="Nombre completo"
                value={name}
                onChangeText={setName}
              />
              <Field
                label="Teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Button label="Guardar cambios de demostración" onPress={save} />
            </>
          ) : (
            <>
              <Row label="Nombre" value={name} />
              <Row label="Correo" value="cliente@example.com" />
              <Row label="Teléfono" value={phone || "Sin agregar"} />
              <Button label="Editar perfil" onPress={() => setEdit(true)} />
            </>
          )}
        </Card>
      ) : (
        <Empty
          title="Tus datos, próximamente"
          description="La consulta y edición de tus datos se conectará al perfil de la estética."
          icon="user"
        />
      )}
      <Button
        label="Mis compras"
        secondary
        icon="shopping-bag"
        onPress={() => flow.go("orders")}
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
