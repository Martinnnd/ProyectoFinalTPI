import { expect, test, type Page } from "@playwright/test";
import type {
  AdminTreasureLocation,
  CurrentTreasure,
  TreasureAdminPanel,
} from "../src/admin/treasureAdminApi";

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

async function prepare(page: Page, failFirst = false, postCount = 0, isAdmin = false) {
  let found: string | null = null;
  let captures = 0;
  let fail = failFirst;
  const visibleZooms: number[] = [];
  const pista =
    "Cruzó los Andes y fue Libertador de Argentina, Chile y Perú. Hoy, a caballo entre los árboles de Retiro, guarda un secreto.";
  const posts = Array.from({ length: postCount }, (_, index) => ({
    id: index + 1,
    titulo: `Recuerdo de prueba ${index + 1}`,
    descripcionBreve: "Un recuerdo de nuestro barrio.",
    fecha: "1995-01-01T00:00:00Z",
    fechaCreacion: "2026-11-22T12:00:00Z",
    categoria: 0,
    tipoMultimedia: 0,
    urlMultimedia: "",
    adjuntos: [],
    autor: { id: 2, username: "vecino" },
    lugar: { nombre: "Retiro", latitud: -34.59558, longitud: -58.3785 },
    cantidadLikes: 0,
    cantidadComentarios: 0,
    dioLike: false,
  }));
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
        esAdmin: isAdmin,
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
    if (path === "/api/admin/estadisticas")
      return reply({
        totalUsuarios: 0,
        totalPublicaciones: 0,
        publicacionesVisibles: 0,
        publicacionesOcultas: 0,
        publicacionesPorCategoria: [],
        masGustadas: [],
        masPuntuadas: [],
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
    if (path === "/api/feed/para-vos" || path === "/api/feed/seguidos") {
      const secondPage = url.searchParams.has("cursor");
      const hayMas = !secondPage && posts.length > 8;
      return reply({
        items: secondPage ? posts.slice(8) : posts.slice(0, 8),
        hayMas,
        siguienteCursor: hayMas ? "pagina-2" : null,
      });
    }
    if (path === "/api/feed/impresiones") return route.fulfill({ status: 204, headers });
    if (/^\/api\/publicaciones\/\d+\/like$/.test(path))
      return reply({ publicacionId: Number(path.split("/")[3]), cantidadLikes: 1, dioLike: true });
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

test("muestra una sola pista después de tres a seis publicaciones y conserva su lugar al interactuar y paginar", async ({
  page,
}) => {
  await prepare(page, false, 12);
  await page.goto("/feed?era=1990");
  const posts = page.locator("article.feed-post");
  await expect(posts).toHaveCount(8);
  const clue = page.getByRole("complementary", { name: "Pista del tesoro semanal" });
  await expect(clue).toHaveCount(1);
  const postsBeforeClue = () =>
    clue.evaluate((element) => {
      let count = 0;
      for (
        let sibling = element.previousElementSibling;
        sibling;
        sibling = sibling.previousElementSibling
      ) {
        if (sibling.matches("article.feed-post")) count++;
      }
      return count;
    });
  const position = await postsBeforeClue();
  expect(position).toBeGreaterThanOrEqual(3);
  expect(position).toBeLessThanOrEqual(6);
  const like = page.getByRole("button", { name: "Me gusta: Recuerdo de prueba 1", exact: true });
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  expect(await postsBeforeClue()).toBe(position);
  await page.locator(".feed-load-target").scrollIntoViewIfNeeded();
  await expect(posts).toHaveCount(12);
  await expect(clue).toHaveCount(1);
  expect(await postsBeforeClue()).toBe(position);
});

test("deja la pista al final cuando el feed tiene menos de tres publicaciones", async ({
  page,
}) => {
  await prepare(page, false, 2);
  await page.goto("/feed?era=1990");
  await expect(page.locator("article.feed-post")).toHaveCount(2);
  const clue = page.getByRole("complementary", { name: "Pista del tesoro semanal" });
  await expect(clue).toHaveCount(1);
  await expect(
    clue.locator("xpath=preceding-sibling::article[contains(@class, 'feed-post')]"),
  ).toHaveCount(2);
});

async function prepareAdmin(page: Page, failFirstSave = false) {
  await prepare(page, false, 0, true);
  const locations: AdminTreasureLocation[] = [
    {
      id: 1,
      nombre: "Plaza San Martín",
      pista: "El Libertador cruzó los Andes.",
      latitud: -34.59558,
      longitud: -58.3785,
      zoomMinimo: 18,
      activa: true,
    },
  ];
  let current: CurrentTreasure = { ...locations[0] };
  const plans = new Map<string, number | null>();
  let fail = failFirstSave;
  await page.route("http://localhost:5198/api/admin/juegos/tesoro**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": "http://localhost:3161",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization,content-type,x-nostalgiar-request",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    };
    const reply = (json: unknown) => route.fulfill({ headers, json });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (request.method() === "GET") {
      const panel: TreasureAdminPanel = {
        habilitado: true,
        semanaActual: "2026-11-22",
        actual: current,
        ubicaciones: locations,
        semanas: Array.from({ length: 13 }, (_, i) => {
          const week = new Date(Date.UTC(2026, 10, 22 + i * 7)).toISOString().slice(0, 10);
          const selected = plans.get(week);
          const location =
            selected === undefined
              ? locations.find((l) => l.activa)
              : locations.find((l) => l.id === selected && l.activa);
          return {
            semanaInicio: week,
            editable: i > 0,
            modo:
              i === 0
                ? "fijo"
                : selected === undefined
                  ? "automatica"
                  : location
                    ? "programada"
                    : "pausada",
            ubicacionId: selected ?? null,
            nombre: location?.nombre ?? null,
            pista: location?.pista ?? null,
          };
        }),
      };
      return reply(panel);
    }
    if (fail) {
      fail = false;
      return route.fulfill({
        status: 500,
        headers,
        json: { detail: "No se pudo guardar. Intentá nuevamente." },
      });
    }
    if (path.endsWith("/ubicaciones")) {
      const location = {
        ...request.postDataJSON(),
        id: locations.length + 1,
      } as AdminTreasureLocation;
      locations.push(location);
      return reply(location);
    }
    if (path.includes("/ubicaciones/")) {
      const id = Number(path.split("/").at(-1));
      const location = { ...request.postDataJSON(), id } as AdminTreasureLocation;
      locations[locations.findIndex((l) => l.id === id)] = location;
      return reply(location);
    }
    if (path.includes("/actual/"))
      current = { ...request.postDataJSON(), id: current.id } as CurrentTreasure;
    if (path.includes("/semanas/")) {
      const week = path.split("/").at(-1)!;
      if (request.method() === "DELETE") plans.delete(week);
      else plans.set(week, request.postDataJSON().ubicacionId as number | null);
    }
    return route.fulfill({ status: 204, headers });
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Búsqueda del tesoro", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ubicaciones y pistas" })).toBeVisible();
  return { locations, plans, current: () => current };
}

test("el administrador crea lugares en el mapa, programa semanas y edita el vigente", async ({
  page,
}) => {
  const state = await prepareAdmin(page);
  await page.getByRole("button", { name: "Nueva ubicación", exact: true }).click();
  await page.getByLabel("Nombre al encontrarlo").fill("El secreto de Retiro");
  await page.getByLabel("Pista del feed").fill("Una nueva pista entre árboles de Retiro.");
  await page.getByRole("searchbox", { name: "Buscar un lugar" }).fill("Plaza San Martín");
  await page.getByRole("button", { name: "Buscar lugar", exact: true }).click();
  await page.getByRole("button", { name: /Plaza San Martín.*Retiro/ }).click();
  await expect(page.locator('[data-treasure-picker-ready="true"]')).toBeVisible();
  await page.locator(".mapboxgl-canvas").click({ position: { x: 150, y: 100 } });
  await expect(page.getByLabel("Latitud", { exact: true })).not.toHaveValue("-34.59558");
  await page.getByRole("button", { name: "Guardar ubicación", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Editar El secreto de Retiro", exact: true }),
  ).toBeVisible();
  expect(state.locations).toHaveLength(2);
  expect(state.locations[1].latitud).not.toBe(-34.59558);
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("combobox", { name: "Ubicación para 2026-11-29" }) });
  for (const choice of ["2", "pause", "auto"]) {
    await row.getByRole("combobox").selectOption(choice);
    await row.getByRole("button", { name: "Guardar semana" }).click();
    await expect(row.getByRole("button", { name: "Guardar semana" })).toBeDisabled();
    if (choice === "auto") expect(state.plans.has("2026-11-29")).toBe(false);
    else expect(state.plans.get("2026-11-29")).toBe(choice === "pause" ? null : 2);
  }
  await page.getByRole("button", { name: "Editar El secreto de Retiro", exact: true }).click();
  await page.getByLabel("Ubicación activa", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Guardar ubicación", exact: true }).click();
  await expect(page.getByRole("button", { name: "Editar reto vigente" })).toBeVisible();
  expect(state.locations[1].activa).toBe(false);
  await page.getByRole("button", { name: "Editar reto vigente" }).click();
  await expect(
    page.getByText(/Quienes ya lo encontraron conservan el reto completado/),
  ).toBeVisible();
  await page.getByLabel("Pista del feed").fill("La pista del reto actual fue corregida.");
  await page.getByLabel("Zoom mínimo").selectOption("19");
  await page.getByRole("button", { name: "Guardar cambios en el reto actual" }).click();
  await expect(page.getByRole("region", { name: "Reto de esta semana" })).toContainText(
    "La pista del reto actual fue corregida.",
  );
  expect(state.current().zoomMinimo).toBe(19);
  expect(state.locations[0].pista).toBe("El Libertador cruzó los Andes.");
  await page.screenshot({ path: "test-results/tesoro-admin.png", fullPage: true });
});

test("el editor administrativo permite reintentar y usar coordenadas desde móvil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await prepareAdmin(page, true);
  await page.getByRole("button", { name: "Nueva ubicación", exact: true }).click();
  await page.getByLabel("Nombre al encontrarlo").fill("Obelisco");
  await page.getByLabel("Pista del feed").fill("Una aguja señala el cielo porteño.");
  await page.getByLabel("Latitud", { exact: true }).fill("-34.6037");
  await page.getByLabel("Longitud", { exact: true }).fill("-58.3816");
  await page.getByRole("button", { name: "Guardar ubicación", exact: true }).click();
  await expect(
    page.getByRole("form", { name: "Editar ubicación del tesoro" }).getByRole("alert"),
  ).toContainText("No se pudo guardar. Intentá nuevamente.");
  await expect(page.getByLabel("Nombre al encontrarlo")).toHaveValue("Obelisco");
  await page.getByRole("button", { name: "Guardar ubicación", exact: true }).click();
  await expect(page.getByRole("button", { name: "Editar Obelisco", exact: true })).toBeVisible();
  expect(state.locations[1].latitud).toBe(-34.6037);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
