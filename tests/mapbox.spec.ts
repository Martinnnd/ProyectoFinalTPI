import { test, expect } from "@playwright/test";

// These tests use the real Mapbox provider and the production build.
// Build with a valid public token before running; no vendor responses are mocked.
test("globo real, publicaciones y opciones de estilo", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator('[data-mapbox-ready="true"]')).toBeVisible({
    timeout: 60000,
  });
  await expect(page.locator(".mapbox-memory-pin")).toHaveCount(7);
  await expect(page.locator(".mapboxgl-ctrl-logo")).toBeVisible();
  await page
    .getByRole("button", { name: "Cerrar datos de época", exact: true })
    .click();
  await page.screenshot({ path: "test-results/next-mapbox-desktop.png" });
  await page
    .getByRole("button", { name: "Ver Argentina", exact: true })
    .click();
  await page.locator(".mapbox-memory-pin").first().click();
  await expect(page.locator(".stories-drawer")).toBeVisible();
  await page
    .getByRole("button", { name: "Cerrar historias", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Estilo del mapa", exact: true })
    .click();
  const settings = page.locator("#mapbox-settings");
  await settings.locator("select").nth(0).selectOption("night");
  await settings.locator("select").nth(1).selectOption("faded");
  const satellite = settings.getByRole("checkbox", {
    name: "Satélite",
    exact: true,
  });
  const satelliteResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/styles/v1/mapbox/standard-satellite") &&
      response.status() === 200,
  );
  await satellite.check();
  await satelliteResponse;
  await expect(settings.locator("select").nth(1)).toBeDisabled();
  await settings
    .getByRole("checkbox", { name: "Nombres de lugares", exact: true })
    .uncheck();
  await page
    .getByRole("button", { name: "Cerrar estilo del mapa", exact: true })
    .click();
  await expect(page.locator(".mapbox-status")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Ver globo", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const add = await page
    .getByRole("button", { name: "Agregar un recuerdo", exact: true })
    .boundingBox();
  expect(add!.x + add!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/next-mapbox-mobile.png" });
  expect(errors).toEqual([]);
});

test("crear con teclado en Mapbox, perfil y persistencia", async ({ page }) => {
  await page.goto("/?era=1980");
  await expect(page.locator('[data-mapbox-ready="true"]')).toBeVisible({
    timeout: 60000,
  });
  await page
    .getByRole("button", { name: "Agregar un recuerdo", exact: true })
    .click();
  await page.locator(".mapboxgl-canvas").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .locator('input[name="title"]')
    .fill("Mi recuerdo desde Next y Mapbox");
  await page.locator('input[name="place"]').fill("Un lugar del mapa");
  await page
    .locator('textarea[name="description"]')
    .fill("Un recuerdo de prueba guardado en un navegador aislado.");
  await page
    .getByRole("button", { name: "Guardar recuerdo", exact: true })
    .click();
  await expect(page.locator(".mapbox-memory-pin")).toHaveCount(8);
  await page.getByRole("button", { name: "Perfil", exact: true }).click();
  await expect(page.locator(".personal-counts dd").first()).toHaveText("1");
  await expect(page.locator(".personal-memory")).toContainText(
    "Mi recuerdo desde Next y Mapbox",
  );
  await page.reload();
  await page.getByRole("button", { name: "Perfil", exact: true }).click();
  await expect(page.locator(".personal-memory")).toContainText(
    "Mi recuerdo desde Next y Mapbox",
  );
});

test("alternativa 2D sin WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(7);
  await expect(page.locator(".mapbox-status")).toContainText(
    "Mapbox no pudo cargar",
  );
});
