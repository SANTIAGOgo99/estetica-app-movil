import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { router, type Href } from "expo-router";
import { useAuth } from "../auth/AuthProvider";
import { accessReason, needsSession, routePath } from "./access";
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
  size?: string;
};
export type CartLine = { item: Item; quantity: number };
export type Booking = {
  id: number;
  service: Item;
  date: string;
  time: string;
  status: string;
  total: number;
  deposit: number;
};
type Pending = { screen: Screen; reason: string; id?: number };
type Flow = {
  go: (screen: Screen) => void;
  requireSession: (screen: Screen) => boolean;
  pending: Pending | null;
  service: Item | null;
  selectService: (item: Item) => void;
  product: Item | null;
  selectProduct: (item: Item) => void;
  cart: CartLine[];
  add: (item: Item, quantity: number) => boolean;
  quantity: (id: number, value: number) => void;
  booking: Booking | null;
  setBooking: (value: Booking | null) => void;
};
const Context = createContext<Flow | null>(null);
export function FlowProvider({ children }: PropsWithChildren) {
  const { token } = useAuth();
  const [service, selectService] = useState<Item | null>(null);
  const [product, selectProduct] = useState<Item | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sessionToken, setSessionToken] = useState(token);
  if (sessionToken !== token) {
    setSessionToken(token);
    setCart([]);
    setBooking(null);
    if (!token) setPending(null);
  }
  useEffect(() => {
    if (token && pending) {
      router.replace(routePath(pending.screen, pending.id) as Href);
    }
  }, [token, pending]);
  function requireSession(screen: Screen) {
    if (token) return true;
    setPending({
      screen,
      reason: accessReason(screen),
      id:
        screen === "booking" || screen === "service-detail"
          ? service?.id
          : screen === "product-detail"
            ? product?.id
            : undefined,
    });
    router.push("/sign-in");
    return false;
  }
  function go(screen: Screen) {
    if (needsSession(screen) && !requireSession(screen)) return;
    if (!token && (screen === "home" || screen === "welcome")) setPending(null);
    router.push(
      routePath(
        screen,
        screen === "booking" || screen === "service-detail"
          ? service?.id
          : screen === "product-detail"
            ? product?.id
            : undefined,
      ) as Href,
    );
  }
  function add(item: Item, amount: number) {
    if (!requireSession("product-detail")) return false;
    const stock = item.stock ?? 0;
    if (stock <= 0 || !Number.isInteger(amount) || amount < 1) return false;
    setCart((previous) => {
      const found = previous.find((line) => line.item.id === item.id);
      const quantity = Math.min(stock, (found?.quantity ?? 0) + amount);
      return found
        ? previous.map((line) =>
            line.item.id === item.id ? { item, quantity } : line,
          )
        : [...previous, { item, quantity }];
    });
    return true;
  }
  function quantity(id: number, value: number) {
    if (!token || !Number.isInteger(value)) return;
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
  return (
    <Context.Provider
      value={{
        go,
        requireSession,
        pending: token ? null : pending,
        service,
        selectService,
        product,
        selectProduct,
        cart,
        add,
        quantity,
        booking,
        setBooking,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFlow() {
  const value = useContext(Context);
  if (!value) throw Error("Falta el contexto de la aplicación.");
  return value;
}
