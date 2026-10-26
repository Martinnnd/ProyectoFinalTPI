export { API_BASE_URL } from "./apiConfig";
import { API_BASE_URL } from "./apiConfig";
import {
    clearStoredSession,
    getStoredSession,
    storeSession,
} from "./components/auth/authStorage";
import type { AuthSession } from "./components/auth/authTypes";
import { apiFetch } from "./components/auth/apiClient";
import { buildPublicationFormData } from "./publicationFormData";
import type { Memory } from "./types";

export type UsuarioSesion = AuthSession;
export const getSesion = getStoredSession;
export const guardarSesion = storeSession;
export const cerrarSesion = clearStoredSession;

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

function requireSession(): AuthSession {
    const session = getSesion();
    if (!session) throw new Error("Tenés que iniciar sesión para realizar esta acción.");
    return session;
}

export async function repostearPublicacion(id: string, autorId?: number) {
    const sesion = requireSession();
    const finalAutorId = autorId ?? sesion.usuarioId;
    const numericId = parseInt(id.replace(/\D/g, ''), 10) || 1;

    const response = await apiFetch(`${API_BASE_URL}/api/publicaciones/${numericId}/repost?usuarioId=${finalAutorId}`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error(`Error en el backend al repostear: ${response.statusText}`);
    }

    return await response.json();
}

export async function quitarRepost(id: string, autorId?: number) {
    const sesion = requireSession();
    const finalAutorId = autorId ?? sesion.usuarioId;
    const numericId = parseInt(id.replace(/\D/g, ''), 10) || 1;

    const response = await apiFetch(`${API_BASE_URL}/api/publicaciones/${numericId}/repost?usuarioId=${finalAutorId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error(`Error en el backend al quitar repost: ${response.statusText}`);
    }

    return await response.json();
}

export async function citarPublicacion(id: string, descripcion: string, autorId?: number) {
    const sesion = requireSession();
    const finalAutorId = autorId ?? sesion.usuarioId;
    const numericId = parseInt(id.replace(/\D/g, ''), 10) || 1;

    const response = await apiFetch(`${API_BASE_URL}/api/publicaciones/${numericId}/citar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            autorId: finalAutorId,
            descripcion: descripcion.trim()
        })
    });

    if (!response.ok) {
        throw new Error(`Error en el backend al citar: ${response.statusText}`);
    }

    return await response.json();
}


export async function eliminarPublicacion(id: string, autorId?: number) {
    const sesion = requireSession();
    const finalAutorId = sesion.usuarioId;
    const numericId = parseInt(id.replace(/\D/g, ''), 10) || 1;

    const url = finalAutorId !== undefined
        ? `${API_BASE_URL}/api/publicaciones/${numericId}?autorId=${finalAutorId}`
        : `${API_BASE_URL}/api/publicaciones/${numericId}`;

    const response = await apiFetch(url, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error(`Error en el backend al eliminar publicación: ${response.statusText}`);
    }

    return await response.json().catch(() => ({}));
}

export async function crearPublicacion(memory: Memory, autorId?: number, gpsUsuario?: {lat: number; lng: number} | null): Promise<any> {
    const sesion = requireSession();
    const finalAutorId = sesion.usuarioId;
    const formData = buildPublicationFormData(memory, finalAutorId, gpsUsuario);

    let response: Response;
    try {
        response = await apiFetch(`${API_BASE_URL}/api/publicaciones`, {
            method: 'POST', body: formData
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

    return await response.json();
}

