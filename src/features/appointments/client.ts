import { apiRequest, object } from "../api/client.ts";
export async function reserveAppointment(
  token: string,
  date: string,
  serviceId: number,
  fetcher: typeof fetch = fetch,
) {
  const response = object(
    await apiRequest(
      "/appointments",
      {
        token,
        method: "POST",
        body: { service_id: serviceId, appointment_date: date },
      },
      fetcher,
    ),
  );
  const item = object(response.appointment);
  if (
    !Number.isInteger(Number(item.id)) ||
    typeof item.status !== "string" ||
    !Number.isFinite(Number(item.total_amount))
  )
    throw Error(
      "El servidor no confirmó la cita. Consulta Mis citas antes de intentar otra vez.",
    );
  return {
    id: Number(item.id),
    status: item.status,
    total: Number(item.total_amount),
    deposit: Number(item.deposit_amount) || 0,
  };
}
