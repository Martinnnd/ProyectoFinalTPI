import { expect, test } from '@playwright/test';

test('un momento conecta pines lejanos, mantiene el panel y vuelve al origen', async ({ page }, testInfo) => {
  let analysisRequests = 0;
  const queries: string[] = [];
  const empty = { items: [], siguienteCursor: null, hayMas: false };
  const moment = { id: 1, nombre: 'Argentina campeón del mundo 1986', fechaInicio: '1986-01-01', fechaFin: '1986-12-31', momentoPadreId: null };
  const publication = (id: number) => ({ id, titulo: id === 118 ? 'Campeones en el Obelisco' : 'La copa desde Campana', descripcionBreve: 'Celebramos juntos', fecha: id === 118 ? '1986-06-29T00:00:00Z' : '1990-06-29T00:00:00Z', categoria: 5, urlMultimedia: 'https://fixtures.nostalgiar.test/recuerdo.jpg', tipoMultimedia: 0, autor: { id: 1, username: 'Ana' }, lugar: { nombre: id === 118 ? 'Obelisco' : 'Campana', latitud: id === 118 ? -34.6037 : -34.1636, longitud: id === 118 ? -58.3816 : -58.9586 } });
  await page.route('https://fixtures.nostalgiar.test/recuerdo.jpg', route => route.fulfill({ path: 'public/facts/bttf.jpg', contentType: 'image/jpeg' }));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = { 'access-control-allow-origin': request.headers().origin ?? 'http://localhost:3001', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type, authorization, x-nostalgiar-request', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.includes('/auth/')) return route.fulfill({ status: 401, headers });
    if (url.pathname.endsWith('/mapa')) return route.fulfill({ headers, json: { pines: [{ id: 118, latitud: -34.6037, longitud: -58.3816, categoria: 5 }], hayMas: false } });
    if (url.pathname.endsWith('/relaciones')) return route.fulfill({ headers, json: { publicacionId: 118, radioMetros: 200, dia: empty, lugar: empty } });
    if (url.pathname.endsWith('/analisis')) {
      analysisRequests++;
      return route.fulfill({ headers, json: { publicacionId: 118, versionContenido: 1, estado: analysisRequests <= 2 ? 'pendiente' : 'completado' } });
    }
    if (url.pathname.match(/\/publicaciones\/\d+\/momentos$/)) {
      return route.fulfill({ headers, json: { publicacionId: 118, versionRelaciones: 1, permitirMomentosAutomaticos: true, puedeCorregir: false, momentos: analysisRequests <= 2 ? [] : [{ momento: { ...moment, id: 9 }, origen: 'automatico' }, { momento: { ...moment, id: 2, nombre: 'Un momento sin otros recuerdos' }, origen: 'automatico' }] } });
    }
    if (url.pathname === '/api/momentos/2/publicaciones') return route.fulfill({ headers, json: { ...empty, items: [publication(118)] } });
    if (url.pathname === '/api/momentos/9') return route.fulfill({ headers, json: { ...moment, versionCatalogo: 1, redirigidoDesdeId: 9, descripcion: '', padre: null, hijos: [], alias: [] } });
    if (/\/api\/momentos\/(1|9)\/publicaciones$/.test(url.pathname)) {
      if (url.searchParams.get('limite') === '2') return route.fulfill({ headers, json: { ...empty, items: [publication(118), publication(119)] } });
      queries.push(url.search);
      if (url.searchParams.has('cursor')) {
        expect(url.searchParams.get('cursor')).toBe('momento+/= &?');
        return route.fulfill({ headers, json: { ...empty, items: [publication(119)] } });
      }
      return route.fulfill({ headers, json: { items: [publication(118)], siguienteCursor: 'momento+/= &?', hayMas: true } });
    }
    const match = url.pathname.match(/\/publicaciones\/(\d+)(?:\/resumen)?$/);
    return route.fulfill({ headers, json: match ? publication(Number(match[1])) : [] });
  });
  await page.goto('/explorar?era=1980');
  await page.getByRole('button', { name: 'Recuerdo, 1980, Acontecimientos', exact: true }).click();
  const preview = page.locator('#explore .pin-message-preview');
  await expect(preview.getByText('Buscando momentos relacionados…')).toBeVisible();
  await preview.getByRole('button', { name: 'Parte de Argentina campeón del mundo 1986' }).click({ timeout: 15000 });
  await expect(preview.getByRole('button', { name: 'Parte de Un momento sin otros recuerdos' })).toHaveCount(0);
  const panel = page.getByRole('complementary', { name: 'Explorar un momento' });
  await expect(panel.getByRole('heading', { name: moment.nombre })).toBeVisible();
  await expect(panel.getByText('1986', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Más recuerdos del momento' }).click();
  await panel.getByRole('button', { name: 'Explorar recuerdo: La copa desde Campana' }).click();
  await expect(page.locator('.app')).toHaveClass(/era-1990/);
  await expect(preview.locator('strong').filter({ hasText: /^La copa desde Campana$/ })).toBeVisible();
  await expect(panel).toBeVisible();
  await panel.screenshot({ path: testInfo.outputPath('explorar-momento.png') });
  await panel.getByRole('button', { name: 'Volver a Campeones en el Obelisco' }).click();
  await expect(page.locator('.app')).toHaveClass(/era-1980/);
  await expect(preview.locator('strong').filter({ hasText: /^Campeones en el Obelisco$/ })).toBeVisible();
  await panel.getByRole('checkbox').uncheck();
  await expect(panel.getByRole('button', { name: 'Explorar recuerdo: La copa desde Campana' })).toHaveCount(0);
  await expect.poll(() => queries.some(query => query.includes('incluirDescendientes=false') && !query.includes('cursor'))).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel).toBeVisible();
  const bounds = (await panel.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await panel.screenshot({ path: testInfo.outputPath('explorar-momento-movil.png') });
  await panel.getByRole('button', { name: 'Cerrar exploración del momento' }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator('.app.view-map')).toBeVisible();
});
