export { API_BASE_URL } from "./apiConfig";
import { API_BASE_URL } from "./apiConfig";
import {
    clearStoredSession,
    getStoredSession,
    storeSession,
} from "./components/auth/authStorage";
import type { AuthSession } from "./components/auth/authTypes";
import { apiFetch } from "./components/auth/apiClient";

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

export async function compartirPublicacion(originalId: string, descripcion: string, autorId?: number) {
    const sesion = requireSession();
    const finalAutorId = sesion.usuarioId;
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1; 

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    const response = await apiFetch(`${API_BASE_URL}/api/publicaciones/compartir`, {
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
    const sesion = requireSession();
    const finalAutorId = sesion.usuarioId;
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1;

    const url = finalAutorId !== undefined
        ? `${API_BASE_URL}/api/publicaciones/compartir/${numericId}?autorId=${finalAutorId}`
        : `${API_BASE_URL}/api/publicaciones/compartir/${numericId}`;

    const response = await apiFetch(url, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error(`Error en el backend al eliminar repost: ${response.statusText}`);
    }

    return await response.json().catch(() => ({}));
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

export async function getMemories() {
    const response = await apiFetch(`${API_BASE_URL}/api/publicaciones`);
    if (!response.ok) {
        throw new Error(`Error fetching memories: ${response.statusText}`);
    }
    return await response.json();
}

export async function crearPublicacion(memory: any, autorId?: number): Promise<any> {
    const sesion = requireSession();
    const finalAutorId = sesion.usuarioId;
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

    const response = await apiFetch(`${API_BASE_URL}/api/publicaciones`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Error ${response.status}`);
    }

    return await response.json();
}

