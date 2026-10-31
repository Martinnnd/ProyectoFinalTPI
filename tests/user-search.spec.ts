import { expect, test, type Page, type Request } from "@playwright/test";

const session = {
  token: "token-test",
  usuarioId: 1,
  username: "ana",
  email: "ana@example.com",
  esAdmin: false,
};

async function mockApi(page: Page) {
  const followBodies: unknown[] = [];

  await page.route("**/api/**", async (route) => {
    const request: Request = route.request();
    const url = new URL(request.url());
    const origin = request.headers().origin ?? "http://localhost:3109";
    const headers = {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
      "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    };

    if (request.method() === "OPTIONS") return route.fulfill({ headers, status: 204 });
    if (url.pathname === "/api/auth/refresh") return route.fulfill({ headers, json: session });
    if (url.pathname === "/api/usuario/buscar") {
      return route.fulfill({
        headers,
        json: [
          { id: 1, username: "ana" },
          { id: 2, username: "lucia" },
          { id: 3, username: "maria" },
        ].filter((user) =>
          user.username.includes(url.searchParams.get("texto")?.toLowerCase() ?? ""),
        ),
      });
    }
    if (url.pathname === "/api/seguimientos/1/seguidos") {
      return route.fulfill({ headers, json: [{ id: 3, username: "maria" }] });
    }
    if (url.pathname === "/api/seguimientos/1/seguidores")
      return route.fulfill({ headers, json: [] });
    if (url.pathname === "/api/seguimientos" && request.method() === "POST") {
      followBodies.push(request.postDataJSON());
      return route.fulfill({
        headers,
        status: 201,
        json: { mensaje: "Ahora seguís a este usuario." },
      });
    }
    if (url.pathname === "/api/seguimientos" && request.method() === "DELETE") {
      return route.fulfill({ headers, status: 204 });
    }
    if (url.pathname === "/api/usuario/perfil/lucia") {
      return route.fulfill({
        headers,
        json: {
          id: 2,
          username: "lucia",
          logros: [],
          tipoUsuario: "Usuario_Personal",
          reputacion: "Errante",
          puntosNostalgia: 0,
          cantidadPublicaciones: 0,
          cantidadSeguidores: 4,
          cantidadSeguidos: 0,
          loSigo: true,
        },
      });
    }
    if (url.pathname === "/api/publicaciones/usuario/2")
      return route.fulfill({ headers, json: [] });
    if (url.pathname === "/api/grupos") return route.fulfill({ headers, json: [] });
    if (url.pathname === "/api/publicaciones/mapa")
      return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    if (url.pathname === "/api/publicaciones") return route.fulfill({ headers, json: [] });
    if (url.pathname === "/api/chat/conversaciones") return route.fulfill({ headers, json: [] });
    if (url.pathname.startsWith("/api/feed/"))
      return route.fulfill({ headers, json: { items: [], siguienteCursor: null, hayMas: false } });
    return route.fulfill({ headers, json: {} });
  });

  return followBodies;
}

test("busca usuarios, muestra inicial, sigue y abre el perfil", async ({ page }) => {
  const followBodies = await mockApi(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/explorar?era=1990");
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

  await page.getByRole("button", { name: "Buscar usuarios", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Buscar usuarios" });
  await expect(dialog).toBeVisible();
  const search = dialog.getByRole("searchbox", { name: "Nombre de usuario" });
  await expect(search).toBeFocused();
  await search.fill("lu");

  const lucia = dialog.getByRole("listitem");
  await expect(lucia).toContainText("lucia");
  await expect(lucia.locator("span").first()).toHaveText("L");
  await lucia.getByRole("button", { name: "Seguir", exact: true }).click();
  await expect(lucia.getByRole("button", { name: "Dejar de seguir", exact: true })).toBeVisible();
  expect(followBodies).toEqual([{ idUsuario: 1, idUsuarioASeguir: 2 }]);

  await lucia.getByRole("button", { name: "Ver perfil", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("main", { name: "Perfil de lucia" })).toBeVisible();
  const profileActions = page.locator(".profile-visitor-actions");
  const chatButton = profileActions.getByRole("button", { name: "Iniciar chat", exact: true });
  const unfollowButton = profileActions.getByRole("button", {
    name: "Dejar de seguir",
    exact: true,
  });
  await expect(chatButton).toBeVisible();
  await expect(unfollowButton).toBeVisible();
  expect((await chatButton.boundingBox())?.y).toBe((await unfollowButton.boundingBox())?.y);
  await unfollowButton.click();
  await expect(profileActions.getByRole("button", { name: "Seguir", exact: true })).toBeVisible();
  await expect(page.locator(".personal-counts")).toContainText("3 Seguidores");
});

test("identifica el perfil propio y cierra con Escape", async ({ page }) => {
  await mockApi(page);
  await page.goto("/explorar");
  await page.getByRole("button", { name: "Buscar usuarios", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Buscar usuarios" });
  await dialog.getByRole("searchbox", { name: "Nombre de usuario" }).fill("an");
  await expect(dialog.getByRole("button", { name: "Tu perfil", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Seguir", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Buscar usuarios", exact: true })).toBeFocused();
});
