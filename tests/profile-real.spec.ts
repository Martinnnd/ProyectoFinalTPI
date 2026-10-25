import { expect, test, type Page } from '@playwright/test';

const api = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5199';

async function login(page: Page, email: string) {
  await page.getByRole('button', {name: 'Iniciar sesión', exact: true}).first().click();
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill('PruebaLogros123!');
  const loginRequest = page.waitForRequest(request => request.url().endsWith('/api/auth/login') && request.method() === 'POST');
  await page.getByRole('button', {name: 'Ingresar', exact: true}).click();
  expect((await loginRequest).url()).toBe(`${api}/api/auth/login`);
  await expect(page.getByRole('button', {name: /^Cuenta:/})).toBeVisible();
}

test('logro real persiste al recargar y no se comparte entre cuentas', async ({page, request}) => {
  const suffix = Date.now();
  const users = [1, 2].map(number => ({username: `logros_${suffix}_${number}`, email: `logros_${suffix}_${number}@example.test`, contrasena: 'PruebaLogros123!'}));
  for (const user of users) {
    const response = await request.post(`${api}/api/auth/registro`, {
      data: {username: user.username, email: user.email, contraseña: user.contrasena},
      headers: {'X-Nostalgiar-Request': '1'},
    });
    expect(response.status()).toBe(201);
  }
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(api) && response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  const mapResponse = page.waitForResponse(response => response.url().includes('/api/publicaciones/mapa') && response.request().method() === 'GET');
  await page.goto('/explorar?era=1990');
  expect((await mapResponse).status()).toBe(200);
  await login(page, users[0].email);
  await page.getByRole('button', {name: 'Perfil', exact: true}).click();
  const profile = page.getByRole('main', {name: 'Mi perfil', exact: true});
  await expect(profile.getByRole('heading', {name: users[0].username, exact: true})).toBeVisible();
  await expect(profile.locator('.achievements-count')).toHaveText('0/20');
  await expect(profile.getByText('Nico Gutierrez')).toHaveCount(0);
  await page.getByRole('button', {name: 'Feed', exact: true}).click();
  const feed = page.getByRole('region', {name: 'Feed de recuerdos'});
  await feed.getByRole('button', {name: /^\d+ Comentar$/}).first().click();
  const content = `Comentario con logro ${suffix}`;
  await page.getByLabel('Comentar el recuerdo', {exact: true}).fill(content);
  const response = page.waitForResponse(response => /\/api\/publicaciones\/\d+\/comentarios$/.test(response.url()) && response.request().method() === 'POST');
  await page.getByRole('region', {name: 'Comentarios', exact: true}).getByRole('button', {name: 'Comentar', exact: true}).click();
  expect((await response).status()).toBe(201);
  await expect(page.getByText(content, {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Perfil', exact: true}).click();
  await expect(profile.locator('.achievements-count')).toHaveText('1/20');
  await expect(profile.getByRole('img', {name: 'Primera Palabra', exact: true})).toBeVisible();
  await profile.getByRole('button', {name: 'Logros', exact: true}).click();
  const catalogue = page.getByRole('dialog', {name: 'Todas las insignias', exact: true});
  await expect(catalogue.locator('.achievement-card')).toHaveCount(20);
  const earned = catalogue.locator('.achievement-card.is-unlocked');
  await expect(earned).toHaveCount(1);
  await expect(earned).toContainText('Primera Palabra');
  await expect(earned.locator('time')).toBeVisible();
  await catalogue.getByRole('button', {name: 'Cerrar catálogo de logros'}).click();
  await page.reload();
  await page.getByRole('button', {name: 'Perfil', exact: true}).click();
  await expect(profile.locator('.achievements-count')).toHaveText('1/20');
  await page.getByRole('button', {name: /^Cuenta:/}).click();
  await page.getByRole('button', {name: 'Cerrar sesión', exact: true}).click();
  await expect(profile).toContainText('Iniciá sesión');
  await expect(profile.locator('.achievements-count')).toHaveCount(0);
  await login(page, users[1].email);
  await expect(profile.getByRole('heading', {name: users[1].username, exact: true})).toBeVisible();
  await expect(profile.locator('.achievements-count')).toHaveText('0/20');
  expect(errors).toEqual([]);
});
