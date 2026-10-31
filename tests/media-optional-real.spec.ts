import { expect, test } from "@playwright/test";
import { api, loginReal } from "./real-api-helpers";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
});

for (const grupo of [false, true])
  test(`publica texto sin multimedia y lo recupera al recargar${grupo ? " dentro de un grupo, en móvil" : ""}`, async ({
    page,
    request,
  }) => {
    if (grupo) await page.setViewportSize({ width: 390, height: 844 });
    const suffix = `${Date.now()}_${grupo ? "grupo" : "general"}`;
    const email = `texto_${suffix}@example.test`;
    const registro = await request.post(`${api}/api/auth/registro`, {
      data: { email, username: `texto_${suffix}`, contraseña: "PruebaLogros123!" },
      headers: { "X-Nostalgiar-Request": "1" },
    });
    expect(registro.status()).toBe(201);
    const sesion = await loginReal(page, email);
    let groupId: number | undefined;
    if (grupo) {
      const nuevo = await request.post(`${api}/api/grupos`, {
        data: { nombre: `Grupo ${suffix}`, descripcion: "Recuerdos sin adjunto", decada: 1990 },
        headers: { Authorization: `Bearer ${sesion.token}`, "X-Nostalgiar-Request": "1" },
      });
      expect(nuevo.status()).toBe(201);
      groupId = (await nuevo.json()).id;
      await page.goto(`/explorar?era=1990&action=recordar&groupId=${groupId}`);
    } else await page.getByRole("button", { name: "Recordar", exact: true }).click();
    await page
      .locator("#explore .memory-map")
      .click({ position: { x: grupo ? 160 : 350, y: 240 } });
    const dialog = page.getByRole("dialog", { name: "¿Qué pasó en este lugar?" });
    await expect(dialog.getByText("Foto o video · opcional", { exact: true })).toBeVisible();
    // Un adjunto opcional sigue teniendo que ser válido si se intenta agregar.
    await dialog.getByRole("button", { name: "Enlace", exact: true }).click();
    await dialog
      .getByLabel("O pegá un enlace HTTPS al archivo")
      .fill("http://example.test/foto.jpg");
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("El adjunto debe ser");
    await dialog.getByRole("button", { name: "Continuar sin adjunto", exact: true }).click();
    const title = `Recuerdo de texto ${suffix}`;
    await dialog.getByRole("textbox", { name: "Título del recuerdo" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Tu historia" })
      .fill("Una historia que puedo contar sin buscar una foto.");
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    await dialog.getByRole("textbox", { name: "Nombre del lugar" }).fill("Buenos Aires");
    await dialog.getByLabel("Fecha del recuerdo", { exact: true }).fill("1995-04-15");
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    const endpoint = grupo ? `/api/grupos/${groupId}/recuerdos` : "/api/publicaciones";
    const saved = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === endpoint && response.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Guardar recuerdo", exact: true }).click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const multipart = response.request().postDataBuffer()!.toString();
    expect(multipart).not.toContain('name="Archivo"');
    expect(multipart).not.toContain('name="UrlArchivo"');
    const id = (await response.json()).id;
    const persisted = await request.get(`${api}/api/publicaciones/${id}`, {
      headers: { Authorization: `Bearer ${sesion.token}` },
    });
    expect(persisted.status()).toBe(200);
    expect((await persisted.json()).urlMultimedia).toBe("");
    await page.goto(`/recuerdo/${id}?era=1990`);
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    const post = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      .first();
    await expect(post).toContainText("Una historia que puedo contar sin buscar una foto.");
    await expect(post.locator(".post-image, video, iframe")).toHaveCount(0);
    await expect(post.locator(".retro-media-placeholder.is-failed")).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    await expect(post).toContainText("Una historia que puedo contar sin buscar una foto.");
    await expect(post.locator(".post-image, video, iframe")).toHaveCount(0);
  });
