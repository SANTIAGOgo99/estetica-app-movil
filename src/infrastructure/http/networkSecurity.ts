import { initializeSslPinning, isSslPinningAvailable } from 'react-native-ssl-public-key-pinning';
import { configureApiPinning } from './pinningPolicy';

export const initializeNetworkSecurity = () => configureApiPinning(
  { available: isSslPinningAvailable, initialize: initializeSslPinning },
  process.env.EXPO_PUBLIC_API_URL ?? '',
  __DEV__,
);
