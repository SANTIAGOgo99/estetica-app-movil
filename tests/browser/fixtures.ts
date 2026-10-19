import type { Page } from '@playwright/test';
import data from '../fixtures/mobile.json';

export const service = data.service;
export const product = data.product;
export const login = data.login;
export const performanceData = data.performance;
export async function mockApi(page: Page) {
  // Contrato simulado y reproducible; no acredita API/PostgreSQL ni un teléfono físico.
  await page.route('https://api.example.test/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    let status = 200;
    if (path.endsWith('/services/active')) body = [service];
    else if (path.endsWith('/products/active')) body = [product];
    else if (path === '/api/services/2') body = service;
    else if (path === '/api/products/3') body = product;
    else if (path.endsWith('/auth/login')) {
      const credentials = route.request().postDataJSON();
      if (credentials.email !== login.email || credentials.password !== login.password) {
        status = 401;
        body = { error: 'Usuario no encontrado' };
      } else {
        const claims = btoa(JSON.stringify({ role: 'client', exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        body = { role: 'client', token: `e30.${claims}.test` };
      }
    } else if (path.endsWith('/users/profile')) body = data.profile;
    else if (path.endsWith('/appointments/my')) body = { appointments: [] };
    else { status = 404; body = { message: `Ruta de prueba no configurada: ${path}` }; }
    await route.fulfill({ status, json: body });
  });
}
