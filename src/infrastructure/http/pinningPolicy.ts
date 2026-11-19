import { normalizeApiUrl } from './apiUrl.ts';

export const PINNED_API_HOST = 'esteticaa-backend-five.vercel.app';
// Huellas SPKI SHA-256 verificadas el 19/11/2026: hoja e intermediario GTS WR1.
// Revisar ante cambios de certificado/proveedor; no se desactiva la validación por fecha.
export const API_PUBLIC_KEY_HASHES = [
  'ED02jY6POswcMjticCshf50ywurppjVGa00Y+Oqf8ho=',
  'yDu9og255NN5GEf+Bwa9rTrqFQ0EydZ0r1FCh9TdAW4=',
];

export type PinningOptions = Record<string, { includeSubdomains: boolean; publicKeyHashes: string[] }>;
type Adapter = { available: () => boolean; initialize: (options: PinningOptions) => Promise<void> };

export async function configureApiPinning(adapter: Adapter, apiUrl: string, development: boolean) {
  const url = new URL(normalizeApiUrl(apiUrl, development));
  if (development && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return 'local-development';
  if (url.hostname !== PINNED_API_HOST)
    throw new Error('El servidor configurado no coincide con la conexión verificada.');
  if (!adapter.available()) {
    if (development) return 'development-without-native-pinning';
    throw new Error('Esta instalación no permite verificar la conexión segura.');
  }
  await adapter.initialize({
    [PINNED_API_HOST]: { includeSubdomains: false, publicKeyHashes: [...API_PUBLIC_KEY_HASHES] },
  });
  return 'native-pinning';
}
