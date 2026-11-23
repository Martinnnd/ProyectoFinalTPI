import { API_BASE_URL } from "../apiConfig";
import { apiFetch } from "../components/auth/apiClient";

export type Candidate = {
  id: number;
  creadorId: number;
  decada: number;
  titulo: string;
  artista: string;
  puntos: number;
};
export type SongInput = { decada: number; titulo: string; artista: string };
export type Round = {
  id: number;
  apertura: string;
  cierre: string;
  decadas: { decada: number; candidaturas: Candidate[] }[];
  saldo: null | { cupo: number; puntosRestantes: number; reinicio: string };
};
export type Vote = { id: number; puntosTotales: number; puntosDiariosRestantes: number };
export type Position = {
  candidaturaId: number;
  posicion: number;
  titulo: string;
  artista: string;
  puntos: number;
};
export type Results = {
  id: number;
  apertura: string;
  cierre: string;
  decadas: { decada: number; ganadoras: Position[]; clasificadas: Position[] }[];
};

const messages: Record<number, string> = {
  400: "Revisá los datos ingresados.",
  401: "Iniciá sesión para continuar.",
  403: "Tu cuenta no tiene permiso para esta acción.",
  404: "La ronda o la candidatura ya no está disponible.",
  409: "La canción está duplicada, la ronda terminó o la edición está bloqueada por votos.",
  429: "No tenés suficientes puntos diarios. Actualizamos tu saldo.",
};
export class RankingError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string[]> = {},
  ) {
    super(message);
  }
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(API_BASE_URL + path, { ...init, cache: "no-store" });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const fields = problem?.errors ?? {};
    const detail = [problem?.detail, ...Object.values(fields).flat()].filter(Boolean).join(" ");
    throw new RankingError(
      response.status,
      [messages[response.status], detail || problem?.title].filter(Boolean).join(" ") ||
        `Error del servidor (${response.status}).`,
      fields,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const root = "/api/ranking-musica";
export const getCurrentRound = (signal?: AbortSignal) =>
  request<Round>(root + "/actual", { signal });
export async function getResults(roundId?: number, signal?: AbortSignal) {
  if (roundId !== undefined && (!Number.isSafeInteger(roundId) || roundId <= 0))
    throw new RankingError(400, "El ID de ronda debe ser un entero positivo.");
  return request<Results>(
    root + "/resultados" + (roundId === undefined ? "" : `?rondaId=${roundId}`),
    { signal },
  );
}
export const suggestSong = (song: SongInput) =>
  request<Candidate>(root + "/sugerencias", json("POST", song));
export const addAdminSong = (song: SongInput) =>
  request<Candidate>("/api/admin/ranking-musica", json("POST", song));
export const voteSong = (candidaturaId: number, puntos: number) =>
  request<Vote>(root + "/puntuacion", json("POST", { candidaturaId, puntos }));
export const editSong = (id: number, song: Pick<SongInput, "titulo" | "artista">) =>
  request<Candidate>(`${root}/${id}`, json("PUT", { titulo: song.titulo, artista: song.artista }));
export const withdrawSong = (id: number) => request<void>(`${root}/${id}`, { method: "DELETE" });
