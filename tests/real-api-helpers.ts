import { expect, type Page } from '@playwright/test';

export const api = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5199').replace(/\/+$/, '');

export async function loginReal(page: Page, email: string, password = 'PruebaLogros123!') {
  await page.goto('/auth/login?returnTo=' + encodeURIComponent('/explorar?era=1990'));
  await page.getByRole('textbox', {name: 'Email', exact: true}).fill(email);
  await page.locator('input[name=contrasena]').fill(password);
  const response = page.waitForResponse(response => response.url() === `${api}/api/auth/login` && response.request().method() === 'POST');
  await page.getByRole('button', {name: 'Ingresar', exact: true}).click();
  const saved = await response;
  expect(saved.status()).toBe(200);
  const session = await saved.json();
  await expect(page.getByRole('button', {name: 'Abrir menú de usuario', exact: true}).first()).toBeVisible();
  await page.addStyleTag({content: 'nextjs-portal { display: none !important; }'});
  return session as {token: string; usuarioId: number};
}

export async function openOwnProfile(page: Page) {
  await page.getByRole('button', {name: 'Abrir menú de usuario', exact: true}).first().click();
  await page.getByRole('menuitem', {name: 'Perfil', exact: true}).click();
  await expect(page.locator('.personal-profile')).toBeVisible();
}

export async function prepareMemory(page: Page, title: string) {
  await page.getByRole('button', {name: 'Recordar', exact: true}).click();
  await page.locator('#explore .memory-map').click({position: {x: 350, y: 240}});
  const dialog = page.getByRole('dialog', {name: '¿Qué pasó en este lugar?'});
  await dialog.getByRole('button', {name: 'Enlace', exact: true}).click();
  await dialog.getByLabel('O pegá un enlace HTTPS al archivo').fill('https://example.test/foto.jpg');
  await dialog.getByRole('button', {name: 'Usar enlace', exact: true}).click();
  await dialog.getByRole('button', {name: 'Continuar', exact: true}).click();
  await dialog.getByRole('textbox', {name: 'Título del recuerdo'}).fill(title);
  await dialog.getByRole('textbox', {name: 'Tu historia'}).fill('Una historia de prueba');
  await dialog.getByRole('button', {name: 'Continuar', exact: true}).click();
  await dialog.getByRole('textbox', {name: 'Nombre del lugar'}).fill('Buenos Aires');
  await dialog.getByLabel('Fecha del recuerdo', {exact: true}).fill('1995-04-15');
  await dialog.getByRole('button', {name: 'Continuar', exact: true}).click();
  return dialog;
}
