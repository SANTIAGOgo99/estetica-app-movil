import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { initializeNetworkSecurity } from '../infrastructure/http/networkSecurity';
import { colors } from '../theme';

export function NetworkSecurityGate({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void initializeNetworkSecurity().then(() => { if (active) setReady(true); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  if (ready) return children;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
      {failed ? <>
        <Text accessibilityRole="alert" style={{ color: colors.ink, fontSize: 17, textAlign: 'center' }}>
          No pudimos preparar la conexión segura. Cierra y vuelve a abrir la app o comprueba que tienes su versión más reciente.
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Reintentar conexión segura"
          onPress={() => { setFailed(false); setAttempt(value => value + 1); }}
          style={{ minHeight: 48, backgroundColor: colors.accent, padding: 16, borderRadius: 24 }}>
          <Text>Reintentar</Text>
        </Pressable>
      </> : <ActivityIndicator accessibilityLabel="Preparando conexión segura" color={colors.roseDeep} />}
    </View>
  );
}
