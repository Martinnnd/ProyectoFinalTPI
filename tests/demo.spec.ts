import { test, expect, type Locator } from "@playwright/test";

test("mapa a pantalla completa, filtros, historias y creación persistente", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const map = await page.locator(".memory-map").boundingBox();
  expect(map!.y).toBe(0);
  expect(map!.height).toBe(1000);
  expect(map!.width).toBe(1368);
  await expect(page.locator(".stories-drawer")).toHaveCount(0);
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(7);
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible({
    timeout: 20000,
  });
  await expect(
    page.getByRole("link", { name: "OpenStreetMap", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "La ronda de mate del Parque Centenario, 1997, Personales",
    })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "La ronda de mate del Parque Centenario",
    }),
  ).toBeVisible();
  await expect(page.locator(".memory-story")).toContainText(
    "avenida Díaz Vélez",
  );
  await expect(
    page.getByText("Autor ficticio · dato de demostración"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar historias" }).click();
  await expect(
    page.getByRole("button", { name: "Historias", exact: true }),
  ).toBeFocused();
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 1980" }).click();
  await expect(page.locator(".app")).toHaveClass(/era-1980/);
  await page.locator(".filters summary").click();
  await page
    .getByRole("group", { name: "Filtrar por categoría" })
    .getByRole("button", { name: "Música", exact: true })
    .click();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "Año del recuerdo" })
    .selectOption("1980");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(0);
  await expect(
    page.getByText("No hay recuerdos con esta combinación."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agregar un recuerdo" }).click();
  await expect(
    page.getByText("Elegí un lugar en el mapa para tu recuerdo."),
  ).toBeVisible();
  await page.locator(".memory-map").click({ position: { x: 650, y: 440 } });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Título del recuerdo" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Guardar recuerdo" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Título del recuerdo" })
    .fill("Mi paseo por Caballito");
  await page.getByRole("spinbutton", { name: "Año", exact: true }).fill("1994");
  await page
    .getByRole("textbox", { name: "Nombre del lugar" })
    .fill("Parque Centenario, Buenos Aires");
  await page
    .getByRole("textbox", { name: "Tu historia" })
    .fill(
      "Fuimos a caminar por el lago y volvimos con una bolsa de libros de la feria.",
    );
  await page.getByRole("button", { name: "Guardar recuerdo" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".app")).toHaveClass(/era-1990/);
  await expect(
    page.getByRole("heading", { name: "Mi paseo por Caballito" }),
  ).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(8);
  await page.reload();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(8);
  await page.getByRole("button", { name: "Historias", exact: true }).click();
  await page
    .locator(".memory-list")
    .getByRole("button", { name: /Mi paseo por Caballito/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mi paseo por Caballito" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agregar un recuerdo" }).click();
  await page.locator(".memory-map").click({ position: { x: 550, y: 450 } });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".marker-provisional")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Agregar un recuerdo" }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test("datos culturales verificables, navegación y filtrado por año", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Los juguetes cobraron vida" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "The Walt Disney Company" }),
  ).toHaveAttribute("href", /thewaltdisneycompany.com/);
  await page.getByRole("button", { name: "Siguiente dato" }).click();
  await expect(
    page.getByRole("heading", { name: "La Web se abrió al mundo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar datos de época" }).click();
  await expect(page.locator(".era-fact-popup")).toHaveCount(0);
  await page.getByRole("button", { name: "La época", exact: true }).click();
  await expect(page.locator(".era-fact-popup")).toBeVisible();
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 2000" }).click();
  await expect(
    page.getByRole("heading", { name: "Un ogro se robó la película" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Año del recuerdo" })
    .selectOption("2004");
  await expect(
    page.getByRole("heading", { name: "Una generación bañada en oro" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Siguiente dato" }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Año del recuerdo" })
    .selectOption("2003");
  await expect(
    page.getByText("No tenemos datos verificados de 2003", { exact: false }),
  ).toBeVisible();
});

test("música real: carga explícita, pistas por década y cierre que detiene el proveedor", async ({
  page,
}) => {
  // La prueba no depende de la cuenta, licencias ni red de Spotify.
  // Verifica nuestra integración; la reproducción real se revisa por separado.
  await page.route("https://open.spotify.com/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html lang="es"><body>Proveedor de música aislado para la prueba</body></html>',
    }),
  );
  await page.goto("/");
  await expect(page.locator(".spotify-player")).toHaveCount(0);
  await expect(page.locator(".music-card")).toContainText("Michael Jackson");
  await page
    .getByRole("button", { name: "Abrir reproductor", exact: true })
    .click();
  await expect(page.locator(".spotify-player")).toHaveAttribute(
    "src",
    /6bsCZtBsAvu4u2ueA7saDo/,
  );
  await expect(page.locator(".spotify-player")).not.toHaveAttribute(
    "src",
    /autoplay=1|autoplay=true/,
  );
  await expect(
    page.getByRole("link", { name: "Abrir Spotify" }),
  ).toHaveAttribute(
    "href",
    "https://open.spotify.com/track/6bsCZtBsAvu4u2ueA7saDo",
  );
  await page.getByRole("button", { name: "Pista siguiente" }).click();
  await expect(page.locator(".music-card")).toContainText("Soda Stereo");
  await expect(page.locator(".spotify-player")).toHaveAttribute(
    "src",
    /5jVvwEH4nsTrDf2pU3IW2i/,
  );
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 1980" }).click();
  await expect(page.locator(".spotify-player")).toHaveCount(0);
  await expect(page.locator(".music-card")).toContainText("Guns N' Roses");
  await page
    .getByRole("button", { name: "Abrir reproductor", exact: true })
    .click();
  await expect(page.locator(".spotify-player")).toHaveAttribute(
    "src",
    /5r9AgnhkPQXeKG1w5rauDq/,
  );
  await page
    .getByRole("button", {
      name: "Cerrar reproductor y detener música",
      exact: true,
    })
    .click();
  await expect(page.locator(".spotify-player")).toHaveCount(0);
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 2000" }).click();
  await expect(page.locator(".music-card")).toContainText("Linkin Park");
});

test("móvil: mapa ocupa el fondo, paneles excluyentes, atribución visible y formulario", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const map = await page.locator(".memory-map").boundingBox();
  expect(map!.y).toBe(0);
  expect(map!.width).toBe(390);
  expect(map!.height).toBe(785);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const attribution = await page
    .locator(".leaflet-control-attribution")
    .boundingBox();
  const navigation = await page.locator(".navigation-rail").boundingBox();
  expect(attribution!.y + attribution!.height).toBeLessThanOrEqual(
    navigation!.y + 1,
  );
  await page.getByRole("button", { name: "Historias", exact: true }).click();
  await expect(page.locator(".era-fact-popup")).toHaveCount(0);
  await page
    .locator(".memory-list")
    .getByRole("button", { name: /La ronda de mate/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "La ronda de mate del Parque Centenario",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agregar un recuerdo" }).click();
  await expect(page.locator(".stories-drawer")).toHaveCount(0);
  await page.locator(".memory-map").click({ position: { x: 180, y: 410 } });
  await expect(page.getByRole("dialog")).toBeVisible();
  const box = await page.getByRole("dialog").boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mapa bloqueado, datos corruptos y almacenamiento lleno mantienen la app utilizable", async ({
  page,
}) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.addInitScript(() =>
    localStorage.setItem("nostalgia.memories.v1", "{bad"),
  );
  await page.goto("/");
  await expect(
    page.getByText(
      "No pudimos recuperar los recuerdos de este navegador. Podés seguir explorando.",
    ),
  ).toBeVisible();
  await expect(page.locator(".map-error")).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(7);
  await page.getByRole("button", { name: "Cerrar aviso" }).click();
  await page.getByRole("button", { name: "Agregar un recuerdo" }).click();
  await page.locator(".memory-map").click({ position: { x: 510, y: 405 } });
  await page
    .getByRole("textbox", { name: "Título del recuerdo" })
    .fill("No perder el texto");
  await page
    .getByRole("textbox", { name: "Nombre del lugar" })
    .fill("Lugar de prueba");
  await page
    .getByRole("textbox", { name: "Tu historia" })
    .fill("El formulario debe seguir abierto.");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Guardar recuerdo" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "No se pudo guardar",
  );
  await expect(
    page.getByRole("textbox", { name: "Título del recuerdo" }),
  ).toHaveValue("No perder el texto");
});

