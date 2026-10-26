import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({
  API_BASE_URL: 'https://api.test',
  getSesion: vi.fn(),
}));

import { getSesion } from '../api';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from './notificationApi';

const getSesionMock = vi.mocked(getSesion);
const fakeSession = { token: 'test-token', usuarioId: 1, username: 'user', email: 'a@b.com', esAdmin: false };

const backendNotification = {
  id: 1,
  tipo: 'NuevoSeguidor',
  leida: false,
  fechaCreacion: '2024-01-01T00:00:00Z',
  emisorId: 2,
  emisorUsername: 'pepito',
};

beforeEach(() => {
  vi.resetAllMocks();
  getSesionMock.mockReturnValue(fakeSession);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── getNotifications ─────────────────────────────────────────────────────────

describe('getNotifications', () => {
  it('returns parsed notifications when the response is ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([backendNotification]),
    } as unknown as Response);

    const result = await getNotifications();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      type: 'newFollower',
      isRead: false,
      createdAt: '2024-01-01T00:00:00Z',
      senderId: 2,
      senderUsername: 'pepito',
    });
  });

  it('calls the correct endpoint with authorization header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as unknown as Response);

    await getNotifications();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/api/notificaciones',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
        cache: 'no-store',
      }),
    );
  });

  it('throws session expired error on 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response);

    await expect(getNotifications()).rejects.toThrow('Sesión expirada');
  });

  it('throws generic error for other error codes', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(getNotifications()).rejects.toThrow('Error al cargar notificaciones (500)');
  });

  it('throws when there is no active session', async () => {
    getSesionMock.mockReturnValue(null);

    await expect(getNotifications()).rejects.toThrow('No hay sesión activa');
  });
});

// ─── markNotificationAsRead ───────────────────────────────────────────────────

describe('markNotificationAsRead', () => {
  it('sends PATCH to the correct endpoint with authorization', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

    await markNotificationAsRead(42);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/api/notificaciones/42/leida',
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-token' },
      }),
    );
  });

  it('throws session expired error on 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response);

    await expect(markNotificationAsRead(1)).rejects.toThrow('Sesión expirada');
  });

  it('throws not found error on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(markNotificationAsRead(1)).rejects.toThrow('Notificación no encontrada');
  });

  it('throws generic error for other error codes', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(markNotificationAsRead(1)).rejects.toThrow('Error al marcar notificación como leída (500)');
  });

  it('throws when there is no active session', async () => {
    getSesionMock.mockReturnValue(null);

    await expect(markNotificationAsRead(1)).rejects.toThrow('No hay sesión activa');
  });
});

// ─── markAllNotificationsAsRead ───────────────────────────────────────────────

describe('markAllNotificationsAsRead', () => {
  it('sends PATCH to the correct endpoint with authorization', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

    await markAllNotificationsAsRead();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/api/notificaciones/leidas',
      expect.objectContaining({
        method: 'PATCH',
        headers: { Authorization: 'Bearer test-token' },
      }),
    );
  });

  it('throws session expired error on 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response);

    await expect(markAllNotificationsAsRead()).rejects.toThrow('Sesión expirada');
  });

  it('throws generic error for other error codes', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(markAllNotificationsAsRead()).rejects.toThrow('Error al marcar todas las notificaciones como leídas (500)');
  });

  it('throws when there is no active session', async () => {
    getSesionMock.mockReturnValue(null);

    await expect(markAllNotificationsAsRead()).rejects.toThrow('No hay sesión activa');
  });
});
