import { expect, test } from "@playwright/test";

for (const mobile of [false, true]) {
  test(`el cartel se mueve sin elegir un lugar${mobile ? " en móvil" : " en escritorio"}`, async ({
    page,
  }) => {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const headers = {
        "access-control-allow-origin": route.request().headers().origin ?? "http://localhost:3101",
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      };
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      if (path === "/api/categorias-cuenta/me")
        return route.fulfill({
          headers,
          json: {
            categoria: {
              codigo: "Nostalgico",
              nombre: "Nostálgico",
              publicacionesSemanales: 10,
              publicacionesIlimitadas: false,
              permitePrimerRecuerdo: true,
              prioridadVisibilidad: "Normal",
              permisos: ["CrearRecuerdo"],
            },
            publicacionesConsumidas: 0,
            publicacionesRestantes: 10,
            semanaInicio: "2026-11-09",
            reinicioSemana: "2026-11-16",
            maximoAdjuntos: 1,
          },
        });
      const json =
        path === "/api/auth/refresh"
          ? {
              token: "test",
              usuarioId: 1,
              username: "Ana",
              email: "ana@example.com",
              esAdmin: false,
            }
          : path.endsWith("/mapa")
            ? { pines: [], hayMas: false }
            : [];
      return route.fulfill({ headers, json });
    });
    await page.goto("/explorar?era=1990");
    await page
      .getByRole("button", { name: mobile ? "Sumar mi recuerdo" : "Recordar", exact: true })
      .click();
    const notice = page.locator(".map-notice.picking");
    const handle = page.getByRole("button", { name: "Mover cartel de ubicación" });
    await expect(notice).toBeVisible();
    await page.waitForTimeout(600); // Wait for the notice's entrance animation.
    const before = (await notice.boundingBox())!;
    const grip = (await handle.boundingBox())!;
    const dy = before.y > 100 ? -80 : 80;
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(grip.x + grip.width / 2 + 30, grip.y + grip.height / 2 + dy, {
      steps: 8,
    });
    await page.mouse.up();
    const after = (await notice.boundingBox())!;
    expect(Math.abs(after.y - before.y)).toBeGreaterThan(40);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await handle.focus();
    await page.keyboard.press("ArrowDown");
    expect((await notice.boundingBox())!.y).toBeGreaterThan(after.y);
    await page.mouse.move(
      (await handle.boundingBox())!.x + 10,
      (await handle.boundingBox())!.y + 10,
    );
    await page.mouse.down();
    await page.mouse.move(-100, -100, { steps: 8 });
    await page.mouse.up();
    const bounds = (await notice.locator("..").boundingBox())!;
    const clamped = (await notice.boundingBox())!;
    expect(clamped.x).toBeGreaterThanOrEqual(bounds.x - 1);
    expect(clamped.y).toBeGreaterThanOrEqual(bounds.y - 1);
    await notice.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(notice).toHaveCount(0);
  });
}
