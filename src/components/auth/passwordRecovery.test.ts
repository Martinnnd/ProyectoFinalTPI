import { describe, expect, it } from "vitest";
import { AuthError } from "./authErrors";
import {
  isInvalidRecoveryLink,
  readRecoveryToken,
  recoveryErrorMessage,
  validateNewPassword,
} from "./passwordRecovery";

const token = `${"a".repeat(32)}.${"B".repeat(43)}`;

describe("enlaces de recuperación", () => {
  it("lee el token del fragmento enviado por el backend", () => {
    expect(readRecoveryToken(`#token=${encodeURIComponent(token)}`)).toBe(token);
  });

  it.each([
    "",
    "#token=",
    "#token=un-jwt",
    `#token=${token}&token=${token}`,
    `#token=${token}extra`,
  ])("rechaza enlaces incompletos, ambiguos o mal formados: %s", (fragment) => {
    expect(readRecoveryToken(fragment)).toBeNull();
  });

  it("distingue un enlace vencido de un error en las contraseñas", () => {
    expect(isInvalidRecoveryLink(new AuthError("Enlace inválido", 400))).toBe(true);
    expect(
      isInvalidRecoveryLink(
        new AuthError("No coinciden", 400, { confirmacionContrasena: "No coinciden" }),
      ),
    ).toBe(false);
    expect(isInvalidRecoveryLink(new AuthError("No disponible", 503))).toBe(false);
  });
});

describe("contraseña nueva", () => {
  it.each([7, 101])("rechaza contraseñas de %i caracteres", (length) => {
    const password = "x".repeat(length);
    expect(validateNewPassword(password, password)).toHaveProperty("nuevaContrasena");
  });

  it.each([8, 100])("acepta contraseñas de %i caracteres", (length) => {
    const password = "x".repeat(length);
    expect(validateNewPassword(password, password)).toEqual({});
  });

  it("exige una confirmación que coincida con la contraseña", () => {
    expect(validateNewPassword("nueva-clave-123", "")).toHaveProperty("confirmacionContrasena");
    expect(validateNewPassword("nueva-clave-123", "otra-clave-123")).toHaveProperty(
      "confirmacionContrasena",
    );
    expect(validateNewPassword("nueva-clave-123", "nueva-clave-123")).toEqual({});
  });

  it("ofrece una salida ante límites de intentos o indisponibilidad", () => {
    expect(recoveryErrorMessage(new AuthError("", 429))).toContain("Esperá unos minutos");
    expect(recoveryErrorMessage(new AuthError("detalle interno", 503))).not.toContain(
      "detalle interno",
    );
  });
});
