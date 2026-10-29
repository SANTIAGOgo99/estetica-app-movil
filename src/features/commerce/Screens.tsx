import { Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Empty,
  Page,
  Row,
  TextAction,
  money,
  s,
} from "../../components/ui";
import { useFlow } from "../interfaces/Flow";
import { ItemImage } from "../catalog/Screens";
import { cartTotal } from '../../domain/commerce/cart';
export function CartScreen() {
  const flow = useFlow();
  const total = cartTotal(flow.cart);
  return (
    <Page
      title="Tu carrito"
      subtitle="Tus favoritos, listos para ti."
      back="products"
      footer={
        <Button
          label="Continuar compra"
          disabled={!flow.cart.length}
          onPress={() => flow.go("checkout")}
        />
      }
    >
      <View style={{ gap: 14 }}>
        {flow.cart.map((line) => (
          <Card key={line.item.id}>
            <View style={{ flexDirection: "row", gap: 14 }}>
              <ItemImage item={line.item} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={s.subheading}>{line.item.name}</Text>
                <Body>{money(line.item.price)}</Body>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Button
                    label="−"
                    secondary
                    onPress={() =>
                      flow.quantity(line.item.id, line.quantity - 1)
                    }
                  />
                  <Text style={s.label}>{line.quantity}</Text>
                  <Button
                    label="+"
                    secondary
                    disabled={line.quantity >= (line.item.stock ?? 0)}
                    onPress={() =>
                      flow.quantity(line.item.id, line.quantity + 1)
                    }
                  />
                </View>
              </View>
            </View>
            <TextAction
              label={"Quitar " + line.item.name}
              onPress={() => flow.quantity(line.item.id, 0)}
            />
          </Card>
        ))}
      </View>
      {!flow.cart.length && (
        <Empty
          title="Tu carrito está vacío"
          description="Explora nuestros productos para encontrar tu próximo favorito."
          icon="shopping-bag"
        />
      )}
      <Card>
        <Text style={s.subheading}>Resumen de compra</Text>
        <Row label="Subtotal" value={money(total)} />
        <Row label="Entrega" value="Por confirmar" />
        <Row label="Total de productos" value={money(total)} />
      </Card>
      <Body muted>
        Tu carrito se conserva mientras usas la app y se vacía al cerrar sesión.
        Los precios y existencias se confirmarán al habilitar los pedidos.
      </Body>
      <TextAction
        label="Seguir explorando"
        onPress={() => flow.go("products")}
      />
    </Page>
  );
}
export function CheckoutScreen() {
  const flow = useFlow();
  const total = cartTotal(flow.cart);
  return (
    <Page
      title="Tu selección"
      subtitle="Revisa los productos que te interesan."
      back="cart"
    >
      <Card>
        <Text style={s.subheading}>Resumen</Text>
        {flow.cart.map((line) => (
          <Row
            key={line.item.id}
            label={line.quantity + " × " + line.item.name}
            value={money(line.item.price * line.quantity)}
          />
        ))}
        <Row label="Total de productos" value={money(total)} />
      </Card>
      <Empty
        title="Pedido en preparación"
        description="Por ahora puedes elegir productos en el carrito. La estética todavía no permite registrar pedidos desde la app; no se realizará un cobro ni se confirmará una compra."
        icon="shopping-bag"
      />
      <Button label="Volver al carrito" onPress={() => flow.go("cart")} />
      <TextAction
        label="Continuar viendo productos"
        onPress={() => flow.go("products")}
      />
    </Page>
  );
}
export function OrderConfirmedScreen() {
  const flow = useFlow();
  return (
    <Page title="Mis compras" back="cart">
      <Empty
        title="No hay una compra confirmada"
        description="La creación de pedidos todavía está en preparación."
        icon="shopping-bag"
      />
      <Button label="Ver mi carrito" onPress={() => flow.go("cart")} />
    </Page>
  );
}
export function OrdersScreen() {
  const flow = useFlow();
  return (
    <Page title="Mis compras" back="profile">
      <Empty
        title="Pedidos en preparación"
        description="Por ahora no se registran compras en la app. Puedes explorar productos y preparar tu carrito."
        icon="shopping-bag"
      />
      <Button label="Ver productos" onPress={() => flow.go("products")} />
    </Page>
  );
}
