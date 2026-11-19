import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { Body, Button, Card, Field, Icon, Page, TextAction, s } from '../../components/ui';
import { colors } from '../../theme';
import { useAuth } from '../auth/AuthProvider';
import { useFlow } from '../interfaces/Flow';
import { apiRequest, object } from '../api/client';
import { useRemote } from '../api/useRemote';
import { decodeProfile, type Profile } from './model';
import { PRIVACY_NOTICE_VERSION } from '../privacy/notice';
import { PrivacyNoticeContent } from '../privacy/Screens';

function decodePrivacy(value: unknown) {
  const data = object(value);
  if (typeof data.marketing_allowed !== 'boolean') throw Error('No se pudieron interpretar tus preferencias.');
  return { marketing: data.marketing_allowed, version: data.consent_version, acceptedAt: data.consent_at };
}

export function AccountSettingsScreen() {
  const auth = useAuth();
  const profile = useRemote(auth.token ? '/users/profile' : null, auth.token, decodeProfile);
  return (
    <Page title="Mis datos y privacidad" subtitle="Controla la información de tu cuenta." back="profile">
      {profile.loading ? <ActivityIndicator accessibilityLabel="Cargando datos de cuenta" color={colors.roseDeep} />
        : profile.error ? <Card><Body>{profile.error}</Body><Button label="Reintentar datos de cuenta" onPress={profile.refresh} /></Card>
        : profile.data ? <SettingsForm key={profile.data.id} profile={profile.data} /> : null}
    </Page>
  );
}

function SettingsForm({ profile }: { profile: Profile }) {
  const auth = useAuth();
  const flow = useFlow();
  const privacy = useRemote('/users/privacy', auth.token, decodePrivacy);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showNotice, setShowNotice] = useState(false);
  const [consent, setConsent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pending = useRef(false);
  async function perform(action: string, work: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(action); setError(''); setNotice('');
    try { await work(); }
    catch (value) { setError(value instanceof Error ? value.message : 'No se pudo completar la operación.'); }
    finally { pending.current = false; setBusy(''); }
  }
  return <>
    <Card>
      <Text style={s.subheading}>Corregir mis datos</Text>
      <Field label="Nombre completo" value={name} onChangeText={setName} editable={!busy} maxLength={120} />
      <Field label="Correo electrónico" value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" keyboardType="email-address" maxLength={254} />
      <Field label="Teléfono" value={phone} onChangeText={setPhone} editable={!busy} keyboardType="phone-pad" maxLength={10} />
      <Field label="Contraseña de confirmación" value={password} onChangeText={setPassword} editable={!busy} secret autoCapitalize="none" autoCorrect={false} autoComplete="current-password" />
      <Body muted>Confirma tu contraseña para guardar cambios o eliminar tu cuenta.</Body>
      <Button label="Guardar mis datos" disabled={!!busy || !password} loading={busy === 'profile'} onPress={() => void perform('profile', async () => {
        decodeProfile(await apiRequest('/users/profile', { token: auth.token, method: 'PUT', body: { full_name: name, email, phone, password } }));
        setPassword(''); setNotice('Tus datos se guardaron correctamente.');
      })} />
    </Card>
    <Card>
      <Text style={s.subheading}>Preferencias de privacidad</Text>
      {privacy.loading ? <ActivityIndicator accessibilityLabel="Cargando preferencias" color={colors.roseDeep} />
        : privacy.error ? <><Body>{privacy.error}</Body><Button label="Reintentar preferencias" onPress={privacy.refresh} /></>
        : <>
          <View style={[s.row, { flexWrap: 'nowrap' }]}>
            <Text style={[s.body, { flex: 1 }]}>Permitir comunicaciones promocionales</Text>
            <Switch accessibilityLabel="Permitir comunicaciones promocionales" value={privacy.data?.marketing ?? false} disabled={!!busy}
              onValueChange={value => void perform('privacy', async () => {
                await apiRequest('/users/privacy', { token: auth.token, method: 'PUT', body: { marketing_allowed: value } });
                privacy.refresh(); setNotice('Tu preferencia de privacidad quedó guardada.');
              })} trackColor={{ true: colors.roseDeep }} />
          </View>
          <Body muted>Puedes retirar este permiso cuando quieras. Las funciones de tu cuenta seguirán disponibles.</Body>
          <Body>{privacy.data?.version === PRIVACY_NOTICE_VERSION ? 'Aceptaste la versión vigente del aviso de privacidad.' : 'Puedes registrar aquí la aceptación del aviso vigente.'}</Body>
          <TextAction label={showNotice ? 'Ocultar aviso' : 'Leer aviso vigente'} onPress={() => setShowNotice(value => !value)} />
          {showNotice && <PrivacyNoticeContent />}
          {privacy.data?.version !== PRIVACY_NOTICE_VERSION && <>
            <Pressable accessibilityRole="checkbox" accessibilityLabel="Acepto el aviso vigente" accessibilityState={{ checked: consent }} disabled={!!busy}
              onPress={() => setConsent(value => !value)} style={[s.row, { justifyContent: 'flex-start', minHeight: 48 }]}>
              <Icon name={consent ? 'check-square' : 'square'} /><Text style={[s.body, { flex: 1 }]}>He leído y acepto el aviso de privacidad vigente.</Text>
            </Pressable>
            <Button label="Guardar aceptación del aviso" disabled={!consent || !!busy} loading={busy === 'consent'} onPress={() => void perform('consent', async () => {
              await apiRequest('/users/privacy/consent', { token: auth.token, method: 'POST', body: { accepted: consent, version: PRIVACY_NOTICE_VERSION } });
              privacy.refresh(); setConsent(false); setNotice('La aceptación del aviso quedó registrada.');
            })} />
          </>}
        </>}
    </Card>
    <Card>
      <Text style={s.subheading}>Eliminar mi cuenta</Text>
      <Body>Se retirarán tu nombre, correo, teléfono y acceso. El historial operativo podrá conservarse sin esos datos de identificación. Esta acción no se puede deshacer.</Body>
      {!deleting ? <Button label="Eliminar mi cuenta" secondary disabled={!!busy} onPress={() => setDeleting(true)} /> : <>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="Confirmo eliminar mi cuenta" accessibilityState={{ checked: confirmDelete }} disabled={!!busy}
          onPress={() => setConfirmDelete(value => !value)} style={[s.row, { justifyContent: 'flex-start', minHeight: 48 }]}>
          <Icon name={confirmDelete ? 'check-square' : 'square'} /><Text style={[s.body, { flex: 1 }]}>Entiendo que perderé el acceso y confirmo la eliminación.</Text>
        </Pressable>
        <Body muted>Escribe tu contraseña de confirmación en el formulario de arriba.</Body>
        <Button label="Confirmar eliminación de mi cuenta" disabled={!confirmDelete || !password || !!busy} loading={busy === 'delete'} onPress={() => void perform('delete', async () => {
          const result = object(await apiRequest('/account', { token: auth.token, method: 'DELETE', body: { password, confirm: confirmDelete } }));
          if (result.deleted !== true) throw Error('El servidor no confirmó la eliminación.');
          setPassword(''); await auth.signOut(); flow.go('home');
        })} />
        <TextAction label="Conservar mi cuenta" onPress={() => { setDeleting(false); setConfirmDelete(false); }} />
      </>}
    </Card>
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {!!notice && <Text accessibilityRole="alert" style={s.body}>{notice}</Text>}
  </>;
}
