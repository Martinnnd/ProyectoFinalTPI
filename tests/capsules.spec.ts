import { expect, test, type Page } from "@playwright/test";
import type { Capsule } from "../src/capsulesApi";

// API simulada: estas pruebas no crean ni eliminan datos en el backend real.
async function prepare(page: Page, options: { viewer?: number | null; public?: boolean } = {}) {
  const viewer = options.viewer === undefined ? 1 : options.viewer;
  const requests: string[] = [];
  const bodies: Record<string, unknown>[] = [];
  const originalPublications = [
    {
      id: 11,
      titulo: "Veranos en la costa",
      fecha: "1975-01-10T00:00:00Z",
      descripcion: "La primera visita al mar.",
      categoria: 0,
      urlMultimedia: "",
      tipoMultimedia: 0,
      autor: { id: 1, username: "ana" },
      lugar: { nombre: "Mar del Plata", latitud: -38, longitud: -57 },
    },
    {
      id: 12,
      titulo: "El mundial en familia",
      fecha: "2022-12-18T00:00:00Z",
      descripcion: "Volvimos a festejar juntos.",
      categoria: 5,
      urlMultimedia: "",
      tipoMultimedia: 0,
      autor: { id: 1, username: "ana" },
      lugar: { nombre: "Tokio", latitud: 35, longitud: 139 },
    },
  ];
  const capsules: Capsule[] = [
    {
      id: 4,
      propietarioId: 1,
      propietarioUsername: "ana",
      nombre: "Nuestra historia",
      descripcion: "Recuerdos que van juntos",
      visibilidad: options.public ? 1 : 0,
      portadaPublicacionId: null,
      portadaAdjuntoId: null,
      portadaUrl: null,
      cantidadRecuerdos: 2,
      fechaDesde: originalPublications[0].fecha,
      fechaHasta: originalPublications[1].fecha,
      fechaCreacion: "2026-11-16T12:00:00Z",
      fechaActualizacion: "2026-11-16T12:00:00Z",
      puedeAdministrar: viewer === 1,
    },
  ];
  const memberships = new Map<number, number[]>([[4, [11, 12]]]);
  await page.route("**/hubs/**", (route) => route.fulfill({ status: 404, json: {} }));
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const headers = {
      "access-control-allow-origin": request.headers().origin || "http://localhost:3131",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization,content-type,x-nostalgiar-request",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    };
    const reply = (json: unknown, status = 200) => route.fulfill({ status, headers, json });
    const empty = () => route.fulfill({ status: 204, headers });
    const paged = (items: unknown[], next: string | null = null) => ({
      items,
      siguienteCursor: next,
      hayMas: next !== null,
    });
    if (request.method() === "OPTIONS") return empty();
    requests.push(`${request.method()} ${path}${url.search}`);
    if (path === "/api/auth/refresh")
      return viewer === null
        ? reply({}, 401)
        : reply({
            token: "test-token",
            usuarioId: viewer,
            username: viewer === 1 ? "ana" : "visitante",
            email: "prueba@example.test",
            esAdmin: false,
          });
    if (path === "/api/categorias-cuenta/me")
      return reply({
        categoria: { codigo: "Nostalgico", nombre: "Nostálgico", permisos: ["CrearRecuerdo"] },
        publicacionesConsumidas: 0,
        publicacionesRestantes: 5,
        maximoAdjuntos: 1,
        semanaInicio: "2026-11-15",
        reinicioSemana: "2026-11-22",
      });
    if (path === "/api/capsulas/mias")
      return viewer === 1 ? reply(paged(capsules)) : reply({}, 401);
    if (path === "/api/capsulas" && request.method() === "GET")
      return reply(paged(capsules.filter((c) => c.visibilidad === 1)));
    if (path === "/api/capsulas/recuerdos-disponibles")
      return reply(
        paged(
          originalPublications.map((p) => ({
            id: p.id,
            titulo: p.titulo,
            fecha: p.fecha,
            portadaUrl: null,
            yaAgregado:
              memberships.get(Number(url.searchParams.get("capsulaId")))?.includes(p.id) ?? false,
          })),
        ),
      );
    if (path === "/api/capsulas" && request.method() === "POST") {
      const body = request.postDataJSON();
      bodies.push(body);
      const capsule = {
        ...capsules[0],
        ...body,
        id: 5,
        cantidadRecuerdos: body.publicacionesIds.length,
        puedeAdministrar: true,
      };
      capsules.push(capsule);
      memberships.set(5, body.publicacionesIds);
      return reply(capsule, 201);
    }
    const match = /^\/api\/capsulas\/(\d+)(?:\/(recuerdos|mapa))?$/.exec(path);
    if (match) {
      const id = Number(match[1]);
      const capsule = capsules.find((c) => c.id === id);
      if (!capsule || (capsule.visibilidad === 0 && viewer !== 1))
        return reply({ detail: "La cápsula no existe o no está disponible." }, 404);
      const visible = originalPublications.filter((p) => memberships.get(id)?.includes(p.id));
      if (!match[2] && request.method() === "PUT") {
        const body = request.postDataJSON();
        bodies.push(body);
        Object.assign(capsule, body);
        return reply(capsule);
      }
      if (!match[2] && request.method() === "DELETE") {
        capsules.splice(capsules.indexOf(capsule), 1);
        memberships.delete(id);
        return empty();
      }
      if (!match[2]) return reply(capsule);
      if (match[2] === "recuerdos" && request.method() === "GET") return reply(paged(visible));
      if (match[2] === "recuerdos" && request.method() === "DELETE") {
        memberships.set(
          id,
          (memberships.get(id) ?? []).filter(
            (p) => p !== Number(url.searchParams.get("publicacionId")),
          ),
        );
        capsule.cantidadRecuerdos--;
        return empty();
      }
      if (match[2] === "recuerdos" && request.method() === "POST") {
        const body = request.postDataJSON();
        bodies.push(body);
        memberships.set(id, [
          ...new Set([...(memberships.get(id) ?? []), ...body.publicacionesIds]),
        ] as number[]);
        capsule.cantidadRecuerdos = memberships.get(id)!.length;
        return empty();
      }
      if (match[2] === "mapa") {
        const pins = visible.map((p) => ({
          id: p.id,
          titulo: p.titulo,
          año: Number(p.fecha.slice(0, 4)),
          categoria: p.categoria,
          ...p.lugar,
        }));
        return reply({
          ...paged(
            url.searchParams.has("cursor") ? pins.slice(1) : pins.slice(0, 1),
            !url.searchParams.has("cursor") && pins.length > 1 ? "more" : null,
          ),
          limites: { minLatitud: -38, maxLatitud: 35, minLongitud: -57, maxLongitud: 139 },
        });
      }
    }
    return reply([]);
  });
  return { requests, bodies, publications: originalPublications, capsules };
}

