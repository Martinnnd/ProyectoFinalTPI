import { expect, test, type Page } from "@playwright/test";

const musicPanel = (page: Page) => page.getByRole("region", { name: "Ranking musical del perfil" });
async function openRanking(page: Page) {
  await page.goto("/perfil?era=1980");
  const panel = musicPanel(page);
  await expect(panel.getByText("Billie Jean", { exact: true })).toBeVisible();
  return panel;
}

test("perfil concentra el ranking, muestra voto al hacer hover y explica la sugerencia bloqueada", async ({
  page,
}) => {
  const state = await prepare(page, { profile: true });
  const panel = await openRanking(page);
  await expect(
    page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("button", { name: "Ranking musical" }),
  ).toHaveCount(0);
  await expect(panel.getByText("Elegimos la banda sonora")).toHaveCount(0);
  await expect(panel.getByRole("button", { name: /Actualizar/ })).toHaveCount(0);
  await expect(panel.locator('a[href^="/musica"]')).toHaveCount(0);
  await expect(panel.getByText(/puntos disponibles hoy/)).toHaveCount(0);
  await expect(panel.getByLabel(/Cierre de la ronda/)).toBeVisible();
  const vote = panel.getByRole("form", { name: "Aportar a Billie Jean" });
  await expect(vote).toBeHidden();
  await panel.getByText("Billie Jean", { exact: true }).hover();
  await expect(vote).toBeVisible();
  await panel.getByLabel("Puntos para Billie Jean").fill("2");
  await vote.getByRole("button", { name: "Dar puntos" }).click();
  await expect(
    page.getByRole("button", { name: /3 de 5 puntos diarios disponibles/ }),
  ).toBeVisible();
  const suggest = panel.getByRole("button", { name: "Sugerir canción", exact: true });
  await expect(suggest).toBeDisabled();
  await panel.locator('span[aria-label^="Tu categoría no permite"]').hover();
  await expect(panel.getByRole("tooltip", { name: /Tu categoría/ })).toBeVisible();
  expect(state.requests.filter((request) => request.path.endsWith("/sugerencias"))).toHaveLength(0);
  await page.screenshot({ path: "test-results/profile-music-ranking.png" });
});

