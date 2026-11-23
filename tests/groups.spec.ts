import { expect, test, type Page, type Request } from "@playwright/test";

const session = {
  token: "token-test",
  usuarioId: 1,
  username: "ana",
  email: "ana@example.com",
  esAdmin: false,
};

for (const destination of ["/feed?scope=12", "/feed?tab=groups&scope=12"]) {
  test(`abre directamente el grupo sin consultar Para vos: ${destination}`, async ({ page }) => {
    await mockApi(page);
    const feedRequests: string[] = [];
    let releaseGroups!: () => void;
    let releaseMemories!: () => void;
    const groupsGate = new Promise<void>((resolve) => {
      releaseGroups = resolve;
    });
    const memoriesGate = new Promise<void>((resolve) => {
      releaseMemories = resolve;
    });
    await page.route("**/api/feed/**", (route) => {
      if (route.request().method() !== "OPTIONS")
        feedRequests.push(new URL(route.request().url()).pathname);
      return route.fulfill({ json: { items: [], siguienteCursor: null, hayMas: false } });
    });
    await page.route("**/api/grupos", async (route) => {
      await groupsGate;
      await route.fulfill({
        json: [
          {
            id: 12,
            nombre: "Nuestro barrio",
            descripcion: "Historias del barrio",
            decada: 2020,
            esIntegrante: true,
            esCreador: true,
          },
        ],
      });
    });
    await page.route("**/api/grupos/12/recuerdos", async (route) => {
      await memoriesGate;
      await route.fulfill({
        json: [
          {
            id: 73,
            titulo: "Recuerdo publicado en el grupo",
            descripcion: "Un recuerdo también incluido en dos cápsulas",
            fecha: "2022-12-18T00:00:00Z",
            fechaCreacion: "2026-11-17T12:00:00Z",
            categoria: 0,
            urlMultimedia: "",
            tipoMultimedia: 0,
            autor: { id: 1, username: "ana" },
            lugar: { nombre: "Plaza", latitud: -34, longitud: -58 },
            grupo: { id: 12 },
          },
        ],
      });
    });
    try {
      await page.goto(destination);
      await expect(
        page.getByRole("button", { name: "Mis grupos", exact: true }).first(),
      ).toHaveAttribute("aria-pressed", "true");
      expect(feedRequests).toEqual([]);
      releaseGroups();
      await expect(
        page.getByRole("heading", { name: "Nuestro barrio", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("status").filter({ hasText: "Cargando recuerdos del grupo" }),
      ).toBeVisible();
      await expect(
        page.getByText("Este grupo no tiene publicaciones para esta época y categoría", {
          exact: true,
        }),
      ).toHaveCount(0);
      releaseMemories();
      await expect(
        page.getByRole("heading", { name: "Recuerdo publicado en el grupo", exact: true }),
      ).toBeVisible();
      expect(feedRequests).toEqual([]);
      await page.getByRole("button", { name: "Para vos", exact: true }).click();
      await expect
        .poll(() => feedRequests.some((path) => path === "/api/feed/para-vos"))
        .toBe(true);
      await expect(page.getByRole("button", { name: "Para vos", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.goBack();
      await expect(
        page.getByRole("heading", { name: "Nuestro barrio", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Mis grupos", exact: true }).first(),
      ).toHaveAttribute("aria-pressed", "true");
    } finally {
      releaseGroups();
      releaseMemories();
    }
  });
}

async function mockApi(page: Page) {
  let createdBody: Record<string, unknown> | null = null;

  await page.route("**/api/**", async (route) => {
    const request: Request = route.request();
    const url = new URL(request.url());
    const origin = request.headers().origin ?? "http://localhost:3107";
    const headers = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };

    if (request.method() === "OPTIONS") return route.fulfill({ headers, status: 204 });

    if (url.pathname === "/api/auth/refresh") {
      return route.fulfill({ headers, json: session });
    }
    if (url.pathname === "/api/grupos" && request.method() === "POST") {
      createdBody = request.postDataJSON();
      return route.fulfill({
        headers,
        status: 201,
        json: {
          id: 45,
          nombre: createdBody?.nombre,
          descripcion: createdBody?.descripcion,
          decada: createdBody?.decada,
          fechaCreacion: "2026-10-20T18:00:00Z",
          creador: { id: 1, username: "ana" },
          cantidadIntegrantes: 1,
          esIntegrante: true,
          esCreador: true,
        },
      });
    }
    if (url.pathname === "/api/grupos") return route.fulfill({ headers, json: [] });
    if (url.pathname === "/api/publicaciones/mapa") {
      return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    }
    if (url.pathname === "/api/publicaciones") return route.fulfill({ headers, json: [] });
    if (url.pathname === "/api/chat/conversaciones") return route.fulfill({ headers, json: [] });
    if (url.pathname.includes("/api/seguimientos/")) return route.fulfill({ headers, json: [] });
    if (url.pathname.startsWith("/api/feed/")) {
      return route.fulfill({ headers, json: { items: [], siguienteCursor: null, hayMas: false } });
    }
    return route.fulfill({ headers, json: {} });
  });

  return () => createdBody;
}

for (const viewport of [
  { name: "escritorio", width: 1440, height: 1000 },
  { name: "móvil", width: 390, height: 844 },
]) {
  test(`crea un grupo y mantiene el formulario responsive en ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const createdBody = await mockApi(page);
    await page.goto("/explorar?era=1990");
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await page.getByRole("button", { name: "Feed", exact: true }).click();
    if (viewport.width < 900) {
      await page.getByText("Tendencias, búsqueda y comunidad", { exact: true }).click();
    }
    await page.getByRole("button", { name: "Mis grupos", exact: true }).click();
    await page.getByRole("button", { name: "Crear grupo", exact: true }).click();

    const form = page.locator(".community-create-form");
    await expect(form).toBeVisible();
    await expect(form).toContainText("1990–1999");
    expect(await form.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

    await page.getByRole("textbox", { name: "Nombre del grupo" }).fill("Cine de los 90");
    await page
      .getByRole("textbox", { name: "Descripción" })
      .fill("Películas que marcaron la década.");
    await form.getByRole("button", { name: "Crear grupo", exact: true }).click();

    await expect(form).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Cine de los 90", exact: true })).toBeVisible();
    const publishInGroup = page.getByRole("button", {
      name: "Publicar recuerdo en este grupo",
      exact: true,
    });
    await expect(publishInGroup).toBeVisible();
    expect(createdBody()).toEqual({
      nombre: "Cine de los 90",
      descripcion: "Películas que marcaron la década.",
      decada: 1990,
    });
    await publishInGroup.click();
    await expect(page.getByText("Elegí un lugar en el mapa para tu recuerdo.")).toBeVisible();
  });
}

test("abre un grupo compartido, copia su enlace y permite volver con el navegador", async ({
  page,
  context,
}) => {
  await mockApi(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/grupos", (route) =>
    route.fulfill({
      json: [
        {
          id: 12,
          nombre: "Cine de los 80",
          descripcion: "Nuestro cine compartido",
          decada: 1980,
          esIntegrante: false,
          esCreador: false,
        },
      ],
    }),
  );
  await page.route("**/api/grupos/12/recuerdos", (route) => route.fulfill({ json: [] }));
  await page.goto("/feed?scope=12");
  await expect(page.getByRole("heading", { name: "Cine de los 80", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unirme al grupo", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compartir grupo", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "¡Enlace copiado!" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    new URL("/feed?scope=12", page.url()).href,
  );
  await page.getByRole("button", { name: "Mis grupos", exact: true }).click();
  await expect(page).toHaveURL(/scope=groups/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Cine de los 80", exact: true })).toBeVisible();
});

test("informa cuando el grupo compartido no existe", async ({ page }) => {
  await mockApi(page);
  await page.goto("/feed?scope=999");
  await expect(
    page.getByRole("alert").filter({ hasText: "Este grupo no existe o ya no está disponible." }),
  ).toBeVisible();
});
