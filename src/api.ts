export const API_BASE_URL = "http://localhost:5199";

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

export async function compartirPublicacion(originalId: string, descripcion: string, autorId: number = 1) {
    const finalAutorId = await getValidAutorId(autorId);
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1; 

    const response = await fetch(`${API_BASE_URL}/api/publicaciones/compartir`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
    const response = await fetch(`${API_BASE_URL}/api/publicaciones`);
    if (!response.ok) {
        throw new Error(`Error fetching memories: ${response.statusText}`);
    }
    return await response.json();
}

export async function crearPublicacion(memory: any, autorId: number = 1): Promise<any> {
    const finalAutorId = await getValidAutorId(autorId);
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

    const response = await fetch(`${API_BASE_URL}/api/publicaciones`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Error ${response.status}`);
    }

    return await response.json();
}

