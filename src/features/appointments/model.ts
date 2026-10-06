import { object } from "../api/client.ts";
export type Appointment = {
  id: number;
  serviceId: number;
  service: string;
  date: string;
  status: string;
  phase: string;
  price: number;
  deposit: number;
  duration: number;
};
export type Slot = {
  time: string;
  date: string;
  available: boolean;
  reason: string;
};
export function decodeAppointments(value: unknown): Appointment[] {
  const response = object(value);
  if (!Array.isArray(response.appointments))
    throw Error("No se pudo interpretar tu agenda.");
  return response.appointments.map((value) => {
    const item = object(value);
    if (
      !Number.isInteger(Number(item.id)) ||
      typeof item.appointment_date !== "string" ||
      typeof item.status !== "string" ||
      !Number.isFinite(Number(item.total_amount))
    )
      throw Error("La información de una cita está incompleta.");
    return {
      id: Number(item.id),
      serviceId: Number(item.service_id),
      service: typeof item.servicio === "string" ? item.servicio : "Servicio",
      date: item.appointment_date,
      status: item.status,
      phase:
        typeof item.calendar_status === "string"
          ? item.calendar_status
          : item.status,
      price: Number(item.total_amount),
      deposit: Number(item.deposit_amount) || 0,
      duration: Number(item.duration_minutes) || 0,
    };
  });
}
export function decodeSlots(value: unknown): {
  slots: Slot[];
  message: string;
} {
  const response = object(value);
  if (!Array.isArray(response.all_slots))
    throw Error("No pudimos interpretar los horarios disponibles.");
  return {
    message:
      typeof response.message === "string"
        ? response.message
        : "Selecciona un horario disponible.",
    slots: response.all_slots.map((value) => {
      const slot = object(value);
      if (
        typeof slot.time !== "string" ||
        typeof slot.appointment_date !== "string" ||
        typeof slot.available !== "boolean"
      )
        throw Error("Un horario contiene información incompleta.");
      return {
        time: slot.time,
        date: slot.appointment_date,
        available: slot.available,
        reason: typeof slot.reason === "string" ? slot.reason : "No disponible",
      };
    }),
  };
}
export const appointmentStatus = (value: string) =>
  ({
    pending: "Pendiente",
    confirmed: "Confirmada",
    canceled: "Cancelada",
    cancelled: "Cancelada",
    completed: "Completada",
    no_show: "No asistió",
    in_progress: "En atención",
    in_process: "En proceso",
    pending_review: "Pendiente de cierre",
  })[value] ?? value;
export function appointmentDate(value: string) {
  const [date, time] = value.replace("T", " ").split(" ");
  return (
    date.split("-").reverse().join("/") + (time ? " · " + time.slice(0, 5) : "")
  );
}
export function mexicoDates() {
  const now = new Date();
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = format.formatToParts(now);
  const part = (name: string) =>
    parts.find((item) => item.type === name)?.value;
  const start = new Date(
    `${part("year")}-${part("month")}-${part("day")}T12:00:00`,
  );
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return (
      day.getFullYear() +
      "-" +
      String(day.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(day.getDate()).padStart(2, "0")
    );
  });
}

export function isUpcoming(item: Appointment) {
  return ["pending", "confirmed", "in_process", "in_progress"].includes(
    item.phase,
  );
}
export function displayedStatus(item: Appointment) {
  return appointmentStatus(
    ["in_process", "pending_review"].includes(item.phase)
      ? item.phase
      : item.status,
  );
}
