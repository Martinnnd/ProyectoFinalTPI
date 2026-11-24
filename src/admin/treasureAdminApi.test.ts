import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "../components/auth/apiClient";
import {
  editCurrentTreasure,
  getTreasureAdmin,
  saveTreasureLocation,
  scheduleTreasure,
} from "./treasureAdminApi";

vi.mock("../components/auth/apiClient", () => ({ apiFetch: vi.fn() }));
const request = vi.mocked(apiFetch);
afterEach(() => request.mockReset());

it("consulta el panel sin caché y conserva la cancelación", async () => {
  request.mockResolvedValue(new Response("{}"));
  const signal = new AbortController().signal;
  await getTreasureAdmin(signal);
  expect(request.mock.calls[0][0]).toContain("/api/admin/juegos/tesoro");
  expect(request.mock.calls[0][1]).toMatchObject({ signal, cache: "no-store" });
});

it("distingue ubicación específica, pausa y restauración de la rotación", async () => {
  request.mockImplementation(async () => new Response(null, { status: 204 }));
  await scheduleTreasure("2026-11-29", "8");
  await scheduleTreasure("2026-11-29", "pause");
  await scheduleTreasure("2026-11-29", "auto");
  expect(request.mock.calls[0][1]).toMatchObject({
    method: "PUT",
    body: JSON.stringify({ ubicacionId: 8 }),
  });
  expect(request.mock.calls[1][1]).toMatchObject({
    method: "PUT",
    body: JSON.stringify({ ubicacionId: null }),
  });
  expect(request.mock.calls[2][1]).toMatchObject({ method: "DELETE" });
  expect(request.mock.calls[2][1]?.body).toBeUndefined();
});

it("separa la edición del catálogo de la del reto vigente", async () => {
  request.mockImplementation(async () => new Response("{}"));
  const location = {
    nombre: "Retiro",
    pista: "Una pista",
    latitud: -34.59,
    longitud: -58.37,
    zoomMinimo: 18,
    activa: true,
  };
  await saveTreasureLocation(null, location);
  await saveTreasureLocation(3, { ...location, activa: false });
  await editCurrentTreasure(7, location);
  expect(request.mock.calls[0][0]).toContain("/ubicaciones");
  expect(request.mock.calls[0][1]?.method).toBe("POST");
  expect(request.mock.calls[1][0]).toContain("/ubicaciones/3");
  expect(JSON.parse(String(request.mock.calls[1][1]?.body)).activa).toBe(false);
  expect(request.mock.calls[2][0]).toContain("/actual/7");
  expect(request.mock.calls[2][1]?.method).toBe("PUT");
});

it("muestra el detalle del servidor si se rechaza una edición", async () => {
  request.mockResolvedValue(
    new Response(JSON.stringify({ detail: "El reto cambió de semana." }), { status: 400 }),
  );
  await expect(
    editCurrentTreasure(1, {
      nombre: "Lugar",
      pista: "Pista",
      latitud: 0,
      longitud: 0,
      zoomMinimo: 18,
    }),
  ).rejects.toThrow("El reto cambió de semana.");
});
