import { expect, test } from '@playwright/test';
import { API_BASE_URL } from '../src/api';

test('mapa conserva la cámara entre pestañas y se crea de nuevo al recargar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const bounds: string[] = [];
  await page.route(`${API_BASE_URL}/api/**`, async route => {
    const url = new URL(route.request().url());
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

test('feed paginado, sesión vencida, recarga y Seguidos del servidor', async ({ page }) => {
  const cursors: (string | null)[] = [];
  let firstPage = 0;
  const publication = (id: number, titulo: string) => ({ id, titulo, descripcion: 'Descripción abreviada', fecha: '1992-01-01T00:00:00Z', fechaCreacion: '2026-10-13T15:00:00Z', categoria: 0, tipoMultimedia: 0, urlMultimedia: '', autor: { id: 2, username: 'Ana' }, lugar: { nombre: 'Buenos Aires', latitud: -34, longitud: -58 } });
  await page.route(`${API_BASE_URL}/api/**`, async route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' };
    if (url.pathname.endsWith('/mapa')) return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    if (url.pathname.endsWith('/para-vos')) {
      expect(url.searchParams.get('usuarioId')).toBe('1');
      expect(url.searchParams.get('limite')).toBe('20');
      const cursor = url.searchParams.get('cursor'); cursors.push(cursor);
      if (cursor === 'expired') return route.fulfill({ headers, status: 410, json: { mensaje: 'Sesión vencida' } });
      if (cursor) return route.fulfill({ headers, json: { items: [publication(25, 'Primera recomendación'), publication(26, 'Segunda recomendación')], siguienteCursor: 'expired', hayMas: true } });
      firstPage++;
      return route.fulfill({ headers, json: { items: [publication(25, firstPage === 1 ? 'Primera recomendación' : 'Nueva recomendación')], siguienteCursor: 'next+/=', hayMas: true } });
    }
    if (url.pathname.endsWith('/seguidos')) return route.fulfill({ headers, json: { items: [publication(30, 'Publicación de un seguido')], siguienteCursor: null, hayMas: false } });
    if (url.pathname.endsWith('/comentarios')) return route.fulfill({ headers, json: { items: [], siguienteCursor: null, hayMas: false } });
    return route.fulfill({ headers, json: { ...publication(30, 'Publicación de un seguido'), descripcion: 'Descripción completa desde el detalle', cantidadLikes: 12, cantidadComentarios: 47, dioLike: true } });
  });
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', { name: 'Feed', exact: true }).click();
  const feed = page.getByRole('region', { name: 'Feed de recuerdos' });
  await expect(feed.getByRole('heading', { name: 'Primera recomendación', exact: true })).toBeVisible();
  await feed.getByRole('button', { name: 'Ver más publicaciones', exact: true }).click();
  await expect(feed.getByRole('heading', { name: 'Segunda recomendación', exact: true })).toBeVisible();
  await expect(feed.getByRole('heading', { name: 'Primera recomendación', exact: true })).toHaveCount(1);
  await feed.getByRole('button', { name: 'Ver más publicaciones', exact: true }).click();
  await expect(feed.getByRole('alert')).toContainText('venció');
  await expect(feed.getByRole('button', { name: 'Ver más publicaciones', exact: true })).toHaveCount(0);
  await feed.getByRole('button', { name: 'Nueva selección', exact: true }).click();
  await expect(feed.getByRole('heading', { name: 'Nueva recomendación', exact: true })).toBeVisible();
  expect(cursors).toEqual([null, 'next+/=', 'expired', null]);
  await feed.getByRole('button', { name: 'Seguidos', exact: true }).click();
  await expect(feed.getByRole('heading', { name: 'Publicación de un seguido', exact: true })).toBeVisible();
  await feed.getByRole('button', { name: /Publicación de un seguido.*Leer recuerdo completo/ }).click();
  await expect(feed.getByText('Descripción completa desde el detalle', { exact: true })).toBeVisible();
  await expect(feed.getByRole('button', { name: '47 Comentar', exact: true })).toBeVisible();
  const like = feed.getByRole('button', { name: 'Me gusta: Publicación de un seguido', exact: true });
  await expect(like).toContainText('12');
  await expect(like).toHaveAttribute('aria-pressed', 'true');
});
