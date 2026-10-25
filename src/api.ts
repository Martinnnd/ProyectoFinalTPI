import { notifyAchievementsChanged } from './achievementEvents';
import { rememberLoginAchievements, clearLoginAchievements } from './loginAchievements';
import type { AchievementState } from './profileApi';

// Coincide con el perfil HTTP del backend, sin exigir un archivo local al clonar.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5199").replace(/\/+$/, "");

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
    clearLoginAchievements();
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
        body: JSON.stringify({ email, contrasena })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ mensaje: "Credenciales inválidas" }));
        throw new Error(err.mensaje || `Error ${response.status}`);
    }

    const {logrosNuevos, ...data}: UsuarioSesion & {logrosNuevos?: AchievementState[]} = await response.json();
    guardarSesion(data);
    rememberLoginAchievements(data.usuarioId, logrosNuevos);
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

let validAutorId: number | null = null;

async function getValidAutorId(providedId: number): Promise<number> {
    if (providedId !== 1) return providedId;
    if (validAutorId !== null) return validAutorId;
    try {
        const response = await fetch(`${API_BASE_URL}/api/publicaciones/test-users`);
        if (response.ok) {
            const users = await response.json();
            if (users && users.length > 0) {
                validAutorId = users[0].id;
                return validAutorId as number;
            }
        }
    } catch (e) {
        console.error("Failed to fetch users", e);
    }
    return providedId;
}

export async function compartirPublicacion(originalId: string, descripcion: string, autorId?: number) {
    const sesion = getSesion();
    const token = sesion?.token;
    const finalAutorId = sesion?.usuarioId ?? (autorId !== undefined ? await getValidAutorId(autorId) : await getValidAutorId(1));
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1; 

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
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

    notifyAchievementsChanged();
    return await response.json();
}

export async function eliminarRepost(originalId: string, autorId?: number) {
    const sesion = getSesion();
    const token = sesion?.token;
    const finalAutorId = sesion?.usuarioId ?? autorId;
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1;

    const headers: Record<string, string> = {};
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

    const headers: Record<string, string> = {};
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

export async function getMemories(signal?: AbortSignal) {
    const session = getSesion();
    if (!session) return [];
    const { getUserMemories } = await import('./profileApi');
    return getUserMemories(session.usuarioId, signal);
}

export async function crearPublicacion(memory: any, autorId?: number, gpsUsuario?: {lat: number; lng: number}): Promise<any> {
    const sesion = getSesion();
    const token = sesion?.token;
    const finalAutorId = sesion?.usuarioId ?? (autorId !== undefined ? await getValidAutorId(autorId) : await getValidAutorId(1));
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
    if (gpsUsuario) {
        formData.append('GpsLatitud', String(gpsUsuario.lat));
        formData.append('GpsLongitud', String(gpsUsuario.lng));
    }

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

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/api/publicaciones`, {
            method: 'POST', headers, body: formData
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor. Comprobá que el backend esté encendido y volvé a intentar.');
    }

    if (!response.ok) {
        const problem = await response.json().catch(() => null);
        const fields = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
        const message = fields || problem?.detail || problem?.mensaje || problem?.title || 'El servidor rechazó la publicación.';
        const reference = problem?.traceId ? ` Referencia: ${problem.traceId}.` : '';
        throw new Error(`${message} (HTTP ${response.status}).${reference}`);
    }

    notifyAchievementsChanged();
    return await response.json();
}

