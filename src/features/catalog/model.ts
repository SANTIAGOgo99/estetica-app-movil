import { object } from "../api/client.ts";
import type { Item } from "../interfaces/Flow";
export function decodeItem(value: unknown): Item {
  const item = object(value);
  const id = Number(item.id),
    price = Number(item.price);
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    !Number.isFinite(price) ||
    price < 0
  )
    throw Error("No se pudo interpretar un artículo del catálogo.");
  if (item.is_active === false)
    throw Error("Este artículo ya no está disponible.");
  let image: string | undefined;
  if (typeof item.image_url === "string" && item.image_url) {
    try {
      const url = new URL(
        item.image_url,
        new URL(
          process.env.EXPO_PUBLIC_API_URL ??
            "https://esteticaa-backend-five.vercel.app/api",
        ).origin,
      );
      if (url.protocol === "https:") image = url.href;
    } catch {
      /* An invalid photo does not block the catalog. */
    }
  }
  return {
    id,
    name: item.name,
    price,
    category: typeof item.category === "string" ? item.category : "Otros",
    description:
      typeof item.description === "string" && item.description.trim()
        ? item.description
        : "Consulta más información con la estética.",
    image,
    duration:
      Number(item.duration_minutes) > 0
        ? Number(item.duration_minutes)
        : undefined,
    brand: typeof item.brand === "string" ? item.brand : undefined,
    stock: Number.isFinite(Number(item.stock))
      ? Math.max(0, Math.floor(Number(item.stock)))
      : undefined,
    size: typeof item.size === "string" ? item.size : undefined,
  };
}
export function decodeCatalog(value: unknown): Item[] {
  if (!Array.isArray(value))
    throw Error("El catálogo devolvió una respuesta inesperada.");
  return value
    .filter(
      (item) => item && typeof item === "object" && item.is_active !== false,
    )
    .map(decodeItem);
}
