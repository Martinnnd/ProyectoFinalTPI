import { API_BASE_URL, getSesion } from '../api';
import type { ConversacionResumenDto, UsuarioResumenDto } from './types';

/** Construye los headers de autorización. Lanza si no hay sesión activa. */
function headersAutorizados(): Record<string, string> {
  const sesion = getSesion();
  if (!sesion?.token) throw new Error('No hay sesión activa.');
  return { Authorization: `Bearer ${sesion.token}` };
}

/**
 * Obtiene el resumen de todas las conversaciones activas del usuario autenticado.
 * Las conversaciones expiradas (>7 días sin mensajes) no se incluyen.
 * GET /api/chat/conversaciones
 */
export async function obtenerConversaciones(): Promise<ConversacionResumenDto[]> {
  const headers = headersAutorizados();
  const response = await fetch(`${API_BASE_URL}/api/chat/conversaciones`, {
    headers,
    cache: 'no-store',
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
    throw new Error(`Error al cargar conversaciones (${response.status}).`);
  }
  return response.json();
}

/**
 * Busca un usuario por su nombre de usuario exacto.
 * Usado para resolver el usuarioId antes de iniciar un chat desde un perfil.
 * GET /api/usuario/por-username/{username}
 */
export async function obtenerUsuarioPorUsername(username: string): Promise<UsuarioResumenDto> {
  const headers = headersAutorizados();
  const response = await fetch(
    `${API_BASE_URL}/api/usuario/por-username/${encodeURIComponent(username)}`,
    { headers, cache: 'no-store' },
  );
  if (!response.ok) {
    if (response.status === 404) throw new Error(`El usuario "${username}" no existe.`);
    if (response.status === 401) throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
    throw new Error(`Error al buscar usuario (${response.status}).`);
  }
  return response.json();
}

/**
 * Elimina todos los mensajes de la conversación entre el usuario autenticado
 * y otro usuario específico. La eliminación es inmediata, sin esperar los 7 días
 * de expiración natural.
 * DELETE /api/chat/conversaciones/{otroUsuarioId}
 */
export async function eliminarConversacion(otroUsuarioId: number): Promise<void> {
  const headers = headersAutorizados();
  const response = await fetch(
    `${API_BASE_URL}/api/chat/conversaciones/${otroUsuarioId}`,
    { method: 'DELETE', headers },
  );
  if (!response.ok) {
    if (response.status === 404) throw new Error('No existe una conversación activa con este usuario.');
    if (response.status === 400) throw new Error('No podés eliminar una conversación con vos mismo.');
    if (response.status === 401) throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
    throw new Error(`Error al eliminar la conversación (${response.status}).`);
  }
}
