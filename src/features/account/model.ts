import { object } from "../api/client.ts";
export type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string;
};
export function decodeProfile(value: unknown): Profile {
  const profile = object(value);
  if (
    profile.role !== "client" ||
    profile.is_active === false ||
    typeof profile.full_name !== "string" ||
    typeof profile.email !== "string" ||
    !Number.isInteger(Number(profile.id)) ||
    Number(profile.id) <= 0
  )
    throw Error(
      "No se pudo verificar tu perfil de cliente. Vuelve a iniciar sesión.",
    );
  return {
    id: Number(profile.id),
    name: profile.full_name,
    email: profile.email,
    phone: typeof profile.phone === "string" ? profile.phone : "",
  };
}
