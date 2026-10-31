export interface ChatMessageDto {
  id: number;
  senderId: number;
  senderUsername: string;
  recipientId: number;
  content: string;
  sentAt: string;
}

export interface ConversationSummaryDto {
  otherUserId: number;
  otherUsername: string;
  lastMessage: string;
  lastMessageAt: string;
}

export interface UserSummaryDto {
  userId: number;
  username: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseChatMessage(value: unknown): ChatMessageDto {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    typeof value.emisorId !== "number" ||
    typeof value.emisorUsername !== "string" ||
    typeof value.destinatarioId !== "number" ||
    typeof value.contenido !== "string" ||
    typeof value.fechaEnvio !== "string"
  ) {
    throw new Error("Invalid chat message response.");
  }

  return {
    id: value.id,
    senderId: value.emisorId,
    senderUsername: value.emisorUsername,
    recipientId: value.destinatarioId,
    content: value.contenido,
    sentAt: value.fechaEnvio,
  };
}

export function parseChatMessages(value: unknown): ChatMessageDto[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid chat history response.");
  }
  return value.map(parseChatMessage);
}

export function parseConversationSummary(value: unknown): ConversationSummaryDto {
  if (
    !isRecord(value) ||
    typeof value.otroUsuarioId !== "number" ||
    typeof value.otroUsuarioUsername !== "string" ||
    typeof value.ultimoMensaje !== "string" ||
    typeof value.fechaUltimoMensaje !== "string"
  ) {
    throw new Error("Invalid conversation summary response.");
  }

  return {
    otherUserId: value.otroUsuarioId,
    otherUsername: value.otroUsuarioUsername,
    lastMessage: value.ultimoMensaje,
    lastMessageAt: value.fechaUltimoMensaje,
  };
}

export function parseConversationSummaries(value: unknown): ConversationSummaryDto[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid conversations response.");
  }
  return value.map(parseConversationSummary);
}

export function parseUserSummary(value: unknown): UserSummaryDto {
  if (
    !isRecord(value) ||
    typeof value.usuarioId !== "number" ||
    typeof value.username !== "string"
  ) {
    throw new Error("Invalid user summary response.");
  }

  return {
    userId: value.usuarioId,
    username: value.username,
  };
}
