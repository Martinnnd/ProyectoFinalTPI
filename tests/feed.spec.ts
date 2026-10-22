import { expect, test } from '@playwright/test';
import { API_BASE_URL } from '../src/api';

test('mapa conserva la cámara entre pestañas y se crea de nuevo al recargar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const bounds: string[] = [];
  await page.route(`${API_BASE_URL}/api/**`, async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/publicaciones') return route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: [] });
    if (url.pathname.endsWith('/mapa')) bounds.push(url.search);
    return route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: url.pathname.endsWith('/mapa') ? { pines: [], hayMas: false } : { items: [], siguienteCursor: null, hayMas: false } });
  });
  await page.goto('/explorar?era=1990');
  const map = page.locator('#explore .memory-map');
  await expect(map).toBeVisible();
  await expect.poll(() => bounds.length, { timeout: 30000 }).toBeGreaterThan(0);
  await map.evaluate(element => element.setAttribute('data-preserved-instance', 'yes'));
  const keyboard = page.locator('#explore .mapboxgl-canvas, #explore .leaflet-container');
  await keyboard.focus();
  const before = bounds.length;
  await keyboard.press('ArrowRight');
  await keyboard.press('ArrowUp');
  await expect.poll(() => bounds.length).toBeGreaterThan(before);
  const position = bounds.at(-1)!;
  for (const name of ['Feed', 'Perfil', 'Chat']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(map).toBeHidden();
    await page.getByRole('button', { name: 'Explorar mapa', exact: true }).click();
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute('data-preserved-instance', 'yes');
  }
  expect(bounds.at(-1)).toBe(position);
  await page.reload();
  await expect(map).toBeVisible();
  await expect(map).not.toHaveAttribute('data-preserved-instance', 'yes');
});

