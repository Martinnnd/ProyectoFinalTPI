import { expect, test, type Page } from "@playwright/test";

// Las fuentes externas no forman parte de estas pruebas funcionales.
test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
});

import { api, loginReal as login, openOwnProfile } from "./real-api-helpers";

test("logro real persiste al recargar y no se comparte entre cuentas", async ({
  page,
  request,
}) => {
  const suffix = Date.now();
  const users = [1, 2].map((number) => ({
    username: `logros_${suffix}_${number}`,
    email: `logros_${suffix}_${number}@example.test`,
    contrasena: "PruebaLogros123!",
  }));
  for (const user of users) {
    const response = await request.post(`${api}/api/auth/registro`, {
      data: { username: user.username, email: user.email, contraseña: user.contrasena },
      headers: { "X-Nostalgiar-Request": "1" },
    });
    expect(response.status()).toBe(201);
  }
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (
      response.url().startsWith(api) &&
      response.status() >= 400 &&
      !(response.url().endsWith("/api/auth/refresh") && response.status() === 401)
    )
      errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  const mapResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/publicaciones/mapa") && response.request().method() === "GET",
  );
  await page.goto("/explorar?era=1990");
  expect((await mapResponse).status()).toBe(200);
  await login(page, users[0].email);
  await openOwnProfile(page);
  const profile = page.locator(".personal-profile");
  await expect(
    profile.getByRole("heading", { name: users[0].username, exact: true }),
  ).toBeVisible();
  await expect(profile.locator(".achievements-count")).toHaveText("0/17");
  await expect(profile.locator(".achievement-rail img")).toHaveCount(0);
  await expect(profile.getByText("Todavía no conseguiste ninguna insignia.")).toBeVisible();
  await profile.getByRole("button", { name: "Logros", exact: true }).click();
  const initialCatalogue = page.getByRole("dialog", { name: "Todas las insignias", exact: true });
  await expect(initialCatalogue.locator(".achievement-card.is-locked")).toHaveCount(17);
  await expect(initialCatalogue.locator(".achievement-card.is-unlocked")).toHaveCount(0);
  await expect(initialCatalogue).not.toContainText("Corazón abierto");
  await initialCatalogue.getByRole("button", { name: "Cerrar catálogo de logros" }).click();
  await expect(profile.getByText("Nico Gutierrez")).toHaveCount(0);
  await expect(page.locator(".achievement-toast")).toHaveCount(0);
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  const feed = page.getByRole("region", { name: "Feed de recuerdos" });
  await feed
    .getByRole("button", { name: /^\d+ Comentar$/ })
    .first()
    .click();
  const content = `Comentario con logro ${suffix}`;
  await page.getByLabel("Comentar el recuerdo", { exact: true }).fill(content);
  const response = page.waitForResponse(
    (response) =>
      /\/api\/publicaciones\/\d+\/comentarios$/.test(response.url()) &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("region", { name: "Comentarios", exact: true })
    .getByRole("button", { name: "Comentar", exact: true })
    .click();
  expect((await response).status()).toBe(201);
  await expect(page.getByText(content, { exact: true })).toBeVisible();
  const toast = page.locator(".achievement-toast");
  await expect(toast).toContainText("¡Logro completado!");
  await expect(toast).toContainText("Primera Palabra");
  await toast.getByRole("button", { name: "Cerrar aviso de insignia" }).click();
  await expect(toast).toHaveCount(0);
  // Un segundo comentario no vuelve a anunciar el mismo logro.
  await page.getByLabel("Comentar el recuerdo", { exact: true }).fill(content + " segundo");
  const savedAgain = page.waitForResponse(
    (response) =>
      /\/api\/publicaciones\/\d+\/comentarios$/.test(response.url()) &&
      response.request().method() === "POST",
  );
  const refreshed = page.waitForResponse((response) =>
    /\/api\/usuario\/\d+\/perfil$/.test(response.url()),
  );
  await page
    .getByRole("region", { name: "Comentarios", exact: true })
    .getByRole("button", { name: "Comentar", exact: true })
    .click();
  expect((await savedAgain).status()).toBe(201);
  await (await refreshed).finished();
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await expect(toast).toHaveCount(0);
  await openOwnProfile(page);
  await expect(profile.locator(".achievements-count")).toHaveText("1/17");
  await expect(profile.getByRole("img", { name: "Primera Palabra", exact: true })).toBeVisible();
  await profile.getByRole("button", { name: "Logros", exact: true }).click();
  const catalogue = page.getByRole("dialog", { name: "Todas las insignias", exact: true });
  await expect(catalogue.locator(".achievement-card")).toHaveCount(17);
  await expect(catalogue).not.toContainText("Melómano");
  await expect(catalogue).not.toContainText("Turista del Pasado");
  await expect(catalogue).not.toContainText("Mecenas");
  const earned = catalogue.locator(".achievement-card.is-unlocked");
  await expect(earned).toHaveCount(1);
  await expect(earned).toContainText("Primera Palabra");
  await expect(earned.locator("time")).toBeVisible();
  await catalogue.getByRole("button", { name: "Cerrar catálogo de logros" }).click();
  await page.reload();
  await openOwnProfile(page);
  await expect(profile.locator(".achievements-count")).toHaveText("1/17");
  await expect(page.locator(".achievement-toast")).toHaveCount(0);
  await page.getByRole("button", { name: "Abrir menú de usuario", exact: true }).first().click();
  await page.getByRole("menuitem", { name: "Cerrar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.locator(".achievement-rail")).toHaveCount(0);
  await login(page, users[1].email);
  await openOwnProfile(page);
  await expect(
    profile.getByRole("heading", { name: users[1].username, exact: true }),
  ).toBeVisible();
  await expect(profile.locator(".achievements-count")).toHaveText("0/17");
  await expect(page.locator(".achievement-toast")).toHaveCount(0);
  expect(errors).toEqual([]);
});
