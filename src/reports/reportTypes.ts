export const reportTarget = {
  publication: 0,
  comment: 1,
  chatMessage: 2,
  profile: 3,
} as const;

export type ReportTarget = (typeof reportTarget)[keyof typeof reportTarget];

export const reportReasons = [
  { value: 0, label: "Spam" },
  { value: 1, label: "Acoso" },
  { value: 2, label: "Contenido ofensivo" },
  { value: 3, label: "Desinformación" },
  { value: 4, label: "Suplantación de identidad" },
  { value: 5, label: "Contenido sexual" },
  { value: 6, label: "Violencia" },
  { value: 7, label: "Otro" },
] as const;

export type ReportReason = (typeof reportReasons)[number]["value"];

export const reportTargetLabels: Record<ReportTarget, string> = {
  0: "Publicación",
  1: "Comentario",
  2: "Mensaje de chat",
  3: "Perfil",
};

export const reportStateLabels = {
  0: "Pendiente",
  1: "En revisión",
  2: "Resuelto",
  3: "Desestimado",
} as const;

export const reportActionLabels = {
  0: "Desestimar",
  1: "Ocultar contenido",
  2: "Eliminar contenido",
  3: "Suspender usuario",
  4: "Dar de baja usuario",
} as const;

export type ReportAction = keyof typeof reportActionLabels;

export function actionsForTarget(target: ReportTarget): ReportAction[] {
  if (target === reportTarget.profile) return [0, 3, 4];
  if (target === reportTarget.publication) return [0, 1, 2, 3, 4];
  return [0, 2, 3, 4];
}
