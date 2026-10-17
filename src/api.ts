import { categories, type Category, type Memory } from "./types";

export const API_BASE_URL = "http://localhost:5199";

export interface UsuarioSesion {
    token: string;
    usuarioId: number;
    username: string;
    email: string;
    esAdmin: boolean;
}

let memorySesion: UsuarioSesion | null = null;

export function getSesion(): UsuarioSesion | null {
    if (memorySesion) return memorySesion;
    if (typeof window !== "undefined" && window.localStorage) {
        try {
            const raw = window.localStorage.getItem("nostalgia_auth");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
    return null;
}

export function guardarSesion(sesion: UsuarioSesion): void {
    memorySesion = sesion;
    if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("nostalgia_auth", JSON.stringify(sesion));
    }
}

export function cerrarSesion(): void {
    memorySesion = null;
    if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("nostalgia_auth");
    }
}

export function isOwnMemory(memory: { author?: string; source?: string } | null | undefined): boolean {
    if (!memory) return false;
    if (memory.source === "local" || memory.author === "Vos") return true;
    const sesion = getSesion();
    if (sesion && sesion.username && memory.author) {
        return memory.author.trim().toLowerCase() === sesion.username.trim().toLowerCase();
    }
    return false;
}

export function getMemoryAuthorDisplay(memory: { author?: string; source?: string } | null | undefined): string {
    if (!memory) return "Desconocido";
    if (isOwnMemory(memory)) return "Vos";
    return memory.author || "Desconocido";
}

export async function login(email: string, contrasena: string): Promise<UsuarioSesion> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Nostalgiar-Request': '1'
        },
        credentials: 'include',
        body: JSON.stringify({ email, contrasena, contraseña: contrasena })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ mensaje: "Credenciales inválidas" }));
        throw new Error(err.mensaje || `Error ${response.status}`);
    }

    const data: UsuarioSesion = await response.json();
    guardarSesion(data);
    return data;
}

export async function registro(datos: { username: string; email: string; contrasena: string; esAdmin?: boolean }): Promise<UsuarioSesion> {
    const response = await fetch(`${API_BASE_URL}/api/auth/registro`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Nostalgiar-Request': '1'
        },
        credentials: 'include',
        body: JSON.stringify(datos)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ mensaje: "Error al registrarse" }));
        throw new Error(err.mensaje || `Error ${response.status}`);
    }

    const data: UsuarioSesion = await response.json();
    guardarSesion(data);
    return data;
}

export async function compartirPublicacion(originalId: string, descripcion: string, autorId?: number) {
    const sesion = getSesion();
    const token = sesion?.token;
    const finalAutorId = sesion?.usuarioId ?? autorId;
    if (!finalAutorId) {
        throw new Error("Debés iniciar sesión para compartir una publicación.");
    }
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1; 

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Nostalgiar-Request': '1',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/publicaciones/compartir`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            publicacionOriginalId: numericId,
            descripcion: descripcion,
            autorId: finalAutorId
        })
    });

    if (!response.ok) {
        throw new Error(`Error en el backend: ${response.statusText}`);
    }

    return await response.json();
}

export async function eliminarRepost(originalId: string, autorId?: number) {
    const sesion = getSesion();
    const token = sesion?.token;
    const finalAutorId = sesion?.usuarioId ?? autorId;
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1;

    const headers: Record<string, string> = {
        'X-Nostalgiar-Request': '1',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = finalAutorId !== undefined
        ? `${API_BASE_URL}/api/publicaciones/compartir/${numericId}?autorId=${finalAutorId}`
        : `${API_BASE_URL}/api/publicaciones/compartir/${numericId}`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers
    });

    if (!response.ok) {
        throw new Error(`Error en el backend al eliminar repost: ${response.statusText}`);
    }

    return await response.json().catch(() => ({}));
}

export async function eliminarPublicacion(id: string, autorId?: number) {
    const sesion = getSesion();
    const token = sesion?.token;
    const finalAutorId = sesion?.usuarioId ?? autorId;
    const numericId = parseInt(id.replace(/\D/g, ''), 10) || 1;

    const headers: Record<string, string> = {
        'X-Nostalgiar-Request': '1',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = finalAutorId !== undefined
        ? `${API_BASE_URL}/api/publicaciones/${numericId}?autorId=${finalAutorId}`
        : `${API_BASE_URL}/api/publicaciones/${numericId}`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers
    });

    if (!response.ok) {
        throw new Error(`Error en el backend al eliminar publicación: ${response.statusText}`);
    }

    return await response.json().catch(() => ({}));
}

function dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

export function normalizarCategoria(cat: unknown): Category {
    if (typeof cat === "number") {
        const map = ["Lugares", "Música", "Cine", "Televisión", "Videojuegos", "Acontecimientos", "Personales"] as const;
        return map[cat] ?? "Personales";
    }
    const str = String(cat ?? "").replace("Recuerdos_Personales", "Personales");
    if (categories.includes(str as Category)) {
        return str as Category;
    }
    return "Personales";
}

export function pinToMemory(pin: any): Memory {
    return {
        id: (pin.id ?? pin.Id).toString(),
        title: pin.titulo ?? pin.Titulo ?? "",
        year: pin.año ?? pin.Año ?? 1990,
        category: normalizarCategoria(pin.categoria ?? pin.Categoria),
        description: "",
        place: "",
        author: "",
        lat: pin.latitud ?? pin.Latitud ?? 0,
        lng: pin.longitud ?? pin.Longitud ?? 0,
        source: "db"
    };
}

export function detalleToMemory(dto: any): Memory {
    const original = dto.publicacionOriginal ?? dto.PublicacionOriginal;
    const esRepost = Boolean(original);
    const fecha = dto.fecha ?? dto.Fecha;
    const year = fecha ? new Date(fecha).getFullYear() : 1990;

    const urlMedia = (dto.urlMultimedia ?? dto.UrlMultimedia) || (original?.urlMultimedia ?? original?.UrlMultimedia) || "";
    const tipoMedia = dto.tipoMultimedia ?? dto.TipoMultimedia;
    const isVideo = tipoMedia === "Video" || tipoMedia === 1;

    const autor = dto.autor ?? dto.Autor;
    const lugar = dto.lugar ?? dto.Lugar;
    const originalAutor = original?.autor ?? original?.Autor;

    return {
        id: (dto.id ?? dto.Id).toString(),
        title: (dto.titulo ?? dto.Titulo) || (original?.titulo ?? original?.Titulo) || "",
        year: year,
        category: normalizarCategoria(dto.categoria ?? dto.Categoria),
        description: (dto.descripcion ?? dto.Descripcion) || (original?.descripcion ?? original?.Descripcion) || "",
        place: lugar?.nombre ?? lugar?.Nombre ?? "",
        author: autor?.username ?? autor?.Username ?? "Desconocido",
        lat: lugar?.latitud ?? lugar?.Latitud ?? 0,
        lng: lugar?.longitud ?? lugar?.Longitud ?? 0,
        source: "db",
        createdAt: dto.fechaCreacion ?? dto.FechaCreacion,
        image: !isVideo && urlMedia ? urlMedia : undefined,
        media: urlMedia ? {
            url: urlMedia,
            kind: isVideo ? "video" : "image"
        } : undefined,
        repost: esRepost ? {
            id: (dto.id ?? dto.Id).toString(),
            originalId: (original.id ?? original.Id)?.toString(),
            author: originalAutor?.username ?? originalAutor?.Username ?? "Desconocido",
            comment: (dto.descripcion ?? dto.Descripcion) || undefined
        } : undefined
    };
}

export async function obtenerPinesMapa(filtro?: {
    minLatitud?: number;
    maxLatitud?: number;
    minLongitud?: number;
    maxLongitud?: number;
    categoria?: string;
}): Promise<any[]> {
    const params = new URLSearchParams({
        minLatitud: (filtro?.minLatitud ?? -90).toString(),
        maxLatitud: (filtro?.maxLatitud ?? 90).toString(),
        minLongitud: (filtro?.minLongitud ?? -180).toString(),
        maxLongitud: (filtro?.maxLongitud ?? 180).toString(),
    });

    if (filtro?.categoria) {
        params.append("categoria", filtro.categoria);
    }

    const response = await fetch(`${API_BASE_URL}/api/publicaciones/mapa?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Error al obtener pines del mapa: ${response.statusText}`);
    }
    const data = await response.json();
    return data.pines ?? data.Pines ?? [];
}

