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

test('el formulario pide GPS con permiso explícito', async ({page, context}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude: -34.6, longitude: -58.4});
  await page.goto('/explorar?era=1990');
  await page.getByRole('button', {name: 'Recordar', exact: true}).click();
  await page.locator('#explore .memory-map').click({position: {x: 350, y: 240}});
  const dialog = page.getByRole('dialog', {name: '¿Qué pasó en este lugar?'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name: 'Usar mi ubicación actual para Cronista Local'}).click();
  await expect(dialog.getByRole('status')).toContainText('Ubicación actual lista');
});
