import { afterEach, expect, it, vi } from "vitest";
import { loginRequest, registerRequest } from "./authApi";
import { AuthError } from "./authErrors";

const session = {
  token: "token-test",
  usuarioId: 7,
  username: "fran",
  email: "fran@example.com",
  esAdmin: false,
};

afterEach(() => vi.unstubAllGlobals());

it("envía el contrato de login y devuelve la sesión", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetch);

  await expect(
    loginRequest({ email: "fran@example.com", contrasena: "password123" }),
  ).resolves.toEqual(session);
  expect(fetch.mock.calls[0][1].credentials).toBe("include");
  expect(fetch.mock.calls[0][1].headers["X-Nostalgiar-Request"]).toBe("1");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    email: "fran@example.com",
    contrasena: "password123",
  });
});

it("adapta la contraseña al contrato actual de registro", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetch);

  await registerRequest({
    username: "fran",
    email: "fran@example.com",
    contrasena: "password123",
  });

  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    username: "fran",
    email: "fran@example.com",
    contraseña: "password123",
  });
});

it("convierte los errores del backend en errores de autenticación", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ mensaje: "Ya existe una cuenta registrada con ese email." }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );

  await expect(
    registerRequest({
      username: "fran",
      email: "fran@example.com",
      contrasena: "password123",
    }),
  ).rejects.toMatchObject({ status: 409, name: "AuthError" } satisfies Partial<AuthError>);
});

it("Google envía solo la credencial y username al BE con cookie y protección de origen", async () => {
  const { googleLoginRequest } = await import("./authApi");
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(session), { status: 200 }));
  vi.stubGlobal("fetch", fetch);
  await expect(googleLoginRequest("google-id-token", "fran")).resolves.toEqual(session);
  expect(fetch.mock.calls[0][0]).toContain("/api/auth/google");
  expect(fetch.mock.calls[0][1].credentials).toBe("include");
  expect(fetch.mock.calls[0][1].headers["X-Nostalgiar-Request"]).toBe("1");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    credential: "google-id-token",
    username: "fran",
  });
});

it("Google devuelve el paso de username sin inventar una sesión", async () => {
  const { googleLoginRequest } = await import("./authApi");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ requiereUsername: true }), { status: 200 })),
  );
  await expect(googleLoginRequest("google-id-token")).resolves.toEqual({ requiereUsername: true });
});
