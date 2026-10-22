import { test, expect } from "@playwright/test";

test("trends, hilo persistente y publicación con hashtags editables", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("http://localhost:5199/api/publicaciones", route => route.fulfill({ json: { id: 99001 } }));
  await page.goto("/explorar?era=1990");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trends semanales" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir hilo #cassettes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "#cassettes", exact: true })).toBeVisible();
  expect(await page.locator(".feed-post").count()).toBeGreaterThan(1);
  for (const post of await page.locator(".feed-post").all()) {
    await expect(post.getByRole("button", { name: "Ver hilo #cassettes", exact: true })).toBeVisible();
  }
  await page.getByLabel("Tu aporte a #cassettes").fill("Grababa mis canciones favoritas de la radio.");
  await page.getByRole("button", { name: "Publicar aporte", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  await page.getByRole("button", { name: "Abrir hilo #cassettes", exact: true }).click();
  await expect(page.locator(".thread-messages")).toContainText("Grababa mis canciones favoritas de la radio.");

  await page.getByRole("button", { name: "Sumar un recuerdo a #cassettes", exact: true }).click();
  await page.locator(".map-canvas .memory-map").click({ position: { x: 600, y: 420 } });
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Enlace", exact: true }).click();
  await dialog.getByLabel("O pegá un enlace HTTPS al archivo").fill("https://example.com/foto.jpg");
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(dialog.getByLabel("Tu historia")).toHaveValue("#cassettes");
  await dialog.getByLabel("Título del recuerdo").fill("Mi cinta del colegio");
  await dialog.getByLabel("Tu historia").fill("Una tarde escuchando música con mis amigos. #CASSETTES, #micolegio #cassettes");
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await dialog.getByLabel("Fecha del recuerdo", { exact: true }).fill("1991-04-15");
  await dialog.getByLabel("Nombre del lugar").fill("La plaza");
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await dialog.getByRole("button", { name: "Guardar recuerdo" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".app")).toHaveClass(/view-feed/);
  const post = page.locator(".feed-post", { hasText: "Mi cinta del colegio" });
  await expect(post).toBeVisible();
  await post.getByRole("button", { name: "Ver hilo #micolegio", exact: true }).click();
  await expect(page.locator(".feed-post")).toHaveCount(1);
  await page.getByRole("button", { name: "Editar recuerdo", exact: true }).click();
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(dialog.getByLabel("Tu historia")).toHaveValue(/#CASSETTES/);
  await expect(dialog.locator(".memory-form-tags > span")).toHaveText(["#cassettes", "#micolegio"]);
  await dialog.getByLabel("Tu historia").fill("Una tarde escuchando música con mis amigos. #micolegio #nuevotema");
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
  await dialog.getByRole("button", { name: "Guardar recuerdo" }).click();
  await post.getByRole("button", { name: "Ver hilo #nuevotema", exact: true }).click();
  await expect(page.getByRole("heading", { name: "#nuevotema", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  await expect(post.getByRole("button", { name: "Ver hilo #nuevotema", exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("nostalgia.memories.v1") ?? "[]"));
  expect(saved[0].hashtags).toEqual(["micolegio", "nuevotema"]);
  expect(saved[0].createdAt).toBeTruthy();
  expect(errors).toEqual([]);
});

for (const era of [1970, 1980, 1990, 2000]) {
  test(`trends e hilo accesibles en móvil, década ${era}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/explorar?era=${era}`);
    await page.getByRole("button", { name: "Feed", exact: true }).click();
    await page.locator(".trends-list button").first().click();
    await expect(page.locator(".hashtag-thread")).toBeVisible();
    await page.getByLabel(/Tu aporte a #/).fill("Un recuerdo compartido desde el celular.");
    await page.getByRole("button", { name: "Publicar aporte", exact: true }).click();
    await expect(page.locator(".thread-messages")).toContainText("Un recuerdo compartido desde el celular.");
    expect(await page.evaluate(() => {
      const stream = document.querySelector(".social-stream")!;
      return document.documentElement.scrollWidth <= innerWidth && stream.scrollWidth <= stream.clientWidth;
    })).toBe(true);
    await page.screenshot({ path: `test-results/hashtags-${era}-mobile.png` });
  });
}
