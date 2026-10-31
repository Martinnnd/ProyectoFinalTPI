import { API_BASE_URL } from "../src/api";
import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
});

async function mockNoMoments(page: Page) {
  await page.route(/\/api\/publicaciones\/\d+\/(momentos|analisis)(?:\?|$)/, (route) => {
    const analysis = new URL(route.request().url()).pathname.endsWith("/analisis");
    return route.fulfill({
      headers: {
        "access-control-allow-origin": route.request().headers().origin ?? "http://localhost:3001",
        "access-control-allow-credentials": "true",
      },
      json: analysis
        ? { publicacionId: 25, versionContenido: 1, estado: "sinMomento" }
        : {
            publicacionId: 25,
            versionRelaciones: 1,
            permitirMomentosAutomaticos: true,
            puedeCorregir: false,
            momentos: [],
          },
    });
  });
}

for (const { mobile, era } of [
  { mobile: false, era: 1970 },
  { mobile: true, era: 1980 },
  { mobile: false, era: 1990 },
  { mobile: true, era: 2000 },
]) {
  test(`crear un recuerdo exige fecha completa y envía el día elegido en UTC${mobile ? " en móvil" : ""}, década ${era}`, async ({
    page,
  }, testInfo) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    let body = "";
    const publishedUrl =
      era === 1990 ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : "https://example.com/foto.jpg";
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const headers = {
        "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      };
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/auth/refresh")
        return route.fulfill({
          headers,
          json: {
            token: "test",
            usuarioId: 1,
            username: "Ana",
            email: "ana@example.com",
            esAdmin: false,
          },
        });
      if (path === "/api/publicaciones" && request.method() === "POST") {
        body = request.postDataBuffer()?.toString("utf8") ?? "";
        return route.fulfill({ status: 201, headers, json: { id: 999 } });
      }
      if (path === "/api/publicaciones/999" || path === "/api/publicaciones/999/resumen")
        return route.fulfill({
          headers,
          json: {
            id: 999,
            titulo: "Un día preciso",
            descripcion: "Nos encontramos ese día. #Amigos #amigos, #Música",
            fecha: "1991-04-15T00:00:00Z",
            categoria: "Personales",
            urlMultimedia: publishedUrl,
            tipoMultimedia: era === 1990 ? "Video" : "Foto",
            autor: { id: 1, username: "Ana" },
            lugar: { nombre: "La plaza", latitud: -34.6, longitud: -58.5 },
          },
        });
      if (path.endsWith("/mapa"))
        return route.fulfill({
          headers,
          json: {
            pines:
              body && era === 1990
                ? [{ id: 999, latitud: -34.6, longitud: -58.5, categoria: "Personales" }]
                : [],
            hayMas: false,
          },
        });
      if (path.startsWith("/api/feed/"))
        return route.fulfill({
          headers,
          json: { items: [], siguienteCursor: null, hayMas: false },
        });
      return route.fulfill({ headers, json: [] });
    });
    await mockNoMoments(page);
    await page.goto(`/explorar?era=${era}`);
    await page
      .getByRole("button", { name: mobile ? "Sumar mi recuerdo" : "Recordar", exact: true })
      .click();
    await expect(
      page.getByText("Elegí un lugar en el mapa para tu recuerdo.", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("#explore .memory-map")).toHaveCSS("cursor", "crosshair");
    await page
      .locator("#explore .memory-map")
      .click({ position: { x: mobile ? 160 : 350, y: 240 } });
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Paso 1 de 4: Foto o video" })).toBeVisible();
    await expect(dialog.getByLabel("Título del recuerdo")).not.toBeVisible();
    await expect(dialog.getByLabel("Subir foto (hasta 5 MB) o video (hasta 2 MB)")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Elegir desde Google Photos" })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Google Photos", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Elegir desde Google Photos" })).toBeVisible();
    await expect(dialog.locator('input[type="file"]')).toHaveCount(0);
    await dialog.screenshot({ path: testInfo.outputPath("memory-form-media.png") });
    await expect(
      dialog.getByRole("button", { name: "Continuar sin adjunto", exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Archivo", exact: true }).click();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "grande.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(dialog.getByRole("alert")).toContainText("El archivo supera 5 MB");
    await expect(dialog.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
    await dialog.locator('input[type="file"]').setInputFiles("public/facts/bttf.jpg");
    await expect(dialog.getByAltText("Vista previa del adjunto")).toBeVisible();
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    await expect(
      dialog.getByLabel("Subir foto (hasta 5 MB) o video (hasta 2 MB)"),
    ).not.toBeVisible();
    await expect(dialog.getByText("Archivo adjunto listo.", { exact: true })).toHaveCount(0);
    for (const name of ["Archivo", "Google Photos", "Enlace"]) {
      await expect(dialog.getByRole("button", { name, exact: true })).toBeDisabled();
    }
    const previewWidth = await dialog
      .getByAltText("Vista previa del adjunto")
      .evaluate((image) => ({
        width: image.getBoundingClientRect().width,
        container: image.parentElement!.clientWidth,
      }));
    expect(Math.abs(previewWidth.width - previewWidth.container)).toBeLessThanOrEqual(1);
    await dialog.screenshot({ path: testInfo.outputPath("memory-form-selected-photo.png") });
    await dialog.getByRole("button", { name: "Quitar adjunto", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Enlace", exact: true })).toBeEnabled();
    await expect(dialog.getByLabel("Subir foto (hasta 5 MB) o video (hasta 2 MB)")).toBeVisible();
    await dialog.getByRole("button", { name: "Enlace", exact: true }).click();
    await page.route("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg", (route) =>
      route.fulfill({ path: "public/facts/bttf.jpg", contentType: "image/jpeg" }),
    );
    await dialog
      .getByLabel("O pegá un enlace HTTPS al archivo")
      .fill("https://youtu.be/dQw4w9WgXcQ");
    await dialog.getByRole("button", { name: "Usar enlace", exact: true }).click();
    const thumbnail = dialog.getByAltText("Miniatura del video de YouTube adjunto");
    await expect(thumbnail).toBeVisible();
    await expect(thumbnail).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
    await expect(dialog.getByRole("button", { name: "Enlace", exact: true })).toBeDisabled();
    if (era !== 1990) {
      await dialog.getByRole("button", { name: "Quitar adjunto", exact: true }).click();
      await dialog.getByLabel("Tipo de adjunto").selectOption("image");
      await dialog
        .getByLabel("O pegá un enlace HTTPS al archivo")
        .fill("https://example.com/foto.jpg");
      await dialog.getByRole("button", { name: "Archivo", exact: true }).click();
      await dialog.getByRole("button", { name: "Enlace", exact: true }).click();
      await expect(dialog.getByLabel("O pegá un enlace HTTPS al archivo")).toHaveValue(
        "https://example.com/foto.jpg",
      );
    }
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    await dialog.getByLabel("Título del recuerdo").fill("Un día preciso");
    await dialog
      .getByLabel("Tu historia")
      .fill("Nos encontramos ese día. #Amigos #amigos, #Música");
    await expect(dialog.locator(".memory-form-tags > span")).toHaveText(["#amigos", "#música"]);
    await dialog.screenshot({ path: testInfo.outputPath("memory-form-story.png") });
    await expect(dialog.locator('input[name="hashtags"]')).toHaveCount(0);
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    await dialog.getByLabel("Nombre del lugar").fill("La plaza");
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    expect(body).toBe("");
    await expect(dialog.getByLabel("Fecha del recuerdo", { exact: true })).toHaveValue("");
    const dialogBeforeCalendar = await dialog.boundingBox();
    await dialog
      .getByRole("button", { name: "Elegir fecha en el calendario", exact: true })
      .click();
    const calendar = dialog.getByRole("region", { name: "Calendario del recuerdo" });
    await expect(
      calendar.getByRole("button", { name: `Elegir año: ${era}`, exact: true }),
    ).toBeVisible();
    const controlStyles = await calendar.locator(".memory-select-control").evaluateAll((controls) =>
      controls.map((control) => {
        const style = getComputedStyle(control);
        return {
          background: style.backgroundColor,
          color: style.color,
          border: style.border,
          radius: style.borderRadius,
          shadow: style.boxShadow,
          font: style.font,
          height: style.height,
        };
      }),
    );
    expect(controlStyles[0]).toEqual(controlStyles[1]);
    await expect(
      calendar.getByRole("button", { name: "Elegir mes: Enero", exact: true }),
    ).toBeVisible();
    if (!mobile) {
      const dialogAfterCalendar = await dialog.boundingBox();
      expect(dialogAfterCalendar!.height).toBeCloseTo(dialogBeforeCalendar!.height, 0);
      const calendarBox = await calendar.boundingBox();
      const dateBox = await dialog.locator(".memory-date-input").boundingBox();
      expect(calendarBox!.y + calendarBox!.height).toBeLessThanOrEqual(dateBox!.y);
    }
    await expect(dialog.getByLabel("Fecha del recuerdo", { exact: true })).toHaveValue("");
    await calendar.getByRole("button", { name: `Elegir año: ${era}`, exact: true }).click();
    const yearList = calendar.getByRole("listbox", { name: "Año", exact: true });
    const visibleYears = await yearList.evaluate((list) => {
      const box = list.getBoundingClientRect();
      return Array.from(list.querySelectorAll('[role="option"]'))
        .filter((option) => {
          const item = option.getBoundingClientRect();
          return item.top >= box.top && item.bottom <= box.bottom;
        })
        .map((option) => option.textContent);
    });
    expect(visibleYears[0]).toBe(String(era));
    expect(visibleYears.at(-1)).toBe(String(Math.min(era + 10, 2009)));
    const yearListStyle = await yearList.evaluate((list) => {
      const css = getComputedStyle(list);
      return {
        background: css.backgroundColor,
        border: css.border,
        shadow: css.boxShadow,
        radius: css.borderRadius,
        height: css.height,
      };
    });
    await page.screenshot({ path: testInfo.outputPath("calendar-year-dropdown.png") });
    await yearList.getByRole("option", { name: "1991", exact: true }).click();
    await calendar.getByRole("button", { name: "Elegir mes: Enero", exact: true }).click();
    const monthList = calendar.getByRole("listbox", { name: "Mes", exact: true });
    const monthListStyle = await monthList.evaluate((list) => {
      const css = getComputedStyle(list);
      return {
        background: css.backgroundColor,
        border: css.border,
        shadow: css.boxShadow,
        radius: css.borderRadius,
        height: css.height,
      };
    });
    expect(monthListStyle).toEqual(yearListStyle);
    await page.screenshot({ path: testInfo.outputPath("calendar-month-dropdown.png") });
    await monthList.getByRole("option", { name: "Abril", exact: true }).click();
    await dialog.screenshot({ path: testInfo.outputPath("memory-calendar.png") });
    await calendar.getByRole("button", { name: "15 de abril de 1991", exact: true }).click();
    await expect(calendar).not.toBeVisible();
    await dialog.getByRole("button", { name: "Atrás", exact: true }).click();
    await expect(dialog.getByLabel("Título del recuerdo")).toHaveValue("Un día preciso");
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(dialog.getByLabel("Fecha del recuerdo", { exact: true })).toHaveValue(
      "1991-04-15",
    );
    await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: "Paso 4 de 4: Música · opcional" }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Guardar recuerdo", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(body).toContain('name="Fecha"\r\n\r\n1991-04-15T00:00:00.000Z');
    expect(body).toContain("Nos encontramos ese día. #Amigos #amigos, #Música");
    if (era === 1990) {
      const pinThumbnail = page.locator("#explore .pin-message-preview .pin-preview-photo");
      await expect(pinThumbnail).toHaveAttribute(
        "src",
        "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      );
      await expect(pinThumbnail).toBeVisible();
    }
    const savedNotice = page.locator(".memory-saved-notice");
    await expect(savedNotice).toContainText("¡Recuerdo guardado! Ya tiene su lugar en el mapa.");
    const savedNoticeBox = await savedNotice.boundingBox();
    expect(savedNoticeBox!.y).toBeGreaterThan(page.viewportSize()!.height / 2);
    await expect(page.locator("#explore .memory-map")).toBeVisible();
    await expect(
      savedNotice.getByRole("button", { name: "Cerrar aviso", exact: true }),
    ).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("memory-saved-notice.png") });
    if (mobile) {
      await expect(savedNotice).toHaveCount(0, { timeout: 4000 });
    } else {
      await savedNotice.getByRole("button", { name: "Cerrar aviso", exact: true }).click();
      await expect(savedNotice).toHaveCount(0);
    }
    if (era === 1990) {
      // La selección del pin se recupera a partir de su enlace en el mapa.
      await page.goto("/explorar?era=1990&recuerdo=999");
      await page.reload();
      const pinThumbnail = page.locator("#explore .pin-message-preview .pin-preview-photo");
      await expect(pinThumbnail).toBeVisible();
      await expect(pinThumbnail).toHaveAttribute(
        "src",
        "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      );
      await page.screenshot({ path: testInfo.outputPath("youtube-pin-preview.png") });
    }
  });
}

test("recargar un pin recupera su ubicación real aunque el resumen no tenga coordenadas", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback) {
          window.setTimeout(() => {
            success({
              coords: {
                latitude: -34.9,
                longitude: -58.4,
                accuracy: 100,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            } as GeolocationPosition);
            document.documentElement.dataset.locationDelivered = "true";
          }, 5000);
        },
      },
    });
  });
  const detail = {
    id: 125,
    titulo: "Recorriendo Ramos",
    descripcion: "Mi recuerdo de Ramos Mejía",
    fecha: "1990-01-01T00:00:00Z",
    categoria: 0,
    urlMultimedia: "",
    tipoMultimedia: 0,
    autor: { id: 1, username: "Ana" },
    lugar: { nombre: "Ramos Mejía", latitud: -34.64, longitud: -58.56 },
  };
  const requested: string[] = [];
  await page.route("**/api/**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    requested.push(path);
    const headers = {
      "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (path.includes("/auth/")) return route.fulfill({ status: 401, headers });
    if (path.endsWith("/mapa"))
      return route.fulfill({ headers, json: { pines: [], hayMas: false } });
    if (path === "/api/publicaciones/125") return route.fulfill({ headers, json: detail });
    if (path === "/api/publicaciones/125/resumen")
      return route.fulfill({ headers, json: { ...detail, lugar: undefined } });
    return route.fulfill({ headers, json: [] });
  });
  await mockNoMoments(page);
  await page.goto("/explorar?era=1990&view=map&post=125");
  const assertRestoredPin = async () => {
    await expect(page.locator("#explore .pin-message-preview")).toContainText("Recorriendo Ramos");
    await expect(page.locator("html")).toHaveAttribute("data-location-delivered", "true", {
      timeout: 10000,
    });
    await expect
      .poll(async () => {
        const href = await page
          .getByRole("link", { name: "Improve this map", exact: true })
          .getAttribute("href");
        return href?.split("#/")[1]?.split("/").slice(0, 2).map(Number);
      })
      .toEqual([-58.56, -34.64]);
  };
  await assertRestoredPin();
  await page.reload();
  await assertRestoredPin();
  expect(requested.filter((path) => path === "/api/publicaciones/125")).toHaveLength(2);
  expect(requested).not.toContain("/api/publicaciones/125/resumen");
  await page.screenshot({ path: testInfo.outputPath("restored-pin-location.png") });
});

