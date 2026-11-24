import { adminRequest } from "./adminApi";

export type TreasureLocationInput = {
  nombre: string;
  pista: string;
  latitud: number;
  longitud: number;
  zoomMinimo: number;
  activa: boolean;
};
export type AdminTreasureLocation = TreasureLocationInput & { id: number };
export type CurrentTreasure = Omit<AdminTreasureLocation, "activa">;
export type TreasureWeek = {
  semanaInicio: string;
  editable: boolean;
  modo: "fijo" | "automatica" | "programada" | "pausada";
  ubicacionId: number | null;
  nombre: string | null;
  pista: string | null;
};
export type TreasureAdminPanel = {
  habilitado: boolean;
  semanaActual: string;
  actual: CurrentTreasure | null;
  ubicaciones: AdminTreasureLocation[];
  semanas: TreasureWeek[];
};
const endpoint = "juegos/tesoro";
export function getTreasureAdmin(signal?: AbortSignal) {
  return adminRequest<TreasureAdminPanel>(endpoint, { signal, cache: "no-store" });
}
export function saveTreasureLocation(id: number | null, input: TreasureLocationInput) {
  return adminRequest<AdminTreasureLocation>(`${endpoint}/ubicaciones${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(input),
  });
}
export function scheduleTreasure(week: string, choice: string) {
  return adminRequest<void>(`${endpoint}/semanas/${encodeURIComponent(week)}`, {
    method: choice === "auto" ? "DELETE" : "PUT",
    ...(choice === "auto"
      ? {}
      : { body: JSON.stringify({ ubicacionId: choice === "pause" ? null : Number(choice) }) }),
  });
}
export function editCurrentTreasure(id: number, input: Omit<TreasureLocationInput, "activa">) {
  return adminRequest<void>(`${endpoint}/actual/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
