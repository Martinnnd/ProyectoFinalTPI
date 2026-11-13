import { API_BASE_URL, getSesion } from "../api";
import { parseNotifications, type NotificationDto } from "./types";

/** Builds authorization headers. Throws when there is no active session. */
function getAuthorizedHeaders(): Record<string, string> {
  const session = getSesion();
  if (!session?.token) throw new Error("No hay sesión activa.");
  return { Authorization: `Bearer ${session.token}` };
}

/**
 * Gets non-expired notifications for the authenticated user.
 * GET /api/notificaciones
 */
export async function getNotifications(): Promise<NotificationDto[]> {
  const headers = getAuthorizedHeaders();
  const response = await fetch(`${API_BASE_URL}/api/notificaciones`, {
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Sesión expirada. Iniciá sesión de nuevo.");
    throw new Error(`Error al cargar notificaciones (${response.status}).`);
  }
  return parseNotifications(await response.json());
}

/**
 * Marks a specific notification as read.
 * PATCH /api/notificaciones/{id}/leida
 */
export async function markNotificationAsRead(id: number): Promise<void> {
  const headers = getAuthorizedHeaders();
  const response = await fetch(`${API_BASE_URL}/api/notificaciones/${id}/leida`, {
    method: "PATCH",
    headers,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Sesión expirada. Iniciá sesión de nuevo.");
    if (response.status === 404) throw new Error("Notificación no encontrada.");
    throw new Error(`Error al marcar notificación como leída (${response.status}).`);
  }
}

/**
 * Marks all notifications for the authenticated user as read.
 * PATCH /api/notificaciones/leidas
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const headers = getAuthorizedHeaders();
  const response = await fetch(`${API_BASE_URL}/api/notificaciones/leidas`, {
    method: "PATCH",
    headers,
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Sesión expirada. Iniciá sesión de nuevo.");
    throw new Error(`Error al marcar todas las notificaciones como leídas (${response.status}).`);
  }
}
