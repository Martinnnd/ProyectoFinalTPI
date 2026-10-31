import { API_BASE_URL, getSesion } from '../api';
import {
  parseConversationSummaries,
  parseUserSummary,
  type ConversationSummaryDto,
  type UserSummaryDto,
} from './types';

/** Builds authorization headers. Throws when there is no active session. */
function getAuthorizedHeaders(): Record<string, string> {
  const session = getSesion();
  if (!session?.token) throw new Error('No hay sesión activa.');
  return { Authorization: `Bearer ${session.token}` };
}

/**
 * Gets all active conversations for the authenticated user.
 * Conversations with no messages for more than seven days are excluded.
 * GET /api/chat/conversaciones
 */
export async function getConversations(): Promise<ConversationSummaryDto[]> {
  const headers = getAuthorizedHeaders();
  const response = await fetch(`${API_BASE_URL}/api/chat/conversaciones`, {
    headers,
    cache: 'no-store',
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
    throw new Error(`Error al cargar conversaciones (${response.status}).`);
  }
  return parseConversationSummaries(await response.json());
}

/**
 * Finds a user by their exact username.
 * Used to resolve the user ID before starting a chat from a profile.
 * GET /api/usuario/por-username/{username}
 */
export async function getUserByUsername(username: string): Promise<UserSummaryDto> {
  const headers = getAuthorizedHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/usuario/por-username/${encodeURIComponent(username)}`,
    { headers, cache: 'no-store' },
  );
  if (!response.ok) {
    if (response.status === 404) throw new Error(`El usuario "${username}" no existe.`);
    if (response.status === 401) throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
    throw new Error(`Error al buscar usuario (${response.status}).`);
  }
  return parseUserSummary(await response.json());
}

/**
 * Deletes all messages in the conversation between the authenticated user
 * and another user.
 * DELETE /api/chat/conversaciones/{otroUsuarioId}
 */
export async function deleteConversation(otherUserId: number): Promise<void> {
  const headers = getAuthorizedHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/chat/conversaciones/${otherUserId}`,
    { method: 'DELETE', headers },
  );
  if (!response.ok) {
    if (response.status === 404) throw new Error('No existe una conversación activa con este usuario.');
    if (response.status === 400) throw new Error('No podés eliminar una conversación con vos mismo.');
    if (response.status === 401) throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
    throw new Error(`Error al eliminar la conversación (${response.status}).`);
  }
}
