import { API_BASE_URL } from '../src/api';
import { expect, test } from '@playwright/test';

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
