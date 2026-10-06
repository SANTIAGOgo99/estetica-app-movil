import { useLocalSearchParams } from "expo-router";
import { decodeItem } from "../catalog/model";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
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
import { useAuth } from "../auth/AuthProvider";
import { useRemote } from "../api/useRemote";
import {
  decodeSlots,
  mexicoDates,
  reserveAppointment,
  useAppointments,
  appointmentStatus,
  displayedStatus,
  isUpcoming,
  appointmentDate,
} from "./data";
export function BookingScreen() {
  const flow = useFlow(),
    auth = useAuth();
  const [date, setDate] = useState<string | null>(null),
    [selected, setSelected] = useState<string | null>(null),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const [dates] = useState(mexicoDates);
  const { service: id } = useLocalSearchParams<{ service?: string }>();
  const detail = useRemote(
    id && /^\d+$/.test(id) && Number(id) > 0 ? "/services/" + Number(id) : null,
    null,
    decodeItem,
  );
  const service = id ? detail.data : flow.service;
  const availability = useRemote(
    date && service && auth.token
      ? "/appointments/slots?date=" + date + "&service_id=" + service.id
      : null,
    auth.token,
    decodeSlots,
  );
  const slot = availability.data?.slots.find(
    (slot) => slot.date === selected && slot.available,
  );
  async function reserve() {
    if (pending.current || !auth.token || !service || !slot || !date) return;
    pending.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await reserveAppointment(
        auth.token,
        slot.date,
        service.id,
      );
      flow.setBooking({ ...result, service, date, time: slot.time });
      flow.go("booking-confirmed");
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "No pudimos registrar tu cita.",
      );
      setSelected(null);
      availability.refresh();
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  if (detail.loading || detail.error)
    return (
      <Page title="Agendar cita" back="services">
        {detail.loading ? (
          <ActivityIndicator
            accessibilityLabel="Consultando servicio"
            color={colors.roseDeep}
          />
        ) : (
          <Card>
            <Text accessibilityRole="alert" style={s.error}>
              {detail.error}
            </Text>
            <Button label="Volver a consultar" onPress={detail.refresh} />
          </Card>
        )}
      </Page>
    );
  if (!service)
    return (
      <Page title="Agendar cita" back="services">
        <Empty
          title="Elige tu servicio"
          description="Consulta el catálogo y selecciona el cuidado que quieres reservar."
          icon="calendar"
        />
        <Button label="Ver servicios" onPress={() => flow.go("services")} />
      </Page>
    );
  return (
    <Page
      title="Agendar cita"
      subtitle="Selecciona una fecha y un horario disponibles."
      back="service-detail"
      footer={
        <Button
          label="Confirmar mi cita"
          loading={saving}
          disabled={!slot || !date || availability.loading}
          onPress={() => void reserve()}
        />
      }
    >
      <Card>
        <Text style={s.subheading}>{service.name}</Text>
        <Row
          label="Duración"
          value={service.duration ? service.duration + " min" : "Consultar"}
        />
        <Row label="Precio" value={money(service.price)} />
      </Card>
      <Text style={s.label}>Selecciona una fecha</Text>
      <Chips
        values={dates}
        value={date ?? ""}
        onChange={(value) => {
          setDate(value);
          setSelected(null);
          setError(null);
        }}
      />
      <Text style={s.label}>Selecciona un horario</Text>
      {!date ? (
        <Body muted>Primero selecciona el día de tu cita.</Body>
      ) : availability.loading ? (
        <ActivityIndicator
          accessibilityLabel="Consultando horarios reales"
          color={colors.roseDeep}
        />
      ) : availability.error ? (
        <Card>
          <Text accessibilityRole="alert" style={s.error}>
            {availability.error}
          </Text>
          <Button
            label="Consultar horarios nuevamente"
            onPress={availability.refresh}
          />
        </Card>
      ) : (
        <>
          <Body muted>{availability.data?.message}</Body>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {availability.data?.slots.map((slot) => (
              <Pressable
                key={slot.date}
                accessibilityRole="button"
                accessibilityLabel={
                  slot.time +
                  (slot.available ? " disponible" : " · " + slot.reason)
                }
                accessibilityState={{
                  disabled: !slot.available || saving,
                  selected: selected === slot.date,
                }}
                disabled={!slot.available || saving}
                onPress={() => {
                  setSelected(slot.date);
                  setError(null);
                }}
                style={[
                  s.chip,
                  { minHeight: 48, opacity: slot.available ? 1 : 0.45 },
                  selected === slot.date && { backgroundColor: colors.accent },
                ]}
              >
                <Text style={s.label}>{slot.time}</Text>
                {!slot.available && (
                  <Text style={[s.label, { fontSize: 11 }]}>No disponible</Text>
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Card>
        <Text style={s.subheading}>Revisa tu cita</Text>
        <Row label="Servicio" value={service.name} />
        <Row
          label="Fecha"
          value={date ? appointmentDate(date) : "Por seleccionar"}
        />
        <Row label="Hora" value={slot?.time ?? "Por seleccionar"} />
        <Row label="Precio del servicio" value={money(service.price)} />
        <Body muted>
          Al confirmar se registrará una cita real en la estética. El horario se
          verifica nuevamente al guardar.
        </Body>
      </Card>
      {!!error && (
        <Card>
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
          <TextAction
            label="Revisar mis citas antes de volver a intentar"
            onPress={() => flow.go("appointments")}
          />
        </Card>
      )}
    </Page>
  );
}
export function BookingConfirmedScreen() {
  const flow = useFlow(),
    booking = flow.booking;
  if (!booking)
    return (
      <Page title="Confirmación de cita" back="appointments">
        <Empty
          title="Consulta tu agenda"
          description="Aquí aparecerá la confirmación cuando el servidor registre tu cita."
          icon="calendar"
        />
        <Button label="Ver mis citas" onPress={() => flow.go("appointments")} />
      </Page>
    );
  return (
    <Page>
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 24 }}>
        <Icon name="check-circle" size={58} color={colors.roseDeep} />
        <Text style={s.heading}>¡Cita registrada!</Text>
        <Body muted>Tu reservación se guardó correctamente.</Body>
      </View>
      <Card>
        <Text style={s.subheading}>{booking.service.name}</Text>
        <Row label="Folio" value={"#" + booking.id} />
        <Row label="Fecha" value={appointmentDate(booking.date)} />
        <Row label="Hora" value={booking.time} />
        <Row label="Estado" value={appointmentStatus(booking.status)} />
        <Row label="Total" value={money(booking.total)} />
        <Row label="Anticipo registrado" value={money(booking.deposit)} />
      </Card>
      <Button label="Ver mis citas" onPress={() => flow.go("appointments")} />
      <TextAction label="Volver al inicio" onPress={() => flow.go("home")} />
    </Page>
  );
}
export function AppointmentsScreen() {
  const flow = useFlow(),
    appointments = useAppointments();
  const [tab, setTab] = useState("Próximas");
  const visible = appointments.data?.filter((item) =>
    tab === "Próximas" ? isUpcoming(item) : !isUpcoming(item),
  );
  return (
    <Page
      title="Mis citas"
      subtitle="Tu agenda con la estética."
      screen="appointments"
    >
      <Chips values={["Próximas", "Historial"]} value={tab} onChange={setTab} />
      <Button
        label="Actualizar mi agenda"
        secondary
        onPress={appointments.refresh}
      />
      {appointments.loading ? (
        <ActivityIndicator
          accessibilityLabel="Cargando mis citas"
          color={colors.roseDeep}
        />
      ) : appointments.error ? (
        <Card>
          <Text accessibilityRole="alert" style={s.error}>
            {appointments.error}
          </Text>
          <Button label="Intentar nuevamente" onPress={appointments.refresh} />
        </Card>
      ) : !visible?.length ? (
        <Empty
          title="No hay citas en esta sección"
          description="Consulta nuestros servicios y agenda tu próximo cuidado."
          icon="calendar"
        />
      ) : (
        visible.map((item) => (
          <Card key={item.id}>
            <View style={s.row}>
              <Text style={s.subheading}>{item.service}</Text>
              <Text style={[s.label, { color: colors.roseDeep }]}>
                {displayedStatus(item)}
              </Text>
            </View>
            <Row label="Folio" value={"#" + item.id} />
            <Row label="Fecha y hora" value={appointmentDate(item.date)} />
            <Row label="Total" value={money(item.price)} />
            <Row label="Anticipo registrado" value={money(item.deposit)} />
            <Row label="Saldo" value={money(item.price - item.deposit)} />
            <Body muted>
              Para cambiar o cancelar una cita, contacta a la estética.
            </Body>
          </Card>
        ))
      )}
      <Button label="Consultar servicios" onPress={() => flow.go("services")} />
    </Page>
  );
}
