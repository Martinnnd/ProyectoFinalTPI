import { expect, test } from "@playwright/test";

const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
const publication = (id: number) => ({
  id,
  titulo: `Recuerdo ${id}`,
  descripcion: `Una mañana de #amanecer ${id}`,
  fecha: "1991-04-15T00:00:00Z",
  fechaCreacion: "2026-10-27T12:00:00Z",
  categoria: 6,
  urlMultimedia: "",
  tipoMultimedia: 0,
  autor: { id, username: `autor${id}` },
  lugar: { nombre: "La plaza", latitud: -34.6, longitud: -58.5 },
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/api/publicaciones/hashtags/tendencias")
      return route.fulfill({
        headers,
        json: [{ hashtag: "amanecer", cantidadPublicaciones: 2, cantidadAutores: 2 }],
      });
    if (url.pathname === "/api/publicaciones/hashtags/buscar")
      return route.fulfill({
        headers,
        json: [{ hashtag: "amanecer", cantidadPublicaciones: 3, cantidadAutores: 2 }],
      });
    if (url.pathname === "/api/publicaciones/hashtags/amanecer/publicaciones") {
      const next = url.searchParams.has("cursor");
      return route.fulfill({
        headers,
        json: {
          items: [publication(next ? 2 : 1)],
          siguienteCursor: next ? null : "segunda",
          hayMas: !next,
        },
      });
    }
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ status: 401, headers });
    if (url.pathname.endsWith("/mapa"))
      return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    if (url.pathname.startsWith("/api/feed/"))
      return route.fulfill({ headers, json: { items: [], siguienteCursor: null, hayMas: false } });
    return route.fulfill({ headers, json: [] });
  });
});

test("un enlace directo al hashtag muestra publicaciones de todas las épocas con paginación", async ({
  page,
}) => {
  await page.goto("/feed?tag=amanecer");
  await expect(page.getByRole("heading", { name: "#amanecer", exact: true })).toBeVisible();
  await expect(page.locator(".feed-post")).toHaveCount(2);
  await expect(page.locator(".feed-post").first()).toContainText("Recuerdo 1");
  await expect(page.locator(".feed-post").last()).toContainText("Recuerdo 2");
});

test("buscar o tocar una tendencia abre la página compartible del hashtag", async ({ page }) => {
  await page.goto("/feed");
  await page.getByRole("searchbox", { name: "Buscar hashtags" }).fill("#aman");
  await page.getByRole("button", { name: /#amanecer.*3 recuerdos/ }).click();
  await expect(page).toHaveURL(/\/feed\?tag=amanecer$/);
  await expect(page.getByRole("heading", { name: "#amanecer", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Volver al feed" }).click();
  await page.getByRole("button", { name: "Ver recuerdos con #amanecer" }).click();
  await expect(page).toHaveURL(/\/feed\?tag=amanecer$/);
});