test("identidades de época, menú Inicio y cambios sin ventanas duplicadas", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const systemFont = await page
    .locator("h1")
    .evaluate((e) => getComputedStyle(e).fontFamily);
  await page.getByRole("button", { name: "Inicio", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Menú de inicio" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Abrir mis recuerdos", exact: true })
    .click();
  await expect(page.locator(".stories-drawer")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Menú de inicio" }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Minimizar paneles y ver el mapa" })
    .click();
  await expect(page.locator(".stories-drawer")).toHaveCount(0);
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 1980" }).click();
  const arcadeFont = await page
    .locator("h1")
    .evaluate((e) => getComputedStyle(e).fontFamily);
  expect(arcadeFont).not.toBe(systemFont);
  await expect(page.locator(".vhs-status")).toBeVisible();
  await expect(page.locator(".system-taskbar")).toHaveCount(0);
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 2000" }).click();
  const messengerFont = await page
    .locator("h1")
    .evaluate((e) => getComputedStyle(e).fontFamily);
  expect(messengerFont).not.toBe(arcadeFont);
  expect(messengerFont).not.toBe(systemFont);
  await expect(page.locator(".era-shell-top")).toContainText(
    "Internet Explorer",
  );
  await page.getByRole("button", { name: "Mis espacios", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Menú de inicio" }),
  ).toBeVisible();
  // An era change also dismisses the old native popover.
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 1990" }).click();
  await expect(
    page.getByRole("navigation", { name: "Menú de inicio" }),
  ).toBeHidden();
  await expect(page.locator(".era-shell-top")).toHaveCount(1);
  await expect(page.locator(".system-taskbar")).toHaveCount(1);
  await expect(page.locator("#era-start-menu")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const year of [1980, 1990, 2000]) {
    await page.locator(".decade-menu summary").click();
    await page.getByRole("button", { name: `Década de ${year}` }).click();
    await expect(
      page.getByRole("button", { name: "Agregar un recuerdo" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Historias", exact: true }).click();
    await expect(page.locator(".stories-drawer")).toBeVisible();
    const drawer = await page.locator(".stories-drawer").boundingBox();
    expect(drawer!.x).toBeGreaterThanOrEqual(0);
    expect(drawer!.x + drawer!.width).toBeLessThanOrEqual(390);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".decade-menu summary").click();
  await page.getByRole("button", { name: "Década de 1980" }).click();
  expect(
    await page
      .locator(".era-atmosphere")
      .evaluate((e) => getComputedStyle(e, "::after").backgroundImage),
  ).toBe("none");
});

test("selectores compactos: opciones ocultas, cierre y dispositivos por epoca", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".decades")).toBeHidden();
  await expect(page.locator(".category-options")).toBeHidden();
  const timeline = await page.locator(".timeline").boundingBox();
  const filters = await page.locator(".filters").boundingBox();
  expect(filters!.y).toBeGreaterThan(timeline!.y + timeline!.height);
  await page.locator(".filters summary").click();
  await page.locator(".category-options button").nth(1).click();
  await expect(page.locator(".category-options")).toBeHidden();
  await expect(page.locator(".filters summary")).toContainText("Lugares");
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
  await page.locator(".filters summary").click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".category-options")).toBeHidden();
  for (const [index, selector] of [
    ".vinyl-platter",
    ".radio-speaker",
    ".device-2000 .music-buttons",
  ].entries()) {
    await page.locator(".decade-menu summary").click();
    await page
      .locator(".decades button")
      .nth(index + 1)
      .click();
    await expect(page.locator(".decades")).toBeHidden();
    await expect(page.locator(selector).first()).toBeVisible();
  }
});

