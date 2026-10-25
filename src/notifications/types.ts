export type NotificationType =
  | "newFollower"
  | "publicationComment"
  | "publicationRating"
  | "categoryPromotion"
  | "emailMessages"
  | "chatMessage";

export interface NotificationDto {
  id: number;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  publicationId?: number;
  senderId?: number;
  senderUsername?: string;
}

const notificationTypeByApiValue: Record<string | number, NotificationType> = {
  NuevoSeguidor: "newFollower",
  ComentarioEnPublicacion: "publicationComment",
  PuntuacionEnPublicacion: "publicationRating",
  AscensoCategoria: "categoryPromotion",
  MensajesCorreo: "emailMessages",
  MensajeChat: "chatMessage",
  0: "newFollower",
  1: "publicationComment",
  2: "publicationRating",
  3: "categoryPromotion",
  4: "emailMessages",
  5: "chatMessage",
};

const apiField = {
  type: "tipo",
  isRead: "leida",
  createdAt: "fechaCreacion",
  publicationId: "publicacionId",
  senderId: "emisorId",
  senderUsername: "emisorUsername",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseNotification(value: unknown): NotificationDto {
  if (!isRecord(value)) {
    throw new Error("Invalid notification response.");
  }

  const apiType = value[apiField.type];
  const type =
    (typeof apiType === "string" || typeof apiType === "number") &&
    Object.hasOwn(notificationTypeByApiValue, apiType)
      ? notificationTypeByApiValue[apiType]
      : undefined;
  const isRead = value[apiField.isRead];
  const createdAt = value[apiField.createdAt];
  const id = value.id;
  if (
    typeof id !== "number" ||
    !Number.isFinite(id) ||
    !type ||
    typeof isRead !== "boolean" ||
    typeof createdAt !== "string"
  ) {
    throw new Error("Invalid notification response.");
  }

  const notification: NotificationDto = {
    id,
    type,
    isRead,
    createdAt,
  };

  const publicationId = value[apiField.publicationId];
  if (publicationId != null) {
    if (typeof publicationId !== "number" || !Number.isFinite(publicationId)) {
      throw new Error("Invalid notification response.");
    }
    notification.publicationId = publicationId;
  }

  const senderId = value[apiField.senderId];
  if (senderId != null) {
    if (typeof senderId !== "number" || !Number.isFinite(senderId)) {
      throw new Error("Invalid notification response.");
    }
    notification.senderId = senderId;
  }

  const senderUsername = value[apiField.senderUsername];
  if (senderUsername != null) {
    if (typeof senderUsername !== "string") {
      throw new Error("Invalid notification response.");
    }
    notification.senderUsername = senderUsername;
  }

  return notification;
}

export function parseNotifications(value: unknown): NotificationDto[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid notifications response.");
  }
  return value.map(parseNotification);
}
