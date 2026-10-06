export const privateScreens = [
  "booking",
  "booking-confirmed",
  "appointments",
  "cart",
  "checkout",
  "order-confirmed",
  "orders",
  "profile",
] as const;
export function needsSession(screen: string) {
  return privateScreens.some((value) => value === screen);
}
export function accessReason(screen: string) {
  if (["cart", "checkout", "product-detail"].includes(screen))
    return "Para agregar productos al carrito o comprar, inicia sesión o crea una cuenta de cliente.";
  if (["booking", "booking-confirmed", "appointments"].includes(screen))
    return "Para agendar y consultar tus citas, inicia sesión o crea una cuenta de cliente.";
  return "Para consultar tu cuenta, inicia sesión o regístrate como cliente.";
}

const routes = [
  "welcome",
  "sign-in",
  "register",
  "home",
  "services",
  "service-detail",
  "products",
  "product-detail",
  ...privateScreens,
];
export function routePath(screen: string, id?: number) {
  if (
    !routes.includes(screen as (typeof routes)[number]) ||
    screen === "home" ||
    screen === "welcome"
  )
    return "/";
  const item = Number.isInteger(id) && Number(id) > 0 ? id : undefined;
  if (item && (screen === "product-detail" || screen === "service-detail"))
    return "/" + screen + "?id=" + item;
  if (item && screen === "booking") return "/booking?service=" + item;
  return "/" + screen;
}
