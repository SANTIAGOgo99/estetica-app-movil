import type { Page } from '@playwright/test';

export const service = { id: 2, name: 'Corte de prueba', price: '250.00', duration_minutes: 45, category: 'Cabello', description: 'Corte para cliente de pruebas', is_active: true };
export const product = { id: 3, name: 'Shampoo de prueba', price: '120.50', stock: 5, category: 'Cuidado', description: 'Producto para pruebas', is_active: true };
export async function mockApi(page: Page) {
  // URL ficticia incrustada al exportar: jamás envía datos a producción.
  await page.route('https://api.example.test/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    let status = 200;
    if (path.endsWith('/services/active')) body = [service];
    else if (path.endsWith('/products/active')) body = [product];
    else if (path === '/api/services/2') body = service;
    else if (path === '/api/products/3') body = product;
    else if (path.endsWith('/auth/login')) {
      const claims = btoa(JSON.stringify({ role: 'client', exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      body = { role: 'client', token: `e30.${claims}.test` };
    } else if (path.endsWith('/users/profile')) body = { id: 1, full_name: 'Cliente de prueba', email: 'cliente@example.com', phone: '5550000000', role: 'client', is_active: true };
    else if (path.endsWith('/appointments/my-appointments')) body = { appointments: [] };
    else { status = 404; body = { message: `Ruta de prueba no configurada: ${path}` }; }
    await route.fulfill({ status, json: body });
  });
}

