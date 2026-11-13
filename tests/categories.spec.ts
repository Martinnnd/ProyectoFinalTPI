import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { AccountCategoryCode, AccountCategoryState } from '../src/accountCategories';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const video = readFileSync(new URL('./fixtures/category-clip.mp4', import.meta.url));
const common = ['DarLike', 'GuardarPublicacion', 'SeguirPerfil', 'SerEtiquetado'];

function account(code: AccountCategoryCode, used = 0): AccountCategoryState {
  const unlimited = code === 'Mnemosine' || code === 'Marca';
  const limit = unlimited ? null : code === 'Aedo' ? 7 : 5;
  return {
    categoria: {
      codigo: code, nombre: code === 'Nostalgico' ? 'Nostálgico' : code,
      publicacionesSemanales: limit, publicacionesIlimitadas: unlimited,
      permitePrimerRecuerdo: code === 'Errante',
      prioridadVisibilidad: unlimited ? 'MuyAlta' : code === 'Aedo' ? 'Alta' : 'Normal',
      permisos: [...common, ...(code === 'Errante' ? [] : ['CrearRecuerdo', 'Comentar', 'PuntuarPublicacion', 'Compartir', 'EtiquetarUsuario']),
        ...(['Aedo', 'Mnemosine', 'Marca'].includes(code) ? ['AgregarMusicaAPublicacion'] : []),
        ...(unlimited ? ['AdjuntarVariasFotos', 'SugerirMusica'] : [])],
    },
    publicacionesConsumidas: used, publicacionesRestantes: limit === null ? null : Math.max(0, limit - used),
    semanaInicio: '2026-11-08', reinicioSemana: '2026-11-15', maximoAdjuntos: unlimited ? 4 : 1,
  };
}

async function prepare(page: Page, initial: AccountCategoryCode = 'Errante', initialPath = '/perfil?era=1990') {
  let state = account(initial);
  let rejectNext = false;
  let lastBody = '';
  const requests: string[] = [];
  let createdAttachments: { url: string; tipo: string; orden: number }[] = [];
  const publication = () => ({
    id: 25, titulo: 'Recuerdo de la plaza', descripcion: 'Una historia de nuestra comunidad',
    fecha: '1995-04-15T00:00:00Z', fechaCreacion: '2026-11-13T12:00:00Z',
    categoria: 0, urlMultimedia: '', tipoMultimedia: 0,
    autor: { id: 2, username: 'otro_usuario' },
    lugar: { id: 1, nombre: 'Buenos Aires', latitud: -34.6, longitud: -58.4 },
    cantidadLikes: 0, cantidadComentarios: 0, puntosTotales: 0, cantidadReposts: 0,
    adjuntos: createdAttachments,
  });
  await page.route('**/hubs/**', route => route.fulfill({ status: 404, json: {} }));
  await page.route('https://media.example/**', route => route.fulfill(route.request().url().endsWith('.mp4')
    ? { contentType: 'video/mp4', body: video } : { contentType: 'image/png', body: png }));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      'access-control-allow-origin': request.headers().origin || 'http://localhost:3127',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization,content-type,x-nostalgiar-request',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    };
    const reply = (json: unknown, status = 200) => route.fulfill({ status, headers, json });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    requests.push(request.method() + ' ' + path);
    if (path === '/api/auth/refresh') return reply({ token: 'test-token', usuarioId: 1, username: 'ana', email: 'ana@example.test', esAdmin: false });
    if (path === '/api/categorias-cuenta/me') return reply(state);
    if (path === '/api/usuario/1/perfil' || path === '/api/usuario/perfil/ana')
      return reply({ id: 1, username: 'ana', fotoPerfilUrl: null, nombre: 'Ana', apellido: '',
        reputacion: state.categoria.nombre, puntosNostalgia: 0, cantidadPublicaciones: state.publicacionesConsumidas,
        cantidadSeguidores: 0, cantidadSeguidos: 0, loSigo: false, logros: [] });
    if (path === '/api/publicaciones' && request.method() === 'POST') {
      lastBody = request.postData() || '';
      if (rejectNext) {
        state = account('Nostalgico', 5);
        return reply({ title: 'Cupo semanal agotado', detail: 'Alcanzaste el límite semanal. Se renueva el domingo.', status: 429 }, 429);
      }
      createdAttachments = [...lastBody.matchAll(/name="Adjuntos\[(\d+)\]\.Tipo"\r\n\r\n([^\r]+)/g)]
        .map(match => ({ orden: Number(match[1]), tipo: match[2], url: 'https://media.example/adjunto-' + match[1] + (match[2] === 'Video' ? '.mp4' : '.png') }));
      state = account(state.categoria.codigo === 'Errante' ? 'Nostalgico' : state.categoria.codigo, state.publicacionesConsumidas + 1);
      return reply({ id: 25 }, 201);
    }
    if (path === '/api/feed/para-vos' || path === '/api/feed/seguidos')
      return reply({ items: [publication()], hayMas: false, siguienteCursor: null });
    if (/\/publicaciones\/25\/comentarios$/.test(path))
      return reply({ items: [], hayMas: false, siguienteCursor: null });
    if (path === '/api/publicaciones/25' || path === '/api/publicaciones/25/resumen')
      return reply(publication());
    if (path.endsWith('/mapa')) return reply({ pines: [], hayMas: false });
    if (path.endsWith('/impresiones')) return route.fulfill({ status: 204, headers });
    return reply([]);
  });
  await page.goto(initialPath);
  if (initialPath.startsWith('/perfil'))
    await expect(page.locator('.account-status[data-category="' + initial + '"]')).toBeVisible();
  else
    await expect(page.getByText('Recuerdo de la plaza', { exact: true }).first()).toBeVisible();
  return {
    requests, body: () => lastBody,
    rejectNext: () => { rejectNext = true; },
    setCategory: (code: AccountCategoryCode, used = 0) => { state = account(code, used); },
  };
}

