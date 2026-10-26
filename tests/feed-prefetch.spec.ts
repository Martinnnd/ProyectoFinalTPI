import { expect, test } from '@playwright/test';

for (const pending of [false, true]) {
  test(`precarga el feed después del mapa y reutiliza la consulta ${pending ? 'en curso' : 'completada'}`, async ({ page }) => {
    // Exercise the supported 2D fallback without external map resources.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
        if (String(args[0]).startsWith('webgl') || args[0] === 'experimental-webgl') return null;
        return original.apply(this, args);
      } as typeof original;
    });
    let maps = 0, feeds = 0, impressions = 0;
    let releaseMap!: () => void, releaseFeed!: () => void;
    const mapGate = new Promise<void>(resolve => { releaseMap = resolve; });
    const feedGate = new Promise<void>(resolve => { releaseFeed = resolve; });
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
      if (url.pathname === '/api/auth/refresh') return respond({ token: 'test', usuarioId: 1, username: 'ana', email: 'ana@test.com', esAdmin: false });
      if (url.pathname.endsWith('/mapa')) { maps++; await mapGate; return respond({ pines: [], hayMas: false }); }
      if (url.pathname === '/api/feed/para-vos') {
        feeds++;
        if (pending) await feedGate;
        return respond({ items: [{ id: 12, titulo: 'Recuerdo precargado', descripcion: 'Una historia', fecha: '1985-01-01', fechaCreacion: '2026-10-26T10:00:00Z', categoria: 0, urlMultimedia: '', tipoMultimedia: 0, autor: { id: 2, username: 'sofi' } }], siguienteCursor: null, hayMas: false });
      }
      if (url.pathname === '/api/feed/impresiones') { impressions++; return respond({}); }
      if (url.pathname.endsWith('/momentos')) return respond({ publicacionId: 12, momentos: [] });
      if (url.pathname.endsWith('/analisis')) return respond({ estado: 'sinMomento' });
      if (url.pathname.endsWith('/relaciones')) return respond({ publicacionId: 12, dia: { items: [], siguienteCursor: null, hayMas: false }, lugar: { items: [], siguienteCursor: null, hayMas: false } });
      return respond([]);
    });
    await page.goto('/explorar?era=1980');
    await page.addStyleTag({ content: 'nextjs-portal { display:none !important; }' });
    await expect.poll(() => maps).toBeGreaterThan(0);
    expect(feeds).toBe(0);
    const response = pending ? null : page.waitForResponse(value => value.url().includes('/api/feed/para-vos') && value.status() === 200);
    releaseMap();
    await expect.poll(() => feeds).toBe(1);
    if (response) await (await response).finished();
    expect(impressions).toBe(0);
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'Feed', exact: true }).click();
    if (pending) releaseFeed();
    await expect(page.getByText('Recuerdo precargado', { exact: true })).toBeVisible();
    await expect(page.locator('.feed-loading')).toHaveCount(0);
    expect(feeds).toBe(1);
    await expect.poll(() => impressions).toBe(1);
  });
}
