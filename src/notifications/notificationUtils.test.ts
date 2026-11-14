import { describe, expect, it } from "vitest";
import {
  getNotificationText,
  getNotificationNavigation,
  isNotificationFeatureImplemented,
} from "./notificationUtils";
import type { NotificationDto } from "./types";

function makeNotification(overrides: Partial<NotificationDto>): NotificationDto {
  return {
    id: 1,
    type: "newFollower",
    isRead: false,
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── getNotificationText ──────────────────────────────────────────────────────

describe("getNotificationText", () => {
  it("includes the username for newFollower when available", () => {
    const text = getNotificationText(
      makeNotification({ type: "newFollower", senderUsername: "pepito" }),
    );
    expect(text).toBe("@pepito empezó a seguirte.");
  });

  it("uses generic text for newFollower without username", () => {
    const text = getNotificationText(makeNotification({ type: "newFollower" }));
    expect(text).toBe("Alguien empezó a seguirte.");
  });

  it("returns correct text for publicationComment with and without username", () => {
    expect(
      getNotificationText(
        makeNotification({ type: "publicationComment", senderUsername: "pepito" }),
      ),
    ).toBe("@pepito comentó en tu recuerdo.");
    expect(getNotificationText(makeNotification({ type: "publicationComment" }))).toBe(
      "Comentaron en tu recuerdo.",
    );
  });

  it("returns correct text for publicationRating with score and username", () => {
    expect(
      getNotificationText(
        makeNotification({ type: "publicationRating", senderUsername: "pepito", puntaje: 5 }),
      ),
    ).toBe("@pepito puntuó tu recuerdo con 5 puntos.");
    expect(
      getNotificationText(makeNotification({ type: "publicationRating", puntaje: 4 })),
    ).toBe("Puntuaron tu recuerdo con 4 puntos.");
    expect(
      getNotificationText(
        makeNotification({ type: "publicationRating", senderUsername: "pepito" }),
      ),
    ).toBe("@pepito puntuó tu recuerdo.");
    expect(getNotificationText(makeNotification({ type: "publicationRating" }))).toBe(
      "Puntuaron tu recuerdo.",
    );
  });

  it("returns correct text for publicationLike", () => {
    expect(
      getNotificationText(makeNotification({ type: "publicationLike", senderUsername: "pepito" })),
    ).toBe("A @pepito le gustó tu recuerdo.");
    expect(getNotificationText(makeNotification({ type: "publicationLike" }))).toBe(
      "A alguien le gustó tu recuerdo.",
    );
  });

  it("returns correct text for publicationRepost", () => {
    expect(
      getNotificationText(makeNotification({ type: "publicationRepost", senderUsername: "pepito" })),
    ).toBe("@pepito compartió tu recuerdo.");
    expect(getNotificationText(makeNotification({ type: "publicationRepost" }))).toBe(
      "Alguien compartió tu recuerdo.",
    );
  });

  it("returns text for categoryPromotion", () => {
    const text = getNotificationText(makeNotification({ type: "categoryPromotion" }));
    expect(text).toBe("¡Felicitaciones! Subiste de categoría.");
  });

  it("returns placeholder text for emailMessages", () => {
    const text = getNotificationText(makeNotification({ type: "emailMessages" }));
    expect(text).toContain("correo");
  });

  it("returns correct text for chatMessage", () => {
    expect(
      getNotificationText(makeNotification({ type: "chatMessage", senderUsername: "pepito" })),
    ).toBe("@pepito te envió un mensaje.");
    expect(getNotificationText(makeNotification({ type: "chatMessage" }))).toBe(
      "Recibiste un mensaje nuevo.",
    );
  });

  it("explains an administrative moderation action", () => {
    expect(getNotificationText(makeNotification({ type: "administrative" }))).toBe(
      "Ocultamos tu publicación porque no cumple con las normas comunitarias.",
    );
  });

  it("returns correct text for userTagged with senderUsername", () => {
    const text = getNotificationText(
      makeNotification({ type: "userTagged", senderUsername: "juan" }),
    );
    expect(text).toBe("@juan te etiquetó en un recuerdo.");
  });

  it("returns generic text for userTagged without senderUsername", () => {
    const text = getNotificationText(makeNotification({ type: "userTagged" }));
    expect(text).toBe("Te etiquetaron en un recuerdo.");
  });
});

// ─── getNotificationNavigation ────────────────────────────────────────────────

describe("getNotificationNavigation", () => {
  it("returns push to sender profile for newFollower with senderUsername", () => {
    const nav = getNotificationNavigation(
      makeNotification({ type: "newFollower", senderUsername: "pepito" }),
    );
    expect(nav).toEqual({ kind: "push", path: "/perfil/pepito" });
  });

  it("returns none for newFollower without senderId", () => {
    const nav = getNotificationNavigation(makeNotification({ type: "newFollower" }));
    expect(nav).toEqual({ kind: "none" });
  });

  it("returns push to /recuerdo/:id for publicationComment with publicationId", () => {
    const nav = getNotificationNavigation(
      makeNotification({ type: "publicationComment", publicationId: 99 }),
    );
    expect(nav).toEqual({ kind: "push", path: "/recuerdo/99" });
  });

  it("returns none for publicationComment without publicationId", () => {
    const nav = getNotificationNavigation(makeNotification({ type: "publicationComment" }));
    expect(nav).toEqual({ kind: "none" });
  });

  it("returns push to /recuerdo/:id for publicationRating with publicationId", () => {
    const nav = getNotificationNavigation(
      makeNotification({ type: "publicationRating", publicationId: 55 }),
    );
    expect(nav).toEqual({ kind: "push", path: "/recuerdo/55" });
  });

  it("returns push to /recuerdo/:id for publicationLike with publicationId", () => {
    const nav = getNotificationNavigation(
      makeNotification({ type: "publicationLike", publicationId: 66 }),
    );
    expect(nav).toEqual({ kind: "push", path: "/recuerdo/66" });
  });

  it("returns push to /recuerdo/:id for publicationRepost with publicationId", () => {
    const nav = getNotificationNavigation(
      makeNotification({ type: "publicationRepost", publicationId: 77 }),
    );
    expect(nav).toEqual({ kind: "push", path: "/recuerdo/77" });
  });

  it("returns none for publicationRating without publicationId", () => {
    const nav = getNotificationNavigation(makeNotification({ type: "publicationRating" }));
    expect(nav).toEqual({ kind: "none" });
  });

  it("returns push to /perfil for categoryPromotion", () => {
    const nav = getNotificationNavigation(makeNotification({ type: "categoryPromotion" }));
    expect(nav).toEqual({ kind: "push", path: "/perfil" });
  });

  it("returns none for emailMessages", () => {
    const nav = getNotificationNavigation(makeNotification({ type: "emailMessages" }));
    expect(nav).toEqual({ kind: "none" });
  });

  it("returns openChat for chatMessage", () => {
    const nav = getNotificationNavigation(makeNotification({ type: "chatMessage" }));
    expect(nav).toEqual({ kind: "openChat" });
  });

  it("opens the moderated publication for administrative notifications", () => {
    expect(
      getNotificationNavigation(makeNotification({ type: "administrative", publicationId: 88 })),
    ).toEqual({ kind: "push", path: "/recuerdo/88" });
  });

  it("returns push to /recuerdo/:id for userTagged with publicationId", () => {
    const nav = getNotificationNavigation(
      makeNotification({ type: "userTagged", publicationId: 77 }),
    );
    expect(nav).toEqual({ kind: "push", path: "/recuerdo/77" });
  });

  it("returns none for userTagged without publicationId", () => {
    const nav = getNotificationNavigation(makeNotification({ type: "userTagged" }));
    expect(nav).toEqual({ kind: "none" });
  });
});

// ─── isNotificationFeatureImplemented ────────────────────────────────────────

describe("isNotificationFeatureImplemented", () => {
  it("returns true for types with implemented backend", () => {
    expect(isNotificationFeatureImplemented("newFollower")).toBe(true);
    expect(isNotificationFeatureImplemented("publicationComment")).toBe(true);
    expect(isNotificationFeatureImplemented("publicationRating")).toBe(true);
    expect(isNotificationFeatureImplemented("publicationLike")).toBe(true);
    expect(isNotificationFeatureImplemented("publicationRepost")).toBe(true);
    expect(isNotificationFeatureImplemented("chatMessage")).toBe(true);
    expect(isNotificationFeatureImplemented("administrative")).toBe(true);
    expect(isNotificationFeatureImplemented("userTagged")).toBe(true);
    expect(isNotificationFeatureImplemented("categoryPromotion")).toBe(true);
  });

  it("returns false for types with pending backend", () => {
    expect(isNotificationFeatureImplemented("emailMessages")).toBe(false);
  });
});
