import { expect, test, type Page } from "@playwright/test";

const token = `${"a".repeat(32)}.${"B".repeat(43)}`;

async function mockRecovery(page: Page, status = 204) {
  const requests: { path: string; body: unknown }[] = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": request.headers().origin ?? "http://localhost:3101",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type, x-nostalgiar-request",
      "access-control-allow-methods": "POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ headers, status: 204 });
    if (path === "/api/auth/refresh") return route.fulfill({ headers, status: 401, json: {} });
    requests.push({ path, body: request.postDataJSON() });
    if (status >= 400)
      return route.fulfill({
        headers,
        status,
        json: { mensaje: "No se pudo completar la solicitud." },
      });
    if (path === "/api/auth/recuperar-contrasena")
      return route.fulfill({ headers, status: 202, json: { mensaje: "Solicitud recibida" } });
    return route.fulfill({ headers, status: 204 });
  });
  return requests;
}

test("desde el login se puede pedir un enlace sin revelar si el correo existe", async ({
  page,
}) => {
  const requests = await mockRecovery(page);
  await page.goto("/auth/login");
  await page.getByRole("link", { name: "Olvidé mi contraseña" }).click();
  await expect(page).toHaveURL(/\/auth\/recuperar$/);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("ana@example.com");
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toHaveValue(
    "ana@example.com",
  );
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("region").getByRole("status")).toContainText(
    "Si existe una cuenta con ese correo",
  );
  expect(requests).toEqual([
    { path: "/api/auth/recuperar-contrasena", body: { email: "ana@example.com" } },
  ]);
});

test("el enlace permite cambiar la clave, se borra de la URL y termina en el login", async ({
  page,
}) => {
  const requests = await mockRecovery(page);
  await page.goto(`/auth/restablecer#token=${token}`);
  await expect(page.getByRole("heading", { name: "Nueva contraseña", exact: true })).toBeVisible();
  const password = page.locator('input[name="nuevaContrasena"]');
  await expect(password).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/restablecer$/);
  await password.fill("nueva-clave-123");
  await page.locator('input[name="confirmacionContrasena"]').fill("otra-clave-123");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByRole("region").getByRole("alert")).toContainText(
    "Las contraseñas no coinciden",
  );
  expect(requests).toHaveLength(0);
  await page.locator('input[name="confirmacionContrasena"]').fill("nueva-clave-123");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByRole("heading", { name: "Contraseña actualizada" })).toBeVisible();
  expect(requests).toEqual([
    {
      path: "/api/auth/restablecer-contrasena",
      body: {
        token,
        nuevaContrasena: "nueva-clave-123",
        confirmacionContrasena: "nueva-clave-123",
      },
    },
  ]);
  expect(
    await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]),
  ).not.toContainEqual(expect.stringContaining(token));
  await page.getByRole("link", { name: "Volver a iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("un enlace vencido o usado permite solicitar uno nuevo", async ({ page }) => {
  await mockRecovery(page, 400);
  await page.goto(`/auth/restablecer#token=${token}`);
  await page.locator('input[name="nuevaContrasena"]').fill("nueva-clave-123");
  await page.locator('input[name="confirmacionContrasena"]').fill("nueva-clave-123");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByRole("heading", { name: "Pedí un nuevo enlace" })).toBeVisible();
  await page.getByRole("link", { name: "Solicitar otro enlace" }).click();
  await expect(page).toHaveURL(/\/auth\/recuperar$/);
});

test("sin token no envía una solicitud de cambio de clave", async ({ page }) => {
  const requests = await mockRecovery(page);
  await page.goto("/auth/restablecer#token=malformado");
  await expect(page.getByRole("heading", { name: "Pedí un nuevo enlace" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar contraseña" })).toHaveCount(0);
  expect(requests).toHaveLength(0);
});

for (const status of [429, 503]) {
  test(`explica cómo continuar cuando el servidor responde ${status}`, async ({ page }) => {
    await mockRecovery(page, status);
    await page.goto("/auth/recuperar");
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("ana@example.com");
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByRole("region").getByRole("alert")).toContainText(
      status === 429 ? "Esperá unos minutos" : "Intentá de nuevo más tarde",
    );
    await expect(page.getByRole("button", { name: "Enviar enlace" })).toBeEnabled();
  });
}
