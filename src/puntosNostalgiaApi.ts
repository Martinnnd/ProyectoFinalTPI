import { API_BASE_URL } from "./apiConfig";
import { apiFetch } from "./components/auth/apiClient";

export interface SaldoPuntosDto {
  cupo: number;
  puntosRestantes: number;
  reinicio: string;
  puntosExtra: number;
  totalDisponible: number;
}

export interface PackPuntosDto {
  id: string;
  nombre: string;
  puntos: number;
  precioUsd: number;
  precioArs: number;
  icono: string;
  etiqueta?: string;
  destacado?: boolean;
}

export interface PreferenciaCompraDto {
  compraId: number;
  preferenceId: string;
  initPoint: string;
  packId: string;
  packNombre: string;
  puntos: number;
  precioArs: number;
  precioUsd: number;
  cotizacionDolar: number;
}

export interface ResultadoCompraDto {
  compraId: number;
  estado: string;
  puntosAcreditados: number;
  saldoActual: SaldoPuntosDto;
}

export async function getSaldoPuntos(): Promise<SaldoPuntosDto | null> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/puntos-nostalgia/saldo`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function getPacksPuntos(): Promise<PackPuntosDto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/puntos-nostalgia/packs`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function iniciarCompraPack(packId: string): Promise<PreferenciaCompraDto> {
  const response = await apiFetch(`${API_BASE_URL}/api/puntos-nostalgia/comprar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || err?.title || "No se pudo iniciar la compra.");
  }
  return await response.json();
}

export function notificarPuntosActualizados(nuevoSaldo?: SaldoPuntosDto): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("nostalgiar:puntos-actualizados", { detail: nuevoSaldo })
    );
  }
}

export async function confirmarCompraPack(compraId: number, paymentId?: string): Promise<ResultadoCompraDto> {
  const response = await apiFetch(`${API_BASE_URL}/api/puntos-nostalgia/confirmar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compraId, paymentId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.detail || err?.title || "No se pudo acreditar la compra.");
  }
  const resultado: ResultadoCompraDto = await response.json();
  notificarPuntosActualizados(resultado.saldoActual);
  return resultado;
}
