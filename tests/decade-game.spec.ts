import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const photo = readFileSync(
  new URL("../public/juego-decadas/1980/foto-original.jpg", import.meta.url),
);
const publicationImage = "https://fotos.example/estacion.jpg";

async function prepare(page: Page, mode: "mixed" | "offline" | "empty" = "mixed") {
  await page.route("**/hubs/**", (route) => route.fulfill({ status: 404, json: {} }));
  await page.route(publicationImage, (route) =>
    route.fulfill({ contentType: "image/jpeg", body: photo }),
  );
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = {
      "access-control-allow-origin": request.headers().origin || "http://localhost:3140",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization,content-type,x-nostalgiar-request",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (path === "/api/juegos/decadas/fotos") {
      // Fijamos el sorteo una vez iniciado React, sin alterar sus identificadores internos.
      await page.evaluate(() => {
        Math.random = () => 0.8;
      });
      if (process.env.PLAYWRIGHT_GAME_REAL_API === "1") return route.continue();
      if (mode === "offline") return route.fulfill({ status: 503, headers, json: {} });
      return route.fulfill({
        headers,
        json: mode === "empty" ? [] : [{ publicacionId: 42, url: publicationImage, decada: 1980 }],
      });
    }
    if (path === "/api/auth/refresh") return route.fulfill({ status: 401, headers, json: {} });
    return route.fulfill({ headers, json: [] });
  });
  await page.goto("/juego?era=1990");
  await expect(page.getByRole("heading", { name: "¿De qué década es esta foto?" })).toBeVisible();
}

async function currentPhoto(page: Page) {
  const image = page.getByRole("img", { name: /Fotografía para identificar/ });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  const src = new URL((await image.getAttribute("src"))!, "http://localhost");
  const path = src.searchParams.get("url") || src.pathname;
  const local = path.match(/\/juego-decadas\/(1970|1980|1990|2000|2010|2020)\//);
  return { image, decade: local ? Number(local[1]) : 1980, publication: !local };
}

async function answer(page: Page, decade: number) {
  const label = decade < 2000 ? "Decada " + String(decade).slice(2) : "Decada " + decade;
  await page.getByRole("button", { name: label, exact: true }).click();
}

test("mezcla fotos locales y publicaciones y revela el enlace solo después de responder", async ({
  page,
}) => {
  await prepare(page);
  let local = 0,
    publications = 0;
  for (let index = 0; index < 5; index++) {
    const current = await currentPhoto(page);
    await expect(page.getByRole("link", { name: /Ver publicación/ })).not.toBeVisible();
    if (current.publication) {
      publications++;
      await answer(page, 1970);
      await expect(page.getByText("Respuesta incorrecta", { exact: true })).toBeVisible();
      const link = page.getByRole("link", {
        name: "Ver publicación (se abre en otra pestaña)",
        exact: true,
      });
      await expect(link).toHaveAttribute(
        "href",
        process.env.PLAYWRIGHT_GAME_REAL_API === "1" ? /\/recuerdo\/\d+/ : "/recuerdo/42",
      );
      await expect(link).toHaveAttribute("target", "_blank");
      await page.screenshot({ path: "test-results/juego-publicacion-respondida.png" });
      const popup = page.context().waitForEvent("page");
      await link.click();
      const detail = await popup;
      await expect(detail).toHaveURL(/\/recuerdo\/\d+/);
      await detail.close();
      await expect(page).toHaveURL(/\/juego/);
      await expect(page.getByText("Respuesta incorrecta", { exact: true })).toBeVisible();
    } else {
      local++;
      await answer(page, current.decade);
      await expect(page.getByText("¡Correcto!", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Ver publicación/ })).not.toBeVisible();
    }
    await page
      .getByRole("button", { name: index === 4 ? "Ver resultado" : "Siguiente foto", exact: true })
      .click();
  }
  expect(local).toBeGreaterThan(0);
  expect(publications).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "¡Ganaste!", exact: true })).toBeVisible();
  await expect(page.getByText("4 de 5", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Jugar de nuevo", exact: true }).click();
  await currentPhoto(page);
  await expect(page.getByRole("link", { name: /Ver publicación/ })).not.toBeVisible();
});

test("permite ver la publicación también cuando se acierta", async ({ page }) => {
  await prepare(page);
  for (let index = 0; index < 5; index++) {
    const current = await currentPhoto(page);
    await answer(page, current.decade);
    if (current.publication) {
      await expect(page.getByText("¡Correcto!", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Ver publicación/ })).toBeVisible();
      return;
    }
    await page
      .getByRole("button", { name: index === 4 ? "Ver resultado" : "Siguiente foto", exact: true })
      .click();
  }
  throw new Error("La partida de prueba debe incluir una publicación.");
});

test("si falla el backend sigue funcionando con el archivo local", async ({ page }) => {
  await prepare(page, "offline");
  await expect(
    page.getByRole("status").filter({ hasText: "Esta partida usa las fotos del archivo" }),
  ).toBeVisible();
  const current = await currentPhoto(page);
  expect(current.publication).toBe(false);
  await answer(page, current.decade);
  await expect(page.getByRole("link", { name: /Ver publicación/ })).not.toBeVisible();
});

test("una cuenta sin fotos candidatas mantiene las imágenes locales", async ({ page }) => {
  await prepare(page, "empty");
  const current = await currentPhoto(page);
  expect(current.publication).toBe(false);
  await expect(page.getByText(/Las publicaciones no están disponibles ahora/)).not.toBeVisible();
});

test("la foto y el enlace después de responder se adaptan a móvil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  for (let index = 0; index < 5; index++) {
    const current = await currentPhoto(page);
    await answer(page, current.decade);
    if (current.publication) {
      await expect(page.getByRole("link", { name: /Ver publicación/ })).toBeVisible();
      const main = page.getByRole("main");
      const size = await main.evaluate((element) => ({
        width: element.clientWidth,
        content: element.scrollWidth,
      }));
      expect(size.content).toBeLessThanOrEqual(size.width);
      await page.screenshot({ path: "test-results/juego-publicacion-mobile.png" });
      return;
    }
    await page
      .getByRole("button", { name: index === 4 ? "Ver resultado" : "Siguiente foto", exact: true })
      .click();
  }
  throw new Error("La partida de prueba debe incluir una publicación.");
});
