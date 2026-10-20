import { expect, test, type Page, type Request } from '@playwright/test';

const session = {
  token: 'token-test',
  usuarioId: 1,
  username: 'ana',
  email: 'ana@example.com',
  esAdmin: false,
};

async function mockApi(page: Page) {
  let createdBody: Record<string, unknown> | null = null;

  await page.route('**/api/**', async route => {
    const request: Request = route.request();
    const url = new URL(request.url());
    const origin = request.headers().origin ?? 'http://localhost:3107';
    const headers = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-headers': 'authorization, content-type, x-nostalgiar-request',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    };

    if (request.method() === 'OPTIONS') return route.fulfill({ headers, status: 204 });

    if (url.pathname === '/api/auth/refresh') {
      return route.fulfill({ headers, json: session });
    }
    if (url.pathname === '/api/grupos' && request.method() === 'POST') {
      createdBody = request.postDataJSON();
      return route.fulfill({
        headers,
        status: 201,
        json: {
          id: 45,
          nombre: createdBody?.nombre,
          descripcion: createdBody?.descripcion,
          decada: createdBody?.decada,
          fechaCreacion: '2026-10-20T18:00:00Z',
          creador: { id: 1, username: 'ana' },
          cantidadIntegrantes: 1,
          esIntegrante: true,
          esCreador: true,
        },
      });
    }
    if (url.pathname === '/api/grupos') return route.fulfill({ headers, json: [] });
    if (url.pathname === '/api/publicaciones/mapa') {
      return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    }
    if (url.pathname === '/api/publicaciones') return route.fulfill({ headers, json: [] });
    if (url.pathname === '/api/chat/conversaciones') return route.fulfill({ headers, json: [] });
    if (url.pathname.includes('/api/seguimientos/')) return route.fulfill({ headers, json: [] });
    if (url.pathname.startsWith('/api/feed/')) {
      return route.fulfill({ headers, json: { items: [], siguienteCursor: null, hayMas: false } });
    }
    return route.fulfill({ headers, json: {} });
  });

  return () => createdBody;
}

for (const viewport of [
  { name: 'escritorio', width: 1440, height: 1000 },
  { name: 'móvil', width: 390, height: 844 },
]) {
  test(`crea un grupo y mantiene el formulario responsive en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const createdBody = await mockApi(page);
    await page.goto('/explorar?era=1990');
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    await page.getByRole('button', { name: 'Feed', exact: true }).click();
    if (viewport.width < 900) {
      await page.getByText('Tendencias, búsqueda y comunidad', { exact: true }).click();
    }
    await page.getByRole('button', { name: 'Crear grupo', exact: true }).click();

    const form = page.locator('.community-create-form');
    await expect(form).toBeVisible();
    await expect(form).toContainText('1990–1999');
    expect(await form.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);

    await page.getByRole('textbox', { name: 'Nombre del grupo' }).fill('Cine de los 90');
    await page.getByRole('textbox', { name: 'Descripción' }).fill('Películas que marcaron la década.');
    await form.getByRole('button', { name: 'Crear grupo', exact: true }).click();

    await expect(form).toHaveCount(0);
    await expect(page.getByText('Películas que marcaron la década.', { exact: true })).toBeVisible();
    const publishInGroup = page.getByRole('button', { name: 'Publicar recuerdo en este grupo', exact: true });
    await expect(publishInGroup).toBeVisible();
    expect(createdBody()).toEqual({
      nombre: 'Cine de los 90',
      descripcion: 'Películas que marcaron la década.',
      decada: 1990,
    });
    await publishInGroup.click();
    await expect(page.getByText('Elegí un lugar en el mapa para tu recuerdo.')).toBeVisible();
  });
}
