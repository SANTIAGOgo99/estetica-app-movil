import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Chips,
  Empty,
  Icon,
  Page,
  Row,
  TextAction,
  money,
  s,
} from "../../components/ui";
import { colors } from "../../theme";
import { useFlow } from "../interfaces/Flow";
export function BookingScreen() {
  const flow = useFlow();
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  if (!flow.service)
    return (
      <Page title="Agendar cita" back="services">
        <Empty
          title="Elige tu servicio"
          description="Consulta el catálogo y selecciona el cuidado que quieres reservar."
        />
        <Button label="Ver servicios" onPress={() => flow.go("services")} />
      </Page>
    );
  const dates = ["28 oct", "29 oct", "30 oct", "31 oct"];
  const times = ["09:00", "10:00", "11:00", "12:00"];
  return (
    <Page
      title="Agendar cita"
      subtitle="Reserva tu momento de cuidado."
      back="service-detail"
      footer={
        <Button
          label="Continuar"
          disabled={!flow.demo || !date || !time}
          onPress={() => {
            if (date && time && flow.service) {
              flow.setBooking({ service: flow.service, date, time });
              flow.go("booking-confirmed");
            }
          }}
        />
      }
    >
      <Card>
        <Text style={s.subheading}>{flow.service.name}</Text>
        <Row label="Duración" value={(flow.service.duration ?? 45) + " min"} />
        <Row label="Precio" value={money(flow.service.price)} />
      </Card>
      <Text style={s.label}>Selecciona una fecha</Text>
      {flow.demo ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {dates.map((value) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={value}
              accessibilityState={{ selected: date === value }}
              key={value}
              onPress={() => {
                setDate(value);
                setTime(null);
              }}
              style={[
                s.chip,
                { minHeight: 58 },
                date === value && { backgroundColor: colors.accent },
              ]}
            >
              <Text style={s.label}>{value}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Empty
          title="Disponibilidad en preparación"
          description="Los días y horarios reales se conectarán con la agenda de la estética."
          icon="calendar"
        />
      )}
      <Text style={s.label}>Selecciona un horario</Text>
      {flow.demo && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {times.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={value + (value === "11:00" ? " ocupado" : "")}
              accessibilityState={{
                disabled: !date || value === "11:00",
                selected: time === value,
              }}
              disabled={!date || value === "11:00"}
              onPress={() => setTime(value)}
              style={[
                s.chip,
                { minHeight: 44 },
                (!date || value === "11:00") && { opacity: 0.4 },
                time === value && { backgroundColor: colors.accent },
              ]}
            >
              <Text style={s.label}>
                {value}
                {value === "11:00" ? " · ocupado" : ""}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Card>
        <Text style={s.subheading}>Resumen</Text>
        <Row label="Servicio" value={flow.service.name} />
        <Row label="Fecha" value={date ?? "Por seleccionar"} />
        <Row label="Hora" value={time ?? "Por seleccionar"} />
        <Row label="Total" value={money(flow.service.price)} />
        <Body muted>
          El anticipo se confirmará con las condiciones de la estética antes de
          reservar.
        </Body>
      </Card>
    </Page>
  );
}
export function BookingConfirmedScreen() {
  const flow = useFlow();
  const booking = flow.booking;
  if (!flow.demo || !booking)
    return (
      <Page title="Confirmación de cita" back="appointments">
        <Empty
          title="Sin confirmación"
          description="Aquí aparecerá el resultado cuando una cita se registre correctamente."
          icon="calendar"
        />
      </Page>
    );
  return (
    <Page>
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 24 }}>
        <Icon name="check-circle" size={58} color={colors.roseDeep} />
        <Text style={s.heading}>¡Cita lista!</Text>
        <Body muted>Así se verá la confirmación de tu cita.</Body>
      </View>
      <Card>
        <Text style={s.subheading}>{booking.service.name}</Text>
        <Row label="Fecha" value={booking.date} />
        <Row label="Hora" value={booking.time} />
        <Row
          label="Duración"
          value={(booking.service.duration ?? 45) + " min"}
        />
        <Row label="Total" value={money(booking.service.price)} />
      </Card>
      <Body muted>
        Esta es una confirmación de demostración. No se reservó ningún horario
        real.
      </Body>
      <Button label="Ver mis citas" onPress={() => flow.go("appointments")} />
      <TextAction label="Volver al inicio" onPress={() => flow.go("home")} />
    </Page>
  );
}
export function AppointmentsScreen() {
  const flow = useFlow();
  const [tab, setTab] = useState("Próximas");
  const [cancelled, setCancelled] = useState(false);
  const booking = flow.booking;
  return (
    <Page
      title="Mis citas"
      subtitle="Tus próximos momentos de cuidado."
      screen="appointments"
    >
      <Chips values={["Próximas", "Historial"]} value={tab} onChange={setTab} />
      {!flow.demo ? (
        <Empty
          title="Consulta de citas en preparación"
          description="Aquí consultarás, reagendarás o cancelarás tus citas cuando conectemos tu agenda."
          icon="calendar"
        />
      ) : !booking || cancelled || tab === "Historial" ? (
        <Empty
          title="No hay citas en esta sección"
          description="Cuando tengas citas aparecerán aquí."
          icon="calendar"
        />
      ) : (
        <Card>
          <View style={s.row}>
            <Text style={s.subheading}>{booking.service.name}</Text>
            <Text style={[s.label, { color: colors.success }]}>Confirmada</Text>
          </View>
          <Row label="Fecha" value={booking.date} />
          <Row label="Hora" value={booking.time} />
          <Row label="Total" value={money(booking.service.price)} />
          <Button
            label="Ver detalle"
            secondary
            onPress={() => flow.go("booking-confirmed")}
          />
          <TextAction
            label="Reagendar"
            onPress={() => {
              flow.selectService(booking.service);
              flow.go("booking");
            }}
          />
          <TextAction
            label="Cancelar cita de demostración"
            onPress={() => setCancelled(true)}
          />
        </Card>
      )}
      <Button label="Consultar servicios" onPress={() => flow.go("services")} />
    </Page>
  );
}