test("crea una cápsula privada con un recuerdo propio y abre su recorrido", async ({ page }) => {
  const state = await prepare(page);
  await page.goto("/capsulas?era=1990");
  await page.getByRole("button", { name: "Nueva cápsula", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Una nueva cápsula" });
  await dialog.getByLabel("Nombre", { exact: true }).fill("Mis veranos");
  await dialog.getByRole("checkbox", { name: /Veranos en la costa/ }).check();
  await dialog.getByRole("button", { name: "Crear cápsula", exact: true }).click();
  await expect(page).toHaveURL(/\/capsulas\/5/);
  await expect(page.getByRole("heading", { name: "Mis veranos", exact: true })).toBeVisible();
  await expect(page.getByText("Solo vos podés ver esta cápsula.", { exact: false })).toBeVisible();
  expect(state.bodies[0]).toMatchObject({
    nombre: "Mis veranos",
    visibilidad: 0,
    publicacionesIds: [11],
  });
  expect(state.bodies[0]).not.toHaveProperty("propietarioId");
});

test("las tarjetas cambian con la década sin volver a pedir ni filtrar las cápsulas", async ({
  page,
}) => {
  const state = await prepare(page);
  await page.goto("/capsulas?era=1970");
  await expect(page.getByRole("heading", { name: "Mis cápsulas", exact: true })).toBeVisible();
  const requests = () =>
    state.requests.filter((request) => request.startsWith("GET /api/capsulas/mias")).length;
  await expect(page.locator('a[href="/capsulas/4"] [data-medium]')).toHaveAttribute(
    "data-medium",
    "cassette",
  );
  const before = requests();
  for (const [decade, medium] of [
    [1980, "vhs"],
    [1990, "disc"],
    [2000, "usb"],
    [2010, "phone"],
    [2020, "cloud"],
  ] as const) {
    await page.getByRole("button", { name: `Década de ${decade}`, exact: true }).click();
    await expect(page.locator('a[href="/capsulas/4"] [data-medium]')).toHaveAttribute(
      "data-medium",
      medium,
    );
  }
  expect(requests()).toBe(before);
});

test("el hilo conserva décadas distintas y el mapa carga solo los pines de la cápsula", async ({
  page,
}) => {
  const state = await prepare(page);
  await page.goto("/capsulas/4?era=1980");
  await expect(page.getByRole("heading", { name: "Veranos en la costa" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "El mundial en familia" })).toBeVisible();
  await page.getByRole("button", { name: "Década de 2000", exact: true }).click();
  await expect(page.getByRole("heading", { name: "El mundial en familia" })).toBeVisible();
  await page.getByRole("button", { name: "Ver en el mapa", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cargar más lugares", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cargar más lugares", exact: true }).click();
  await expect(page.getByText("2 lugares para volver a visitar.", { exact: true })).toBeVisible();
  expect(
    state.requests.filter((request) => request.includes("/api/publicaciones/mapa")),
  ).toHaveLength(0);
  expect(
    state.requests
      .filter((request) => request.includes("/api/capsulas/4/"))
      .every((request) => !request.includes("fechaDesde")),
  ).toBe(true);
});

test("un visitante recorre una cápsula pública y no recibe acciones de administración", async ({
  page,
}) => {
  await prepare(page, { viewer: 2, public: true });
  await page.goto("/capsulas/4");
  await expect(page.getByRole("heading", { name: "Nuestra historia", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sumar recuerdos", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Eliminar cápsula", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Editar", exact: true })).toHaveCount(0);
});

test("una cápsula privada ajena no muestra su título ni pide hilo o mapa", async ({ page }) => {
  const state = await prepare(page, { viewer: 2 });
  await page.goto("/capsulas/4");
  await expect(
    page.getByRole("heading", { name: "No pudimos abrir esta cápsula", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nuestra historia", exact: true })).toHaveCount(0);
  expect(state.requests.some((request) => /\/capsulas\/4\/(recuerdos|mapa)/.test(request))).toBe(
    false,
  );
});

test("quitar un recuerdo y borrar la cápsula conserva las publicaciones", async ({ page }) => {
  const state = await prepare(page);
  await page.goto("/capsulas/4");
  await page.getByRole("button", { name: "Quitar de la cápsula", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Veranos en la costa" })).toHaveCount(0);
  await page.getByRole("button", { name: "Eliminar cápsula", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "¿Eliminar esta cápsula?" });
  await dialog.getByRole("button", { name: "Eliminar cápsula", exact: true }).click();
  await expect(page).toHaveURL(/\/capsulas$/);
  expect(state.publications).toHaveLength(2);
  expect(state.requests.some((request) => request.startsWith("DELETE /api/publicaciones/"))).toBe(
    false,
  );
});

test("permite subir una portada con vista previa y conserva el formulario si falla el guardado", async ({
  page,
}) => {
  const state = await prepare(page);
  let fail = true;
  const uploaded: string[] = [];
  await page.route("**/api/capsulas/4", async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    const headers = {
      "access-control-allow-origin": "http://localhost:3131",
      "access-control-allow-credentials": "true",
    };
    uploaded.push(route.request().postData() ?? "");
    if (fail)
      return route.fulfill({
        status: 503,
        headers,
        json: { detail: "No pudimos guardar la portada." },
      });
    Object.assign(state.capsules[0], {
      portadaSubida: true,
      portadaUrl: "/api/capsulas/4/portada",
      fechaActualizacion: "2026-11-17T15:00:00Z",
    });
    return route.fulfill({ headers, json: state.capsules[0] });
  });
  await page.goto("/capsulas/4");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar cápsula", exact: true });
  await dialog.getByRole("radio", { name: "Subir una foto", exact: true }).check();
  const input = dialog.getByLabel("Foto de tu dispositivo");
  await input.setInputFiles({
    name: "foto.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(dialog.getByRole("alert")).toHaveText(/JPG, PNG o WebP/);
  expect(uploaded).toHaveLength(0);
  await input.setInputFiles({
    name: "portada.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(dialog.getByAltText("Vista previa de la portada")).toHaveAttribute("src", /^blob:/);
  await dialog.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("No pudimos guardar la portada.");
  await expect(dialog.getByAltText("Vista previa de la portada")).toBeVisible();
  expect(state.capsules[0].portadaSubida).toBeFalsy();
  fail = false;
  await dialog.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(uploaded).toHaveLength(2);
  expect(uploaded[1]).toContain('name="Archivo"; filename="portada.png"');
  expect(uploaded[1]).not.toContain('name="PortadaPublicacionId"');
  expect(state.requests.some((r) => r.startsWith("POST /api/publicaciones"))).toBe(false);
});
