import { AuthService } from '../application/auth/AuthService';
import { SessionStore } from '../application/auth/SessionStore';
import { createTokenRepository } from '../infrastructure/auth/TokenRepositoryFactory';
import { HttpLoginGateway } from '../infrastructure/auth/HttpLoginGateway';
import * as storage from '../infrastructure/auth/storage';

// Único punto de ensamblado: aquí se eligen los adaptadores de la aplicación.
export const sessionStore = SessionStore.getInstance();
const tokenRepository = createTokenRepository({ kind: 'persistent', storage });
export const authService = new AuthService(
  tokenRepository,
  new HttpLoginGateway(() => process.env.EXPO_PUBLIC_API_URL),
  sessionStore,
);
