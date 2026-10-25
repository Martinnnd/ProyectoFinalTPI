import { describe, expect, it } from 'vitest';
import { parseNotification, parseNotifications } from './types';

// ─── parseNotification ────────────────────────────────────────────────────────

describe('parseNotification', () => {
  it('correctly maps all backend field names to internal model', () => {
    const result = parseNotification({
      id: 1,
      tipo: 'NuevoSeguidor',
      leida: false,
      fechaCreacion: '2024-01-01T00:00:00Z',
      emisorId: 2,
      emisorUsername: 'pepito',
    });

    expect(result).toEqual({
      id: 1,
      type: 'newFollower',
      isRead: false,
      createdAt: '2024-01-01T00:00:00Z',
      senderId: 2,
      senderUsername: 'pepito',
    });
  });

  it('maps all notification types from backend values', () => {
    const cases: [string, string][] = [
      ['NuevoSeguidor', 'newFollower'],
      ['ComentarioEnPublicacion', 'publicationComment'],
      ['PuntuacionEnPublicacion', 'publicationRating'],
      ['AscensoCategoria', 'categoryPromotion'],
      ['MensajesCorreo', 'emailMessages'],
      ['MensajeChat', 'chatMessage'],
    ];

    for (const [backendType, expectedType] of cases) {
      const result = parseNotification({
        id: 1,
        tipo: backendType,
        leida: false,
        fechaCreacion: '2024-01-01T00:00:00Z',
      });
      expect(result.type).toBe(expectedType);
    }
  });

  it('parses a notification without optional fields', () => {
    const result = parseNotification({
      id: 5,
      tipo: 'MensajeChat',
      leida: true,
      fechaCreacion: '2024-06-15T12:00:00Z',
    });

    expect(result).toEqual({
      id: 5,
      type: 'chatMessage',
      isRead: true,
      createdAt: '2024-06-15T12:00:00Z',
    });
    expect(result.publicationId).toBeUndefined();
    expect(result.senderId).toBeUndefined();
    expect(result.senderUsername).toBeUndefined();
  });

  it('throws on null input', () => {
    expect(() => parseNotification(null)).toThrow('Invalid notification response.');
  });

  it('throws on array input', () => {
    expect(() => parseNotification([])).toThrow('Invalid notification response.');
  });

  it('throws when id is missing', () => {
    expect(() => parseNotification({
      tipo: 'NuevoSeguidor',
      leida: false,
      fechaCreacion: '2024-01-01T00:00:00Z',
    })).toThrow('Invalid notification response.');
  });

  it('throws when tipo is an unknown backend value', () => {
    expect(() => parseNotification({
      id: 1,
      tipo: 'TipoDesconocido',
      leida: false,
      fechaCreacion: '2024-01-01T00:00:00Z',
    })).toThrow('Invalid notification response.');
  });

  it('throws when leida is not a boolean', () => {
    expect(() => parseNotification({
      id: 1,
      tipo: 'NuevoSeguidor',
      leida: 'false',
      fechaCreacion: '2024-01-01T00:00:00Z',
    })).toThrow('Invalid notification response.');
  });

  it('throws when fechaCreacion is not a string', () => {
    expect(() => parseNotification({
      id: 1,
      tipo: 'NuevoSeguidor',
      leida: false,
      fechaCreacion: 12345,
    })).toThrow('Invalid notification response.');
  });

  it('throws when publicacionId is present but not a number', () => {
    expect(() => parseNotification({
      id: 1,
      tipo: 'ComentarioEnPublicacion',
      leida: false,
      fechaCreacion: '2024-01-01T00:00:00Z',
      publicacionId: 'not-a-number',
    })).toThrow('Invalid notification response.');
  });

  it('throws when emisorId is present but not a number', () => {
    expect(() => parseNotification({
      id: 1,
      tipo: 'NuevoSeguidor',
      leida: false,
      fechaCreacion: '2024-01-01T00:00:00Z',
      emisorId: 'not-a-number',
    })).toThrow('Invalid notification response.');
  });

  it('throws when emisorUsername is present but not a string', () => {
    expect(() => parseNotification({
      id: 1,
      tipo: 'NuevoSeguidor',
      leida: false,
      fechaCreacion: '2024-01-01T00:00:00Z',
      emisorUsername: 123,
    })).toThrow('Invalid notification response.');
  });
});

// ─── parseNotifications ───────────────────────────────────────────────────────

describe('parseNotifications', () => {
  it('returns an empty array for an empty array input', () => {
    expect(parseNotifications([])).toEqual([]);
  });

  it('parses all notifications in the array', () => {
    const result = parseNotifications([
      { id: 1, tipo: 'NuevoSeguidor', leida: false, fechaCreacion: '2024-01-01T00:00:00Z' },
      { id: 2, tipo: 'MensajeChat', leida: true, fechaCreacion: '2024-02-01T00:00:00Z' },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('newFollower');
    expect(result[1].type).toBe('chatMessage');
  });

  it('throws when input is not an array', () => {
    expect(() => parseNotifications({})).toThrow('Invalid notifications response.');
    expect(() => parseNotifications(null)).toThrow('Invalid notifications response.');
    expect(() => parseNotifications('string')).toThrow('Invalid notifications response.');
  });

  it('throws when any item in the array is invalid', () => {
    expect(() => parseNotifications([
      { id: 1, tipo: 'NuevoSeguidor', leida: false, fechaCreacion: '2024-01-01T00:00:00Z' },
      { id: 2, tipo: 'TipoInvalido', leida: true, fechaCreacion: '2024-02-01T00:00:00Z' },
    ])).toThrow('Invalid notification response.');
  });
});