async function openForm(page: Page) {
  const create = page.getByRole('button', { name: 'Recordar', exact: true });
  if (await create.isVisible()) await create.click();
  else await page.getByRole('button', { name: 'Sumar mi recuerdo', exact: true }).click();
  const map = page.locator('#explore .memory-map');
  await expect(map).toBeVisible();
  await map.press('Enter');
  const dialog = page.getByRole('dialog', { name: '¿Qué pasó en este lugar?' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillStory(page: Page) {
  const dialog = page.getByRole('dialog', { name: '¿Qué pasó en este lugar?' });
  await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Título del recuerdo' }).fill('Una historia para compartir');
  await dialog.getByRole('textbox', { name: 'Tu historia' }).fill('Estos datos tienen que conservarse si falla el servidor.');
  await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Nombre del lugar' }).fill('Rosario');
  await dialog.getByLabel('Fecha del recuerdo', { exact: true }).fill('1995-04-15');
  await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
  return dialog;
}

test('Errante tiene acciones limitadas y el cartel cambia en vivo con las seis épocas', async ({ page }) => {
  const api = await prepare(page, 'Errante', '/feed?era=1990');
  const rating = page.getByRole('group', { name: 'Puntuar publicación: Recuerdo de la plaza' });
  await expect(rating.getByRole('button').first()).toBeDisabled();
  await page.getByRole('button', { name: 'Opciones de repost: Recuerdo de la plaza', exact: true }).click();
  const notice = page.locator('.account-notice');
  await expect(notice).toContainText('Publicá tu primer recuerdo');
  const styles = new Set<string>();
  for (const era of [1970, 1980, 1990, 2000, 2010, 2020]) {
    await page.getByRole('button', { name: 'Década de ' + era, exact: true }).click();
    await expect(notice).toHaveAttribute('data-era', String(era));
    await page.waitForFunction(() => !document.documentElement.classList.contains('switching-era'));
    const style = await notice.evaluate(element => {
      const css = getComputedStyle(element);
      return { font: css.fontFamily, color: css.backgroundColor, width: element.getBoundingClientRect().width };
    });
    expect(style.width).toBeGreaterThan(250);
    styles.add(style.font + style.color);
    await notice.screenshot({ path: 'test-results/categoria-aviso-' + era + '.png' });
  }
  expect(styles.size).toBe(6);
  expect(api.requests).not.toContain('POST /api/publicaciones/25/repost');
});

test('el primer recuerdo sin foto actualiza categoría y cupo y muestra el ascenso', async ({ page }) => {
  const api = await prepare(page);
  await openForm(page);
  const dialog = await fillStory(page);
  await expect(dialog.getByText('La música se habilita desde Aedo', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Guardar recuerdo', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.account-notice')).toContainText('¡Ahora sos Nostálgico!');
  expect(api.body()).not.toContain('name="Archivo"');
  expect(api.body()).not.toContain('name="Adjuntos[0].Archivo"');
  await page.goto('/perfil?era=1990');
  await expect(page.locator('.account-status[data-category="Nostalgico"]')).toContainText('Te quedan 4 recuerdos');
  await expect(page.locator('.account-notice')).not.toBeVisible();
});

test('Mnemosine publica cuatro adjuntos mixtos y música, y la galería permite recorrerlos', async ({ page }) => {
  const api = await prepare(page, 'Mnemosine');
  const dialog = await openForm(page);
  await dialog.locator('input[type=file]').setInputFiles([
    { name: 'foto1.png', mimeType: 'image/png', buffer: png },
    { name: 'video1.mp4', mimeType: 'video/mp4', buffer: video },
    { name: 'foto2.png', mimeType: 'image/png', buffer: png },
    { name: 'video2.mp4', mimeType: 'video/mp4', buffer: video },
  ]);
  await expect(dialog.locator('.memory-attachment-card')).toHaveCount(4);
  await expect(dialog.getByRole('button', { name: 'Archivo', exact: true })).toBeDisabled();
  await fillStory(page);
  await dialog.getByRole('combobox', { name: 'Elegir canción', exact: true }).selectOption('custom');
  await dialog.getByLabel('Enlace de Spotify', { exact: true }).fill('https://open.spotify.com/track/1234567890123456789012');
  await dialog.getByLabel('Tema', { exact: true }).fill('Mi canción');
  await dialog.getByLabel('Artista', { exact: true }).fill('Mi artista');
  await dialog.getByRole('button', { name: 'Guardar recuerdo', exact: true }).click();
  await expect.poll(api.body).toContain('name="Adjuntos[3].Archivo"');
  expect(api.body()).toContain('name="Musica.SpotifyId"');
  await page.goto('/recuerdo/25?era=1990');
  const gallery = page.getByRole('region', { name: 'Adjuntos de Recuerdo de la plaza' });
  await expect(gallery).toContainText('Adjunto 1 de 4');
  await gallery.getByRole('button', { name: 'Siguiente adjunto' }).click();
  await expect(gallery).toContainText('Adjunto 2 de 4');
  await expect(gallery.locator('video')).toBeVisible();
});

test('un rechazo por cupo conserva el texto y el archivo del borrador', async ({ page }) => {
  const api = await prepare(page, 'Nostalgico');
  const dialog = await openForm(page);
  await dialog.locator('input[type=file]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: png });
  await expect(dialog.locator('.memory-attachment-card')).toHaveCount(1);
  await fillStory(page);
  api.rejectNext();
  await dialog.getByRole('button', { name: 'Guardar recuerdo', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Alcanzaste el límite semanal');
  await expect(dialog.getByRole('button', { name: 'Guardar recuerdo', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Atrás', exact: true }).click();
  await dialog.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Título del recuerdo' })).toHaveValue('Una historia para compartir');
  await expect(dialog.getByRole('textbox', { name: 'Tu historia' })).toHaveValue('Estos datos tienen que conservarse si falla el servidor.');
  await dialog.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(dialog.locator('.memory-attachment-card')).toHaveCount(1);
});

test('Aedo se consulta sin un ascenso falso y un cambio posterior se refleja al volver a la pestaña', async ({ page }) => {
  const api = await prepare(page, 'Nostalgico');
  await expect(page.locator('.account-notice')).not.toBeVisible();
  api.setCategory('Aedo', 1);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.account-notice')).toContainText('¡Ahora sos Aedo!');
  await expect(page.locator('.account-status[data-category="Aedo"]')).toContainText('Te quedan 6 recuerdos');
  await page.reload();
  await expect(page.locator('.account-status[data-category="Aedo"]')).toBeVisible();
  await expect(page.locator('.account-notice')).not.toBeVisible();
});

test('entrar por un enlace directo tampoco abre el formulario si se agotó el cupo', async ({ page }) => {
  const api = await prepare(page, 'Nostalgico');
  api.setCategory('Nostalgico', 5);
  await page.goto('/explorar?action=recordar&era=1990');
  await expect(page.getByRole('status').filter({ hasText: 'Elegí un lugar en el mapa' })).toBeVisible();
  await expect.poll(() => api.requests.filter(request => request === 'GET /api/categorias-cuenta/me').length).toBeGreaterThan(1);
  const map = page.locator('#explore .memory-map');
  await map.press('Enter');
  await expect(page.locator('.account-notice')).toContainText('Cupo semanal alcanzado');
  await expect(page.getByRole('dialog', { name: '¿Qué pasó en este lugar?' })).not.toBeVisible();
});

test('importar desde Google Photos conserva el borrador al refrescar los permisos', async ({ page }) => {
  const api = await prepare(page, 'Nostalgico');
  let ready = false;
  await page.context().route('https://accounts.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Selector de prueba</p>' }));
  await page.route('**/api/integraciones/google-photos/sesiones**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      'access-control-allow-origin': request.headers().origin || 'http://localhost:3127',
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization,content-type,x-nostalgiar-request',
      'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    };
    if (request.method() === 'OPTIONS' || request.method() === 'DELETE') return route.fulfill({ status: 204, headers });
    if (path.endsWith('/imagen')) return route.fulfill({ headers, contentType: 'image/png', body: png });
    if (request.method() === 'POST') return route.fulfill({ headers, json: {
      operationId: 'category-photo', authorizationUrl: 'https://accounts.google.com/mock', expiresAt: new Date(Date.now() + 120000).toISOString(),
    } });
    return route.fulfill({ headers, json: { status: ready ? 'ready' : 'selecting', pollAfterSeconds: 1, expiresAt: new Date(Date.now() + 120000).toISOString() } });
  });
  const dialog = await openForm(page);
  await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Título del recuerdo' }).fill('Mi borrador con Google Photos');
  await dialog.getByRole('textbox', { name: 'Tu historia' }).fill('La historia sigue acá después de importar.');
  await dialog.getByRole('button', { name: 'Atrás', exact: true }).click();
  await dialog.getByRole('button', { name: 'Google Photos', exact: true }).click();
  await dialog.getByRole('button', { name: 'Elegir desde Google Photos', exact: true }).click();
  await expect(dialog.getByText('Elegí una foto y confirmá la selección en Google Photos.')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  ready = true;
  await expect(dialog.locator('.memory-attachment-card')).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Título del recuerdo' })).toHaveValue('Mi borrador con Google Photos');
  await expect(dialog.getByRole('textbox', { name: 'Tu historia' })).toHaveValue('La historia sigue acá después de importar.');
  await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Nombre del lugar' }).fill('Rosario');
  await dialog.getByLabel('Fecha del recuerdo', { exact: true }).fill('1995-04-15');
  await dialog.getByRole('button', { name: 'Continuar', exact: true }).click();
  await dialog.getByRole('button', { name: 'Guardar recuerdo', exact: true }).click();
  await expect.poll(api.body).toContain('name="Adjuntos[0].Archivo"');
});

test('la información de categoría y el formulario se mantienen dentro del ancho móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, 'Mnemosine', '/perfil?era=2000');
  const dialog = await openForm(page);
  await dialog.locator('input[type=file]').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: png },
    { name: 'b.png', mimeType: 'image/png', buffer: png },
    { name: 'c.png', mimeType: 'image/png', buffer: png },
    { name: 'd.png', mimeType: 'image/png', buffer: png },
  ]);
  await expect(dialog.locator('.memory-attachment-card')).toHaveCount(4);
  const size = await dialog.evaluate(element => ({ width: element.clientWidth, content: element.scrollWidth }));
  expect(size.content).toBeLessThanOrEqual(size.width);
  await dialog.screenshot({ path: 'test-results/categorias-formulario-mobile.png' });
});
