import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "./apiClient";
import { clearStoredSession, storeSession } from "./authStorage";

afterEach(() => {
  clearStoredSession();
  vi.unstubAllGlobals();
});

it("renueva una sesión vencida y repite una sola vez la petición original", async () => {
  storeSession({
    token: "token-anterior",
    usuarioId: 7,
    username: "fran",
    email: "fran@example.com",
    esAdmin: false,
  });
  const renewed = {
    token: "token-renovado",
    usuarioId: 7,
    username: "fran",
    email: "fran@example.com",
    esAdmin: false,
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(renewed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetch);

  const response = await apiFetch("https://localhost:7014/api/protegida");

  expect(response.ok).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(new Headers(fetch.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer token-anterior");
  expect(fetch.mock.calls[1][0]).toContain("/api/auth/refresh");
  expect(fetch.mock.calls[1][1].credentials).toBe("include");
  expect(new Headers(fetch.mock.calls[2][1].headers).get("Authorization")).toBe("Bearer token-renovado");
});
