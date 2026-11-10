/** Evita enviar contraseñas o tokens a una conexión sin cifrar. */
export function normalizeApiUrl(value: string, allowLocalDevelopment = process.env.NODE_ENV !== "production") {
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error("La dirección del servicio no es válida."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(allowLocalDevelopment && local && url.protocol === "http:")))
    throw new Error("La conexión con la estética debe utilizar HTTPS.");
  return url.toString().replace(/\/$/, "");
}
