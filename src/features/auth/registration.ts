import { apiRequest, object } from "../api/client.ts";
export async function registerClient(
  value: { name: string; email: string; phone: string; password: string },
  fetcher: typeof fetch = fetch,
) {
  const response = object(
    await apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: {
          full_name: value.name.trim(),
          email: value.email.trim(),
          phone: value.phone,
          password: value.password,
        },
      },
      fetcher,
    ),
  );
  const user = object(response.user);
  if (user.role !== "client" || !user.id)
    throw Error(
      "No pudimos comprobar el registro de cliente. Contacta a la estética antes de volver a intentarlo.",
    );
}
