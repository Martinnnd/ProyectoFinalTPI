import { describe, expect, it } from "vitest";
import type { AuthSession } from "../components/auth/authTypes";
import { resolveAdminAccess } from "./adminAccess";

const session = { usuarioId: 1, username: "admin", email: "a@n.com", token: "t" };

describe("resolveAdminAccess", () => {
  it("espera a que se restaure la sesión", () => {
    expect(resolveAdminAccess("loading", null)).toBe("loading");
  });

  it("envía al login cuando no hay sesión", () => {
    expect(resolveAdminAccess("anonymous", null)).toBe("login");
  });

  it("rechaza usuarios comunes y permite administradores", () => {
    expect(resolveAdminAccess("authenticated", { ...session, esAdmin: false })).toBe("forbidden");
    expect(resolveAdminAccess("authenticated", { ...session, esAdmin: true } as AuthSession)).toBe(
      "allowed",
    );
  });
});
