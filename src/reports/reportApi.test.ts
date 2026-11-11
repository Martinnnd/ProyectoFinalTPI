import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../components/auth/apiClient";
import { createReport, ReportRequestError } from "./reportApi";

vi.mock("../components/auth/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedFetch = vi.mocked(apiFetch);

afterEach(() => mockedFetch.mockReset());

describe("reportApi", () => {
  it("envía el reporte con el contrato esperado", async () => {
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 7, estado: 0, fechaCreacion: "2026-01-01" }), {
        status: 201,
      }),
    );
    await createReport({ tipoContenido: 1, contenidoId: 25, motivo: 2, detalle: "  ofensivo  " });
    expect(mockedFetch.mock.calls[0][0]).toContain("/api/reportes");
    expect(JSON.parse(String(mockedFetch.mock.calls[0][1]?.body))).toEqual({
      tipoContenido: 1,
      contenidoId: 25,
      motivo: 2,
      detalle: "ofensivo",
    });
  });

  it("conserva el estado HTTP cuando el reporte está duplicado", async () => {
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify({ detail: "Ya enviaste un reporte pendiente" }), { status: 409 }),
    );
    await expect(
      createReport({ tipoContenido: 3, contenidoId: 9, motivo: 4 }),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<ReportRequestError>);
  });
});
