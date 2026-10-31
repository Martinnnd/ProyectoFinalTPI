import { expect, test, type Page } from "@playwright/test";

const root = "/api/integraciones/google-photos/sesiones";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);

async function prepare(page: Page, ready = true, era = 1990) {
  const requests: string[] = [];
  let publication = "";
  await page
    .context()
    .route("https://accounts.google.com/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>Selector simulado</p>" }),
    );
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const headers = {
      "access-control-allow-origin": req.headers().origin ?? "http://localhost:3110",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization,content-type,x-nostalgiar-request",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    requests.push(`${req.method()} ${path}`);
    if (path === "/api/auth/refresh")
      return route.fulfill({
        headers,
        json: {
          token: "test-token",
          usuarioId: 1,
          username: "ana",
          email: "ana@example.com",
          esAdmin: false,
        },
      });
    if (path === root)
      return route.fulfill({
        headers,
        json: {
          operationId: "test-selection",
          authorizationUrl: "https://accounts.google.com/mock",
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });
    if (path === `${root}/test-selection/imagen`)
      return route.fulfill({ headers, contentType: "image/png", body: png });
    if (path === `${root}/test-selection`) {
      if (req.method() === "DELETE") return route.fulfill({ status: 204, headers });
      return route.fulfill({
        headers,
        json: {
          status: ready ? "ready" : "selecting",
          pollAfterSeconds: 1,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      });
    }
    if (path === "/api/publicaciones" && req.method() === "POST") {
      publication = req.postData() ?? "";
      return route.fulfill({ status: 201, headers, json: { id: 123 } });
    }
    if (path.endsWith("/mapa"))
      return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    if (path.startsWith("/api/feed/"))
      return route.fulfill({ headers, json: { items: [], hayMas: false } });
    return route.fulfill({ headers, json: [] });
  });
  await page.goto(`/explorar?era=${era}`);
  await page.getByRole("button", { name: "Recordar", exact: true }).click();
  const map = page.locator(".memory-map");
  const box = await map.boundingBox();
  await map.click({ position: { x: Math.min(550, box!.width * 0.6), y: 350 } });
  await expect(page.locator(".memory-dialog")).toBeVisible();
  await page.getByRole("textbox", { name: "Título del recuerdo" }).fill("Mi foto de Google");
  await page.getByRole("textbox", { name: "Nombre del lugar" }).fill("Rosario");
  await page
    .getByRole("textbox", { name: "Tu historia" })
    .fill("El borrador se conserva mientras elijo una foto.");
  return { requests, publication: () => publication };
}

test("importa una foto, conserva el borrador y publica como archivo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const api = await prepare(page);
  await page.getByRole("button", { name: "Elegir desde Google Photos" }).click();
  await expect(page.getByAltText("Vista previa del adjunto")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Título del recuerdo" })).toHaveValue(
    "Mi foto de Google",
  );
  await expect(page.getByRole("button", { name: "Guardar recuerdo" })).toBeEnabled();
  await page.getByRole("button", { name: "Guardar recuerdo" }).click();
  await expect.poll(api.publication).toContain('name="Archivo"');
  expect(api.publication()).not.toContain('name="UrlArchivo"');
  expect(api.requests).toContain(`DELETE ${root}/test-selection`);
});

test("cancelar la selección mantiene el borrador y no publica", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const api = await prepare(page, false);
  await page.getByRole("button", { name: "Elegir desde Google Photos" }).click();
  await expect(
    page.getByText("Elegí una foto y confirmá la selección en Google Photos."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar selección" }).click();
  await expect(page.getByRole("button", { name: "Elegir desde Google Photos" })).toBeEnabled();
  await expect(page.getByRole("textbox", { name: "Título del recuerdo" })).toHaveValue(
    "Mi foto de Google",
  );
  expect(api.requests).toContain(`DELETE ${root}/test-selection`);
  expect(api.publication()).toBe("");
});

test("informa ventanas bloqueadas sin crear una sesión", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const api = await prepare(page);
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page.getByRole("button", { name: "Elegir desde Google Photos" }).click();
  await expect(page.locator(".google-photos-picker").getByRole("alert")).toContainText(
    "El navegador bloqueó la ventana",
  );
  expect(api.requests).not.toContain(`POST ${root}`);
});

test("el selector se adapta al formulario móvil de los 2000s", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, true, 2000);
  const button = page.getByRole("button", { name: "Elegir desde Google Photos" });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  const layout = await page.locator(".memory-dialog").evaluate((el) => ({
    width: el.clientWidth,
    scroll: el.scrollWidth,
    overflow: Array.from(el.querySelectorAll("*"))
      .filter((child) => child.getBoundingClientRect().right > el.getBoundingClientRect().right)
      .map((child) => ({
        tag: child.tagName,
        class: child.className,
        width: child.getBoundingClientRect().width,
      })),
  }));
  expect(layout.scroll, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
  await button.click();
  await expect(page.getByAltText("Vista previa del adjunto")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar recuerdo" })).toBeEnabled();
  await page
    .locator(".google-photos-picker")
    .screenshot({ path: "test-results/google-photos-mobile.png" });
});
