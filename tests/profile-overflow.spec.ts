import { expect, test } from "@playwright/test";

for (const width of [1280, 390]) {
  test(`el perfil de los 90 no desborda horizontalmente a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const headers = {
        "access-control-allow-origin": request.headers().origin ?? "http://localhost:3001",
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "authorization, content-type, x-nostalgiar-request",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      };
      if (request.method() === "OPTIONS") return route.fulfill({ headers, status: 204 });
      let json: unknown = [];
      if (path === "/api/auth/refresh")
        json = {
          token: "test",
          usuarioId: 1,
          username: "ana",
          email: "ana@test.com",
          esAdmin: false,
        };
      if (path === "/api/usuario/perfil/ana")
        json = {
          id: 1,
          username: "ana",
          logros: [],
          tipoUsuario: "Usuario_Personal",
          reputacion: "Errante",
          puntosNostalgia: 0,
          cantidadPublicaciones: 1,
          cantidadSeguidores: 0,
          cantidadSeguidos: 0,
        };
      if (path === "/api/publicaciones/usuario/1")
        json = [
          {
            id: 12,
            titulo: "Un recuerdo de los noventa",
            descripcion: "Una historia del barrio.",
            fecha: "1995-01-01",
            categoria: 0,
            tipoMultimedia: 0,
            urlMultimedia: "",
            autor: { id: 1, username: "ana" },
          },
        ];
      if (path.endsWith("/analisis")) json = { estado: "sinMomento" };
      if (path.endsWith("/momentos")) json = { publicacionId: 12, momentos: [] };
      if (path.endsWith("/relaciones"))
        json = {
          publicacionId: 12,
          dia: { items: [], siguienteCursor: null, hayMas: false },
          lugar: { items: [], siguienteCursor: null, hayMas: false },
        };
      return route.fulfill({ headers, json });
    });
    await page.goto("/perfil?era=1990");
    await expect(page.locator(".app")).toHaveClass(/era-1990/);
    await expect(page.getByText("Un recuerdo de los noventa", { exact: true })).toBeVisible();
    const overflow = await page
      .locator(".personal-profile")
      .evaluate((element) => ({ scroll: element.scrollWidth, width: element.clientWidth }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.width);
  });
}