test("1970: revista, datos, musica y recuerdo persistente", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".decade-menu summary").click();
  await page.locator(".decades button").first().click();
  await expect(page.locator(".app")).toHaveClass(/era-1970/);
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(7);
  await expect(page.locator(".system-taskbar")).toHaveCount(0);
  await expect(page.locator(".press-footer")).toBeVisible();
  await expect(page.locator(".music-card")).toContainText("ABBA");
  await expect(page.locator(".fact-body")).toContainText("Star Wars");
  await page.locator(".add-button").click();
  await page.locator(".memory-map").click({ position: { x: 500, y: 390 } });
  await page.locator('input[name="title"]').fill("Un recuerdo de 1970");
  await page.locator('input[name="year"]').fill("1970");
  await page.locator('input[name="place"]').fill("Plaza San Martin, Cordoba");
  await page
    .locator("textarea")
    .fill("Nos encontramos para compartir el diario del domingo.");
  await page.locator('button[type="submit"]').click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page.locator(".decade-menu summary").click();
  await page.locator(".decades button").first().click();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(8);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".add-button")).toBeVisible();
  await page.screenshot({ path: "test-results/seventies-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/seventies-desktop.png" });
});

test("feed: epocas, detalle, seguir, comentar, perfil y regreso al mapa", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  await expect(page.locator(".feed-post")).toHaveCount(7);
  const mini = await page.locator(".memory-map").boundingBox();
  expect(mini!.width).toBeLessThan(300);
  for (const decade of [1970, 1980, 1990, 2000]) {
    await page.locator(".decade-menu summary").click();
    await page
      .locator(".decades button")
      .filter({
        hasText: decade === 2000 ? "2000" : String(decade).slice(2) + "s",
      })
      .click();
    await expect(page.locator(".feed-post")).toHaveCount(7);
    const years = await page
      .locator(".feed-post header small")
      .allTextContents();
    expect(
      years.every(
        (t) =>
          Number(t.slice(-4)) >= decade && Number(t.slice(-4)) < decade + 10,
      ),
    ).toBe(true);
  }
  await page.locator(".feed-post .follow-button").first().click();
  await page.getByRole("button", { name: "Seguidos", exact: true }).click();
  await expect(page.locator(".feed-post")).toHaveCount(1);
  await page.locator(".post-content").click();
  await page.locator("#feed-comment").fill("Me encanto volver a este lugar.");
  await page.locator('.post-comments button[type="submit"]').click();
  await expect(page.locator(".post-comments")).toContainText(
    "Me encanto volver a este lugar.",
  );
  await page.locator(".post-place").click();
  await expect(page.locator(".app")).toHaveClass(/view-map/);
  expect((await page.locator(".memory-map").boundingBox())!.width).toBe(1368);
  await page.getByRole("button", { name: "Perfil", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
  await expect(page.locator(".profile-note")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".feed-heading")).toBeVisible();
  expect(errors).toEqual([]);
});

