import { expect, test } from '@playwright/test';

test('conserva páginas del feed al volver del mapa y actualiza solo a pedido; reutiliza el perfil', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let firstPages = 0;
  let profileReads = 0;
  let publicationReads = 0;
  const publication = (id: number, title = `Publicación cacheada ${id}`) => ({
    id, titulo: title, descripcion: 'Un recuerdo de prueba para navegar sin recargar.',
    fecha: '1985-01-01T00:00:00Z', fechaCreacion: '2026-10-26T10:00:00Z', categoria: 0,
    tipoMultimedia: 0, urlMultimedia: '', autor: { id: 2, username: 'sofi' },
    lugar: { nombre: 'Buenos Aires', latitud: -34.6, longitud: -58.4 },
  });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = {
      'access-control-allow-origin': request.headers().origin ?? 'http://localhost:3101',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization, content-type, x-nostalgiar-request',
      'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    };
    const respond = (json: unknown) => route.fulfill({ headers, json });
    if (request.method() === 'OPTIONS') return route.fulfill({ headers, status: 204 });
    if (url.pathname === '/api/auth/refresh') return respond({ token: 'test-token', usuarioId: 1, username: 'ana', email: 'ana@test.com', esAdmin: false });
    if (url.pathname === '/api/feed/para-vos') {
      if (!url.searchParams.has('cursor')) {
        firstPages++;
        return respond({ items: [publication(1, firstPages > 1 ? 'Nueva publicación' : undefined), publication(2)], siguienteCursor: 'next', hayMas: true });
      }
      return respond({ items: [publication(3)], siguienteCursor: null, hayMas: false });
    }
    if (url.pathname === '/api/usuario/perfil/ana') {
      profileReads++;
      return respond({ id: 1, username: 'ana', tipoUsuario: 'Usuario_Personal', reputacion: 'Errante', puntosNostalgia: 0, cantidadPublicaciones: 0, cantidadSeguidores: 0, cantidadSeguidos: 0 });
    }
    if (url.pathname === '/api/publicaciones/usuario/1') { publicationReads++; return respond([]); }
    if (url.pathname.endsWith('/mapa')) return respond({ pines: [], hayMas: false });
    if (url.pathname.endsWith('/relaciones')) return respond({ publicacionId: 1, dia: { items: [], siguienteCursor: null, hayMas: false }, lugar: { items: [], siguienteCursor: null, hayMas: false } });
    if (url.pathname.endsWith('/analisis')) return respond({ estado: 'sinMomento' });
    if (url.pathname.endsWith('/momentos')) return respond({ publicacionId: 1, momentos: [] });
    if (url.pathname.includes('/seguimientos') || url.pathname === '/api/grupos' || url.pathname.includes('notificacion') || url.pathname === '/api/chat/conversaciones') return respond([]);
    return respond({});
  });

  await page.goto('/feed?era=1980');
  // The development issues badge overlaps the account button at this viewport.
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await expect(page.getByText('Publicación cacheada 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'nuevas publicaciones' })).toHaveCount(0);
  await page.locator('.feed-load-target').scrollIntoViewIfNeeded();
  await expect(page.getByText('Publicación cacheada 3', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'nuevas publicaciones' })).toHaveCount(0);
  expect(firstPages).toBe(1);
  const rail = page.getByRole('navigation', { name: 'Navegación principal' });
  await rail.getByRole('button', { name: 'Explorar mapa', exact: true }).click();
  await expect(page).toHaveURL(/\/explorar/);
  await rail.getByRole('button', { name: 'Feed', exact: true }).click();
  await expect(page.getByText('Publicación cacheada 3', { exact: true })).toBeVisible();
  expect(firstPages).toBe(1);

  await page.locator('.social-stream').evaluate(element => {
    let root: HTMLElement | null = element as HTMLElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    if (root) root.scrollTop = 300;
  });
  await expect(page.locator('.feed-heading')).toHaveClass(/is-scroll-hidden/);
  await expect(page.getByRole('button', { name: 'nuevas publicaciones' })).toHaveCount(0);
  await page.locator('.social-stream').evaluate(element => {
    let root: HTMLElement | null = element as HTMLElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    if (root) root.scrollTop = 0;
  });
  await expect(page.getByRole('button', { name: 'nuevas publicaciones' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'nuevas publicaciones' })).toHaveCSS('background-color', 'rgb(191, 220, 247)');
  const overlap = await page.getByRole('button', { name: 'nuevas publicaciones' }).evaluate(button => {
    const control = button.getBoundingClientRect();
    const post = button.closest('.feed-post')!.getBoundingClientRect();
    return { top: control.top, bottom: control.bottom, border: post.top };
  });
  expect(overlap.top).toBeLessThan(overlap.border);
  expect(overlap.bottom).toBeGreaterThan(overlap.border);
  await page.getByRole('button', { name: 'nuevas publicaciones' }).click();
  await expect(page.getByText('Nueva publicación', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'nuevas publicaciones' })).toHaveCount(0);
  expect(firstPages).toBe(2);

  async function openProfile() {
    await rail.getByRole('button', { name: 'Abrir menú de usuario' }).click();
    await page.getByRole('menuitem', { name: 'Perfil', exact: true }).click();
    await expect(page.getByRole('main', { name: 'Perfil de ana' })).toBeVisible();
    await expect(page.getByText('Tu primer recuerdo merece un lugar', { exact: true })).toBeVisible();
  }
  await openProfile();
  await rail.getByRole('button', { name: 'Feed', exact: true }).click();
  await expect(page.getByText('Nueva publicación', { exact: true })).toBeVisible();
  await openProfile();
  expect(profileReads).toBe(1);
  expect(publicationReads).toBe(1);
  expect(firstPages).toBe(2);
});

