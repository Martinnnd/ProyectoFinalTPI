import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canCreateMemory,
  creationRestriction,
  formatWeekReset,
  hasAccountPermission,
  isCategoryPromotion,
  parseAccountCategoryState,
  quotaDescription,
  type AccountCategoryState,
} from "./accountCategories";
import { getAccountCategory } from "./accountCategoryApi";
import { ACCOUNT_ACTION_DENIED, notifyAccountActionDenied } from "./accountCategoryEvents";

const state: AccountCategoryState = {
  categoria: {
    codigo: "Errante",
    nombre: "Errante",
    publicacionesSemanales: 5,
    publicacionesIlimitadas: false,
    permitePrimerRecuerdo: true,
    prioridadVisibilidad: "Normal",
    permisos: ["DarLike", "GuardarPublicacion", "SeguirPerfil", "SerEtiquetado"],
  },
  publicacionesConsumidas: 0,
  publicacionesRestantes: 5,
  semanaInicio: "2026-11-08",
  reinicioSemana: "2026-11-15",
  maximoAdjuntos: 1,
};

afterEach(() => vi.unstubAllGlobals());

describe("Categoría y permisos del servidor", () => {
  it("habilita el primer recuerdo de Errante sin conceder comentarios ni puntuaciones", () => {
    expect(canCreateMemory(state)).toBe(true);
    expect(hasAccountPermission(state, "Comentar")).toBe(false);
    expect(hasAccountPermission(state, "PuntuarPublicacion")).toBe(false);
    expect(hasAccountPermission(state, "DarLike")).toBe(true);
  });

  it("usa los permisos recibidos, aunque el nombre de la categoría sea superior", () => {
    const limited = {
      ...state,
      categoria: { ...state.categoria, codigo: "Aedo" as const, nombre: "Aedo", permisos: [] },
    };
    expect(hasAccountPermission(limited, "AgregarMusicaAPublicacion")).toBe(false);
  });

  it("bloquea crear al agotarse el cupo y muestra la fecha de reinicio argentina", () => {
    const exhausted = { ...state, publicacionesConsumidas: 5, publicacionesRestantes: 0 };
    expect(canCreateMemory(exhausted)).toBe(false);
    expect(creationRestriction(exhausted)).toContain("domingo");
    expect(creationRestriction(exhausted)).toContain("00:00 (Argentina)");
    expect(formatWeekReset(state.reinicioSemana)).toContain("15");
  });

  it("conserva el cupo ilimitado y los cuatro adjuntos informados por el backend", () => {
    const unlimited = parseAccountCategoryState({
      ...state,
      publicacionesRestantes: null,
      maximoAdjuntos: 4,
      categoria: {
        ...state.categoria,
        codigo: "Marca",
        nombre: "Marca",
        publicacionesSemanales: null,
        publicacionesIlimitadas: true,
      },
    });
    expect(canCreateMemory(unlimited)).toBe(true);
    expect(quotaDescription(unlimited)).toBe("Publicaciones ilimitadas");
    expect(unlimited.maximoAdjuntos).toBe(4);
  });

  it.each([
    null,
    {},
    { ...state, maximoAdjuntos: 0 },
    { ...state, publicacionesRestantes: -1 },
    { ...state, reinicioSemana: "2026-02-30" },
    { ...state, categoria: { ...state.categoria, permisos: ["DarLike", 123] } },
    { ...state, categoria: { ...state.categoria, codigo: "Inventada" } },
  ])("rechaza una respuesta incompleta o inválida sin inventar permisos (%j)", (value) => {
    expect(() => parseAccountCategoryState(value)).toThrow();
  });

  it("mantiene cerradas las acciones hasta conocer la cuenta", () => {
    expect(canCreateMemory(null)).toBe(false);
    expect(hasAccountPermission(null, "Compartir")).toBe(false);
  });

  it("distingue un ascenso de una consulta repetida o un descenso", () => {
    expect(isCategoryPromotion("Errante", "Nostalgico")).toBe(true);
    expect(isCategoryPromotion("Nostalgico", "Aedo")).toBe(true);
    expect(isCategoryPromotion("Aedo", "Aedo")).toBe(false);
    expect(isCategoryPromotion("Aedo", "Errante")).toBe(false);
  });

  it("consulta el estado autenticado sin usar la caché de páginas", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(state), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    expect(await getAccountCategory()).toEqual(state);
    expect(fetch.mock.calls[0][0]).toContain("/api/categorias-cuenta/me");
    expect(fetch.mock.calls[0][1].cache).toBe("no-store");
  });

  it("conserva el detalle de un error al consultar la categoría", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ detail: "Cuenta no disponible." }), { status: 503 }),
        ),
    );
    await expect(getAccountCategory()).rejects.toThrow("Cuenta no disponible.");
  });

  it("avisa un rechazo del servidor sin consumir la respuesta que necesita el formulario", async () => {
    const target = new EventTarget();
    vi.stubGlobal("window", target);
    const listener = vi.fn();
    target.addEventListener(ACCOUNT_ACTION_DENIED, listener);
    const problem = { title: "Cupo semanal agotado", detail: "Se renueva el domingo." };
    const response = new Response(JSON.stringify(problem), { status: 429 });
    await notifyAccountActionDenied(response, 7);
    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({
      userId: 7,
      status: 429,
      title: problem.title,
      description: problem.detail,
    });
    expect(await response.json()).toEqual(problem);
  });
});