test("selector general cambia el ranking del perfil y conserva posiciones y explicaciones", async ({
  page,
}) => {
  await prepare(page, { profile: true, many: true });
  const panel = await openRanking(page);
  await expect(panel.getByRole("heading", { name: "Ranking musical 1980" })).toBeVisible();
  await expect(panel.getByRole("group", { name: "Ranking por década" })).toHaveCount(0);
  const decadeSelector = page.getByRole("group", { name: "Elegir década", exact: true });
  await decadeSelector.getByRole("button", { name: "Década de 1990", exact: true }).click();
  await expect(panel.getByRole("heading", { name: "Ranking musical 1990" })).toBeVisible();
  await expect(panel.getByText("De música ligera", { exact: true })).toBeVisible();
  await expect(panel.getByText("Billie Jean", { exact: true })).toHaveCount(0);
  await decadeSelector.getByRole("button", { name: "Década de 2000", exact: true }).click();
  await expect(panel.getByRole("heading", { name: "Ranking musical 2000" })).toBeVisible();
  await expect(panel.getByText("Todavía no hay canciones de 2000 en esta ronda.")).toBeVisible();
  await decadeSelector.getByRole("button", { name: "Década de 1980", exact: true }).click();
  const songs = panel.getByRole("list", { name: "Ranking de 1980" });
  await expect(songs.locator(":scope > li")).toHaveCount(8);
  expect(await songs.locator(":scope > li strong").allTextContents()).toEqual([
    "Billie Jean",
    "Canción 3",
    "Canción 2",
    "Canción 4",
    "Canción 5",
    "Canción 6",
    "Canción 7",
    "Canción 8",
  ]);
  await expect(panel.locator('[data-winner="true"]')).toHaveCount(3);
  await panel.getByLabel(/^Puesto 1\./).hover();
  await expect(
    panel.getByRole("tooltip", { name: /Se incorporan a la lista de reproducción/ }),
  ).toBeVisible();
  await panel.getByLabel(/^Puesto 4\./).hover();
  await expect(
    panel.getByRole("tooltip", { name: /Clasifican a la siguiente ronda/ }),
  ).toBeVisible();
  expect(await songs.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(
    true,
  );
  await panel
    .getByRole("button", { name: "Sugerir canción", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    panel.getByRole("button", { name: "Sugerir canción", exact: true }),
  ).toBeInViewport();
});

test("cuenta habilitada sugiere desde la década seleccionada", async ({ page }) => {
  const state = await prepare(page, { profile: true, suggest: true });
  const panel = await openRanking(page);
  await panel.getByRole("button", { name: "Sugerir canción", exact: true }).click();
  const form = panel.getByRole("form", { name: "Sugerir canción" });
  await form.getByLabel("Título", { exact: true }).fill("Take on Me");
  await form.getByLabel("Artista", { exact: true }).fill("a-ha");
  await form.getByRole("button", { name: "Sugerir canción", exact: true }).click();
  await expect(panel.getByText("Tu canción ya participa en la ronda.")).toBeVisible();
  expect(state.requests.find((request) => request.path.endsWith("/sugerencias"))?.body).toEqual({
    decada: 1980,
    titulo: "Take on Me",
    artista: "a-ha",
  });
});

test("perfil permite corregir antes del primer voto y retirar con confirmación", async ({
  page,
}) => {
  const state = await prepare(page, { profile: true });
  const panel = await openRanking(page);
  await panel.getByText("Billie Jean", { exact: true }).hover();
  await panel.getByRole("button", { name: "Editar", exact: true }).click();
  await panel.getByLabel("Título", { exact: true }).fill("Billie Jean corregida");
  await panel.getByRole("button", { name: "Guardar corrección", exact: true }).click();
  await expect(panel.getByText("Billie Jean corregida", { exact: true })).toBeVisible();
  await panel.getByText("Billie Jean corregida", { exact: true }).hover();
  await panel.getByLabel("Puntos para Billie Jean corregida").fill("2");
  await panel.getByRole("button", { name: "Dar puntos", exact: true }).click();
  await expect(panel.getByText("Sumaste 2 puntos a la canción.")).toBeVisible();
  await panel.getByText("Billie Jean corregida", { exact: true }).hover();
  await expect(panel.getByRole("button", { name: "Editar", exact: true })).toBeDisabled();
  await panel.getByRole("button", { name: "Retirar", exact: true }).click();
  expect(state.requests.filter((request) => request.method === "DELETE")).toHaveLength(0);
  await panel.getByRole("button", { name: "Confirmar retiro" }).click();
  await expect(panel.getByText("Todavía no hay canciones de 1980 en esta ronda.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /3 de 5 puntos diarios disponibles/ }),
  ).toBeVisible();
});

test("429 actualiza saldo sin repetir el voto", async ({ page }) => {
  const state = await prepare(page, { profile: true });
  const panel = await openRanking(page);
  state.reject();
  await panel.getByText("Billie Jean", { exact: true }).hover();
  await panel.getByRole("button", { name: "Dar puntos", exact: true }).click();
  await expect(panel.getByText(/Puntos consumidos en publicaciones/)).toBeVisible();
  await panel.getByText("Billie Jean", { exact: true }).hover();
  await expect(panel.getByRole("button", { name: "Dar puntos", exact: true })).toBeDisabled();
  expect(state.requests.filter((request) => request.path.endsWith("/puntuacion"))).toHaveLength(1);
});

test("móvil puede desplegar la puntuación con un toque y navegar a la última canción", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, { profile: true, many: true });
  const panel = await openRanking(page);
  await panel.getByRole("button", { name: /Billie Jean Michael Jackson/ }).click();
  await expect(panel.getByLabel("Puntos para Billie Jean")).toBeVisible();
  await panel.getByText("Canción 8", { exact: true }).scrollIntoViewIfNeeded();
  await expect(panel.getByText("Canción 8", { exact: true })).toBeInViewport();
  expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: "test-results/profile-music-ranking-mobile.png" });
});

