import { API_BASE_URL } from '../src/api';
import { expect, test, type Page } from '@playwright/test';

async function mockNoMoments(page: Page) {
  await page.route(/\/api\/publicaciones\/\d+\/(momentos|analisis)(?:\?|$)/, route => {
    const analysis = new URL(route.request().url()).pathname.endsWith('/analisis');
    return route.fulfill({ headers: { 'access-control-allow-origin': route.request().headers().origin ?? 'http://localhost:3001', 'access-control-allow-credentials': 'true' }, json: analysis
      ? { publicacionId: 25, versionContenido: 1, estado: 'sinMomento' }
      : { publicacionId: 25, versionRelaciones: 1, permitirMomentosAutomaticos: true, puedeCorregir: false, momentos: [] } });
  });
}

test('crear un recuerdo exige fecha completa y envía el día elegido en UTC', async ({ page }) => {
  let body = '';
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { 'access-control-allow-origin': request.headers().origin ?? 'http://localhost:3001', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization, content-type, x-nostalgiar-request', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path === '/api/auth/refresh') return route.fulfill({ headers, json: { token: 'test', usuarioId: 1, username: 'Ana', email: 'ana@example.com', esAdmin: false } });
    if (path === '/api/publicaciones' && request.method() === 'POST') {
      body = request.postDataBuffer()?.toString('utf8') ?? '';
      return route.fulfill({ status: 201, headers, json: { id: 999 } });
    }
    if (path.endsWith('/mapa')) return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    if (path.startsWith('/api/feed/')) return route.fulfill({ headers, json: { items: [], siguienteCursor: null, hayMas: false } });
    return route.fulfill({ headers, json: [] });
  });
  await mockNoMoments(page);
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', { name: 'Recordar', exact: true }).click();
  await page.locator('#explore .memory-map').click({ position: { x: 500, y: 350 } });
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título del recuerdo').fill('Un día preciso');
  await dialog.getByLabel('Nombre del lugar').fill('La plaza');
  await dialog.getByLabel('Tu historia').fill('Nos encontramos ese día.');
  await dialog.getByLabel('O pegá un enlace HTTPS al archivo').fill('https://example.com/foto.jpg');
  await dialog.getByRole('button', { name: 'Guardar recuerdo', exact: true }).click();
  expect(body).toBe('');
  await expect(dialog.getByLabel('Fecha del recuerdo', { exact: true })).toHaveValue('');
  await dialog.getByLabel('Fecha del recuerdo', { exact: true }).fill('1991-04-15');
  await dialog.getByRole('button', { name: 'Guardar recuerdo', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(body).toContain('name="Fecha"\r\n\r\n1991-04-15T00:00:00.000Z');
});

test('el carrusel del día continúa su cursor y abre la preview de otro pin', async ({ page }, testInfo) => {
  const requests: string[] = [];
  const empty = { items: [], siguienteCursor: null, hayMas: false };
  await page.route('https://fixtures.nostalgiar.test/recuerdo.jpg', route => route.fulfill({ path: 'public/facts/bttf.jpg', contentType: 'image/jpeg' }));
  const publication = (id: number) => ({ id, titulo: `Recuerdo ${id}`, descripcionBreve: `Resumen ${id}`, descripcion: `Descripción ${id}`, fecha: '1992-01-01T00:00:00Z', categoria: 0, urlMultimedia: 'https://fixtures.nostalgiar.test/recuerdo.jpg', tipoMultimedia: 0, autor: { id: 1, username: 'Ana' }, lugar: { nombre: 'San Justo', latitud: -34.67 + (id - 25) * .0001, longitud: -58.56 } });
  const related = (id: number) => ({ ...publication(id), autorId: 1, autorUsername: 'Ana', nombreLugar: 'San Justo', distanciaMetros: 15, mismoDia: true, mismoLugar: true });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    const headers = { 'access-control-allow-origin': route.request().headers().origin ?? 'http://localhost:3001', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type, authorization, x-nostalgiar-request', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.includes('/auth/')) return route.fulfill({ status: 401, headers });
    if (url.pathname.endsWith('/mapa')) return route.fulfill({ headers, json: { pines: [{ id: 25, latitud: -34.67, longitud: -58.56, categoria: 0 }], hayMas: false } });
    if (url.pathname.endsWith('/relaciones')) {
      const id = Number(url.pathname.split('/')[3]);
      return route.fulfill({ headers, json: { publicacionId: id, radioMetros: 200, dia: id === 25 ? { items: [related(26)], siguienteCursor: 'next+/= &?', hayMas: true } : empty, lugar: empty } });
    }
    if (url.pathname.endsWith('/relacionadas')) {
      expect(url.searchParams.get('cursor')).toBe('next+/= &?');
      expect(url.searchParams.get('tipo')).toBe('dia');
      return route.fulfill({ headers, json: { ...empty, items: [related(26), related(27)] } });
    }
    const match = url.pathname.match(/\/publicaciones\/(\d+)(?:\/resumen)?$/);
    return route.fulfill({ headers, json: match ? publication(Number(match[1])) : [] });
  });
  await mockNoMoments(page);
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', { name: 'Recuerdo, 1990, Lugares', exact: true }).click();
  const preview = page.locator('#explore .pin-message-preview');
  await expect(preview.getByRole('heading', { name: 'También ese día' })).toBeVisible();
  await preview.getByRole('button', { name: 'Ver más', exact: true }).click();
  await expect(preview.getByRole('button', { name: 'Ver en el mapa: Recuerdo 26', exact: true })).toHaveCount(1);
  await expect.poll(() => preview.getByRole('button', { name: 'Ver en el mapa: Recuerdo 26', exact: true }).locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await preview.screenshot({ path: testInfo.outputPath('carrusel-dia.png') });
  await preview.getByRole('button', { name: 'Ver en el mapa: Recuerdo 27', exact: true }).click();
  await expect(preview.locator('strong').filter({ hasText: /^Recuerdo 27$/ })).toBeVisible();
  await expect(preview.getByRole('region', { name: 'También ese día', exact: true })).toHaveCount(0);
  expect(requests).toContain('/api/publicaciones/27');
  expect(requests).toContain('/api/publicaciones/27/relaciones');
  await expect(page.locator('.app.view-map')).toBeVisible();
});

test('el carrusel flotante de lugar conserva cursores y salta a otra década', async ({ page }, testInfo) => {
  const empty = { items: [], siguienteCursor: null, hayMas: false };
  const continuations: string[] = [];
  const mapYears: string[] = [];
  await page.route('https://fixtures.nostalgiar.test/recuerdo.jpg', route => route.fulfill({ path: 'public/facts/bttf.jpg', contentType: 'image/jpeg' }));
  const publication = (id: number) => ({ id, titulo: `Recuerdo ${id}`, descripcionBreve: `Resumen ${id}`, fecha: id === 27 ? '1985-06-20T00:00:00Z' : '1992-01-01T00:00:00Z', categoria: 0, urlMultimedia: 'https://fixtures.nostalgiar.test/recuerdo.jpg', tipoMultimedia: 0, autor: { id: 1, username: 'Ana' }, lugar: { nombre: 'San Justo', latitud: -34.67 + (id - 25) * .0001, longitud: -58.56 } });
  const related = (id: number) => ({ ...publication(id), autorId: 1, autorUsername: 'Ana', nombreLugar: 'San Justo', distanciaMetros: 15, mismoDia: id !== 27, mismoLugar: true });
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = { 'access-control-allow-origin': request.headers().origin ?? 'http://localhost:3001', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type, authorization, x-nostalgiar-request', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.includes('/auth/')) return route.fulfill({ status: 401, headers });
    if (url.pathname.endsWith('/mapa')) {
      mapYears.push(url.searchParams.get('fechaDesde') ?? '');
      return route.fulfill({ headers, json: { pines: [{ id: 25, latitud: -34.67, longitud: -58.56, categoria: 0 }], hayMas: false } });
    }
    if (url.pathname.endsWith('/relaciones')) {
      const id = Number(url.pathname.split('/')[3]);
      return route.fulfill({ headers, json: { publicacionId: id, radioMetros: 200,
        dia: id === 25 ? { items: [related(26)], siguienteCursor: 'dia+/=', hayMas: true } : empty,
        lugar: id === 25 ? { items: [related(26), related(27)], siguienteCursor: 'lugar+/= &?', hayMas: true } : empty } });
    }
    if (url.pathname.endsWith('/relacionadas')) {
      const tipo = url.searchParams.get('tipo')!;
      continuations.push(tipo);
      expect(url.searchParams.get('cursor')).toBe(tipo === 'dia' ? 'dia+/=' : 'lugar+/= &?');
      return route.fulfill({ headers, json: { ...empty, items: [related(tipo === 'dia' ? 29 : 28)] } });
    }
    const match = url.pathname.match(/\/publicaciones\/(\d+)(?:\/resumen)?$/);
    return route.fulfill({ headers, json: match ? publication(Number(match[1])) : [] });
  });
  await mockNoMoments(page);
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', { name: 'Recuerdo, 1990, Lugares', exact: true }).click();
  const preview = page.locator('#explore .pin-message-preview');
  const floating = preview.getByRole('region', { name: 'A través de los años', exact: true });
  const day = preview.getByRole('region', { name: 'También ese día', exact: true });
  await expect(floating).toBeVisible();
  await expect(floating.locator('time')).toHaveText(['1985', '1992']);
  await expect(floating.getByRole('heading')).toHaveCount(0);
  await expect(floating.locator('time').filter({ hasText: /^1985$/ })).toHaveCount(1);
  await expect(day).toBeVisible();
  // A shared result remains available in both relation blocks.
  await expect(preview.getByRole('button', { name: 'Ver en el mapa: Recuerdo 26', exact: true })).toHaveCount(2);
  const panelBounds = (await floating.boundingBox())!;
  const photoBounds = (await preview.locator('.pin-preview-photo').boundingBox())!;
  expect(panelBounds.y + panelBounds.height + 12).toBeLessThan(photoBounds.y);
  await day.getByRole('button', { name: 'Ver más', exact: true }).click();
  await floating.getByRole('button', { name: 'Más recuerdos de este lugar', exact: true }).click();
  await expect(floating.getByRole('button', { name: 'Ver en el mapa: Recuerdo 28', exact: true })).toBeAttached();
  await expect(floating.locator('time')).toHaveText(['1985', '1992', '1992']);
  const track = floating.getByRole('group', { name: 'Recuerdos de este lugar' });
  await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  const trackBounds = (await track.boundingBox())!;
  await page.mouse.move(trackBounds.x + 30, trackBounds.y + 25);
  await page.mouse.down();
  await page.mouse.move(trackBounds.x + 120, trackBounds.y + 25, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeLessThan(5);
  await expect(preview.locator('strong').filter({ hasText: /^Recuerdo 25$/ })).toBeVisible();
  await preview.screenshot({ path: testInfo.outputPath('carrusel-lugar-flotante.png') });
  await floating.getByRole('button', { name: 'Ver en el mapa: Recuerdo 27', exact: true }).click();
  await expect(page.locator('.app')).toHaveClass(/era-1980/);
  await expect(preview.locator('strong').filter({ hasText: /^Recuerdo 27$/ })).toBeVisible();
  await expect(floating).toHaveCount(0);
  await expect(day).toHaveCount(0);
  await expect.poll(() => mapYears).toContain('1980-01-01T00:00:00Z');
  expect(continuations).toEqual(['dia', 'lugar']);
  await expect(page.locator('.app.view-map')).toBeVisible();
});

test('pines, resumen, detalle y comentarios del backend', async ({ page }) => {
  const requests: string[] = [];
  let rejectComment = true;
  const publication = { id: 25, titulo: 'Recuerdo del servidor', descripcionBreve: 'Resumen del recuerdo', descripcion: 'Descripción completa del recuerdo', fecha: '1992-01-01T00:00:00Z', categoria: 0, urlMultimedia: '', tipoMultimedia: 0, autor: { id: 1, username: 'usuarioTest' }, lugar: { nombre: 'Buenos Aires', latitud: -34.6, longitud: -58.4 } };
  const comment = { id: 8, contenido: 'Comentario reciente', fechaCreacion: '2026-10-13T15:00:00Z', autor: publication.autor };
  await page.route(`${API_BASE_URL}/api/publicaciones/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(url.pathname);
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.endsWith('/relaciones')) return route.fulfill({ headers, json: { publicacionId: 25, radioMetros: 200, dia: { items: [], siguienteCursor: null, hayMas: false }, lugar: { items: [], siguienteCursor: null, hayMas: false } } });
    if (url.pathname.endsWith('/mapa')) return route.fulfill({ headers, json: { pines: [{ id: 25, latitud: -34.6, longitud: -58.4, categoria: 0 }], hayMas: false } });
    if (url.pathname.endsWith('/comentarios')) {
      if (request.method() === 'POST') {
        expect(request.postDataJSON()).toEqual({ contenido: 'Mi comentario', usuarioId: 1 });
        if (rejectComment) {
          rejectComment = false;
          return route.fulfill({ status: 400, headers, json: { errors: { Contenido: ['Error de validación de prueba.'] } } });
        }
        return route.fulfill({ status: 201, headers, json: { ...comment, id: 10, contenido: 'Mi comentario' } });
      }
      const older = url.searchParams.has('cursor');
      return route.fulfill({ headers, json: { items: [{ ...comment, id: older ? 9 : 8, contenido: older ? 'Comentario anterior' : comment.contenido }], siguienteCursor: older ? null : 'next+/=' } });
    }
    return route.fulfill({ headers, json: url.pathname.endsWith('/resumen') ? { ...publication, descripcion: undefined, lugar: undefined } : publication });
  });
  await page.route(`${API_BASE_URL}/api/publicaciones`, route => route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: [] }));
  await mockNoMoments(page);
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', { name: 'Recuerdo, 1990, Lugares', exact: true }).click();
  await expect(page.locator('.stories-drawer')).toHaveCount(0);
  await expect.poll(() => requests).toContain('/api/publicaciones/25/resumen');
  const summary = page.locator('#explore .pin-message-preview');
  await expect(summary.getByText('Resumen del recuerdo', { exact: true })).toBeVisible();
  await summary.getByRole('button', { name: 'Ver publicación →', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Feed de recuerdos' }).getByText('Descripción completa del recuerdo', { exact: true })).toBeVisible();
  await expect(page.getByText('Comentario reciente', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver más comentarios', exact: true }).click();
  await expect(page.getByText('Comentario anterior', { exact: true })).toBeVisible();
  const comments = page.getByRole('region', { name: 'Comentarios', exact: true });
  const field = comments.getByLabel('Comentar el recuerdo', { exact: true });
  await field.fill('  Mi comentario  ');
  await comments.getByRole('button', { name: 'Comentar', exact: true }).click();
  await expect(comments.getByRole('alert')).toContainText('Error de validación de prueba.');
  await expect(field).toHaveValue('  Mi comentario  ');
  await comments.getByRole('button', { name: 'Comentar', exact: true }).click();
  await expect(field).toHaveValue('');
  await expect(page.getByText('Mi comentario', { exact: true })).toBeVisible();
  for (const path of ['/mapa', '/25/resumen', '/25', '/25/comentarios']) expect(requests).toContain(`/api/publicaciones${path}`);
});
