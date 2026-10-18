/**
 * DTO de un mensaje de chat.
 * Refleja el MensajeChatDto del backend.
 */
export interface MensajeChatDto {
  id: number;
  emisorId: number;
  emisorUsername: string;
  destinatarioId: number;
  contenido: string;
  /** Timestamp UTC en formato ISO 8601 */
  fechaEnvio: string;
}

/**
 * Resumen de una conversación activa.
 * Refleja el ConversacionResumenDto del backend.
 */
export interface ConversacionResumenDto {
  otroUsuarioId: number;
  otroUsuarioUsername: string;
  ultimoMensaje: string;
  /** Timestamp UTC en formato ISO 8601 */
  fechaUltimoMensaje: string;
}

/**
 * Datos básicos de un usuario.
 * Refleja el UsuarioResumenDto del backend.
 */
export interface UsuarioResumenDto {
  usuarioId: number;
  username: string;
}
