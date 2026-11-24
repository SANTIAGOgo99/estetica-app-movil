/** Puerto de almacenamiento. El dominio no conoce SecureStore ni el navegador. */
export interface TokenRepository {
  read(): Promise<string | null>;
  save(token: string): Promise<void>;
  remove(): Promise<void>;
  readRefresh?(): Promise<string | null>;
  saveRefresh?(token: string): Promise<void>;
  removeRefresh?(): Promise<void>;
}

export interface LoginGateway {
  login(email: string, password: string): Promise<{ token: string; refreshToken?: string }>;
  refresh?(refreshToken: string): Promise<{ token: string; refreshToken: string }>;
  logout?(refreshToken: string): Promise<void>;
}
