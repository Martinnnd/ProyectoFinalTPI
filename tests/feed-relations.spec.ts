import { expect, test } from "@playwright/test";

test("el feed despliega día, lugar y momento y vuelve del recuerdo relacionado", async ({
  page,
}, testInfo) => {
  const empty = { items: [], siguienteCursor: null, hayMas: false };
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.text().includes("Encountered two children with the same key"))
      errors.push(message.text());
  });
  const continuationTypes: string[] = [];
  const moment = {
    id: 1,
    nombre: "Un acontecimiento compartido",
    fechaInicio: "1986-01-01",
    fechaFin: "1986-12-31",
    momentoPadreId: null,
  };
  const publication = (id: number) => ({
    id,
    titulo: id === 25 ? "Recuerdo de origen" : `Recuerdo relacionado ${id}`,
    descripcion: "Una historia del barrio",
    fecha:
      id === 27
        ? "1985-04-15T00:00:00Z"
        : id === 30
          ? "2003-04-15T00:00:00Z"
          : "1991-04-15T00:00:00Z",
    categoria: 6,
    urlMultimedia: "https://fixtures.nostalgiar.test/recuerdo.jpg",
    tipoMultimedia: 0,
    autor: { id: 1, username: "Ana" },
    lugar: { nombre: "La plaza", latitud: -34.67 + id * 0.0001, longitud: -58.56 },
  });
  const related = (id: number) => ({
    ...publication(id),
    descripcionBreve: "Otra historia",
    autorId: 1,
    autorUsername: "Ana",
    nombreLugar: "La plaza",
    distanciaMetros: 20,
    mismoDia: id !== 27 && id !== 30,
    mismoLugar: true,
  });
  await page.route("https://fixtures.nostalgiar.test/recuerdo.jpg", (route) =>
    route.fulfill({ path: "public/facts/bttf.jpg", contentType: "image/jpeg" }),
  );
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = {
      "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type, authorization, x-nostalgiar-request",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/api/auth/refresh")
      return route.fulfill({
        headers,
        json: {
          token: "test",
          usuarioId: 1,
          username: "Ana",
          email: "ana@example.com",
          esAdmin: false,
        },
      });
    if (url.pathname.endsWith("/mapa"))
      return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    if (url.pathname.startsWith("/api/feed/"))
      return route.fulfill({ headers, json: { ...empty, items: [publication(25)] } });
    if (url.pathname.endsWith("/analisis"))
      return route.fulfill({
        headers,
        json: { publicacionId: 25, versionContenido: 1, estado: "sinMomento" },
      });
    if (url.pathname.match(/\/publicaciones\/\d+\/momentos$/))
      return route.fulfill({
        headers,
        json: {
          publicacionId: 25,
          versionRelaciones: 1,
          permitirMomentosAutomaticos: true,
          puedeCorregir: false,
          momentos: [{ momento: moment, origen: "autor" }],
        },
      });
    if (url.pathname.endsWith("/relaciones"))
      return route.fulfill({
        headers,
        json: {
          publicacionId: 25,
          radioMetros: 200,
          dia: { items: [related(26)], siguienteCursor: "dia+/= &?", hayMas: true },
          lugar: {
            items: [related(26), related(27)],
            siguienteCursor: "lugar+/= &?",
            hayMas: true,
          },
        },
      });
    if (url.pathname.endsWith("/relacionadas")) {
      continuationTypes.push(url.searchParams.get("tipo")!);
      if (url.searchParams.get("tipo") === "lugar") {
        const next = url.searchParams.get("cursor") === "lugar+/= &?";
        expect(url.searchParams.get("cursor")).toBe(next ? "lugar+/= &?" : "otra-fecha+/=");
        return route.fulfill({
          headers,
          json: next
            ? { items: [related(26)], siguienteCursor: "otra-fecha+/=", hayMas: true }
            : { ...empty, items: [related(26), related(30)] },
        });
      }
      expect(url.searchParams.get("cursor")).toBe("dia+/= &?");
      return route.fulfill({ headers, json: { ...empty, items: [related(29)] } });
    }
    if (url.pathname === "/api/momentos/1")
      return route.fulfill({
        headers,
        json: {
          ...moment,
          versionCatalogo: 1,
          redirigidoDesdeId: null,
          descripcion: "Un acontecimiento vivido desde distintos lugares.",
          padre: null,
          hijos: [],
          alias: [],
        },
      });
    if (url.pathname === "/api/momentos/1/publicaciones")
      return route.fulfill({
        headers,
        json: { ...empty, items: [publication(25), publication(28)] },
      });
    if (url.pathname.endsWith("/comentarios")) return route.fulfill({ headers, json: empty });
    const match = url.pathname.match(/\/publicaciones\/(\d+)$/);
    return route.fulfill({ headers, json: match ? publication(Number(match[1])) : [] });
  });
  await page.goto("/explorar?era=1990");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  const post = page.locator(".feed-post").filter({ hasText: "Recuerdo de origen" });
  const links = post.getByRole("region", { name: "Explorar recuerdos relacionados" });
  const dayLink = links.getByRole("button", { name: "También ese día", exact: true });
  await dayLink.click();
  const day = links.getByRole("region", { name: "También ese día", exact: true });
  await expect(
    day.getByRole("button", { name: "Abrir recuerdo relacionado: Recuerdo relacionado 26" }),
  ).toBeVisible();
  const musicToggle = page.getByRole("button", { name: "Música", exact: true });
  if ((await musicToggle.getAttribute("aria-expanded")) === "true") await musicToggle.click();
  await expect(page.locator("#music-player")).toHaveClass(/player-hidden/);
  await day.getByRole("button", { name: "Más recuerdos relacionados" }).click();
  await expect(
    day.getByRole("button", { name: "Abrir recuerdo relacionado: Recuerdo relacionado 29" }),
  ).toBeVisible();
  await links.getByRole("button", { name: "Este lugar a través de los años", exact: true }).click();
  await expect(day).toHaveCount(0);
  const place = links.getByRole("region", { name: "Este lugar a través de los años", exact: true });
  await expect(place.locator("time")).toHaveText(["1985"]);
  await expect(
    place.getByRole("button", { name: "Abrir recuerdo relacionado: Recuerdo relacionado 26" }),
  ).toHaveCount(0);
  await place.getByRole("button", { name: "Más recuerdos relacionados" }).click();
  await expect(place.locator("time")).toHaveText(["1985", "2003"]);
  await expect(
    place.getByRole("button", { name: "Abrir recuerdo relacionado: Recuerdo relacionado 26" }),
  ).toHaveCount(0);
  await place
    .getByRole("button", { name: "Abrir recuerdo relacionado: Recuerdo relacionado 30" })
    .click();
  await expect(page.locator(".app")).toHaveClass(/era-2000/);
  await expect(
    page.getByRole("heading", { name: "Recuerdo relacionado 30", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Volver a Recuerdo de origen", exact: true }).click();
  await expect(page.locator(".app")).toHaveClass(/era-1990/);
  await expect(
    page.getByRole("heading", { name: "Recuerdo de origen", exact: true }),
  ).toBeVisible();
  await links.getByRole("button", { name: "Parte de Un acontecimiento compartido" }).click();
  await expect(place).toHaveCount(0);
  const momentPanel = links.getByRole("region", { name: moment.nombre, exact: true });
  await expect(
    momentPanel.getByRole("button", { name: "Abrir recuerdo relacionado: Recuerdo de origen" }),
  ).toHaveCount(0);
  await expect(
    momentPanel.getByText("Un acontecimiento vivido desde distintos lugares."),
  ).toBeVisible();
  await post.screenshot({ path: testInfo.outputPath("feed-relaciones.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await momentPanel.scrollIntoViewIfNeeded();
  const panelBounds = (await momentPanel.boundingBox())!;
  const postBounds = (await post.boundingBox())!;
  expect(panelBounds.width).toBeLessThanOrEqual(postBounds.width);
  await expect(
    links.getByRole("button", { name: "Parte de Un acontecimiento compartido" }),
  ).toBeVisible();
  await momentPanel
    .getByRole("button", { name: "Abrir recuerdo relacionado: Recuerdo relacionado 28" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Recuerdo relacionado 28", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Volver a Recuerdo de origen", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Recuerdo de origen", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".feed-post")
      .getByRole("region", { name: "Explorar recuerdos relacionados", exact: true }),
  ).toHaveCount(1);
  await expect(page.locator(".app.view-feed")).toBeVisible();
  expect(continuationTypes).toEqual(["dia", "lugar", "lugar"]);
  expect(errors).toEqual([]);
});
