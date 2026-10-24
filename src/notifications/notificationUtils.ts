import type { NotificationDto, NotificationType } from "./types";

/**
 * Returns the descriptive text for a notification.
 * Backend-pending types (categoryPromotion and emailMessages) use placeholders.
 */
export function getNotificationText(notification: NotificationDto): string {
  const { type, senderUsername } = notification;

  switch (type) {
    case "newFollower":
      return senderUsername
        ? `@${senderUsername} te empezó a seguir`
        : "Alguien te empezó a seguir";

    case "publicationComment":
      return "Comentarios en tu publicación";

    case "publicationRating":
      return "Puntuaciones en tu publicación";

    case "categoryPromotion":
      return "¡Felicidades! Subiste de categoría";

    case "emailMessages":
      return "Tenés mensajes sin leer en tu correo";

    case "chatMessage":
      return "Tenés mensajes sin leer en el chat";

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
  | { kind: "push"; path: string }
  | { kind: "openChat" }
  | { kind: "none" };

export function getNotificationNavigation(notification: NotificationDto): NotificationNavigation {
  const { type, publicationId, senderUsername } = notification;

  switch (type) {
    case "newFollower":
      return senderUsername
        ? { kind: "push", path: `/explorar?view=profile&profile=${encodeURIComponent(senderUsername)}` }
        : { kind: "none" };

    case "publicationComment":
    case "publicationRating":
      return publicationId != null
        ? { kind: "push", path: `/explorar?view=feed&post=${publicationId}` }
        : { kind: "none" };

    case "categoryPromotion":
      // Placeholder — navigates to own profile where category is shown
      return { kind: "push", path: "/perfil" };

    case "emailMessages":
      // Placeholder — main mail screen
      return { kind: "push", path: "/correo" };

    case "chatMessage":
      return { kind: "openChat" };

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
    case "chatMessage":
      return true;
    case "categoryPromotion":
    case "emailMessages":
      return false;
    default: {
      const exhaustiveCheck: never = type;
      return false;
    }
  }
}
