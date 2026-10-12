export const API_BASE_URL = "http://localhost:5199";

export async function compartirPublicacion(originalId: string, descripcion: string, autorId: number = 1) {
    // Intentamos parsear el ID de la memoria a numérico para que el backend lo acepte.
    // En caso de que sea un ID local estilo "demo-1", extraerá el 1.
    // Si no hay número, enviamos 1 por defecto para evitar errores tipo "400 Bad Request".
    const numericId = parseInt(originalId.replace(/\D/g, ''), 10) || 1; 

    const response = await fetch(`${API_BASE_URL}/api/publicaciones/compartir`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            publicacionOriginalId: numericId,
            descripcion: descripcion,
            autorId: autorId
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

export async function crearPublicacion(memory: any, autorId: number = 1): Promise<any> {
    const formData = new FormData();
    formData.append('Titulo', memory.title);
    formData.append('Descripcion', memory.description);
    // Asignamos una fecha con el año del recuerdo
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
    formData.append('Latitud', memory.lat.toString().replace('.', ',')); // Defensive against localization, but FormData stringifies safely. Actually backend invariant culture might expect '.' Let's send raw string
    formData.set('Latitud', memory.lat.toString());
    formData.set('Longitud', memory.lng.toString());
    formData.append('AutorId', autorId.toString());

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

