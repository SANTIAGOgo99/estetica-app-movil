import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { router, type Href } from "expo-router";
export type Screen =
  | "welcome"
  | "sign-in"
  | "register"
  | "home"
  | "services"
  | "service-detail"
  | "booking"
  | "booking-confirmed"
  | "products"
  | "product-detail"
  | "cart"
  | "checkout"
  | "order-confirmed"
  | "appointments"
  | "orders"
  | "profile";
export type Item = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
  duration?: number;
  brand?: string;
  stock?: number;
};
export type CartLine = { item: Item; quantity: number };
export type Booking = { service: Item; date: string; time: string };
export const screens: { screen: Screen; title: string }[] = [
  { screen: "welcome", title: "Bienvenida" },
  { screen: "sign-in", title: "Iniciar sesión" },
  { screen: "register", title: "Crear cuenta" },
  { screen: "home", title: "Inicio" },
  { screen: "services", title: "Servicios" },
  { screen: "service-detail", title: "Detalle de servicio" },
  { screen: "booking", title: "Agendar cita" },
  { screen: "booking-confirmed", title: "Confirmación de cita" },
  { screen: "products", title: "Productos" },
  { screen: "product-detail", title: "Detalle de producto" },
  { screen: "cart", title: "Carrito" },
  { screen: "checkout", title: "Finalizar compra" },
  { screen: "order-confirmed", title: "Compra confirmada" },
  { screen: "appointments", title: "Mis citas" },
  { screen: "orders", title: "Mis compras" },
  { screen: "profile", title: "Perfil" },
];
export const sampleServices: Item[] = [
  {
    id: 1,
    name: "Corte Dama",
    price: 250,
    category: "Cortes",
    duration: 45,
    description:
      "Un corte personalizado que acompaña tu estilo. Incluye diagnóstico, corte y acabado.",
  },
  {
    id: 2,
    name: "Color",
    price: 850,
    category: "Color",
    duration: 120,
    description:
      "Coloración y cuidado para renovar tu imagen. El resultado se define con tu estilista.",
  },
  {
    id: 3,
    name: "Botox Capilar",
    price: 600,
    category: "Tratamientos",
    duration: 90,
    description: "Tratamiento para dar suavidad y brillo al cabello.",
  },
  {
    id: 4,
    name: "Corte Caballero",
    price: 180,
    category: "Caballero",
    duration: 30,
    description: "Corte y acabado adaptados a tu estilo.",
  },
];
export const sampleProducts: Item[] = [
  {
    id: 1,
    name: "Shampoo Nutritivo",
    brand: "Cuidado profesional",
    price: 320,
    category: "Shampoo",
    stock: 8,
    description: "Limpieza y nutrición para tu rutina de cuidado.",
  },
  {
    id: 2,
    name: "Mascarilla Capilar",
    brand: "Cuidado profesional",
    price: 450,
    category: "Tratamientos",
    stock: 5,
    description: "Cuidado intensivo para un cabello suave y brillante.",
  },
  {
    id: 3,
    name: "Aceite Reparador",
    brand: "Cuidado profesional",
    price: 280,
    category: "Aceites",
    stock: 4,
    description: "Un acabado ligero para dar brillo y controlar el frizz.",
  },
  {
    id: 4,
    name: "Protector Térmico",
    brand: "Cuidado profesional",
    price: 350,
    category: "Cuidado",
    stock: 0,
    description: "Protección para tu rutina de peinado.",
  },
];
type Flow = {
  demo: boolean;
  go: (screen: Screen) => void;
  service: Item | null;
  selectService: (item: Item) => void;
  product: Item | null;
  selectProduct: (item: Item) => void;
  cart: CartLine[];
  add: (item: Item, quantity: number) => void;
  quantity: (id: number, value: number) => void;
  booking: Booking | null;
  setBooking: (value: Booking | null) => void;
  orderTotal: number | null;
  finishOrder: () => void;
};
const Context = createContext<Flow | null>(null);
export function FlowProvider({
  children,
  demo = false,
}: PropsWithChildren<{ demo?: boolean }>) {
  const [service, setService] = useState<Item | null>(
    demo ? sampleServices[0] : null,
  );
  const [product, setProduct] = useState<Item | null>(
    demo ? sampleProducts[0] : null,
  );
  const [cart, setCart] = useState<CartLine[]>(
    demo
      ? [
          { item: sampleProducts[0], quantity: 1 },
          { item: sampleProducts[2], quantity: 1 },
        ]
      : [],
  );
  const [booking, setBooking] = useState<Booking | null>(
    demo ? { service: sampleServices[0], date: "29 oct", time: "10:00" } : null,
  );
  const [orderTotal, setOrderTotal] = useState<number | null>(
    demo ? 600 : null,
  );
  function go(screen: Screen) {
    const route =
      screen === "home"
        ? "/"
        : screen === "register"
          ? "/register"
          : "/" + screen;
    router.push((demo ? "/preview/" + screen : route) as Href);
  }
  function add(item: Item, amount: number) {
    if (!demo) return;
    setCart((previous) => {
      const found = previous.find((line) => line.item.id === item.id);
      const quantity = Math.min(
        item.stock ?? 0,
        (found?.quantity ?? 0) + amount,
      );
      return found
        ? previous.map((line) =>
            line.item.id === item.id ? { item, quantity } : line,
          )
        : [...previous, { item, quantity }];
    });
  }
  function quantity(id: number, value: number) {
    if (!demo) return;
    setCart((previous) =>
      previous
        .map((line) =>
          line.item.id === id
            ? {
                ...line,
                quantity: Math.max(0, Math.min(value, line.item.stock ?? 0)),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }
  function finishOrder() {
    if (!demo || !cart.length) return;
    setOrderTotal(
      cart.reduce((total, line) => total + line.item.price * line.quantity, 0),
    );
    setCart([]);
    go("order-confirmed");
  }
  return (
    <Context.Provider
      value={{
        demo,
        go,
        service,
        selectService: setService,
        product,
        selectProduct: setProduct,
        cart,
        add,
        quantity,
        booking,
        setBooking,
        orderTotal,
        finishOrder,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFlow() {
  const flow = useContext(Context);
  if (!flow) throw Error("Falta el contexto de interfaces.");
  return flow;
}
