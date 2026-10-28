import { describe, expect, it } from 'vitest';
import {
  getNotificationText,
  getNotificationNavigation,
  isNotificationFeatureImplemented,
} from './notificationUtils';
import type { NotificationDto } from './types';

function makeNotification(overrides: Partial<NotificationDto>): NotificationDto {
  return {
    id: 1,
    type: 'newFollower',
    isRead: false,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── getNotificationText ──────────────────────────────────────────────────────

describe('getNotificationText', () => {
  it('includes the username for newFollower when available', () => {
    const text = getNotificationText(makeNotification({ type: 'newFollower', senderUsername: 'pepito' }));
    expect(text).toBe('@pepito te empezó a seguir');
  });

  it('uses generic text for newFollower without username', () => {
    const text = getNotificationText(makeNotification({ type: 'newFollower' }));
    expect(text).toBe('Alguien te empezó a seguir');
  });

  it('returns correct text for publicationComment', () => {
    const text = getNotificationText(makeNotification({ type: 'publicationComment' }));
    expect(text).toBe('Comentarios en tu publicación');
  });

  it('returns correct text for publicationRating', () => {
    const text = getNotificationText(makeNotification({ type: 'publicationRating' }));
    expect(text).toBe('Puntuaciones en tu publicación');
  });

  it('returns placeholder text for categoryPromotion', () => {
    const text = getNotificationText(makeNotification({ type: 'categoryPromotion' }));
    expect(text).toContain('categoría');
  });

  it('returns placeholder text for emailMessages', () => {
    const text = getNotificationText(makeNotification({ type: 'emailMessages' }));
    expect(text).toContain('correo');
  });

  it('returns correct text for chatMessage', () => {
    const text = getNotificationText(makeNotification({ type: 'chatMessage' }));
    expect(text).toContain('chat');
  });
});

// ─── getNotificationNavigation ────────────────────────────────────────────────

describe('getNotificationNavigation', () => {
  it('returns push to sender profile for newFollower with senderUsername', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'newFollower', senderUsername: 'pepito' }));
    expect(nav).toEqual({ kind: 'push', path: '/perfil/pepito' });
  });

  it('returns none for newFollower without senderId', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'newFollower' }));
    expect(nav).toEqual({ kind: 'none' });
  });

  it('returns push to publication for publicationComment with publicationId', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'publicationComment', publicationId: 99 }));
    expect(nav).toEqual({ kind: 'push', path: '/explorar?view=feed&post=99' });
  });

  it('returns none for publicationComment without publicationId', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'publicationComment' }));
    expect(nav).toEqual({ kind: 'none' });
  });

  it('returns push to publication for publicationRating with publicationId', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'publicationRating', publicationId: 55 }));
    expect(nav).toEqual({ kind: 'push', path: '/explorar?view=feed&post=55' });
  });

  it('returns none for publicationRating without publicationId', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'publicationRating' }));
    expect(nav).toEqual({ kind: 'none' });
  });

  it('returns push to /perfil for categoryPromotion', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'categoryPromotion' }));
    expect(nav).toEqual({ kind: 'push', path: '/perfil' });
  });

  it('returns push to /correo for emailMessages', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'emailMessages' }));
    expect(nav).toEqual({ kind: 'push', path: '/correo' });
  });

  it('returns openChat for chatMessage', () => {
    const nav = getNotificationNavigation(makeNotification({ type: 'chatMessage' }));
    expect(nav).toEqual({ kind: 'openChat' });
  });
});

// ─── isNotificationFeatureImplemented ────────────────────────────────────────

describe('isNotificationFeatureImplemented', () => {
  it('returns true for types with implemented backend', () => {
    expect(isNotificationFeatureImplemented('newFollower')).toBe(true);
    expect(isNotificationFeatureImplemented('publicationComment')).toBe(true);
    expect(isNotificationFeatureImplemented('publicationRating')).toBe(true);
    expect(isNotificationFeatureImplemented('chatMessage')).toBe(true);
  });

  it('returns false for types with pending backend', () => {
    expect(isNotificationFeatureImplemented('categoryPromotion')).toBe(false);
    expect(isNotificationFeatureImplemented('emailMessages')).toBe(false);
  });
});
