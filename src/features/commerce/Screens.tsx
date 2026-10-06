import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  Page,
  Row,
  TextAction,
  money,
  s,
} from "../../components/ui";
import { colors } from "../../theme";
import { useFlow } from "../interfaces/Flow";
import { ItemImage } from "../catalog/Screens";
export function CartScreen() {
  const flow = useFlow();
  const total = flow.cart.reduce(
    (n, line) => n + line.item.price * line.quantity,
    0,
  );
  return (
    <Page
      title="Tu carrito"
      subtitle="Tus favoritos, listos para ti."
      back="products"
      footer={
        <Button
          label="Continuar compra"
          disabled={!flow.demo || !flow.cart.length}
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
      {!flow.demo && (
        <Body muted>
          La compra móvil está en preparación. Puedes consultar el catálogo real
          de productos.
        </Body>
      )}
      <TextAction
        label="Seguir explorando"
        onPress={() => flow.go("products")}
      />
    </Page>
  );
}
export function CheckoutScreen() {
  const flow = useFlow();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("");
  const [error, setError] = useState("");
  const total = flow.cart.reduce(
    (n, line) => n + line.item.price * line.quantity,
    0,
  );
  function submit() {
    if (
      name.trim().length < 3 ||
      !/^[0-9]{10}$/.test(phone) ||
      address.trim().length < 6 ||
      !payment
    ) {
      setError(
        "Completa tu nombre, teléfono de 10 dígitos, dirección y método de pago.",
      );
      return;
    }
    setError("");
    flow.finishOrder();
  }
  return (
    <Page
      title="Finalizar compra"
      subtitle="Un último paso para tus favoritos."
      back="cart"
    >
      <Field
        label="Nombre completo"
        icon="user"
        value={name}
        onChangeText={setName}
      />
      <Field
        label="Teléfono"
        icon="phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <Field
        label="Dirección de entrega"
        icon="map-pin"
        value={address}
        onChangeText={setAddress}
        multiline
      />
      <Text style={s.label}>Método de pago</Text>
      {["Pago en salón", "Transferencia"].map((method) => (
        <Pressable
          key={method}
          accessibilityRole="radio"
          accessibilityState={{ checked: payment === method }}
          onPress={() => setPayment(method)}
        >
          <Card>
            <View style={[s.row, { justifyContent: "flex-start" }]}>
              <Icon
                name={payment === method ? "check-circle" : "circle"}
                color={colors.roseDeep}
              />
              <Body>{method}</Body>
            </View>
          </Card>
        </Pressable>
      ))}
      <Card>
        <Row label="Total de productos" value={money(total)} />
        <Body muted>
          La entrega y el pago definitivos se confirmarán con la estética.
        </Body>
      </Card>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      {!flow.demo && (
        <Body muted>Esta compra aún no está conectada al servidor.</Body>
      )}
      <Button
        label={
          flow.demo ? "Confirmar compra de demostración" : "Confirmar compra"
        }
        disabled={!flow.demo || !flow.cart.length}
        onPress={submit}
      />
    </Page>
  );
}
export function OrderConfirmedScreen() {
  const flow = useFlow();
  if (!flow.demo || flow.orderTotal === null)
    return (
      <Page title="Compra confirmada" back="orders">
        <Empty
          title="Sin compra confirmada"
          description="Aquí verás el resultado después de registrar una compra."
          icon="shopping-bag"
        />
      </Page>
    );
  return (
    <Page>
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 24 }}>
        <Icon name="check-circle" size={58} color={colors.roseDeep} />
        <Text style={s.heading}>¡Compra realizada!</Text>
        <Body muted>Así se verá el resumen de tu pedido.</Body>
      </View>
      <Card>
        <Row label="Folio de ejemplo" value="DEMO-2026" />
        <Row label="Total" value={money(flow.orderTotal)} />
        <Row label="Entrega" value="Por confirmar" />
        <Row label="Estado" value="Pendiente" />
      </Card>
      <Body muted>
        No se creó un pedido ni se realizó un cobro. Estás viendo una
        demostración.
      </Body>
      <Button label="Ver mis compras" onPress={() => flow.go("orders")} />
      <TextAction label="Volver al inicio" onPress={() => flow.go("home")} />
    </Page>
  );
}
export function OrdersScreen() {
  const flow = useFlow();
  return (
    <Page
      title="Mis compras"
      subtitle="El seguimiento de tus favoritos."
      back="profile"
      screen="profile"
    >
      {flow.demo && flow.orderTotal !== null ? (
        <Card>
          <View style={s.row}>
            <Text style={s.subheading}>Pedido DEMO-2026</Text>
            <Text style={[s.label, { color: colors.roseDeep }]}>Pendiente</Text>
          </View>
          <Row label="Total" value={money(flow.orderTotal)} />
          <Body muted>Entrega por confirmar.</Body>
          <Button
            label="Ver detalle"
            secondary
            onPress={() => flow.go("order-confirmed")}
          />
        </Card>
      ) : (
        <Empty
          title={
            flow.demo
              ? "Todavía no hay compras"
              : "Consulta de compras en preparación"
          }
          description="Tus pedidos y su seguimiento aparecerán en esta sección."
          icon="shopping-bag"
        />
      )}
    </Page>
  );
}
