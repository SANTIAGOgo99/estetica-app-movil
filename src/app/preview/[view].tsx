import { useLocalSearchParams } from "expo-router";
import { screens } from "../../features/interfaces/Flow";
import {
  WelcomeScreen,
  SignInScreen,
  RegisterScreen,
} from "../../features/auth/AuthScreens";
import {
  HomeScreen,
  ProfileScreen,
} from "../../features/account/Screens";
import {
  CatalogScreen,
  DetailScreen,
} from "../../features/catalog/Screens";
import {
  BookingScreen,
  BookingConfirmedScreen,
  AppointmentsScreen,
} from "../../features/appointments/Screens";
import {
  CartScreen,
  CheckoutScreen,
  OrderConfirmedScreen,
  OrdersScreen,
} from "../../features/commerce/Screens";
import { Empty, Page } from "../../components/ui";
export default function PreviewScreen() {
  const { view: screen } = useLocalSearchParams<{ view: string }>();
  if (!__DEV__ || !screens.some((item) => item.screen === screen))
    return (
      <Page>
        <Empty
          title="Vista no disponible"
          description="Selecciona una interfaz de la demostración."
        />
      </Page>
    );
  switch (screen) {
    case "welcome":
      return <WelcomeScreen />;
    case "sign-in":
      return <SignInScreen />;
    case "register":
      return <RegisterScreen />;
    case "home":
      return <HomeScreen />;
    case "services":
      return <CatalogScreen key="services" kind="services" />;
    case "products":
      return <CatalogScreen key="products" kind="products" />;
    case "service-detail":
      return <DetailScreen key="service" kind="services" />;
    case "product-detail":
      return <DetailScreen key="product" kind="products" />;
    case "booking":
      return <BookingScreen />;
    case "booking-confirmed":
      return <BookingConfirmedScreen />;
    case "appointments":
      return <AppointmentsScreen />;
    case "cart":
      return <CartScreen />;
    case "checkout":
      return <CheckoutScreen />;
    case "order-confirmed":
      return <OrderConfirmedScreen />;
    case "orders":
      return <OrdersScreen />;
    case "profile":
      return <ProfileScreen />;
  }
}
