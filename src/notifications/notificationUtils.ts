import type { NotificationDto, NotificationType } from "./types";

/**
 * Returns the descriptive text for a notification.
 * Backend-pending types (categoryPromotion and emailMessages) use placeholders.
 */
export function getNotificationText(notification: NotificationDto): string {
  const { type, senderUsername, puntaje } = notification;

  switch (type) {
    case "newFollower":
      return senderUsername
        ? `@${senderUsername} empezó a seguirte.`
        : "Alguien empezó a seguirte.";

    case "publicationComment":
      return senderUsername
        ? `@${senderUsername} comentó en tu recuerdo.`
        : "Comentaron en tu recuerdo.";

    case "publicationRating":
      if (puntaje != null) {
        return senderUsername
          ? `@${senderUsername} puntuó tu recuerdo con ${puntaje} puntos.`
          : `Puntuaron tu recuerdo con ${puntaje} puntos.`;
      }
      return senderUsername
        ? `@${senderUsername} puntuó tu recuerdo.`
        : "Puntuaron tu recuerdo.";

    case "publicationLike":
      return senderUsername
        ? `A @${senderUsername} le gustó tu recuerdo.`
        : "A alguien le gustó tu recuerdo.";

    case "publicationRepost":
      return senderUsername
        ? `@${senderUsername} compartió tu recuerdo.`
        : "Alguien compartió tu recuerdo.";

    case "categoryPromotion":
      return "¡Felicitaciones! Subiste de categoría.";

    case "emailMessages":
      return "Tienes nuevos mensajes en tu casilla de correo.";

    case "chatMessage":
      return senderUsername
        ? `@${senderUsername} te envió un mensaje.`
        : "Recibiste un mensaje nuevo.";

    case "administrative":
      return "Ocultamos tu publicación porque no cumple con las normas comunitarias.";

    case "userTagged":
      return senderUsername
        ? `@${senderUsername} te etiquetó en un recuerdo.`
        : "Te etiquetaron en un recuerdo.";

    default: {
      const exhaustiveCheck: never = type;
      return "Nueva notificación";
    }
  }
}

/**
 * Describes the navigation action for a notification.
 * All routing decisions are centralized here; Notification.tsx only executes them.
 */
export type NotificationNavigation =
  { kind: "push"; path: string } | { kind: "openChat" } | { kind: "none" };

export function getNotificationNavigation(notification: NotificationDto): NotificationNavigation {
  const { type, publicationId, senderUsername } = notification;

  switch (type) {
    case "newFollower":
      return senderUsername
        ? { kind: "push", path: `/perfil/${encodeURIComponent(senderUsername)}` }
        : { kind: "none" };

    case "publicationComment":
    case "publicationRating":
    case "publicationLike":
    case "publicationRepost":
    case "userTagged":
      return publicationId != null
        ? { kind: "push", path: `/recuerdo/${publicationId}` }
        : { kind: "none" };

    case "categoryPromotion":
      return { kind: "push", path: "/perfil" };

    case "emailMessages":
      return { kind: "none" };

    case "chatMessage":
      return { kind: "openChat" };

    case "administrative":
      return publicationId != null
        ? { kind: "push", path: `/recuerdo/${publicationId}` }
        : { kind: "none" };

    default: {
      const exhaustiveCheck: never = type;
      return { kind: "none" };
    }
  }
}

/** Returns whether the backend feature for a notification type is implemented. */
export function isNotificationFeatureImplemented(type: NotificationType): boolean {
  switch (type) {
    case "newFollower":
    case "publicationComment":
    case "publicationRating":
    case "publicationLike":
    case "publicationRepost":
    case "chatMessage":
    case "administrative":
    case "userTagged":
    case "categoryPromotion":
      return true;
    case "emailMessages":
      return false;
    default: {
      const exhaustiveCheck: never = type;
      return false;
    }
  }
}
