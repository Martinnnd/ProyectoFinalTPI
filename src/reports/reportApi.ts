import { API_BASE_URL } from "../apiConfig";
import { apiFetch } from "../components/auth/apiClient";
import type { ReportReason, ReportTarget } from "./reportTypes";

export type CreateReportRequest = {
  tipoContenido: ReportTarget;
  contenidoId: number;
  motivo: ReportReason;
  detalle?: string | null;
};

export type CreatedReport = { id: number; estado: number; fechaCreacion: string };

export class ReportRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function createReport(data: CreateReportRequest): Promise<CreatedReport> {
  const response = await apiFetch(`${API_BASE_URL}/api/reportes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Nostalgiar-Request": "1" },
    body: JSON.stringify({ ...data, detalle: data.detalle?.trim() || null }),
  });
  if (!response.ok) throw new ReportRequestError(await reportError(response), response.status);
  return (await response.json()) as CreatedReport;
}

async function reportError(response: Response) {
  const fallback = `No se pudo enviar el reporte (${response.status}).`;
  try {
    const body = (await response.json()) as { detail?: string; mensaje?: string; title?: string };
    return body.detail ?? body.mensaje ?? body.title ?? fallback;
  } catch {
    return fallback;
  }
}