test("feed: miniatura a la derecha, imagen abierta a lo ancho y ocultas si fallan", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const base = {
      category: "Música",
      author: "Vos",
      source: "local",
      lat: -34.5889,
      lng: -58.43,
    };
    localStorage.setItem(
      "nostalgia.memories.v1",
      JSON.stringify([
        {
          ...base,
          id: "local-foto",
          title: "La disquetera plateada",
          year: 1994,
          place: "Palermo, Buenos Aires",
          description: "Un verano entero con el mismo cassette.",
          image:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'%3E%3Crect width='80' height='60' fill='%23c96f3a'/%3E%3C/svg%3E",
        },
        {
          ...base,
          id: "local-panoramica",
          title: "El horizonte del parquet",
          year: 1991,
          place: "Mar del Plata, Buenos Aires",
          description: "Una tira de fotos pegada en la pared del living.",
          image:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2000' height='100'%3E%3Crect width='2000' height='100' fill='%234a7ba7'/%3E%3C/svg%3E",
        },
        {
          ...base,
          id: "local-rota",
          title: "La foto que se perdio",
          year: 1993,
          place: "Caballito, Buenos Aires",
          description: "Un disco rayado que nunca volvio a reproducirse.",
          image: "/no-existe-1993.png",
        },
        {
          ...base,
          id: "local-sin-foto",
          title: "Recuerdo sin foto",
          year: 1992,
          place: "Recoleta, Buenos Aires",
          description: "Una descripcion de un recuerdo guardado sin imagen.",
        },
      ]),
    );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  const post = (title: string) =>
    page.locator(".feed-post", { hasText: title });
  const withImage = post("La disquetera plateada");
  const wide = post("El horizonte del parquet");
  const broken = post("La foto que se perdio");
  const noImage = post("Recuerdo sin foto");
  const thumb = withImage.locator(".post-image");
  await expect(thumb).toBeVisible();
  await expect(thumb).toHaveAttribute(
    "alt",
    "Fotografía de La disquetera plateada en Palermo, Buenos Aires, 1994",
  );
  await expect(thumb).toHaveAttribute("loading", "lazy");
  await expect(thumb).toHaveAttribute("decoding", "async");
  await expect(withImage.locator(".post-content > .post-image")).toHaveCount(1);
  await broken.scrollIntoViewIfNeeded();
  await expect(broken.locator(".post-image")).toBeHidden();
  await expect(noImage.locator(".post-image")).toHaveCount(0);
  await expect(page.locator(".post-text")).toHaveCount(
    await page.locator(".feed-post").count(),
  );
  const text = await withImage.locator(".post-text").boundingBox();
  const image = await thumb.boundingBox();
  expect(image!.x).toBeGreaterThanOrEqual(text!.x + text!.width - 1);
  expect(image!.width).toBe(108);
  expect(await thumb.evaluate((el) => getComputedStyle(el).objectFit)).toBe(
    "cover",
  );
  expect((await wide.locator(".post-image").boundingBox())!.width).toBe(108);
  const openPost = page.locator(".post-content.is-open");
  const openImage = page.locator(".post-content.is-open .post-image");
  const back = page.getByRole("button", { name: "Volver a feed" });
  const openBox = async () => {
    await page.locator(".feed-post").scrollIntoViewIfNeeded();
    const box = await openImage.boundingBox();
    return {
      image: box!,
      post: (await openPost.boundingBox())!,
      text: (await page
        .locator(".post-content.is-open .post-text")
        .boundingBox())!,
    };
  };
  await withImage.locator(".post-content").click();
  await expect(openPost).toHaveCount(1);
  await expect(page.locator(".post-content.is-open.with-image > .post-image")).toHaveCount(1);
  let box = await openBox();
  expect(Math.abs(box.image.width - box.post.width)).toBeLessThanOrEqual(1);
  expect(box.image.y).toBeGreaterThanOrEqual(box.text.y + box.text.height - 1);
  expect(Math.abs(box.image.height - (box.image.width * 9) / 16)).toBeLessThanOrEqual(2);
  expect(await openImage.evaluate((el) => getComputedStyle(el).objectFit)).toBe(
    "cover",
  );
  await back.click();
  expect((await thumb.boundingBox())!.width).toBe(108);
  await wide.locator(".post-content").click();
  box = await openBox();
  expect(Math.abs(box.image.height - (box.image.width * 9) / 16)).toBeLessThanOrEqual(2);
  await back.click();
  await broken.locator(".post-content").click();
  await page.locator(".feed-post").scrollIntoViewIfNeeded();
  await expect(broken.locator(".post-image")).toBeHidden();
  await back.click();
  await withImage.locator(".post-content").click();
  await page.setViewportSize({ width: 390, height: 844 });
  box = await openBox();
  expect(Math.abs(box.image.width - box.post.width)).toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 880, height: 900 });
  box = await openBox();
  expect(box.image.height).toBe(220);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("feed: repostear y guardar cambian estado y sobreviven a la publicación", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "nostalgia.memories.v1",
      JSON.stringify([
        {
          id: "local-acciones",
          title: "La primera cinta del año",
          year: 1995,
          category: "Música",
          description: "Una cinta regrabada que sonaba igual de nueva.",
          place: "Belgrano, Buenos Aires",
          author: "Vos",
          lat: -34.5622,
          lng: -58.4536,
          source: "local",
        },
      ]),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  const post = page.locator(".feed-post", {
    hasText: "La primera cinta del año",
  });
  const footer = post.locator("footer");
  const like = footer.getByRole("button", {
    name: "Me gusta: La primera cinta del año",
  });
  const comment = footer.getByRole("button", { name: "Comentar" });
  const repost = footer.getByRole("button", {
    name: "Repostear: La primera cinta del año",
  });
  const save = footer.getByRole("button", {
    name: "Guardar: La primera cinta del año",
  });
  for (const button of [like, comment, repost, save])
    await expect(button).toBeVisible();
  await expect(footer.locator("button")).toHaveCount(4);
  await expect(repost).toHaveText("Repostear");
  await expect(save).toHaveText("Guardar");
  await expect(repost).toHaveAttribute("aria-pressed", "false");
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await repost.click();
  await save.click();
  await expect(page.locator(".post-comments")).toHaveCount(0);
  await expect(repost).toHaveAttribute("aria-pressed", "true");
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await expect(repost).toHaveText("Reposteado");
  await expect(save).toHaveText("Guardado");
  const read = (button: Locator) =>
    button.evaluate((el) => ({
      color: getComputedStyle(el).color,
      fill: el.querySelector("svg")?.getAttribute("fill"),
    }));
  const [on, off] = [await read(save), await read(like)];
  expect(on.color).not.toBe(off.color);
  expect(on.fill).toBe("currentColor");
  expect(off.fill).toBe("none");
  await post.locator(".post-content").click();
  await expect(page.locator(".post-comments")).toBeVisible();
  await expect(repost).toHaveAttribute("aria-pressed", "true");
  await expect(save).toHaveText("Guardado");
  await page.getByRole("button", { name: "Volver a feed" }).click();
  await expect(repost).toHaveAttribute("aria-pressed", "true");
  await expect(save).toHaveText("Guardado");
  await repost.click();
  await expect(repost).toHaveAttribute("aria-pressed", "false");
  await expect(repost).toHaveText("Repostear");
  await page.setViewportSize({ width: 390, height: 844 });
  await post.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const row = (await footer.boundingBox())!;
  expect(row.x + row.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(
    await page.evaluate(() => {
      const stream = document.querySelector(".social-stream")!;
      return stream.scrollWidth <= stream.clientWidth;
    }),
  ).toBe(true);
  await expect(footer.locator("button")).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("feed: puntuar la publicación de 1 a 5 fija, muestra y se puede borrar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() =>
    localStorage.setItem(
      "nostalgia.memories.v1",
      JSON.stringify([
        {
          id: "local-puntaje",
          title: "La primera cinta del año",
          year: 1995,
          category: "Música",
          description: "Una cinta regrabada que sonaba igual de nueva.",
          place: "Belgrano, Buenos Aires",
          author: "Vos",
          lat: -34.5622,
          lng: -58.4536,
          source: "local",
        },
      ]),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  const post = page.locator(".feed-post", {
    hasText: "La primera cinta del año",
  });
  await post.scrollIntoViewIfNeeded();
  const group = post.getByRole("group", {
    name: "Puntuar publicación: La primera cinta del año",
  });
  await expect(group).toBeVisible();
  const buttons = group.locator("button");
  await expect(buttons).toHaveCount(5);
  await expect(buttons).toHaveText(["1", "2", "3", "4", "5"]);
  const attrs = (name: string) =>
    buttons.evaluateAll(
      (els, n) => els.map((el) => el.getAttribute(n)),
      name,
    );
  const allFalse = ["false", "false", "false", "false", "false"];
  await expect(attrs("aria-label")).toEqual([
    "Puntar 1 de 5",
    "Puntar 2 de 5",
    "Puntar 3 de 5",
    "Puntar 4 de 5",
    "Puntar 5 de 5",
  ]);
  await expect(attrs("aria-pressed")).toEqual(allFalse);
  await expect(group.locator(".post-rating-value")).toHaveText("Sin puntuar");
  const circle = await buttons.nth(3).boundingBox();
  expect(circle!.width).toBe(28);
  expect(circle!.height).toBe(28);
  expect(
    await buttons.nth(3).evaluate((el) => getComputedStyle(el).borderRadius),
  ).toBe("50%");
  const one = await buttons.nth(0).boundingBox();
  const five = await buttons.nth(4).boundingBox();
  expect(five!.x).toBeGreaterThan(one!.x);
  expect(Math.abs(five!.y - one!.y)).toBeLessThanOrEqual(1);
  const four = group.getByRole("button", { name: "Puntar 4 de 5" });
  await four.click();
  await expect(page.locator(".post-comments")).toHaveCount(0);
  await expect(four).toHaveAttribute("aria-pressed", "true");
  await expect(attrs("aria-pressed")).toEqual([
    "false",
    "false",
    "false",
    "true",
    "false",
  ]);
  await expect(group.locator(".post-rating-value")).toHaveText(
    "Puntaje: 4 de 5",
  );
  const token = (name: string) =>
    page.evaluate((n) => {
      const app = document.querySelector(".app")!;
      return getComputedStyle(app).getPropertyValue(n).trim();
    }, name);
  const hexToRgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
  };
  const tone = (target: Locator) =>
    target.evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, color: s.color };
    });
  const active = await tone(four);
  const idle = await tone(buttons.nth(0));
  expect(active.background).toBe(hexToRgb(await token("--accent")));
  expect(active.background).not.toBe(idle.background);
  expect(active.color).toBe(hexToRgb(await token("--surface")));
  await post.locator(".post-content").click();
  await expect(page.locator(".post-content.is-open")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Puntar 4 de 5" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Volver a feed" }).click();
  await expect(page.locator(".post-content.is-open")).toHaveCount(0);
  await expect(four).toHaveAttribute("aria-pressed", "true");
  await expect(group.locator(".post-rating-value")).toHaveText(
    "Puntaje: 4 de 5",
  );
  const two = group.getByRole("button", { name: "Puntar 2 de 5" });
  await two.click();
  await expect(two).toHaveAttribute("aria-pressed", "true");
  await expect(four).toHaveAttribute("aria-pressed", "false");
  await expect(group.locator(".post-rating-value")).toHaveText(
    "Puntaje: 2 de 5",
  );
  await two.click();
  await expect(attrs("aria-pressed")).toEqual(allFalse);
  await expect(group.locator(".post-rating-value")).toHaveText("Sin puntuar");
  await page.setViewportSize({ width: 390, height: 844 });
  await post.scrollIntoViewIfNeeded();
  const small = await buttons.nth(0).boundingBox();
  expect(small!.width).toBe(26);
  expect(small!.height).toBe(26);
  expect(
    await page.evaluate(() => {
      const stream = document.querySelector(".social-stream")!;
      return {
        document: document.documentElement.scrollWidth <= innerWidth,
        stream: stream.scrollWidth <= stream.clientWidth,
      };
    }),
  ).toEqual({ document: true, stream: true });
  expect(errors).toEqual([]);
});

