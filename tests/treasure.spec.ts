import { expect, test, type Page } from "@playwright/test";

// El renderer y la cámara son Mapbox reales. Estilo y API se sirven localmente
// para no requerir credenciales de Mapbox ni tocar datos de ninguna cuenta.
const basemap = {
  version: 8,
  schema: {
    lightPreset: { default: "day" },
    theme: { default: "default" },
    showPlaceLabels: { default: true },
    showPointOfInterestLabels: { default: true },
  },
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#a8c7bd" } }],
};

async function prepare(page: Page, failFirst = false) {
  let found: string | null = null;
  let captures = 0;
  let fail = failFirst;
  const visibleZooms: number[] = [];
  const pista = "Entre árboles y senderos, un Libertador a caballo guarda un secreto en Retiro.";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://api.mapbox.com/**", (route) =>
    route.fulfill({
      json: route.request().url().includes("/styles/")
        ? {
            version: 8,
            imports: [{ id: "basemap", url: "mapbox://styles/test/local", data: basemap }],
            sources: {},
            layers: [],
          }
        : {},
    }),
  );
  await page.route("https://events.mapbox.com/**", (route) =>
    route.fulfill({ status: 200, body: "" }),
  );
  await page.route("https://photon.komoot.io/api/**", (route) =>
    route.fulfill({
      json: {
        features: [
          {
            geometry: { coordinates: [-58.3785, -34.59558] },
            properties: { name: "Plaza San Martín", district: "Retiro", country: "Argentina" },
          },
        ],
      },
    }),
  );
  await page.routeWebSocket("**/hubs/**", (socket) => {
    socket.onMessage((message) => {
      if (typeof message === "string" && message.includes('"protocol"')) socket.send("{}\u001e");
      else socket.send('{"type":6}\u001e');
    });
  });
  await page.route("**/hubs/**", (route) =>
    route.fulfill({
      headers: {
        "access-control-allow-origin": "http://localhost:3161",
        "access-control-allow-credentials": "true",
      },
      json: {
        connectionId: "tesoro-test",
        connectionToken: "tesoro-test",
        negotiateVersion: 1,
        availableTransports: [{ transport: "WebSockets", transferFormats: ["Text"] }],
      },
    }),
  );
  await page.route("http://localhost:5198/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const headers = {
      "access-control-allow-origin": request.headers().origin || "http://localhost:3161",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization,content-type,x-nostalgiar-request",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    };
    const reply = (json: unknown, status = 200) => route.fulfill({ status, headers, json });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (path === "/api/auth/refresh")
      return reply({
        token: "test-token",
        usuarioId: 7,
        username: "buscador",
        email: "buscador@example.test",
        esAdmin: false,
      });
    if (path === "/api/categorias-cuenta/me")
      return reply({
        categoria: {
          codigo: "Errante",
          nombre: "Errante",
          publicacionesSemanales: 5,
          publicacionesIlimitadas: false,
          permitePrimerRecuerdo: true,
          prioridadVisibilidad: "Normal",
          permisos: ["DarLike", "GuardarPublicacion"],
        },
        publicacionesConsumidas: 0,
        publicacionesRestantes: 5,
        semanaInicio: "2026-11-22",
        reinicioSemana: "2026-11-29",
        maximoAdjuntos: 1,
      });
    if (path === "/api/puntos-nostalgia/saldo")
      return reply({
        cupo: 5,
        puntosRestantes: 5,
        reinicio: "2026-11-24T03:00:00Z",
        puntosExtra: 0,
        totalDisponible: 5,
      });
    if (path === "/api/juegos/tesoro/actual")
      return reply({
        id: 1,
        pista,
        inicioUtc: new Date(Date.now() - 60000).toISOString(),
        finUtc: new Date(Date.now() + 6 * 86400000).toISOString(),
        zoomMinimo: 18,
        halladoUtc: found,
      });
    if (path === "/api/juegos/tesoro/visible") {
      const z = Number(url.searchParams.get("zoom"));
      visibleZooms.push(z);
      const inside =
        Number(url.searchParams.get("minLatitud")) <= -34.59558 &&
        Number(url.searchParams.get("maxLatitud")) >= -34.59558 &&
        Number(url.searchParams.get("minLongitud")) <= -58.3785 &&
        Number(url.searchParams.get("maxLongitud")) >= -58.3785;
      return !found && z >= 18 && inside
        ? reply({ retoId: 1, latitud: -34.59558, longitud: -58.3785 })
        : route.fulfill({ status: 204, headers });
    }
    if (path === "/api/juegos/tesoro/1/hallazgo") {
      captures++;
      expect(request.postDataJSON()).not.toHaveProperty("pitch");
      expect(request.postDataJSON().zoom).toBeGreaterThanOrEqual(18);
      if (fail) {
        fail = false;
        return reply({ detail: "No pudimos registrar el hallazgo. Probá otra vez." }, 500);
      }
      found ??= new Date().toISOString();
      return reply({
        retoId: 1,
        nombre: "Monumento al General San Martín · Retiro",
        halladoUtc: found,
      });
    }
    if (path.endsWith("/mapa")) return reply({ pines: [], hayMas: false });
    if (path === "/api/feed/para-vos" || path === "/api/feed/seguidos")
      return reply({ items: [], hayMas: false, siguienteCursor: null });
    return reply([]);
  });
  return { captures: () => captures, visibleZooms, pista };
}

