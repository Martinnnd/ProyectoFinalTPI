import { afterEach, expect, it, vi } from "vitest";
import { requestPasswordRecovery, resetPassword } from "./authApi";
import { API_BASE_URL } from "../../apiConfig";

afterEach(() => vi.unstubAllGlobals());

it("solicita el correo con el contrato y la protección de las otras rutas de autenticación", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ mensaje: "Solicitud recibida" }), { status: 202 }),
    );
  vi.stubGlobal("fetch", fetch);

  await expect(requestPasswordRecovery("  Ana@Example.com  ")).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledWith(
    `${API_BASE_URL}/api/auth/recuperar-contrasena`,
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Nostalgiar-Request": "1" },
      body: JSON.stringify({ email: "ana@example.com" }),
    }),
  );
});

it("restablece la contraseña sin intentar leer JSON del 204 ni abrir una sesión", async () => {
  const response = new Response(null, { status: 204 });
  const readJson = vi.spyOn(response, "json");
  const fetch = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetch);
  const credentials = {
    token: "token-de-un-solo-uso",
    nuevaContrasena: "nueva-clave-123",
    confirmacionContrasena: "nueva-clave-123",
  };

  await expect(resetPassword(credentials)).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/api/auth/restablecer-contrasena`);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(credentials);
  expect(readJson).not.toHaveBeenCalled();
});

it("asocia los errores de validación del backend con los campos del formulario", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: { ConfirmacionContrasena: ["Las contraseñas no coinciden."] },
        }),
        { status: 400 },
      ),
    ),
  );

  await expect(
    resetPassword({
      token: "token",
      nuevaContrasena: "nueva-clave",
      confirmacionContrasena: "otra-clave",
    }),
  ).rejects.toMatchObject({
    status: 400,
    fields: { confirmacionContrasena: "Las contraseñas no coinciden." },
  });
});