test("el carrusel del día continúa su cursor y abre la preview de otro pin", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let documentLoads = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentLoads++;
  });
  const requests: string[] = [];
  const empty = { items: [], siguienteCursor: null, hayMas: false };
  await page.route("https://fixtures.nostalgiar.test/recuerdo.jpg", (route) =>
    route.fulfill({ path: "public/facts/bttf.jpg", contentType: "image/jpeg" }),
  );
  const publication = (id: number) => ({
    id,
    titulo: `Recuerdo ${id}`,
    descripcionBreve: `Resumen ${id}`,
    descripcion: `Descripción ${id}`,
    fecha: "1992-01-01T00:00:00Z",
    categoria: 0,
    urlMultimedia: "https://fixtures.nostalgiar.test/recuerdo.jpg",
    tipoMultimedia: 0,
    autor: { id: 1, username: "Ana" },
    lugar: { nombre: "San Justo", latitud: -34.67 + (id - 25) * 0.0001, longitud: -58.56 },
  });
  const related = (id: number) => ({
    ...publication(id),
    autorId: 1,
    autorUsername: "Ana",
    nombreLugar: "San Justo",
    distanciaMetros: 15,
    mismoDia: true,
    mismoLugar: true,
  });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url.pathname);
    const headers = {
      "access-control-allow-origin": route.request().headers().origin ?? "http://localhost:3001",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type, authorization, x-nostalgiar-request",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname.includes("/auth/")) return route.fulfill({ status: 401, headers });
    if (url.pathname.endsWith("/mapa"))
      return route.fulfill({
        headers,
        json: {
          pines: [{ id: 25, latitud: -34.67, longitud: -58.56, categoria: 0 }],
          hayMas: false,
        },
      });
    if (url.pathname.endsWith("/relaciones")) {
      const id = Number(url.pathname.split("/")[3]);
      return route.fulfill({
        headers,
        json: {
          publicacionId: id,
          radioMetros: 200,
          dia:
            id === 25
              ? { items: [related(26)], siguienteCursor: "next+/= &?", hayMas: true }
              : empty,
          lugar: empty,
        },
      });
    }
    if (url.pathname.endsWith("/relacionadas")) {
      expect(url.searchParams.get("cursor")).toBe("next+/= &?");
      expect(url.searchParams.get("tipo")).toBe("dia");
      return route.fulfill({ headers, json: { ...empty, items: [related(26), related(27)] } });
    }
    const match = url.pathname.match(/\/publicaciones\/(\d+)(?:\/resumen)?$/);
    return route.fulfill({ headers, json: match ? publication(Number(match[1])) : [] });
  });
  await mockNoMoments(page);
  await page.goto("/explorar?era=1990");
  await page.getByRole("button", { name: "Recuerdo, 1990, Lugares", exact: true }).click();
  const preview = page.locator("#explore .pin-message-preview");
  await expect(preview.getByRole("heading", { name: "También ese día" })).toBeVisible();
  const originalPin = page.getByRole("button", { name: "Recuerdo, 1990, Lugares", exact: true });
  await expect(preview.locator(".pin-preview-photo")).toBeVisible();
  const detailRequests = () =>
    requests.filter(
      (path) =>
        path === "/api/publicaciones/25/resumen" || path === "/api/publicaciones/25/relaciones",
    ).length;
  const requestsBeforeClose = detailRequests();
  await originalPin.click();
  await expect(preview).toHaveCount(0);
  expect(detailRequests()).toBe(requestsBeforeClose);
  expect(new URL(page.url()).searchParams.has("post")).toBe(false);
  await originalPin.click();
  await expect(preview.locator(".pin-preview-photo")).toBeVisible();
  const closePreview = preview.getByRole("button", { name: "Cerrar vista previa", exact: true });
  const closeBounds = await closePreview.boundingBox();
  expect(closeBounds!.width).toBe(22);
  expect(closeBounds!.height).toBe(22);
  await closePreview.click();
  await expect(preview).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has("post")).toBe(false);
  await originalPin.click();
  await expect(preview.locator(".pin-preview-photo")).toBeVisible();
  await expect(preview.getByRole("heading", { name: "También ese día" })).toBeVisible();
  await preview.getByRole("button", { name: "Ver más", exact: true }).click();
  await expect(
    preview.getByRole("button", { name: "Ver en el mapa: Recuerdo 26", exact: true }),
  ).toHaveCount(1);
  await expect
    .poll(() =>
      preview
        .getByRole("button", { name: "Ver en el mapa: Recuerdo 26", exact: true })
        .locator("img")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await preview.screenshot({ path: testInfo.outputPath("carrusel-dia.png") });
  await preview.getByRole("button", { name: "Ver en el mapa: Recuerdo 27", exact: true }).click();
  await expect(preview.locator("strong").filter({ hasText: /^Recuerdo 27$/ })).toBeVisible();
  await expect(preview.getByRole("region", { name: "También ese día", exact: true })).toHaveCount(
    0,
  );
  expect(requests).toContain("/api/publicaciones/27");
  expect(requests).toContain("/api/publicaciones/27/relaciones");
  await expect(page.locator(".app.view-map")).toBeVisible();
  const canvas = page.locator("#explore .mapboxgl-canvas");
  const originalCanvas = await canvas.elementHandle();
  const panned = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith("/api/publicaciones/mapa"),
  );
  await canvas.focus();
  await canvas.press("ArrowRight");
  await panned;
  const marker = page.getByRole("button", { name: "Recuerdo 27, 1992, Lugares", exact: true });
  await expect(marker).toBeVisible();
  const markerBefore = await marker.boundingBox();
  const mapUrl = page.url();
  const initialDocumentLoads = documentLoads;
  await preview.getByRole("button", { name: "Ver publicación →", exact: true }).click();
  await expect(page.locator(".app.view-feed")).toBeVisible();
  await expect(page).toHaveURL(/view=feed/);
  await page.goBack();
  await expect(page.locator(".app.view-map")).toBeVisible();
  await expect(page).toHaveURL(mapUrl);
  await expect(preview.locator("strong").filter({ hasText: /^Recuerdo 27$/ })).toBeVisible();
  expect(await canvas.evaluate((element, original) => element === original, originalCanvas)).toBe(
    true,
  );
  await expect(marker).toBeVisible();
  const markerAfter = await marker.boundingBox();
  expect(markerAfter!.x).toBeCloseTo(markerBefore!.x, 0);
  expect(markerAfter!.y).toBeCloseTo(markerBefore!.y, 0);
  expect(documentLoads).toBe(initialDocumentLoads);
  await page.goForward();
  await expect(page.locator(".app.view-feed")).toBeVisible();
  await page.goBack();
  await expect(preview.locator("strong").filter({ hasText: /^Recuerdo 27$/ })).toBeVisible();
});

