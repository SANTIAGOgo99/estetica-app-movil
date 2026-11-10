import { apiRequest, object } from "../api/client.ts";
import { requirePrivacyConsent } from "../privacy/notice.ts";
export async function registerClient(
  value: { name: string; email: string; phone: string; password: string; privacyAccepted: boolean; privacyVersion: string },
  fetcher: typeof fetch = fetch,
) {
  requirePrivacyConsent(value.privacyAccepted, value.privacyVersion);
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
          // El backend actual ignora estos campos: su persistencia sigue pendiente.
          privacy_consent: { accepted: true, version: value.privacyVersion },
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
