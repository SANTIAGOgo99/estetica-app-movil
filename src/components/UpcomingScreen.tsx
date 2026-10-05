import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function UpcomingScreen({ title }: { title: string }) {
  return <View style={styles.page}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.description}>Esta sección estará disponible próximamente.</Text></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 24, backgroundColor: colors.background }, title: { fontSize: 28, fontWeight: '600', color: colors.ink }, description: { fontSize: 16, lineHeight: 24, marginTop: 16, color: colors.muted } });
