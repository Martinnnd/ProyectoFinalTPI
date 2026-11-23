import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../components/auth/apiClient";
import { collectTreasure, getTreasureChallenge, getVisibleTreasure } from "./treasureApi";

vi.mock("../components/auth/apiClient", () => ({ apiFetch: vi.fn() }));
const fetchMock = vi.mocked(apiFetch);
const view = {
  zoom: 18,
  minLatitud: -34.596,
  maxLatitud: -34.595,
  minLongitud: -58.379,
  maxLongitud: -58.378,
};
beforeEach(() => vi.resetAllMocks());

describe("tesoro semanal", () => {
  it("rechaza una pista mal formada sin programar un reto inválido", async () => {
    fetchMock.mockResolvedValue(new Response("[]"));
    await expect(getTreasureChallenge(new AbortController().signal)).rejects.toThrow(
      "La pista recibida no es válida.",
    );
  });
  it("interpreta la ausencia de reto o marcador sin intentar leer JSON", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const signal = new AbortController().signal;
    expect(await getTreasureChallenge(signal)).toBeNull();
    expect(await getVisibleTreasure(view, signal)).toBeNull();
  });
  it("envía zoom y límites de la vista, sin exigir inclinación ni GPS", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ retoId: 7, latitud: -34.59558, longitud: -58.3785 })),
    );
    await getVisibleTreasure(view, new AbortController().signal);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("zoom")).toBe("18");
    expect(url.searchParams.get("minLatitud")).toBe("-34.596");
    expect(url.searchParams.has("pitch")).toBe(false);
  });
  it("registra el hallazgo con la sesión existente y sin aceptar un usuario del formulario", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ retoId: 7, nombre: "Retiro", halladoUtc: "2026-11-23T12:00:00Z" }),
      ),
    );
    expect((await collectTreasure(7, view, new AbortController().signal)).nombre).toBe("Retiro");
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(view);
  });
  it("conserva el error del servidor sin dar el reto por completado", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: "El reto ya no está vigente." }), { status: 400 }),
    );
    await expect(collectTreasure(7, view, new AbortController().signal)).rejects.toThrow(
      "El reto ya no está vigente.",
    );
  });
});