export async function obtenerDetallePublicacion(id: number | string): Promise<Memory> {
    const sesion = getSesion();
    const headers: Record<string, string> = {
        'X-Nostalgiar-Request': '1',
    };
    if (sesion?.token) {
        headers['Authorization'] = `Bearer ${sesion.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/publicaciones/${id}`, {
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Error al obtener detalle de la publicación ${id}: ${response.statusText}`);
    }

    const dto = await response.json();
    return detalleToMemory(dto);
}

export async function obtenerFeed(
    tipo: 'para-vos' | 'seguidos' = 'para-vos',
    cursor?: string,
    limite = 20
): Promise<{ items: Memory[]; siguienteCursor?: string }> {
    const sesion = getSesion();
    const headers: Record<string, string> = {
        'X-Nostalgiar-Request': '1',
    };
    if (sesion?.token) {
        headers['Authorization'] = `Bearer ${sesion.token}`;
    }

    const params = new URLSearchParams({ limite: limite.toString() });
    if (cursor) params.append('cursor', cursor);

    const response = await fetch(`${API_BASE_URL}/api/feed/${tipo}?${params.toString()}`, {
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error(`Error al obtener feed: ${response.statusText}`);
    }

    const data = await response.json();
    const items = (data.items ?? data.Items ?? []).map((dto: any) => detalleToMemory(dto));
    return {
        items,
        siguienteCursor: data.siguienteCursor ?? data.SiguienteCursor
    };
}

export async function getMemories(): Promise<Memory[]> {
    const pines = await obtenerPinesMapa();
    return pines.map((pin: any) => pinToMemory(pin));
}

export async function crearPublicacion(memory: any, autorId?: number): Promise<any> {
    const sesion = getSesion();
    const token = sesion?.token;
    const finalAutorId = sesion?.usuarioId ?? autorId;
    if (!finalAutorId) {
        throw new Error("Debés iniciar sesión para crear una publicación.");
    }
    const formData = new FormData();
    formData.append('Titulo', memory.title);
    formData.append('Descripcion', memory.description);
    formData.append('Fecha', new Date(memory.year, 0, 1).toISOString());
    
    const mapCategory = (cat: string) => {
        switch(cat) {
            case "Lugares": return "Lugares";
            case "Música": return "Música";
            case "Cine": return "Cine";
            case "Televisión": return "Televisión";
            case "Videojuegos": return "Videojuegos";
            case "Acontecimientos": return "Acontecimientos";
            case "Personales": return "Recuerdos_Personales";
            default: return "Recuerdos_Personales";
        }
    }
    formData.append('Categoria', mapCategory(memory.category));
    formData.append('NombreLugar', memory.place);
    formData.append('Latitud', memory.lat.toString().replace('.', ',')); 
    formData.set('Latitud', memory.lat.toString());
    formData.set('Longitud', memory.lng.toString());
    formData.append('AutorId', finalAutorId.toString());

    let mediaUrl = memory.image || (memory.media ? memory.media.url : '');
    let isVideo = memory.media && memory.media.kind !== 'image';
    
    formData.append('TipoMultimedia', isVideo ? 'Video' : 'Foto');

    if (mediaUrl) {
        if (mediaUrl.startsWith('data:')) {
            const blob = dataURItoBlob(mediaUrl);
            const ext = blob.type.split('/')[1] || 'jpg';
            formData.append('Archivo', blob, `upload.${ext}`);
        } else {
            formData.append('UrlArchivo', mediaUrl);
        }
    }

    const headers: Record<string, string> = {
        'X-Nostalgiar-Request': '1',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/publicaciones`, {
        method: 'POST',
        headers,
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Error ${response.status}`);
    }

    return await response.json();
}

export async function seguirUsuario(idUsuarioASeguir: number): Promise<{ mensaje: string }> {
    const sesion = getSesion();
    if (!sesion?.token) {
        throw new Error("Debés iniciar sesión para seguir a un usuario.");
    }

    const response = await fetch(`${API_BASE_URL}/api/seguimientos/${idUsuarioASeguir}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Nostalgiar-Request": "1",
            "Authorization": `Bearer ${sesion.token}`
        },
        credentials: "include"
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error ${response.status}`);
    }

    return await response.json();
}

export async function dejarDeSeguirUsuario(idUsuarioASeguir: number): Promise<void> {
    const sesion = getSesion();
    if (!sesion?.token) {
        throw new Error("Debés iniciar sesión para dejar de seguir a un usuario.");
    }

    const response = await fetch(`${API_BASE_URL}/api/seguimientos/${idUsuarioASeguir}`, {
        method: "DELETE",
        headers: {
            "X-Nostalgiar-Request": "1",
            "Authorization": `Bearer ${sesion.token}`
        },
        credentials: "include"
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error ${response.status}`);
    }
}

export async function listarSeguidos(idUsuario: number): Promise<Array<{ id: number; username: string; avatarUrl?: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/seguimientos/${idUsuario}/seguidos`);
    if (!response.ok) {
        throw new Error(`Error al listar seguidos: ${response.statusText}`);
    }
    return await response.json();
}

