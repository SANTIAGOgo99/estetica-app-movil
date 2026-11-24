import type { TokenRepository } from '../../domain/auth/TokenRepository.ts';

export type TokenStorage = {
  readToken: () => Promise<string | null>;
  saveToken: (token: string) => Promise<void>;
  removeToken: () => Promise<void>;
  readRefreshToken?: () => Promise<string | null>;
  saveRefreshToken?: (token: string) => Promise<void>;
  removeRefreshToken?: () => Promise<void>;
};

/** Repository: concentra las operaciones de persistencia detrás de un contrato. */
export class PersistentTokenRepository implements TokenRepository {
  private readonly storage: TokenStorage;
  constructor(storage: TokenStorage) { this.storage = storage; }
  read() { return this.storage.readToken(); }
  save(token: string) { return this.storage.saveToken(token); }
  remove() { return this.storage.removeToken(); }
  async readRefresh() { return this.storage.readRefreshToken?.() ?? null; }
  async saveRefresh(token: string) { await this.storage.saveRefreshToken?.(token); }
  async removeRefresh() { await this.storage.removeRefreshToken?.(); }
}

export class MemoryTokenRepository implements TokenRepository {
  private token: string | null = null;
  private refreshToken: string | null = null;
  async read() { return this.token; }
  async save(token: string) { this.token = token; }
  async remove() { this.token = null; }
  async readRefresh() { return this.refreshToken; }
  async saveRefresh(token: string) { this.refreshToken = token; }
  async removeRefresh() { this.refreshToken = null; }
}

type RepositoryConfig = { kind: 'persistent'; storage: TokenStorage } | { kind: 'memory' };

/** Factory: el consumidor solicita una variante y recibe el mismo contrato. */
export function createTokenRepository(config: RepositoryConfig): TokenRepository {
  switch (config.kind) {
    case 'persistent': return new PersistentTokenRepository(config.storage);
    case 'memory': return new MemoryTokenRepository();
    default: throw new Error('Tipo de almacenamiento no compatible.');
  }
}
