import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  sampleProducts,
  sampleServices,
  useFlow,
  type Item,
} from "../interfaces/Flow";
export function useCatalog(kind: "services" | "products") {
  const { demo } = useFlow();
  const { token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.EXPO_PUBLIC_API_URL;
        if (!base) throw Error("No está configurado el catálogo.");
        const response = await fetch(
          base.replace(/\/$/, "") +
            (kind === "services" ? "/services" : "/products/active"),
          {
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: "Bearer " + token } : {}),
            },
            signal: controller.signal,
          },
        );
        if (!response.ok)
          throw Error(
            response.status === 401
              ? "Tu sesión venció. Vuelve a iniciar sesión."
              : "No pudimos consultar el catálogo. Inténtalo nuevamente.",
          );
        const data: unknown = await response.json();
        if (!Array.isArray(data))
          throw Error("El catálogo devolvió una respuesta inesperada.");
        const normalized: Item[] = data
          .filter(
            (value) =>
              value && typeof value === "object" && value.is_active !== false,
          )
          .map((value) => {
            if (
              typeof value.name !== "string" ||
              !Number.isFinite(Number(value.id)) ||
              !Number.isFinite(Number(value.price)) ||
              Number(value.price) < 0
            )
              throw Error("No se pudo interpretar un artículo del catálogo.");
            let image: string | undefined;
            if (typeof value.image_url === "string" && value.image_url) {
              const url = new URL(value.image_url, new URL(base).origin);
              if (url.protocol === "https:") image = url.href;
            }
            return {
              id: Number(value.id),
              name: value.name,
              price: Number(value.price),
              category:
                typeof value.category === "string" ? value.category : "Otros",
              description:
                typeof value.description === "string"
                  ? value.description
                  : "Consulta los detalles con la estética.",
              image,
              duration: Number(value.duration_minutes) || undefined,
              brand: typeof value.brand === "string" ? value.brand : undefined,
              stock: Number.isFinite(Number(value.stock))
                ? Math.max(0, Number(value.stock))
                : undefined,
            };
          });
        if (!controller.signal.aborted) setItems(normalized);
      } catch (value) {
        if (!controller.signal.aborted)
          setError(
            value instanceof Error
              ? value.message
              : "Revisa tu conexión a internet.",
          );
        else if (!disposed)
          setError("La conexión tardó demasiado. Inténtalo nuevamente.");
      } finally {
        clearTimeout(timeout);
        if (!disposed) setLoading(false);
      }
    }
    let disposed = false;
    void load();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [demo, kind, token, revision]);
  return {
    items: demo
      ? kind === "services"
        ? sampleServices
        : sampleProducts
      : items,
    loading: demo ? false : loading,
    error: demo ? null : error,
    retry: () => setRevision((value) => value + 1),
  };
}
