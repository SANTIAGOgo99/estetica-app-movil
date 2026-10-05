import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

export type ServiceSummary = { id: string; name: string; price: number; imageUrl?: string };
type Props = { services: ServiceSummary[]; connected?: boolean };

export function ServiceList({ services, connected = false }: Props) {
  return <FlatList data={services} keyExtractor={item => item.id} contentContainerStyle={styles.list}
    ListHeaderComponent={<View><Text accessibilityRole="header" style={styles.title}>Encuentra tu próximo cuidado</Text><Text style={styles.description}>Consulta las opciones de servicio de la estética.</Text></View>}
    ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>{connected ? 'No hay servicios disponibles' : 'El catálogo estará disponible pronto'}</Text><Text style={styles.description}>{connected ? 'Vuelve a consultar más tarde.' : 'Estamos preparando la consulta de servicios.'}</Text></View>}
    renderItem={({ item }) => <View style={styles.card}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} accessibilityLabel={item.name} style={styles.image} /> : <View style={styles.image}><Text style={styles.initial}>{item.name.slice(0, 1)}</Text></View>}
      <View style={styles.info}><Text style={styles.name}>{item.name}</Text><Text style={styles.price}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.price)}</Text></View>
    </View>} />;
}
const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: 24, backgroundColor: colors.background, gap: 16 }, title: { fontSize: 27, color: colors.ink, fontWeight: '600' }, description: { fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: 10 }, empty: { padding: 24, backgroundColor: colors.surface, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '600' }, card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }, image: { width: 90, height: 100, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }, initial: { color: colors.accent, fontSize: 30 }, info: { flex: 1, padding: 16, justifyContent: 'center' }, name: { fontSize: 17, fontWeight: '600', color: colors.ink }, price: { color: colors.accent, fontSize: 16, marginTop: 8 },
});
