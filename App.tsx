import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>preparando entorno de desarrollo app movil</Text>

      <Text style={styles.texto}>
        Nombre: Héctor Santiago Hernández
      </Text>

      <Text style={styles.texto}>
        Grado: 10
      </Text>

      <Text style={styles.texto}>
        Grupo: A
      </Text>

      <Text style={styles.texto}>
        Matrícula: 20231189
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  texto: {
    fontSize: 20,
    marginBottom: 10,
  },
});