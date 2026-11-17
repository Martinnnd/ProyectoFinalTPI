import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./components/auth/apiClient";
import {
  addCapsuleMemories,
  availableCapsuleMemories,
  createCapsule,
  deleteCapsule,
  getCapsuleMap,
  getCapsuleCover,
  updateCapsule,
  getCapsuleMemories,
  listCapsules,
  positiveId,
  removeCapsuleMemory,
  type CapsuleInput,
} from "./capsulesApi";

vi.mock("./components/auth/apiClient", () => ({ apiFetch: vi.fn() }));
const fetch = vi.mocked(apiFetch);
afterEach(() => vi.resetAllMocks());
const input: CapsuleInput = {
  nombre: "Vacaciones",
  descripcion: null,
  visibilidad: 0,
  portadaPublicacionId: null,
  portadaAdjuntoId: null,
};
const page = { items: [], siguienteCursor: null, hayMas: false };

describe("privacidad y contratos de cápsulas", () => {
  it("crea con archivo y recuerdos en una sola solicitud multipart sin fijar su boundary", async () => {
    fetch.mockResolvedValueOnce(Response.json({ id: 4 }));
    const file = new File(["foto"], "viaje.jpg", { type: "image/jpeg" });
    await createCapsule({ ...input, conservarPortadaSubida: true }, [7, 7, 9], file);
    const [, init] = fetch.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
    const form = init?.body as FormData;
    expect(form.get("Nombre")).toBe("Vacaciones");
    expect(form.get("Archivo")).toBeInstanceOf(File);
    expect(form.get("PublicacionesIds[0]")).toBe("7");
    expect(form.get("PublicacionesIds[1]")).toBe("9");
    expect(form.get("PublicacionesIds[2]")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("conserva o retira la portada subida mediante una edición JSON y admite reemplazarla", async () => {
    fetch.mockResolvedValue(Response.json({ id: 4 }));
    await updateCapsule(4, { ...input, conservarPortadaSubida: false });
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).conservarPortadaSubida).toBe(false);
    await updateCapsule(4, input, new File(["foto"], "viaje.png", { type: "image/png" }));
    expect(fetch.mock.calls[1][1]?.method).toBe("PUT");
    expect(fetch.mock.calls[1][1]?.body).toBeInstanceOf(FormData);
  });

  it("descarga la portada mediante el cliente autenticado, sin caché ni tokens en la URL", async () => {
    fetch.mockResolvedValueOnce(new Response(new Blob(["foto"], { type: "image/webp" })));
    const signal = new AbortController().signal;
    expect((await getCapsuleCover(4, signal)).type).toBe("image/webp");
    const [url, init] = fetch.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/capsulas/4/portada");
    expect(new URL(String(url)).search).toBe("");
    expect(init).toMatchObject({ cache: "no-store", signal });
    fetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
    await expect(getCapsuleCover(4)).rejects.toThrow("No pudimos cargar");
  });
  it("consulta las propias sin pasar otro usuario ni guardarlas en caché", async () => {
    fetch.mockResolvedValueOnce(Response.json(page));
    const signal = new AbortController().signal;
    await listCapsules(null, signal);
    const [url, init] = fetch.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/api/capsulas/mias");
    expect(new URL(String(url)).searchParams.has("propietarioId")).toBe(false);
    expect(init).toMatchObject({ cache: "no-store", signal });
  });

  it("el perfil visitante usa solo el listado público de su propietario", async () => {
    fetch.mockResolvedValueOnce(Response.json(page));
    await listCapsules("continuar+sin/mezclar", undefined, 8);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/capsulas");
    expect(url.searchParams.get("propietarioId")).toBe("8");
    expect(url.searchParams.get("cursor")).toBe("continuar+sin/mezclar");
  });

  it("crea una cápsula sin enviar el propietario y sin duplicar recuerdos", async () => {
    fetch.mockResolvedValueOnce(Response.json({ id: 4 }));
    await createCapsule(input, [7, 9, 7]);
    const [, init] = fetch.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ ...input, publicacionesIds: [7, 9] });
  });

  it("agrega relaciones y las quita sin pedir el borrado de la publicación", async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));
    await addCapsuleMemories(4, [7, 7]);
    await removeCapsuleMemory(4, 7);
    await deleteCapsule(4);
    const [add, remove, deletion] = fetch.mock.calls;
    expect(JSON.parse(String(add[1]?.body))).toEqual({ publicacionesIds: [7] });
    expect(new URL(String(remove[0])).pathname).toBe("/api/capsulas/4/recuerdos");
    expect(new URL(String(remove[0])).searchParams.get("publicacionId")).toBe("7");
    expect(new URL(String(deletion[0])).pathname).toBe("/api/capsulas/4");
  });

  it("conserva el mensaje de un recurso privado o inexistente", async () => {
    fetch.mockResolvedValueOnce(
      Response.json({ detail: "La cápsula no existe o no está disponible." }, { status: 404 }),
    );
    await expect(getCapsuleMemories(4)).rejects.toThrow("no está disponible");
  });

  it("carga las opciones con su pertenencia sin convertirlas en un listado público", async () => {
    fetch.mockResolvedValueOnce(Response.json({ ...page, items: [{ id: 7, yaAgregado: true }] }));
    const result = await availableCapsuleMemories(4);
    expect(result.items[0].yaAgregado).toBe(true);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/capsulas/recuerdos-disponibles");
    expect(url.searchParams.get("capsulaId")).toBe("4");
  });
});

describe("recorrido y mapa de todas las épocas", () => {
  it("mantiene el orden del hilo y adapta las publicaciones con el modelo compartido", async () => {
    const publication = (id: number, date: string) => ({
      id,
      titulo: `Recuerdo ${id}`,
      fecha: date,
      categoria: 0,
      autor: { id: 8, username: "ana" },
      descripcion: "Historia",
      urlMultimedia: "",
      tipoMultimedia: 0,
    });
    fetch.mockResolvedValueOnce(
      Response.json({
        ...page,
        siguienteCursor: "otra-pagina",
        hayMas: true,
        items: [publication(7, "1974-02-10T00:00:00Z"), publication(9, "2022-12-18T00:00:00Z")],
      }),
    );
    const result = await getCapsuleMemories(4);
    expect(result.items.map((memory) => memory.year)).toEqual([1974, 2022]);
    expect(result.items.map((memory) => memory.id)).toEqual(["7", "9"]);
    expect(result.siguienteCursor).toBe("otra-pagina");
    expect(new URL(String(fetch.mock.calls[0][0])).searchParams.has("fechaDesde")).toBe(false);
  });

  it("conserva límites globales y los años de los pines sin consultar el mapa general", async () => {
    const limites = { minLatitud: -35, maxLatitud: 50, minLongitud: -60, maxLongitud: 140 };
    fetch.mockResolvedValueOnce(
      Response.json({
        ...page,
        limites,
        items: [
          { id: 7, titulo: "Un viaje", año: 1974, latitud: -35, longitud: -60, categoria: 0 },
        ],
      }),
    );
    const result = await getCapsuleMap(4);
    expect(result.limites).toEqual(limites);
    expect(result.items[0]).toMatchObject({ year: 1974, title: "Un viaje", lat: -35, lng: -60 });
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/capsulas/4/mapa");
    expect([...url.searchParams.keys()]).toEqual(["limite"]);
  });

  it.each(["0", "-2", "4/recuerdos", "1.5", "9007199254740993", "2147483648"])(
    "rechaza un identificador inválido: %s",
    (value) => {
      expect(() => positiveId(value)).toThrow("identificador");
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