for (const { mobile, era } of [{ mobile: false, era: 1990 }, { mobile: true, era: 1990 }, { mobile: false, era: 1970 }, { mobile: true, era: 1970 }]) {
  test(`feed paginado automático excluye propios y permite reintentar${mobile ? ' en móvil' : ''}, década ${era}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const cursors: (string | null)[] = [];
    let firstPage = 0;
    let failures = 0;
    const followed: number[] = [];
    let releaseNext: (() => void) | undefined;
    const publication = (id: number, titulo: string, authorId = 2) => ({ id, titulo, descripcion: 'Una historia del barrio para descubrir.', fecha: `${era + 2}-01-01T00:00:00Z`, categoria: 0, urlMultimedia: '', tipoMultimedia: 0, autor: { id: authorId, username: authorId === 1 ? 'Ana' : 'Nico' }, lugar: { nombre: 'San Justo', latitud: -34.67, longitud: -58.56 } });
    await page.route('**/api/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = { 'access-control-allow-origin': request.headers().origin ?? 'http://localhost:3001', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization, content-type, x-nostalgiar-request', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.pathname === '/api/auth/refresh') return route.fulfill({ headers, json: { token: 'test', usuarioId: 1, username: 'Ana', email: 'ana@example.com', esAdmin: false } });
      if (url.pathname.startsWith('/api/seguimientos/')) return route.fulfill({ headers, json: url.pathname.endsWith('/seguidos') ? [{ id: 3, username: 'Sofi' }] : [] });
      if (url.pathname === '/api/seguimientos' && request.method() === 'POST') {
        followed.push(request.postDataJSON().idUsuarioASeguir);
        return route.fulfill({ status: 204, headers });
      }
      if (url.pathname.endsWith('/mapa')) return route.fulfill({ headers, json: { pines: [], hayMas: false } });
      if (url.pathname.endsWith('/para-vos')) {
        expect(url.searchParams.get('usuarioId')).toBe('1');
        expect(url.searchParams.get('limite')).toBe('20');
        const cursor = url.searchParams.get('cursor');
        cursors.push(cursor);
        if (!cursor) {
          firstPage++;
          return route.fulfill({ headers, json: { items: [publication(11, 'Mi recuerdo oculto', 1)], siguienteCursor: 'solo-propios', hayMas: true } });
        }
        if (cursor === 'solo-propios') return route.fulfill({ headers, json: { items: Array.from({ length: 10 }, (_, index) => publication(25 + index, index === 0 && firstPage > 1 ? 'Nueva recomendación' : `Recomendación ${25 + index}`)), siguienteCursor: 'next+/=', hayMas: true } });
        if (cursor === 'next+/=') {
          await new Promise<void>(resolve => { releaseNext = resolve; });
          return route.fulfill({ headers, json: { items: [publication(25, 'Recomendación 25'), publication(35, 'Recomendación 35')], siguienteCursor: 'error', hayMas: true } });
        }
        failures++;
        return route.fulfill({ headers, status: failures === 1 ? 503 : 410, json: { mensaje: failures === 1 ? 'Falló la conexión de prueba' : 'Sesión vencida' } });
      }
      if (url.pathname.endsWith('/seguidos')) return route.fulfill({ headers, json: { items: [{ ...publication(40, 'Publicación de un seguido'), autor: { id: 3, username: 'Sofi' } }], siguienteCursor: null, hayMas: false } });
      if (url.pathname.endsWith('/relaciones')) return route.fulfill({ headers, json: { publicacionId: 25, dia: { items: [], hayMas: false, siguienteCursor: null }, lugar: { items: [], hayMas: false, siguienteCursor: null } } });
      if (url.pathname.endsWith('/momentos')) return route.fulfill({ headers, json: { publicacionId: 25, permitirMomentosAutomaticos: true, puedeCorregir: false, momentos: [] } });
      if (url.pathname.endsWith('/analisis')) return route.fulfill({ headers, json: { publicacionId: 25, estado: 'sinMomento' } });
      return route.fulfill({ headers, json: [] });
    });
    await page.goto(`/explorar?era=${era}&view=feed`);
    const feed = page.getByRole('region', { name: 'Feed de recuerdos' });
    await expect(feed.getByRole('heading', { name: 'Recomendación 25', exact: true })).toBeVisible();
    await expect(feed.getByRole('heading', { name: 'Mi recuerdo oculto', exact: true })).toHaveCount(0);
    await expect(feed.getByRole('button', { name: 'Ver más publicaciones', exact: true })).toHaveCount(0);
    expect(cursors).toEqual([null, 'solo-propios']);
    async function scrollToEnd() {
      await feed.locator('.social-stream').evaluate(element => {
        let root: HTMLElement | null = element as HTMLElement;
        while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
        if (!root) throw new Error('No se encontró el contenedor de scroll');
        root.scrollTop = root.scrollHeight;
      });
    }
    async function scrollBy(amount: number) {
      await feed.locator('.social-stream').evaluate((element, delta) => {
        let root: HTMLElement | null = element as HTMLElement;
        while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
        if (!root) throw new Error('No se encontró el contenedor de scroll');
        root.scrollTop += delta;
      }, amount);
    }
    await scrollToEnd();
    await expect(feed.locator('.feed-heading')).toHaveClass(/is-scroll-hidden/);
    await expect(feed.locator('.feed-loading[role="status"]')).toContainText('Cargando recuerdos');
    await expect.poll(() => cursors.filter(cursor => cursor === 'next+/=').length).toBe(1);
    releaseNext!();
    await expect(feed.getByRole('heading', { name: 'Recomendación 35', exact: true })).toBeVisible();
    await expect(feed.getByRole('heading', { name: 'Recomendación 25', exact: true })).toHaveCount(1);
    await scrollBy(-180);
    await expect(feed.locator('.feed-heading')).not.toHaveClass(/is-scroll-hidden/);
    await expect(feed.getByRole('button', { name: 'Seguidos', exact: true })).toBeInViewport();
    await expect.poll(() => feed.locator('.feed-heading').evaluate(header => {
      let root: HTMLElement | null = header.parentElement;
      while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
      if (!root) throw new Error('No se encontró el contenedor de scroll');
      return Math.abs(header.getBoundingClientRect().top - root.getBoundingClientRect().top - root.clientTop);
    })).toBeLessThanOrEqual(1);
    await scrollBy(60);
    await expect(feed.locator('.feed-heading')).toHaveClass(/is-scroll-hidden/);
    await scrollBy(-60);
    await expect(feed.getByRole('button', { name: 'Mis grupos', exact: true })).toBeInViewport();
    await scrollToEnd();
    await expect(feed.getByRole('alert')).toContainText('Falló la conexión de prueba');
    expect(failures).toBe(1);
    await feed.getByRole('alert').getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(feed.getByRole('alert')).toContainText('venció');
    await feed.getByRole('button', { name: 'Nueva selección', exact: true }).click();
    await expect(feed.getByRole('heading', { name: 'Nueva recomendación', exact: true })).toBeVisible();
    expect(cursors).toEqual([null, 'solo-propios', 'next+/=', 'error', 'error', null, 'solo-propios']);
    await scrollBy(1000);
    await scrollBy(-100);
    await expect(feed.getByRole('button', { name: 'Seguidos', exact: true })).toBeInViewport();
    await feed.getByRole('button', { name: 'Seguidos', exact: true }).click();
    await expect(feed.getByRole('heading', { name: 'Publicación de un seguido', exact: true })).toBeVisible();
    const suggestions = feed.locator('.feed-sidebar .suggested-person');
    await expect(suggestions.locator('strong').filter({ hasText: /^Nico$/ })).toHaveCount(1);
    await expect(suggestions.locator('strong').filter({ hasText: /^Sofi$/ })).toHaveCount(0);
    await expect(suggestions.locator('strong').filter({ hasText: /^Ana$/ })).toHaveCount(0);
    await feed.getByRole('button', { name: 'Mis grupos', exact: true }).click();
    await expect(suggestions.locator('strong').filter({ hasText: /^Nico$/ })).toHaveCount(1);
    if (mobile) await feed.locator('.feed-sidebar-content > summary').click();
    await suggestions.filter({ has: page.locator('strong', { hasText: /^Nico$/ }) }).getByRole('button', { name: 'Seguir', exact: true }).click();
    await expect(suggestions.locator('strong').filter({ hasText: /^Nico$/ })).toHaveCount(0);
    expect(followed).toEqual([2]);
  });
}
