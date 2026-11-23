import { API_BASE_URL } from "../apiConfig";
import { apiFetch } from "../components/auth/apiClient";

export type TreasureChallenge = {
  id: number;
  pista: string;
  inicioUtc: string;
  finUtc: string;
  zoomMinimo: number;
  halladoUtc: string | null;
};
export type TreasureView = {
  zoom: number;
  minLatitud: number;
  maxLatitud: number;
  minLongitud: number;
  maxLongitud: number;
};
export type VisibleTreasure = { retoId: number; latitud: number; longitud: number };
export type TreasureFinding = { retoId: number; nombre: string; halladoUtc: string };
const endpoint = `${API_BASE_URL}/api/juegos/tesoro`;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const date = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

async function read<T>(response: Response): Promise<T | null> {
  if (response.status === 204) return null;
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.detail || "No pudimos consultar el tesoro. Intentá nuevamente.");
  }
  return response.json() as Promise<T>;
}

export async function getTreasureChallenge(signal: AbortSignal): Promise<TreasureChallenge | null> {
  const value = await read<unknown>(
    await apiFetch(`${endpoint}/actual`, { signal, cache: "no-store" }),
  );
  if (value === null) return null;
  if (
    !record(value) ||
    !isId(value.id) ||
    typeof value.pista !== "string" ||
    !date(value.inicioUtc) ||
    !date(value.finUtc) ||
    Date.parse(value.finUtc) <= Date.parse(value.inicioUtc) ||
    typeof value.zoomMinimo !== "number" ||
    !Number.isFinite(value.zoomMinimo) ||
    value.zoomMinimo < 17 ||
    value.zoomMinimo > 19 ||
    !(value.halladoUtc === null || date(value.halladoUtc))
  )
    throw new Error("La pista recibida no es válida.");
  return value as TreasureChallenge;
}

export async function getVisibleTreasure(
  view: TreasureView,
  signal: AbortSignal,
): Promise<VisibleTreasure | null> {
  const query = new URLSearchParams(
    Object.entries(view).map(([key, value]) => [key, String(value)]),
  );
  const value = await read<unknown>(
    await apiFetch(`${endpoint}/visible?${query}`, { signal, cache: "no-store" }),
  );
  if (value === null) return null;
  if (
    !record(value) ||
    !isId(value.retoId) ||
    typeof value.latitud !== "number" ||
    !Number.isFinite(value.latitud) ||
    Math.abs(value.latitud) > 90 ||
    typeof value.longitud !== "number" ||
    !Number.isFinite(value.longitud) ||
    Math.abs(value.longitud) > 180
  )
    throw new Error("El marcador recibido no es válido.");
  return value as VisibleTreasure;
}

export async function collectTreasure(
  id: number,
  view: TreasureView,
  signal: AbortSignal,
): Promise<TreasureFinding> {
  const finding = await read<TreasureFinding>(
    await apiFetch(`${endpoint}/${id}/hallazgo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(view),
      signal,
    }),
  );
  if (!finding) throw new Error("No recibimos la confirmación del hallazgo. Intentá nuevamente.");
  if (
    !isId(finding.retoId) ||
    finding.retoId !== id ||
    typeof finding.nombre !== "string" ||
    !date(finding.halladoUtc)
  )
    throw new Error("La confirmación del hallazgo no es válida.");
  return finding;
}