test("el carrusel flotante de lugar conserva cursores y salta a otra década", async ({
  page,
}, testInfo) => {
  const empty = { items: [], siguienteCursor: null, hayMas: false };
  const continuations: string[] = [];
  const mapYears: string[] = [];
  await page.route("https://fixtures.nostalgiar.test/recuerdo.jpg", (route) =>
    route.fulfill({ path: "public/facts/bttf.jpg", contentType: "image/jpeg" }),
  );
  const publication = (id: number) => ({
    id,
    titulo: `Recuerdo ${id}`,
    descripcionBreve: `Resumen ${id}`,
    fecha: id === 27 ? "1985-06-20T00:00:00Z" : "1992-01-01T00:00:00Z",
    categoria: 0,
    urlMultimedia: "https://fixtures.nostalgiar.test/recuerdo.jpg",
    tipoMultimedia: 0,
    autor: { id: 1, username: "Ana" },
    lugar: { nombre: "San Justo", latitud: -34.67 + (id - 25) * 0.0001, longitud: -58.56 },
  });
  const related = (id: number) => ({
    ...publication(id),
    autorId: 1,
    autorUsername: "Ana",
    nombreLugar: "San Justo",
    distanciaMetros: 15,
    mismoDia: id === 26 || id === 29,
    mismoLugar: true,
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = {
      "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type, authorization, x-nostalgiar-request",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname.includes("/auth/")) return route.fulfill({ status: 401, headers });
    if (url.pathname.endsWith("/mapa")) {
      mapYears.push(url.searchParams.get("fechaDesde") ?? "");
      return route.fulfill({
        headers,
        json: {
          pines: [{ id: 25, latitud: -34.67, longitud: -58.56, categoria: 0 }],
          hayMas: false,
        },
      });
    }
    if (url.pathname.endsWith("/relaciones")) {
      const id = Number(url.pathname.split("/")[3]);
      return route.fulfill({
        headers,
        json: {
          publicacionId: id,
          radioMetros: 200,
          dia:
            id === 25 ? { items: [related(26)], siguienteCursor: "dia+/=", hayMas: true } : empty,
          lugar:
            id === 25
              ? {
                  items: [related(26), related(27), related(24)],
                  siguienteCursor: "lugar+/= &?",
                  hayMas: true,
                }
              : empty,
        },
      });
    }
    if (url.pathname.endsWith("/relacionadas")) {
      const tipo = url.searchParams.get("tipo")!;
      continuations.push(tipo);
      expect(url.searchParams.get("cursor")).toBe(tipo === "dia" ? "dia+/=" : "lugar+/= &?");
      return route.fulfill({
        headers,
        json: { ...empty, items: [related(tipo === "dia" ? 29 : 28)] },
      });
    }
    const match = url.pathname.match(/\/publicaciones\/(\d+)(?:\/resumen)?$/);
    return route.fulfill({ headers, json: match ? publication(Number(match[1])) : [] });
  });
  await mockNoMoments(page);
  await page.goto("/explorar?era=1990");
  await page.getByRole("button", { name: "Recuerdo, 1990, Lugares", exact: true }).click();
  const preview = page.locator("#explore .pin-message-preview");
  const floating = preview.getByRole("region", { name: "A través de los años", exact: true });
  const day = preview.getByRole("region", { name: "También ese día", exact: true });
  await expect(floating).toBeVisible();
  await expect(floating.locator("time")).toHaveText(["1985", "1992"]);
  await expect(floating.getByRole("heading")).toHaveCount(0);
  await expect(floating.locator("time").filter({ hasText: /^1985$/ })).toHaveCount(1);
  await expect(day).toBeVisible();
  // Same-day memories appear only in the day block.
  await expect(
    day.getByRole("button", { name: "Ver en el mapa: Recuerdo 26", exact: true }),
  ).toHaveCount(1);
  await expect(
    floating.getByRole("button", { name: "Ver en el mapa: Recuerdo 26", exact: true }),
  ).toHaveCount(0);
  const panelBounds = (await floating.boundingBox())!;
  const photoBounds = (await preview.locator(".pin-preview-photo").boundingBox())!;
  expect(panelBounds.y + panelBounds.height + 12).toBeLessThan(photoBounds.y);
  await day.getByRole("button", { name: "Ver más", exact: true }).click();
  await floating.getByRole("button", { name: "Más recuerdos de este lugar", exact: true }).click();
  await floating.getByRole("button", { name: "Más recuerdos de este lugar", exact: true }).click();
  await expect(
    floating.getByRole("button", { name: "Ver en el mapa: Recuerdo 28", exact: true }),
  ).toBeAttached();
  await expect(floating.locator("time")).toHaveText(["1985", "1992", "1992"]);
  const track = floating.getByRole("group", { name: "Recuerdos de este lugar" });
  await expect(floating.locator("[data-active=true]")).toContainText("Recuerdo 28");
  await floating.getByRole("button", { name: "Más recuerdos de este lugar", exact: true }).click();
  await expect(floating.locator("[data-active=true]")).toContainText("Recuerdo 27");
  await floating.getByRole("button", { name: "Más recuerdos de este lugar", exact: true }).click();
  const trackBounds = (await track.boundingBox())!;
  await page.mouse.move(trackBounds.x + 30, trackBounds.y + 25);
  await page.mouse.down();
  await page.mouse.move(trackBounds.x + 120, trackBounds.y + 25, { steps: 8 });
  await page.mouse.up();
  await expect(floating.locator("[data-active=true]")).toContainText("Recuerdo 27");
  await expect(preview.locator("strong").filter({ hasText: /^Recuerdo 25$/ })).toBeVisible();
  await expect
    .poll(async () => {
      const cards = await floating.locator("[data-active]").evaluateAll((elements) =>
        elements.map((element) => ({
          active: element.getAttribute("data-active") === "true",
          x: element.getBoundingClientRect().x,
        })),
      );
      const front = cards.find((card) => card.active)!;
      return (
        cards.some((card) => card.x < front.x - 30) && cards.some((card) => card.x > front.x + 30)
      );
    })
    .toBe(true);
  await floating.screenshot({ path: testInfo.outputPath("carrusel-tres-frente.png") });
  await preview.screenshot({ path: testInfo.outputPath("carrusel-lugar-flotante.png") });
  await floating.getByRole("button", { name: "Ver en el mapa: Recuerdo 27", exact: true }).click();
  await expect(page.locator(".app")).toHaveClass(/era-1980/);
  await expect(preview.locator("strong").filter({ hasText: /^Recuerdo 27$/ })).toBeVisible();
  await expect(floating).toHaveCount(0);
  await expect(day).toHaveCount(0);
  await expect.poll(() => mapYears).toContain("1980-01-01T00:00:00Z");
  expect(continuations).toEqual(["dia", "lugar"]);
  await expect(page.locator(".app.view-map")).toBeVisible();
});