test("antiguas URLs de música llevan al perfil", async ({ page }) => {
  await prepare(page, { profile: true });
  for (const path of ["/musica", "/musica/resultados"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/perfil(?:\?[^#]*)?#ranking-musical$/);
    await expect(musicPanel(page)).toBeVisible();
  }
});

test("administrador carga desde el panel existente", async ({ page }) => {
  const state = await prepare(page, { admin: true });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Ranking musical" }).click();
  await page.getByLabel("Década", { exact: true }).fill("1980");
  await page.getByLabel("Título", { exact: true }).fill("Take on Me");
  await page.getByLabel("Artista", { exact: true }).fill("a-ha");
  await page.getByRole("button", { name: "Cargar canción", exact: true }).click();
  await expect(page.getByText("Se agregó «Take on Me» a la ronda vigente.")).toBeVisible();
  expect(
    state.requests.find((request) => request.path === "/api/admin/ranking-musica")?.body,
  ).toEqual({ decada: 1980, titulo: "Take on Me", artista: "a-ha" });
});

async function prepare(
  page: Page,
  options: {
    guest?: boolean;
    admin?: boolean;
    empty?: boolean;
    profile?: boolean;
    suggest?: boolean;
    many?: boolean;
  } = {},
) {
  let total = options.many ? 9 : 0;
  let remaining = 5;
  let retired = false;
  let rejected = false;
  let title = "Billie Jean";
  const requests: { method: string; path: string; body: unknown }[] = [];
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  await page.route("**/hubs/**", (route) => route.fulfill({ status: 404, json: {} }));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": request.headers().origin || "http://localhost:3134",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization,content-type",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    };
    const reply = (json: unknown, status = 200) => route.fulfill({ status, headers, json });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    requests.push({ method: request.method(), path, body: request.postDataJSON() });
    if (path === "/api/auth/refresh")
      return reply(
        options.guest
          ? {}
          : {
              token: "test-token",
              usuarioId: 7,
              username: "ana",
              email: "ana@example.test",
              esAdmin: options.admin ?? false,
            },
        options.guest ? 401 : 200,
      );
    if (path === "/api/categorias-cuenta/me")
      return reply({
        categoria: {
          codigo: "Nostalgico",
          nombre: "Nostálgico",
          publicacionesSemanales: 5,
          publicacionesIlimitadas: false,
          permitePrimerRecuerdo: false,
          prioridadVisibilidad: "Normal",
          permisos: ["VotarCancion", ...(options.suggest ? ["SugerirMusica"] : [])],
        },
        publicacionesConsumidas: 1,
        publicacionesRestantes: 4,
        semanaInicio: "2026-11-16",
        reinicioSemana: "2026-11-23",
        maximoAdjuntos: 1,
      });
    if (path === "/api/usuario/7/perfil")
      return reply({
        id: 7,
        username: "ana",
        fotoPerfilUrl: null,
        reputacion: "Nostálgico",
        puntosNostalgia: 0,
        cantidadPublicaciones: 0,
        cantidadSeguidores: 0,
        cantidadSeguidos: 0,
        loSigo: false,
        logros: [],
      });
    const song = {
      id: 12,
      creadorId: 7,
      decada: 1980,
      titulo: title,
      artista: "Michael Jackson",
      puntos: total,
    };
    if (path === "/api/ranking-musica/actual")
      return reply(
        options.empty
          ? {}
          : {
              id: 4,
              apertura: "2020-01-01T03:00:00Z",
              cierre: "2035-01-01T03:00:00Z",
              saldo: options.guest
                ? null
                : { cupo: 5, puntosRestantes: remaining, reinicio: "2030-11-22T03:00:00Z" },
              decadas: retired
                ? []
                : [
                    {
                      decada: 1980,
                      candidaturas: [
                        song,
                        ...(options.many
                          ? [5, 6, 4, 3, 2, 1, 0].map((puntos, index) => ({
                              ...song,
                              id: 20 + index,
                              titulo: `Canción ${index + 2}`,
                              puntos,
                            }))
                          : []),
                      ],
                    },
                    ...(options.profile
                      ? [
                          {
                            decada: 1990,
                            candidaturas: [
                              {
                                ...song,
                                id: 13,
                                decada: 1990,
                                titulo: "De música ligera",
                                artista: "Soda Stereo",
                              },
                            ],
                          },
                        ]
                      : []),
                  ],
            },
        options.empty ? 404 : 200,
      );
    if (path === "/api/ranking-musica/puntuacion") {
      if (rejected) {
        remaining = 0;
        return reply({ detail: "Puntos consumidos en publicaciones" }, 429);
      }
      const body = request.postDataJSON();
      total += body.puntos;
      remaining -= body.puntos;
      await new Promise((resolve) => setTimeout(resolve, 150));
      return reply({ id: 22, puntosTotales: total, puntosDiariosRestantes: remaining });
    }
    if (path === "/api/ranking-musica/12" && request.method() === "PUT") {
      title = request.postDataJSON().titulo;
      return reply({ ...song, titulo: title });
    }
    if (path === "/api/ranking-musica/12" && request.method() === "DELETE") {
      retired = true;
      return route.fulfill({ status: 204, headers });
    }
    if (path === "/api/ranking-musica/sugerencias")
      return reply({ ...song, ...request.postDataJSON() }, 201);
    if (path === "/api/admin/ranking-musica")
      return reply({ ...song, ...request.postDataJSON() }, 201);
    if (path === "/api/ranking-musica/resultados")
      return reply({
        id: 3,
        apertura: "2026-10-15T03:00:00Z",
        cierre: "2026-10-30T03:00:00Z",
        decadas: [
          {
            decada: 1980,
            ganadoras: [
              { candidaturaId: 12, posicion: 1, titulo: title, artista: song.artista, puntos: 10 },
            ],
            clasificadas: [
              { candidaturaId: 13, posicion: 4, titulo: "Take on Me", artista: "a-ha", puntos: 4 },
            ],
          },
        ],
      });
    if (path.includes("notificaciones"))
      return reply(path.endsWith("/no-leidas") ? { cantidad: 0 } : []);
    if (path.includes("logros")) return reply([]);
    if (path === "/api/admin/estadisticas") return reply({}, 500);
    return reply([]);
  });
  return {
    requests,
    reject: () => {
      rejected = true;
    },
  };
}