async function findOnMap(page: Page) {
  await page.goto("/explorar?era=1990");
  await expect(page.locator('[data-mapbox-ready="true"]')).toBeVisible({ timeout: 45000 });
  await page.getByRole("button", { name: "Buscar un lugar", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Dirección o nombre del lugar" })
    .fill("Plaza San Martín");
  await page.getByRole("button", { name: /Plaza San Martín.*Retiro/ }).click();
  await page.getByRole("button", { name: "Cerrar buscador", exact: true }).click();
  const canvas = page.locator(".mapboxgl-canvas");
  await canvas.focus();
  await expect(page.getByRole("button", { name: "Recoger el tesoro" })).toHaveCount(0);
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  await expect(page.getByRole("button", { name: "Recoger el tesoro" })).toBeVisible();
}

test("pista discreta en las seis épocas, mapa plano, captura única y persistencia al recargar", async ({
  page,
}) => {
  const state = await prepare(page);
  for (const era of [1970, 1980, 1990, 2000, 2010, 2020]) {
    await page.goto(`/feed?era=${era}`);
    const clue = page.getByRole("complementary", { name: "Pista del tesoro semanal" });
    await expect(clue).toContainText(state.pista);
    await expect(clue).toHaveAttribute("data-decade", String(era));
    await expect(clue.getByRole("link")).toHaveAttribute("href", "/explorar");
    if (era === 1970) await page.screenshot({ path: "test-results/tesoro-pista-feed.png" });
  }
  await findOnMap(page);
  expect(state.visibleZooms.every((zoom) => zoom >= 18)).toBe(true);
  await page.getByRole("button", { name: "Recoger el tesoro" }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.getByRole("heading", { name: "¡Tesoro encontrado!" })).toBeVisible();
  expect(state.captures()).toBe(1);
  await page.screenshot({ path: "test-results/tesoro-encontrado.png" });
  await page.getByRole("button", { name: "Seguir explorando" }).click();
  await expect(page.getByRole("button", { name: "Recoger el tesoro" })).toHaveCount(0);
  await page.goto("/feed?era=1980");
  await expect(page.getByRole("complementary", { name: "Pista del tesoro semanal" })).toContainText(
    "Esta semana encontraste el tesoro",
  );
  await page.reload();
  await expect(page.getByRole("complementary", { name: "Pista del tesoro semanal" })).toContainText(
    "Esta semana encontraste el tesoro",
  );
});

test("permite reintentar una captura fallida en móvil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await prepare(page, true);
  await findOnMap(page);
  await page.getByRole("button", { name: "Recoger el tesoro" }).click();
  await expect(page.getByText("No pudimos registrar el hallazgo. Probá otra vez.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "¡Tesoro encontrado!" })).toHaveCount(0);
  await page.getByRole("button", { name: "Recoger el tesoro" }).click();
  await expect(page.getByRole("heading", { name: "¡Tesoro encontrado!" })).toBeVisible();
  expect(state.captures()).toBe(2);
  await page.screenshot({ path: "test-results/tesoro-encontrado-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
