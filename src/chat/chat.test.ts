import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted by Vitest before the imports.
vi.mock("../api", () => ({
  API_BASE_URL: "http://localhost:5199",
  getSesion: vi.fn(),
}));

import { getSesion } from "../api";
import { deleteConversation, getConversations, getUserByUsername } from "./chatApi";
import type { ConversationSummaryDto } from "./types";

const mockSession = {
  token: "jwt-valido",
  usuarioId: 1,
  username: "nico",
  email: "nico@example.com",
  esAdmin: false,
};

describe("chatApi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.mocked(getSesion).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getConversations", () => {
    it("throws when there is no active session", async () => {
      vi.mocked(getSesion).mockReturnValue(null);

      await expect(getConversations()).rejects.toThrow("No hay sesión activa.");
    });

    it("throws when the token is empty", async () => {
      vi.mocked(getSesion).mockReturnValue({ ...mockSession, token: "" });

      await expect(getConversations()).rejects.toThrow("No hay sesión activa.");
    });

    it("calls the correct endpoint with the authorization header", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: true, json: async () => [] });

      await getConversations();

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:5199/api/chat/conversaciones",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer jwt-valido" }),
          cache: "no-store",
        }),
      );
    });

    it("maps successful conversation responses to English DTOs", async () => {
      const conversations = [
        {
          otroUsuarioId: 2,
          otroUsuarioUsername: "lucia",
          ultimoMensaje: "¡Hola!",
          fechaUltimoMensaje: "2026-10-14T12:42:00Z",
        },
        {
          otroUsuarioId: 3,
          otroUsuarioUsername: "marcos",
          ultimoMensaje: "Me hiciste recordar esa época.",
          fechaUltimoMensaje: "2026-10-13T09:15:00Z",
        },
      ];
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: true, json: async () => conversations });

      const result = await getConversations();

      expect(result).toEqual<ConversationSummaryDto[]>([
        {
          otherUserId: 2,
          otherUsername: "lucia",
          lastMessage: "¡Hola!",
          lastMessageAt: "2026-10-14T12:42:00Z",
        },
        {
          otherUserId: 3,
          otherUsername: "marcos",
          lastMessage: "Me hiciste recordar esa época.",
          lastMessageAt: "2026-10-13T09:15:00Z",
        },
      ]);
    });

    it("returns an empty list when there are no active conversations", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: true, json: async () => [] });

      const result = await getConversations();

      expect(result).toEqual([]);
    });

    it("throws an expired-session error when the server responds with 401", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(getConversations()).rejects.toThrow("Sesión expirada. Iniciá sesión de nuevo.");
    });

    it("throws a status-specific error for other HTTP failures", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(getConversations()).rejects.toThrow("Error al cargar conversaciones (500).");
    });

    it("propagates network errors unchanged", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(getConversations()).rejects.toThrow("Failed to fetch");
    });
  });

  describe("getUserByUsername", () => {
    it("throws when there is no active session", async () => {
      vi.mocked(getSesion).mockReturnValue(null);

      await expect(getUserByUsername("lucia")).rejects.toThrow("No hay sesión activa.");
    });

    it("calls the correct endpoint with the authorization header", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ usuarioId: 2, username: "lucia" }),
      });

      await getUserByUsername("lucia");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:5199/api/usuario/por-username/lucia",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer jwt-valido" }),
          cache: "no-store",
        }),
      );
    });

    it("encodes special characters in the username URL segment", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ usuarioId: 4, username: "lucia test" }),
      });

      await getUserByUsername("lucia test");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:5199/api/usuario/por-username/lucia%20test",
        expect.anything(),
      );
    });

    it("maps a successful user response to an English DTO", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ usuarioId: 2, username: "lucia" }),
      });

      const result = await getUserByUsername("lucia");

      expect(result).toEqual({ userId: 2, username: "lucia" });
    });

    it("throws a descriptive error when the user does not exist (404)", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 404 });

      await expect(getUserByUsername("noexiste")).rejects.toThrow(
        'El usuario "noexiste" no existe.',
      );
    });

    it("throws an expired-session error when the server responds with 401", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(getUserByUsername("lucia")).rejects.toThrow(
        "Sesión expirada. Iniciá sesión de nuevo.",
      );
    });

    it("throws a status-specific error for other HTTP failures", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 503 });

      await expect(getUserByUsername("lucia")).rejects.toThrow("Error al buscar usuario (503).");
    });

    it("propagates network errors unchanged", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(getUserByUsername("lucia")).rejects.toThrow("Failed to fetch");
    });
  });

  describe("deleteConversation", () => {
    it("throws when there is no active session", async () => {
      vi.mocked(getSesion).mockReturnValue(null);

      await expect(deleteConversation(2)).rejects.toThrow("No hay sesión activa.");
    });

    it("calls the correct endpoint with the DELETE method and authorization header", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: true, status: 204 });

      await deleteConversation(2);

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:5199/api/chat/conversaciones/2",
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({ Authorization: "Bearer jwt-valido" }),
        }),
      );
    });

    it("resolves without a value when the server responds with 204", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: true, status: 204 });

      await expect(deleteConversation(2)).resolves.toBeUndefined();
    });

    it("throws a descriptive error when the conversation does not exist (404)", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 404 });

      await expect(deleteConversation(2)).rejects.toThrow(
        "No existe una conversación activa con este usuario.",
      );
    });

    it("throws a descriptive error when deleting a conversation with oneself (400)", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 400 });

      await expect(deleteConversation(1)).rejects.toThrow(
        "No podés eliminar una conversación con vos mismo.",
      );
    });

    it("throws an expired-session error when the server responds with 401", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(deleteConversation(2)).rejects.toThrow(
        "Sesión expirada. Iniciá sesión de nuevo.",
      );
    });

    it("throws a status-specific error for other HTTP failures", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockResolvedValue({ ok: false, status: 500 });

      await expect(deleteConversation(2)).rejects.toThrow(
        "Error al eliminar la conversación (500).",
      );
    });

    it("propagates network errors unchanged", async () => {
      vi.mocked(getSesion).mockReturnValue(mockSession);
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(deleteConversation(2)).rejects.toThrow("Failed to fetch");
    });
  });
});
