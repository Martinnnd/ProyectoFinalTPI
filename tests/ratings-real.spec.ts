import { expect, test } from '@playwright/test';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5199';

test('los botones guardan, recuperan y quitan una puntuación real', async ({page}) => {
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', {name: 'Iniciar sesión', exact: true}).click();
  await page.locator('input[type=email]').fill('miguel@example.com');
  await page.locator('input[type=password]').fill('password123');
  await page.getByRole('button', {name: 'Ingresar', exact: true}).click();
  await expect(page.getByRole('button', {name: /^Cuenta:/})).toBeVisible();
  await page.getByRole('button', {name: 'Feed', exact: true}).click();
  const group = page.getByRole('group', {name: /^Puntuar publicación:/}).first();
  const button = group.getByRole('button', {name: /^Dar 4 puntos/});
  await expect(button).toBeEnabled();
  const saved = page.waitForResponse(response => response.url().endsWith('/puntuacion') && response.request().method() === 'PUT');
  await button.click();
  const response = await saved;
  expect(response.status()).toBe(200);
  expect((await response.json()).miPuntuacion).toBe(4);
  await expect(group.getByRole('button', {name: /^Quitar 4 puntos/})).toHaveAttribute('aria-pressed', 'true');
  const publication = response.url().replace('/puntuacion', '');
  await page.reload();
  const persisted = await page.evaluate(async url => {
    const session = JSON.parse(localStorage.getItem('nostalgia_auth')!);
    const response = await fetch(url, {headers: {Authorization: `Bearer ${session.token}`}});
    return {status: response.status, data: await response.json()};
  }, publication);
  expect(persisted.status).toBe(200);
  expect(persisted.data.miPuntuacion).toBe(4);
  // El mismo PUT vuelve a desmarcar: se comprueba en el backend real.
  const removed = await page.evaluate(async url => {
    const session = JSON.parse(localStorage.getItem('nostalgia_auth')!);
    const response = await fetch(url, {method: 'PUT', headers: {Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json'}, body: JSON.stringify({puntaje: 4})});
    return response.json();
  }, response.url());
  expect(removed.miPuntuacion).toBeNull();
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
    await route.fulfill({status: 400, headers: {'access-control-allow-origin': new URL(page.url()).origin}, json: {detail: 'Prueba de envío GPS'}});
  });
  await page.goto('/explorar?era=1990');
  await page.waitForFunction(() => (window as Window & {initialLocationReady?: boolean}).initialLocationReady);
  await page.getByRole('button', {name: 'Iniciar sesión', exact: true}).click();
  await page.locator('input[type=email]').fill('miguel@example.com');
  await page.locator('input[type=password]').fill('password123');
  await page.getByRole('button', {name: 'Ingresar', exact: true}).click();
  await expect(page.getByRole('button', {name: /^Cuenta:/})).toBeVisible();
  await page.getByRole('button', {name: 'Recordar', exact: true}).click();
  await page.locator('#explore .memory-map').click({position: {x: 350, y: 240}});
  const dialog = page.getByRole('dialog', {name: '¿Qué pasó en este lugar?'});
  await expect(dialog.getByRole('button', {name: /Usar mi ubicación/})).toHaveCount(0);
  await dialog.getByRole('textbox', {name: 'Título del recuerdo'}).fill('Recuerdo con ubicación inicial');
  await dialog.getByRole('textbox', {name: 'Nombre del lugar'}).fill('Buenos Aires');
  await dialog.getByRole('textbox', {name: 'Tu historia'}).fill('Una historia de prueba');
  await dialog.getByLabel('O pegá un enlace HTTPS al archivo').fill('https://example.test/foto.jpg');
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
  // Solo se simula el rechazo del POST para comprobar cómo lo presenta la interfaz.
  let attempts = 0;
  await page.route(`${api}/api/publicaciones`, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    attempts++;
    await route.fulfill({status: attempts === 1 ? 400 : 500,
      headers: {'access-control-allow-origin': new URL(page.url()).origin},
      json: attempts === 1 ? {errors: {Archivo: ['La imagen no es válida.']}}
        : {detail: 'No se pudo completar la operación.', traceId: 'trace-prueba'},
    });
  });
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', {name: 'Iniciar sesión', exact: true}).click();
  await page.locator('input[type=email]').fill('miguel@example.com');
  await page.locator('input[type=password]').fill('password123');
  await page.getByRole('button', {name: 'Ingresar', exact: true}).click();
  await expect(page.getByRole('button', {name: /^Cuenta:/})).toBeVisible();
  await page.getByRole('button', {name: 'Recordar', exact: true}).click();
  await page.locator('#explore .memory-map').click({position: {x: 350, y: 240}});
  const dialog = page.getByRole('dialog', {name: '¿Qué pasó en este lugar?'});
  await dialog.getByRole('textbox', {name: 'Título del recuerdo'}).fill('Recuerdo para comprobar errores');
  await dialog.getByRole('textbox', {name: 'Nombre del lugar'}).fill('Buenos Aires');
  await dialog.getByRole('textbox', {name: 'Tu historia'}).fill('Una historia de prueba');
  await dialog.getByLabel('O pegá un enlace HTTPS al archivo').fill('https://example.test/foto.jpg');
  await dialog.getByRole('button', {name: 'Guardar recuerdo', exact: true}).click();
  await expect(dialog.getByRole('alert')).toContainText('La imagen no es válida. (HTTP 400)');
  await expect(dialog.getByRole('textbox', {name: 'Título del recuerdo'})).toHaveValue('Recuerdo para comprobar errores');
  await dialog.getByRole('button', {name: 'Guardar recuerdo', exact: true}).click();
  await expect(dialog.getByRole('alert')).toContainText('HTTP 500');
  await expect(dialog.getByRole('alert')).toContainText('trace-prueba');
  await expect(dialog.getByRole('alert')).not.toContainText('Falló la conexión');
});
