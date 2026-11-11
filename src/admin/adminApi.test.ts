import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../components/auth/apiClient";
import {
  deleteAdminComment,
  getAdminReports,
  getAdminPublications,
  resolveAdminReport,
  setAdminPublicationVisibility,
  setAdminUserSuspension,
} from "./adminApi";

vi.mock("../components/auth/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedFetch = vi.mocked(apiFetch);

afterEach(() => mockedFetch.mockReset());

describe("adminApi", () => {
  it("envía filtros de publicaciones por query string", async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    await getAdminPublications({ pagina: 2, tamanio: 10, texto: "cine", categoria: 2 });
    expect(mockedFetch.mock.calls[0][0]).toContain(
      "publicaciones?pagina=2&tamanio=10&texto=cine&categoria=2",
    );
  });

  it("envía el motivo al ocultar una publicación", async () => {
    mockedFetch.mockResolvedValue(new Response(null, { status: 204 }));
    await setAdminPublicationVisibility(8, true, "No cumple las normas");
    const init = mockedFetch.mock.calls[0][1]!;
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({
      ocultar: true,
      motivo: "No cumple las normas",
    });
  });

  it("usa las rutas de suspensión y borrado de comentarios", async () => {
    mockedFetch.mockResolvedValue(new Response(null, { status: 204 }));
    await setAdminUserSuspension(3, true, 14);
    expect(mockedFetch.mock.calls[0][0]).toContain("usuarios/3");
    expect(JSON.parse(String(mockedFetch.mock.calls[0][1]?.body))).toEqual({
      suspender: true,
      dias: 14,
    });
    await deleteAdminComment(22);
    expect(mockedFetch.mock.calls[1][0]).toContain("comentarios/22");
    expect(mockedFetch.mock.calls[1][1]?.method).toBe("DELETE");
  });

  it("lista y resuelve reportes con sus filtros y acción", async () => {
    mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    await getAdminReports({ pagina: 3, tamanio: 10, tipoContenido: 1, estado: 0 });
    expect(mockedFetch.mock.calls[0][0]).toContain(
      "reportes?pagina=3&tamanio=10&tipoContenido=1&estado=0",
    );

    mockedFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await resolveAdminReport(8, 3, "Reincidencia", 14);
    expect(mockedFetch.mock.calls[1][1]?.method).toBe("PATCH");
    expect(JSON.parse(String(mockedFetch.mock.calls[1][1]?.body))).toEqual({
      reporteId: 8,
      accion: 3,
      observacion: "Reincidencia",
      diasSuspension: 14,
    });
  });

  it("envía estado vacío al solicitar reportes de todos los estados", async () => {
    mockedFetch.mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    await getAdminReports({ pagina: 1, tamanio: 10 });
    expect(mockedFetch.mock.calls[0][0]).toContain("reportes?pagina=1&tamanio=10&estado=");
  });

  it("omite los días de suspensión para las demás decisiones", async () => {
    mockedFetch.mockResolvedValue(new Response(null, { status: 204 }));
    await resolveAdminReport(9, 0, "No infringe las normas");
    expect(JSON.parse(String(mockedFetch.mock.calls[0][1]?.body))).toEqual({
      reporteId: 9,
      accion: 0,
      observacion: "No infringe las normas",
    });
  });
});
