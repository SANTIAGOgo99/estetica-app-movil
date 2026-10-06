import { useAuth } from "../auth/AuthProvider";
import { useRemote } from "../api/useRemote";
import { decodeAppointments } from "./model";
export * from "./model";
export { reserveAppointment } from "./client";
export function useAppointments() {
  const { token } = useAuth();
  return useRemote(
    token ? "/appointments/my" : null,
    token,
    decodeAppointments,
  );
}
