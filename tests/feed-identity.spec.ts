import { expect, test } from "@playwright/test";

test("cambiar entre Para vos y Seguidos conserva originales y reposts sin claves repetidas", async ({ page }) => {
  const duplicateKeys: string[] = [];
  page.on("console", (message) => {
    if (/Encountered two children with the same key/.test(message.text()))
      duplicateKeys.push(message.text());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const publication = (id: number) => ({
    id,
    titulo: `Recuerdo ${id}`,
    descripcion: "Una historia del barrio",
    fecha: "2022-12-18T00:00:00Z",
    fechaCreacion: "2026-11-06T10:00:00Z",
    categoria: 0,
    tipoMultimedia: 0,
    urlMultimedia: "",
    autor: { id: 2, username: "Nico" },
    lugar: { nombre: "Obelisco", latitud: -34.6, longitud: -58.38 },
  });
  const firstPublication = publication(25);
  const secondPublication = publication(26);
  const firstRepost = { ...firstPublication, reposteadoPor: { usuarioId: 3, username: "Sofi" } };
  const anotherRepost = { ...firstPublication, reposteadoPor: { usuarioId: 4, username: "Leo" } };
  const secondRepost = { ...secondPublication, reposteadoPor: { usuarioId: 3, username: "Sofi" } };
  let followingRequests = 0;
  let releaseFollowing!: () => void;
  const followingGate = new Promise<void>((resolve) => { releaseFollowing = resolve; });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = {
      "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    const respond = (json: unknown) => route.fulfill({ headers, json });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname === "/api/auth/refresh")
      return respond({ token: "test", usuarioId: 1, username: "Ana", email: "ana@test.com", esAdmin: false });
    if (url.pathname.startsWith("/api/seguimientos/"))
      return respond(url.pathname.endsWith("/seguidos")
        ? [{ id: 3, username: "Sofi" }, { id: 4, username: "Leo" }]
        : []);
    if (url.pathname.endsWith("/mapa")) return respond({ pines: [], hayMas: false });
    if (url.pathname === "/api/feed/para-vos")
      return respond({ items: [firstPublication, secondPublication], siguienteCursor: null, hayMas: false });
    if (url.pathname === "/api/feed/seguidos") {
      followingRequests++;
      await followingGate;
      return respond({
        items: [firstPublication, firstRepost, anotherRepost, firstRepost, secondPublication, secondRepost],
        siguienteCursor: null,
        hayMas: false,
      });
    }
    const id = Number(url.pathname.split("/")[3]);
    if (url.pathname.endsWith("/relaciones"))
      return respond({
        publicacionId: id,
        dia: { items: [], siguienteCursor: null, hayMas: false },
        lugar: { items: [], siguienteCursor: null, hayMas: false },
      });
    if (url.pathname.endsWith("/momentos")) return respond({ publicacionId: id, momentos: [] });
    if (url.pathname.endsWith("/analisis")) return respond({ publicacionId: id, estado: "sinMomento" });
    return respond([]);
  });

  await page.goto("/explorar?era=2020&view=feed");
  const feed = page.getByRole("region", { name: "Feed de recuerdos" });
  const cards = feed.locator(".feed-post");
  await expect(cards).toHaveCount(2);

  await feed.getByRole("button", { name: "Seguidos", exact: true }).click();
  await expect.poll(() => followingRequests).toBe(1);
  await expect(cards).toHaveCount(0);
  releaseFollowing();
  await expect(cards).toHaveCount(5);
  await expect(feed.getByRole("heading", { name: firstPublication.titulo, exact: true })).toHaveCount(3);
  await expect(feed.getByRole("heading", { name: secondPublication.titulo, exact: true })).toHaveCount(2);

  for (let turn = 0; turn < 2; turn++) {
    await feed.getByRole("button", { name: "Para vos", exact: true }).click();
    await expect(cards).toHaveCount(2);
    await feed.getByRole("button", { name: "Seguidos", exact: true }).click();
    await expect(cards).toHaveCount(5);
  }
  expect(followingRequests).toBe(1);
  expect(duplicateKeys).toEqual([]);
});
