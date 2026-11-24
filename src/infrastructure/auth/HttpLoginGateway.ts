import type { LoginGateway } from '../../domain/auth/TokenRepository.ts';
import { requestLogin } from './requestLogin.ts';
import { requestSessionAction } from './requestRefresh.ts';

export class HttpLoginGateway implements LoginGateway {
  private readonly url: () => string | undefined;
  private readonly fetcher: typeof fetch;
  constructor(url: () => string | undefined, fetcher: typeof fetch = fetch) { this.url = url; this.fetcher = fetcher; }
  login(email: string, password: string) { return requestLogin(this.url(), email, password, this.fetcher); }
  refresh(token: string) { return requestSessionAction(this.url(), 'refresh', token, this.fetcher); }
  async logout(token: string) { await requestSessionAction(this.url(), 'logout', token, this.fetcher); }
}