test("pines, resumen, detalle y comentarios del backend", async ({ page }) => {
  const requests: string[] = [];
  let rejectComment = true;
  const publication = {
    id: 25,
    titulo: "Recuerdo del servidor",
    descripcionBreve: "Resumen del recuerdo",
    descripcion: "Descripción completa del recuerdo",
    fecha: "1992-01-01T00:00:00Z",
    categoria: 0,
    urlMultimedia: "",
    tipoMultimedia: 0,
    autor: { id: 1, username: "usuarioTest" },
    lugar: { nombre: "Buenos Aires", latitud: -34.6, longitud: -58.4 },
  };
  const comment = {
    id: 8,
    contenido: "Comentario reciente",
    fechaCreacion: "2026-10-13T15:00:00Z",
    autor: publication.autor,
  };
  await page.route(`${API_BASE_URL}/api/publicaciones/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push(url.pathname);
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (url.pathname.endsWith("/relaciones"))
      return route.fulfill({
        headers,
        json: {
          publicacionId: 25,
          radioMetros: 200,
          dia: { items: [], siguienteCursor: null, hayMas: false },
          lugar: { items: [], siguienteCursor: null, hayMas: false },
        },
      });
    if (url.pathname.endsWith("/mapa"))
      return route.fulfill({
        headers,
        json: { pines: [{ id: 25, latitud: -34.6, longitud: -58.4, categoria: 0 }], hayMas: false },
      });
    if (url.pathname.endsWith("/comentarios")) {
      if (request.method() === "POST") {
        expect(request.postDataJSON()).toEqual({ contenido: "Mi comentario", usuarioId: 1 });
        if (rejectComment) {
          rejectComment = false;
          return route.fulfill({
            status: 400,
            headers,
            json: { errors: { Contenido: ["Error de validación de prueba."] } },
          });
        }
        return route.fulfill({
          status: 201,
          headers,
          json: { ...comment, id: 10, contenido: "Mi comentario" },
        });
      }
      const older = url.searchParams.has("cursor");
      return route.fulfill({
        headers,
        json: {
          items: [
            {
              ...comment,
              id: older ? 9 : 8,
              contenido: older ? "Comentario anterior" : comment.contenido,
            },
          ],
          siguienteCursor: older ? null : "next+/=",
        },
      });
    }
    return route.fulfill({
      headers,
      json: url.pathname.endsWith("/resumen")
        ? { ...publication, descripcion: undefined, lugar: undefined }
        : publication,
    });
  });
  await page.route(`${API_BASE_URL}/api/publicaciones`, (route) =>
    route.fulfill({ headers: { "access-control-allow-origin": "*" }, json: [] }),
  );
  await mockNoMoments(page);
  await page.goto("/explorar?era=1990");
  await page.getByRole("button", { name: "Recuerdo, 1990, Lugares", exact: true }).click();
  await expect(page.locator(".stories-drawer")).toHaveCount(0);
  await expect.poll(() => requests).toContain("/api/publicaciones/25/resumen");
  const summary = page.locator("#explore .pin-message-preview");
  await expect(summary.getByText("Resumen del recuerdo", { exact: true })).toBeVisible();
  await summary.getByRole("button", { name: "Ver publicación →", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Feed de recuerdos" })
      .getByText("Descripción completa del recuerdo", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Comentario reciente", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver más comentarios", exact: true }).click();
  await expect(page.getByText("Comentario anterior", { exact: true })).toBeVisible();
  const comments = page.getByRole("region", { name: "Comentarios", exact: true });
  const field = comments.getByLabel("Comentar el recuerdo", { exact: true });
  await field.fill("  Mi comentario  ");
  await comments.getByRole("button", { name: "Comentar", exact: true }).click();
  await expect(comments.getByRole("alert")).toContainText("Error de validación de prueba.");
  await expect(field).toHaveValue("  Mi comentario  ");
  await comments.getByRole("button", { name: "Comentar", exact: true }).click();
  await expect(field).toHaveValue("");
  await expect(page.getByText("Mi comentario", { exact: true })).toBeVisible();
  for (const path of ["/mapa", "/25/resumen", "/25", "/25/comentarios"])
    expect(requests).toContain(`/api/publicaciones${path}`);
});

for (const count of [4, 5, 6]) {
  test(`el anillo se cierra con ${count} recuerdos relacionados`, async ({ page }, testInfo) => {
    const empty = { items: [], siguienteCursor: null, hayMas: false };
    const publication = (id: number) => ({
      id,
      titulo: `Recuerdo ${id}`,
      descripcionBreve: "En este lugar",
      fecha: "1992-01-01T00:00:00Z",
      categoria: 0,
      urlMultimedia: "",
      tipoMultimedia: 0,
      autor: { id: 1, username: "Ana" },
      lugar: { nombre: "San Justo", latitud: -34.67, longitud: -58.56 },
    });
    await page.route("**/api/**", (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const headers = {
        "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "content-type, authorization, x-nostalgiar-request",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      };
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path.includes("/auth/")) return route.fulfill({ status: 401, headers });
      if (path.endsWith("/mapa"))
        return route.fulfill({
          headers,
          json: {
            pines: [{ id: 25, latitud: -34.67, longitud: -58.56, categoria: 0 }],
            hayMas: false,
          },
        });
      if (path.endsWith("/relaciones"))
        return route.fulfill({
          headers,
          json: {
            publicacionId: 25,
            radioMetros: 200,
            dia: empty,
            lugar: {
              ...empty,
              items: Array.from({ length: count }, (_, index) => ({
                ...publication(index + 26),
                autorId: 1,
                autorUsername: "Ana",
                nombreLugar: "San Justo",
                distanciaMetros: 0,
                mismoDia: false,
                mismoLugar: true,
              })),
            },
          },
        });
      return route.fulfill({
        headers,
        json: /\/publicaciones\/25(?:\/resumen)?$/.test(path) ? publication(25) : [],
      });
    });
    await mockNoMoments(page);
    await page.goto("/explorar?era=1990");
    await page.getByRole("button", { name: "Recuerdo, 1990, Lugares", exact: true }).click();
    const carousel = page.getByRole("region", { name: "A través de los años", exact: true });
    await expect(carousel.locator("[data-active]")).toHaveCount(count);
    const cards = await carousel.locator("[data-active]").evaluateAll((elements) =>
      elements.map((element) => ({
        active: element.getAttribute("data-active") === "true",
        x: element.getBoundingClientRect().x,
        y: element.getBoundingClientRect().y,
      })),
    );
    const front = cards.find((card) => card.active)!;
    const back = cards.filter((card) => card.y < front.y - 40);
    expect(back.length).toBeGreaterThanOrEqual(count === 4 ? 1 : 2);
    if (count === 4) expect(Math.abs(back[0].x - front.x)).toBeLessThan(20);
    else {
      expect(back.some((card) => card.x < front.x)).toBe(true);
      expect(back.some((card) => card.x > front.x)).toBe(true);
    }
    await carousel.screenshot({ path: testInfo.outputPath("anillo.png") });
  });
}
