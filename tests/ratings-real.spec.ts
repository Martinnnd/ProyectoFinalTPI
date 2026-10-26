import { expect, test } from '@playwright/test';
import { api, loginReal, prepareMemory } from './real-api-helpers';

// Las fuentes externas no forman parte de estas pruebas funcionales.
test.beforeEach(async ({page}) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType: 'text/css', body: ''}));
});

test('los botones guardan, recuperan y quitan una puntuación real', async ({page, request}) => {
  const session = await loginReal(page, 'miguel@example.com', 'password123');
  await page.getByRole('button', {name: 'Feed', exact: true}).click();
  const button = page.getByRole('button', {name: /^Dar 4 puntos/}).and(page.locator(':enabled')).first();
  await expect(button).toBeEnabled();
  const targetButton = page.getByRole('button', {name: (await button.getAttribute('aria-label'))!, exact: true}).first();
  let release = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  let held = false;
  await page.route('**/puntuacion', async route => {
    if (route.request().method() === 'PUT' && !held) { held = true; await pending; }
    await route.continue();
  });
  const saved = page.waitForResponse(response => response.url().endsWith('/puntuacion') && response.request().method() === 'PUT');
  await targetButton.click();
  try { await expect(targetButton).toBeDisabled(); } finally { release(); }
  const response = await saved;
  expect(response.status()).toBe(200);
  expect((await response.json()).miPuntuacion).toBe(4);
  const publication = response.url().replace('/puntuacion', '');
  const id = publication.split('/').pop();
  await page.goto(`/recuerdo/${id}?era=1990`);
  const group = page.getByRole('group', {name: /^Puntuar publicación:/}).first();
  await expect(group.getByRole('button', {name: /^Quitar 4 puntos/})).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(group.getByRole('button', {name: /^Quitar 4 puntos/})).toHaveAttribute('aria-pressed', 'true');
  const persisted = await request.get(publication, {headers: {Authorization: `Bearer ${session.token}`}});
  expect(persisted.status()).toBe(200);
  expect((await persisted.json()).miPuntuacion).toBe(4);
  const removed = page.waitForResponse(response => response.url().endsWith('/puntuacion') && response.request().method() === 'PUT');
  await group.getByRole('button', {name: /^Quitar 4 puntos/}).click();
  expect((await (await removed).json()).miPuntuacion).toBeNull();
  await expect(group.getByRole('button', {name: /^Dar 4 puntos/})).toHaveAttribute('aria-pressed', 'false');
});

for (const allowed of [true, false]) test(`publicar reutiliza el permiso inicial del mapa: ${allowed ? 'aceptado' : 'rechazado'}`, async ({page, context}) => {
  if (allowed) {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({latitude: -34.6, longitude: -58.4});
  }
  await page.addInitScript(allow => {
    const state = window as Window & {geoRequests?: number; initialLocationReady?: boolean};
    state.geoRequests = 0;
    const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (success, error, options) => {
      state.geoRequests!++;
      if (!allow) {
        state.initialLocationReady = true;
        error?.({code: 1, message: 'Permiso denegado'} as GeolocationPositionError);
        return;
      }
      original(position => { state.initialLocationReady = true; success(position); }, error, options);
    };
  }, allowed);
  let body = '';
  await page.route(`${api}/api/publicaciones`, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    body = route.request().postData() || '';
    await route.fulfill({status: 400, headers: {'access-control-allow-origin': new URL(page.url()).origin, 'access-control-allow-credentials': 'true'}, json: {detail: 'Prueba de envío GPS'}});
  });
  await loginReal(page, 'miguel@example.com', 'password123');
  await page.waitForFunction(() => (window as Window & {initialLocationReady?: boolean}).initialLocationReady);
  const dialog = await prepareMemory(page, 'Recuerdo con ubicación inicial');
  await expect(dialog.getByRole('button', {name: /Usar mi ubicación/})).toHaveCount(0);
  await dialog.getByRole('button', {name: 'Guardar recuerdo', exact: true}).click();
  await expect(dialog.getByRole('alert')).toContainText('Prueba de envío GPS');
  if (allowed) {
    expect(body).toContain('name="GpsLatitud"\r\n\r\n-34.6');
    expect(body).toContain('name="GpsLongitud"\r\n\r\n-58.4');
  } else {
    expect(body).not.toContain('name="GpsLatitud"');
    expect(body).not.toContain('name="GpsLongitud"');
  }
  expect(await page.evaluate(() => (window as Window & {geoRequests?: number}).geoRequests)).toBe(1);
});

test('publicar muestra el error HTTP real y conserva el formulario', async ({page}) => {
  let attempts = 0;
  await page.route(`${api}/api/publicaciones`, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    attempts++;
    await route.fulfill({status: attempts === 1 ? 400 : 500,
      headers: {'access-control-allow-origin': new URL(page.url()).origin, 'access-control-allow-credentials': 'true'},
      json: attempts === 1 ? {errors: {Archivo: ['La imagen no es válida.']}} : {title: 'Error interno del servidor', detail: 'No se pudo completar la operación.', traceId: 'trace-prueba'}});
  });
  await loginReal(page, 'miguel@example.com', 'password123');
  const dialog = await prepareMemory(page, 'Recuerdo para comprobar errores');
  await dialog.getByRole('button', {name: 'Guardar recuerdo', exact: true}).click();
  await expect(dialog.getByRole('alert')).toContainText('La imagen no es válida. (HTTP 400)');
  await dialog.getByRole('button', {name: 'Atrás', exact: true}).click();
  await dialog.getByRole('button', {name: 'Atrás', exact: true}).click();
  await expect(dialog.getByRole('textbox', {name: 'Título del recuerdo'})).toHaveValue('Recuerdo para comprobar errores');
  await dialog.getByRole('button', {name: 'Continuar', exact: true}).click();
  await dialog.getByRole('button', {name: 'Continuar', exact: true}).click();
  await dialog.getByRole('button', {name: 'Guardar recuerdo', exact: true}).click();
  await expect(dialog.getByRole('alert')).toContainText('HTTP 500');
  await expect(dialog.getByRole('alert')).toContainText('trace-prueba');
  await expect(dialog.getByRole('alert')).not.toContainText('Falló la conexión');
});
