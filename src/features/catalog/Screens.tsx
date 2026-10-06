import { router, useLocalSearchParams } from "expo-router";
import { useRemote } from "../api/useRemote";
import { decodeItem } from "./model";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  Body,
  Button,
  Card,
  Chips,
  Empty,
  Field,
  Icon,
  Page,
  Row,
  money,
  s,
} from "../../components/ui";
import { colors } from "../../theme";
import { useCatalog } from "./useCatalog";
import { useFlow, type Item } from "../interfaces/Flow";
export function ItemImage({
  item,
  large = false,
}: {
  item: Item;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? (
    <Image
      source={{ uri: item.image }}
      onError={() => setFailed(true)}
      accessibilityLabel={item.name}
      resizeMode="cover"
      style={{
        width: large ? "100%" : 80,
        height: large ? 220 : 90,
        borderRadius: 14,
      }}
    />
  ) : (
    <View
      style={{
        width: large ? "100%" : 80,
        height: large ? 220 : 90,
        borderRadius: 14,
        backgroundColor: colors.cream,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <Icon
        name={item.duration ? "scissors" : "droplet"}
        size={large ? 48 : 28}
        color={colors.roseDeep}
      />
      {large && <Body muted>Imagen no disponible</Body>}
    </View>
  );
}
export function CatalogScreen({ kind }: { kind: "services" | "products" }) {
  const flow = useFlow();
  const catalog = useCatalog(kind);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const services = kind === "services";
  const categories = [
    "Todos",
    ...new Set(catalog.items.map((item) => item.category)),
  ];
  const filtered = catalog.items.filter(
    (item) =>
      (category === "Todos" || item.category === category) &&
      (item.name + " " + (item.brand ?? ""))
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  return (
    <Page
      title={services ? "Servicios" : "Productos"}
      subtitle={
        services
          ? "Encuentra tu próximo cuidado."
          : "Tu rutina, con calidad profesional."
      }
      screen={kind}
      scroll={false}
    >
      <Field
        label="Buscar"
        icon="search"
        placeholder={
          services ? "Corte, color, tratamiento…" : "Nombre o marca…"
        }
        value={search}
        onChangeText={setSearch}
      />
      <Chips values={categories} value={category} onChange={setCategory} />
      {catalog.loading ? (
        <ActivityIndicator
          accessibilityLabel="Cargando catálogo"
          color={colors.roseDeep}
        />
      ) : catalog.error ? (
        <Card>
          <Text accessibilityRole="alert" style={s.error}>
            {catalog.error}
          </Text>
          <Button label="Intentar nuevamente" onPress={catalog.retry} />
        </Card>
      ) : !filtered.length ? (
        <Empty
          title="Sin coincidencias"
          description="Prueba otra búsqueda o selecciona Todos."
          icon="search"
        />
      ) : (
        <FlatList
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ gap: 14 }}
          keyboardShouldPersistTaps="handled"
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={"Ver " + item.name}
              onPress={() => {
                if (services) {
                  flow.selectService(item);
                  router.push({
                    pathname: "/service-detail",
                    params: { id: String(item.id) },
                  });
                } else {
                  flow.selectProduct(item);
                  router.push({
                    pathname: "/product-detail",
                    params: { id: String(item.id) },
                  });
                }
              }}
            >
              <Card>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <ItemImage item={item} />
                  <View style={{ flex: 1, gap: 5 }}>
                    {!!item.brand && (
                      <Text style={[s.label, { color: colors.muted }]}>
                        {item.brand}
                      </Text>
                    )}
                    <Text style={s.subheading}>{item.name}</Text>
                    <Text style={[s.label, { color: colors.roseDeep }]}>
                      {money(item.price)}
                      {item.duration ? " · " + item.duration + " min" : ""}
                    </Text>
                    {item.stock === 0 && (
                      <Text style={s.error}>Sin existencia</Text>
                    )}
                  </View>
                  <Icon name="chevron-right" />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
      {!services && (
        <Button
          label={
            "Ver carrito · " +
            flow.cart.reduce((n, line) => n + line.quantity, 0)
          }
          icon="shopping-bag"
          secondary
          onPress={() => flow.go("cart")}
        />
      )}
    </Page>
  );
}
export function DetailScreen({ kind }: { kind: "services" | "products" }) {
  const flow = useFlow();
  const services = kind === "services";
  const { id } = useLocalSearchParams<{ id?: string }>();
  const selected = services ? flow.service : flow.product;
  const itemId =
    id !== undefined
      ? /^\d+$/.test(id)
        ? Number(id)
        : undefined
      : selected?.id;
  const resource = useRemote(
    itemId && itemId > 0 ? "/" + kind + "/" + itemId : null,
    null,
    decodeItem,
  );
  const item = resource.data;
  const select = services ? flow.selectService : flow.selectProduct;
  useEffect(() => {
    if (item) select(item);
  }, [item, select]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (resource.loading || resource.error)
    return (
      <Page
        title={services ? "Detalle de servicio" : "Detalle de producto"}
        back={kind}
      >
        {resource.loading ? (
          <ActivityIndicator
            accessibilityLabel="Cargando detalle"
            color={colors.roseDeep}
          />
        ) : (
          <Card>
            <Text accessibilityRole="alert" style={s.error}>
              {resource.error}
            </Text>
            <Button label="Intentar nuevamente" onPress={resource.refresh} />
          </Card>
        )}
      </Page>
    );
  if (!item)
    return (
      <Page title="Selecciona una opción" back={kind}>
        <Empty
          title="Aún no hay una selección"
          description="Abre un artículo desde el catálogo para consultar sus detalles."
        />
        <Button label="Ir al catálogo" onPress={() => flow.go(kind)} />
      </Page>
    );
  const stock = item.stock ?? 0;
  return (
    <Page
      title={item.name}
      back={kind}
      footer={
        <Button
          label={
            services
              ? "Agendar cita"
              : added
                ? "Ver carrito"
                : "Agregar al carrito"
          }
          disabled={!services && stock === 0}
          onPress={() => {
            if (services) flow.go("booking");
            else if (added) flow.go("cart");
            else {
              if (flow.add(item, quantity)) setAdded(true);
            }
          }}
        />
      }
    >
      <ItemImage item={item} large />
      {!!item.brand && <Body muted>{item.brand}</Body>}
      <Row label="Precio" value={money(item.price)} />
      {!!item.size && <Row label="Presentación" value={item.size} />}
      {services && (
        <Row
          label="Duración"
          value={
            item.duration
              ? item.duration + " minutos"
              : "Consultar con la estética"
          }
        />
      )}
      <Card>
        <Text style={s.subheading}>
          Sobre {services ? "este servicio" : "este producto"}
        </Text>
        <Body>{item.description}</Body>
      </Card>
      {!services && (
        <>
          <Row
            label="Disponibilidad"
            value={stock ? stock + " unidades" : "Sin existencia"}
          />
          <View style={s.row}>
            <Body>Cantidad</Body>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <Button
                label="−"
                disabled={quantity <= 1}
                secondary
                onPress={() => {
                  setQuantity((n) => n - 1);
                  setAdded(false);
                }}
              />
              <Text style={s.label}>{quantity}</Text>
              <Button
                label="+"
                disabled={quantity >= stock}
                secondary
                onPress={() => {
                  setQuantity((n) => n + 1);
                  setAdded(false);
                }}
              />
            </View>
          </View>
        </>
      )}
      {added && <Body>Se agregó al carrito.</Body>}
    </Page>
  );
}
