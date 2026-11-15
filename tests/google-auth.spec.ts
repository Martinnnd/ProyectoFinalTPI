import { expect, test } from "@playwright/test";

test("cuenta anterior entra directamente; cuenta nueva elige username sin contraseña", async ({
  page,
}) => {
  let signup = false;
  let occupied = true;
  const requests: Record<string, unknown>[] = [];
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.google = {accounts:{id:{initialize(o){this.options=o},cancel(){},renderButton(el){const b=document.createElement('button');b.type='button';b.textContent='Continuar con Google';b.onclick=()=>this.options.callback({credential:'verified-in-server-tests'});el.appendChild(b)}}}};`,
    }),
  );
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      "access-control-allow-origin": route.request().headers().origin ?? "http://localhost:3101",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type,x-nostalgiar-request,authorization",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (path === "/api/auth/google/config")
      return route.fulfill({
        headers,
        json: { habilitado: true, clientId: "public-client", nonce: "challenge" },
      });
    if (path === "/api/auth/google") {
      const body = route.request().postDataJSON();
      requests.push(body);
      if (signup && !body.username)
        return route.fulfill({ headers, json: { requiereUsername: true } });
      if (signup && occupied) {
        occupied = false;
        return route.fulfill({
          headers,
          status: 409,
          json: { mensaje: "Ese nombre de usuario ya está en uso." },
        });
      }
      return route.fulfill({
        headers,
        json: {
          token: "test",
          usuarioId: signup ? 22 : 7,
          username: signup ? body.username : "maria",
          email: signup ? "pedro@gmail.com" : "maria@gmail.com",
          esAdmin: false,
        },
      });
    }
    if (path === "/api/auth/refresh") return route.fulfill({ headers, status: 401, json: {} });
    return route.fulfill({ headers, json: [] });
  });
  await page.goto("/auth/login?returnTo=/perfil");
  await page.getByRole("button", { name: "Continuar con Google", exact: true }).click();
  await expect(page).toHaveURL(/\/perfil$/);
  expect(requests).toEqual([{ credential: "verified-in-server-tests" }]);
  signup = true;
  await page.goto("/auth/registro?returnTo=/perfil");
  await page.getByRole("button", { name: "Continuar con Google", exact: true }).click();
  const username = page.locator('input[name="googleUsername"]');
  await expect(username).toBeVisible();
  await expect(page.locator('input[name="contrasena"]')).toHaveCount(0);
  await expect(page).toHaveURL(/\/auth\/registro/);
  await username.fill("pedro_nuevo");
  await page.getByRole("button", { name: "Crear mi cuenta con Google", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText(
    "Ese nombre de usuario ya está en uso.",
  );
  await username.fill("pedro_disponible");
  await page.getByRole("button", { name: "Crear mi cuenta con Google", exact: true }).click();
  await expect(page).toHaveURL(/\/perfil$/);
  expect(requests.at(-1)).toEqual({
    credential: "verified-in-server-tests",
    username: "pedro_disponible",
  });
  expect(await page.evaluate(() => localStorage.getItem("nostalgia_auth"))).toBeNull();
});

test("sin configurar Google se conserva el login actual", async ({ page }) => {
  await page.route("**/api/auth/google/config", (route) =>
    route.fulfill({
      headers: {
        "access-control-allow-origin": "http://localhost:3101",
        "access-control-allow-credentials": "true",
      },
      json: { habilitado: false },
    }),
  );
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      headers: {
        "access-control-allow-origin": "http://localhost:3101",
        "access-control-allow-credentials": "true",
      },
      status: 401,
      json: {},
    }),
  );
  await page.goto("/auth/login");
  await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
  await expect(page.locator('script[src="https://accounts.google.com/gsi/client"]')).toHaveCount(0);
});
