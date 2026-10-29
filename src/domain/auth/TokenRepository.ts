/** Puerto de almacenamiento. El dominio no conoce SecureStore ni el navegador. */
export interface TokenRepository {
  read(): Promise<string | null>;
  save(token: string): Promise<void>;
  remove(): Promise<void>;
}

export interface LoginGateway {
  login(email: string, password: string): Promise<{ token: string }>;
}
