import { expect, test } from '@playwright/test';

for (const origin of ['/perfil/sofi', '/perfil', '/feed']) {
  test(`cambiar de época desde el detalle regresa a ${origin} sin restaurar la época del recuerdo`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.route('**/api/**', async route => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const headers = { 'access-control-allow-origin': request.headers().origin ?? 'http://localhost:3001', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization, content-type, x-nostalgiar-request', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
      if (request.method() === 'OPTIONS') return route.fulfill({ headers, status: 204 });
      const memory = { id: 12, titulo: 'Recuerdo de 1985', descripcion: 'Una historia', fecha: '1985-01-01', categoria: 0, tipoMultimedia: 0, urlMultimedia: '', autor: { id: 2, username: 'sofi' }, lugar: { nombre: 'Buenos Aires', latitud: -34.6, longitud: -58.4 } };
      let json: unknown = [];
      if (path === '/api/auth/refresh') json = { token: 'test', usuarioId: 1, username: 'ana', email: 'ana@test.com', esAdmin: false };
      if (path === '/api/publicaciones/12') json = memory;
      if (path.startsWith('/api/feed/')) json = { items: [memory], siguienteCursor: null, hayMas: false };
      if (/\/api\/publicaciones\/usuario\/\d+$/.test(path)) json = [memory];
      if (path.startsWith('/api/usuario/perfil/')) {
        const own = path.endsWith('/ana');
        json = { id: own ? 1 : 2, username: own ? 'ana' : 'sofi', tipoUsuario: 'Usuario_Personal', reputacion: 'Errante', puntosNostalgia: 0, cantidadPublicaciones: 0, cantidadSeguidores: 0, cantidadSeguidos: 0 };
      }
      if (path.endsWith('/momentos')) json = { publicacionId: 12, momentos: [] };
      if (path.endsWith('/analisis')) json = { estado: 'sinMomento' };
      if (path.endsWith('/relaciones')) json = { publicacionId: 12, dia: { items: [], siguienteCursor: null, hayMas: false }, lugar: { items: [], siguienteCursor: null, hayMas: false } };
      return route.fulfill({ headers, json });
    });
    await page.goto(`${origin}?era=1980`);
    await page.addStyleTag({ content: 'nextjs-portal { display:none !important; }' });
    await expect(page.getByText('Recuerdo de 1985', { exact: true })).toBeVisible();
    await page.locator('.feed-post .post-content').first().click();
    await expect(page).toHaveURL(/\/recuerdo\/12/);
    await expect(page.locator('.app')).toHaveClass(/era-1980/);
    await page.getByRole('button', { name: 'Década de 1990', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${origin}$`));
    if (origin.startsWith('/perfil')) {
      await expect(page.getByRole('main', { name: `Perfil de ${origin === '/perfil' ? 'ana' : 'sofi'}` })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Feed', exact: true })).toBeVisible();
    }
    await expect(page.locator('.app')).toHaveClass(/era-1990/);
    await expect(page.getByRole('button', { name: 'Década de 1990', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });
}