test("perfil propio: mapa privado, contadores, coleccion y creacion", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "nostalgia.memories.v1",
      JSON.stringify([
        {
          id: "mine-90",
          title: "Mi plaza de los noventa",
          year: 1994,
          category: "Personales",
          description: "Una tarde inolvidable con mis amigos.",
          place: "Parque Centenario, Buenos Aires",
          author: "Yo",
          lat: -34.6065,
          lng: -58.4355,
          source: "local",
        },
        {
          id: "mine-70",
          title: "Mi viaje de los setenta",
          year: 1974,
          category: "Lugares",
          description: "El viaje familiar que guardo en mi memoria.",
          place: "Centro Civico, Bariloche",
          author: "Yo",
          lat: -41.1335,
          lng: -71.3102,
          source: "local",
        },
      ]),
    ),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  await page.locator(".feed-post .follow-button").first().click();
  await page.getByRole("button", { name: "Perfil", exact: true }).click();
  await expect(page.locator(".personal-counts dd")).toHaveText([
    "2",
    "0",
    "1",
    "2",
  ]);
  await expect(
    page.locator(".personal-profile .leaflet-marker-icon"),
  ).toHaveCount(1);
  await expect(page.locator(".feed-sidebar")).toBeHidden();
  await page.locator(".personal-memory").click();
  await expect(page.locator(".personal-detail")).toContainText(
    "Mi plaza de los noventa",
  );
  await page.locator(".decade-menu summary").click();
  await page.locator(".decades button").first().click();
  await expect(page.locator(".personal-detail")).toHaveCount(0);
  await expect(page.locator(".personal-memory")).toContainText(
    "Mi viaje de los setenta",
  );
  await expect(
    page.locator(".personal-profile .leaflet-marker-icon"),
  ).toHaveCount(1);
  await page
    .locator(".personal-header")
    .getByRole("button", { name: "Crear un recuerdo" })
    .click();
  await page.locator(".memory-map").click({ position: { x: 500, y: 390 } });
  await page.locator('input[name="title"]').fill("Otro recuerdo propio");
  await page.locator('input[name="place"]').fill("La plaza del barrio");
  await page
    .locator("textarea")
    .fill("Fui a pasear con mi familia un domingo.");
  await page.locator('button[type="submit"]').click();
  await expect(page.locator(".app")).toHaveClass(/view-profile/);
  await expect(page.locator(".personal-counts dd").first()).toHaveText("3");
  await expect(page.locator(".personal-detail")).toContainText(
    "Otro recuerdo propio",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/profile-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/profile-desktop.png" });
});

test("mapa ampliado del feed: dialogo, pines, cierre y teclado", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Feed", exact: true }).click();
  const trigger = page.getByRole("button", {
    name: "Ampliar mapa",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(
    (await dialog.locator(".memory-map").boundingBox())!.width,
  ).toBeGreaterThan(600);
  await dialog.locator(".leaflet-marker-icon").first().click();
  await expect(dialog.locator("footer strong")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator(".app")).toHaveClass(/view-feed/);
  await trigger.press("Enter");
  await page.getByRole("button", { name: "Cerrar mapa ampliado" }).click();
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(390);
  await page.mouse.click(2, 2);
  await expect(dialog).toHaveCount(0);
});
