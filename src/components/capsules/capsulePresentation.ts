import type { Decade } from "../../types";
import type { Capsule } from "../../capsulesApi";

export const capsuleObjects: Record<Decade, { medium: string; label: string }> = {
  1970: { medium: "cassette", label: "Casete de recuerdos" },
  1980: { medium: "vhs", label: "Cinta de recuerdos" },
  1990: { medium: "disc", label: "Disco de recuerdos" },
  2000: { medium: "usb", label: "Memoria de recuerdos" },
  2010: { medium: "phone", label: "Carrete de recuerdos" },
  2020: { medium: "cloud", label: "Nube de recuerdos" },
};
export function capsulePeriod(capsule: Pick<Capsule, "fechaDesde" | "fechaHasta">): string {
  if (!capsule.fechaDesde || !capsule.fechaHasta) return "Tu historia empieza acá";
  const from = new Date(capsule.fechaDesde).getUTCFullYear();
  const to = new Date(capsule.fechaHasta).getUTCFullYear();
  return from === to ? String(from) : `${from} — ${to}`;
}
export function memoryDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}
export function mergeCapsuleItems<T extends { id: string | number }>(
  previous: T[],
  incoming: T[],
): T[] {
  return [...new Map([...previous, ...incoming].map((item) => [item.id, item])).values()];
}
