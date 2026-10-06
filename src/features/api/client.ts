export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status=status; }
}
export async function apiRequest(
  path: string,
  options: {
    token?: string | null;
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw Error("No está configurada la conexión con la estética.");
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 20000);
  try {
    const response = await fetcher(base.replace(/\/$/, "") + path, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: "Bearer " + options.token } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw Error(
        "La estética devolvió una respuesta inesperada. Inténtalo nuevamente.",
      );
    }
    if (!response.ok) {
      let message =
        response.status === 401
          ? "Tu sesión venció. Vuelve a iniciar sesión."
          : response.status === 403
            ? "Tu cuenta no tiene permiso para esta operación."
            : response.status === 429
              ? "Demasiados intentos. Espera un momento."
              : "No se pudo completar la operación. Inténtalo nuevamente.";
      if (
        (response.status === 400 || response.status === 409) &&
        data &&
        typeof data === "object"
      ) {
        const value = data as Record<string, unknown>;
        const detail = value.message ?? value.error;
        if (typeof detail === "string" && detail.length < 220) message = detail;
      }
      throw new ApiError(message, response.status);
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted)
      throw Error("La conexión tardó demasiado. Inténtalo nuevamente.");
    if (error instanceof TypeError)
      throw Error("No pudimos conectar. Revisa tu conexión a internet.");
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("La respuesta del servidor está incompleta.");
  return value as Record<string, unknown>;
}
