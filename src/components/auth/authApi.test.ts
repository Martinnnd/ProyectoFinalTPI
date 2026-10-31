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
