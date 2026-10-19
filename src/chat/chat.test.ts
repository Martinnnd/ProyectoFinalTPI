import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock se hoistea al tope del archivo por Vitest, antes de los imports.
vi.mock('../api', () => ({
  API_BASE_URL: 'http://localhost:5199',
  getSesion: vi.fn(),
}));

import { getSesion } from '../api';
import { obtenerConversaciones, obtenerUsuarioPorUsername, eliminarConversacion } from './chatApi';
import type { ConversacionResumenDto, UsuarioResumenDto } from './types';

// Sesión de prueba reutilizable
const sesionMock = {
  token: 'jwt-valido',
  usuarioId: 1,
  username: 'nico',
  email: 'nico@example.com',
  esAdmin: false,
};

describe('chatApi', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.mocked(getSesion).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  describe('obtenerConversaciones', () => {
    it('lanza un error si no hay sesión activa', async () => {
      vi.mocked(getSesion).mockReturnValue(null);

      await expect(obtenerConversaciones()).rejects.toThrow('No hay sesión activa.');
    });

    it('lanza un error si el token está vacío', async () => {
      vi.mocked(getSesion).mockReturnValue({ ...sesionMock, token: '' });

      await expect(obtenerConversaciones()).rejects.toThrow('No hay sesión activa.');
    });

    it('llama al endpoint correcto con el header de autorización', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: true, json: async () => [] });

      await obtenerConversaciones();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5199/api/chat/conversaciones',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-valido' }),
          cache: 'no-store',
        }),
      );
    });

    it('devuelve la lista de conversaciones cuando la respuesta es exitosa', async () => {
      const conversaciones: ConversacionResumenDto[] = [
        {
          otroUsuarioId: 2,
          otroUsuarioUsername: 'lucia',
          ultimoMensaje: '¡Hola!',
          fechaUltimoMensaje: '2026-10-14T12:42:00Z',
        },
        {
          otroUsuarioId: 3,
          otroUsuarioUsername: 'marcos',
          ultimoMensaje: 'Me hiciste recordar esa época.',
          fechaUltimoMensaje: '2026-10-13T09:15:00Z',
        },
      ];
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: true, json: async () => conversaciones });

      const resultado = await obtenerConversaciones();

      expect(resultado).toEqual(conversaciones);
    });

    it('devuelve una lista vacía cuando el usuario no tiene conversaciones activas', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: true, json: async () => [] });

      const resultado = await obtenerConversaciones();

      expect(resultado).toEqual([]);
    });

    it('lanza error de sesión expirada cuando el servidor responde 401', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(obtenerConversaciones()).rejects.toThrow(
        'Sesión expirada. Iniciá sesión de nuevo.',
      );
    });

    it('lanza error genérico con el código de estado para otros errores HTTP', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(obtenerConversaciones()).rejects.toThrow(
        'Error al cargar conversaciones (500).',
      );
    });

    it('propaga errores de red sin modificarlos', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(obtenerConversaciones()).rejects.toThrow('Failed to fetch');
    });
  });

  // ---------------------------------------------------------------------------
  describe('obtenerUsuarioPorUsername', () => {
    it('lanza un error si no hay sesión activa', async () => {
      vi.mocked(getSesion).mockReturnValue(null);

      await expect(obtenerUsuarioPorUsername('lucia')).rejects.toThrow(
        'No hay sesión activa.',
      );
    });

    it('llama al endpoint correcto con el header de autorización', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ usuarioId: 2, username: 'lucia' }),
      });

      await obtenerUsuarioPorUsername('lucia');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5199/api/usuario/por-username/lucia',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-valido' }),
          cache: 'no-store',
        }),
      );
    });

    it('codifica correctamente los caracteres especiales del username en la URL', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ usuarioId: 4, username: 'lucia test' }),
      });

      await obtenerUsuarioPorUsername('lucia test');

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5199/api/usuario/por-username/lucia%20test',
        expect.anything(),
      );
    });

    it('devuelve los datos del usuario cuando la respuesta es exitosa', async () => {
      const usuario: UsuarioResumenDto = { usuarioId: 2, username: 'lucia' };
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: true, json: async () => usuario });

      const resultado = await obtenerUsuarioPorUsername('lucia');

      expect(resultado).toEqual(usuario);
    });

    it('lanza error descriptivo cuando el usuario no existe (404)', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 404 });

      await expect(obtenerUsuarioPorUsername('noexiste')).rejects.toThrow(
        'El usuario "noexiste" no existe.',
      );
    });

    it('lanza error de sesión expirada cuando el servidor responde 401', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(obtenerUsuarioPorUsername('lucia')).rejects.toThrow(
        'Sesión expirada. Iniciá sesión de nuevo.',
      );
    });

    it('lanza error genérico con el código de estado para otros errores HTTP', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 503 });

      await expect(obtenerUsuarioPorUsername('lucia')).rejects.toThrow(
        'Error al buscar usuario (503).',
      );
    });

    it('propaga errores de red sin modificarlos', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(obtenerUsuarioPorUsername('lucia')).rejects.toThrow('Failed to fetch');
    });
  });

  // ---------------------------------------------------------------------------
  describe('eliminarConversacion', () => {
    it('lanza un error si no hay sesión activa', async () => {
      vi.mocked(getSesion).mockReturnValue(null);

      await expect(eliminarConversacion(2)).rejects.toThrow('No hay sesión activa.');
    });

    it('llama al endpoint correcto con method DELETE y el header de autorización', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: true, status: 204 });

      await eliminarConversacion(2);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5199/api/chat/conversaciones/2',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({ Authorization: 'Bearer jwt-valido' }),
        }),
      );
    });

    it('resuelve sin valor cuando el servidor responde 204', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: true, status: 204 });

      await expect(eliminarConversacion(2)).resolves.toBeUndefined();
    });

    it('lanza error descriptivo cuando no existe la conversación (404)', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 404 });

      await expect(eliminarConversacion(2)).rejects.toThrow(
        'No existe una conversación activa con este usuario.',
      );
    });

    it('lanza error descriptivo al intentar eliminar una conversación con uno mismo (400)', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 400 });

      await expect(eliminarConversacion(1)).rejects.toThrow(
        'No podés eliminar una conversación con vos mismo.',
      );
    });

    it('lanza error de sesión expirada cuando el servidor responde 401', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(eliminarConversacion(2)).rejects.toThrow(
        'Sesión expirada. Iniciá sesión de nuevo.',
      );
    });

    it('lanza error genérico con el código de estado para otros errores HTTP', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(eliminarConversacion(2)).rejects.toThrow(
        'Error al eliminar la conversación (500).',
      );
    });

    it('propaga errores de red sin modificarlos', async () => {
      vi.mocked(getSesion).mockReturnValue(sesionMock);
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(eliminarConversacion(2)).rejects.toThrow('Failed to fetch');
    });
  });
});
