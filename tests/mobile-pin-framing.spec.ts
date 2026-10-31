import { expect, test } from "@playwright/test";

test("al tocar un pin móvil la tarjeta conserva su tamaño y queda dentro del mapa a su derecha", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith("webgl") || args[0] === "experimental-webgl") return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ headers, status: 204 });
    let json: unknown = [];
    if (path === "/api/auth/refresh")
      json = {
        token: "test",
        usuarioId: 1,
        username: "ana",
        email: "ana@test.com",
        esAdmin: false,
      };
    if (path.endsWith("/mapa"))
      json = { pines: [{ id: 12, latitud: -38.4, longitud: -64.4, categoria: 0 }], hayMas: false };
    if (/\/publicaciones\/12(?:\/resumen)?$/.test(path))
      json = {
        id: 12,
        titulo: "Juan de los palotes",
        descripcion:
          "Tantas historias que guardó este lugar, espero que la gente nos cuente las suyas.",
        fecha: "1975-01-01",
        categoria: 0,
        urlMultimedia: "/avatars/foto-1.jpg",
        tipoMultimedia: 0,
        autor: { id: 2, username: "sofi" },
        lugar: { nombre: "Argentina", latitud: -38.4, longitud: -64.4 },
      };
    if (path.includes("/feed/")) json = { items: [], siguienteCursor: null, hayMas: false };
    if (path.endsWith("/momentos")) json = { publicacionId: 12, momentos: [] };
    if (path.endsWith("/analisis")) json = { estado: "sinMomento" };
    if (path.endsWith("/relaciones"))
      json = {
        publicacionId: 12,
        dia: { items: [], siguienteCursor: null, hayMas: false },
        lugar: {
          items: [
            {
              id: 13,
              titulo: "Noches de los 80",
              descripcionBreve: "",
              fecha: "1980-01-01",
              urlMultimedia: "/avatars/foto-2.jpg",
              tipoMultimedia: 0,
              autorId: 2,
              autorUsername: "sofi",
              nombreLugar: "Argentina",
              distanciaMetros: 0,
              mismoDia: false,
              mismoLugar: true,
            },
          ],
          siguienteCursor: null,
          hayMas: false,
        },
      };
    return route.fulfill({ headers, json });
  });
  await page.goto("/explorar?era=1970");
  await page.addStyleTag({ content: "nextjs-portal { display:none !important; }" });
  await page.locator(".leaflet-marker-icon").first().click();
  const preview = page.locator(".leaflet-tooltip.pin-message-preview");
  await expect(preview.getByText("Juan de los palotes", { exact: true })).toBeVisible();
  await expect(preview.getByText("Noches de los 80", { exact: true })).toBeVisible();
  await expect
    .poll(async () =>
      preview.evaluate((element) => {
        const map = element.closest(".memory-map")!.getBoundingClientRect();
        const card = element.querySelector(":scope > div > div")!.getBoundingClientRect();
        return (
          card.left >= map.left &&
          card.right <= map.right &&
          card.top >= map.top &&
          card.bottom <= map.bottom
        );
      }),
    )
    .toBe(true);
  const width = await preview
    .locator(":scope > div > div")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(width).toBeCloseTo(390 * 0.55, 0);
});
