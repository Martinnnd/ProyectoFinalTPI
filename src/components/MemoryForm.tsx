import { youtubeId, spotifyId, safeMediaUrl, normalizeAttachment } from "../media";
import { eraRegistry } from "../eras/registry";
  import { useEffect, useRef, useState } from "react";
  import { X, MapPin, Save } from "lucide-react";
  import { categories, type Memory, type Decade } from "../types";
  import type { Point } from "./MemoryMap";
  export default function MemoryForm({
    initial,
    groupName,
    point,
    decade,
    onCancel,
    onSave,
  }: {
    initial?: Memory;
    groupName?: string;
    point: Point;
    decade: Decade;
    onCancel: () => void;
    onSave: (m: Memory) => string | null | Promise<string | null | void> | void;
  }) {
    const dirty = useRef(false);
    function requestClose() {
      if (dirty.current && !window.confirm("¿Descartar los cambios sin guardar?")) return;
      onCancel();
    }
    const dialog = useRef<HTMLDialogElement>(null);
    const titleInput = useRef<HTMLInputElement>(null);
    const [mediaKind,setMediaKind]=useState<'image'|'video'|'youtube'>(initial?.media?.kind ?? (youtubeId(initial?.image ?? '') ? 'youtube' : 'image'));
    const [mediaUrl,setMediaUrl]=useState(initial?.media?.url ?? initial?.image ?? '');
    const [loadingFile,setLoadingFile]=useState(false);
    const fileVersion=useRef(0);
    const [musicChoice,setMusicChoice]=useState(initial?.music ? 'custom' : '');
    const tracks=eraRegistry[decade].content.music;
    async function readFile(file:File|undefined){
      const version=++fileVersion.current;
      if(!file)return;
      if(file.size>2*1024*1024){setError('El archivo supera 2 MB. Usá un enlace para archivos más grandes.');return;}
      const kind=file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':null;
      if(!kind){setError('Elegí una foto o video compatible.');return;}
      setLoadingFile(true);setError('');
      const reader=new FileReader();
      reader.onload=()=>{if(version!==fileVersion.current)return;setMediaKind(kind);setMediaUrl(String(reader.result));setLoadingFile(false);};
      reader.onerror=()=>{if(version===fileVersion.current){setError('No se pudo leer el archivo.');setLoadingFile(false);}};
      reader.readAsDataURL(file);
    }
    const [error, setError] = useState("");
    useEffect(() => {
      const previous = document.activeElement as HTMLElement | null;
      dialog.current?.showModal();
      titleInput.current?.focus();
      return () => {
        previous?.focus();
      };
    }, []);
    async function submit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const title = String(data.get("title")).trim(),
        place = String(data.get("place")).trim(),
        description = String(data.get("description")).trim();
      const year = Number(data.get("year"));
      if (
        !title ||
        !place ||
        !description ||
        !Number.isInteger(year) ||
        year < 1970 ||
        year > 2009
      ) {
        setError("Completá los campos y elegí un año entre 1970 y 2009.");
        return;
      }
      if(loadingFile){setError('Esperá a que termine de cargar el archivo.');return;}
      if(!mediaUrl || (mediaKind==='youtube'?!youtubeId(mediaUrl):!safeMediaUrl(mediaUrl,mediaKind))){setError('Adjuntá una foto, un video o un enlace válido de YouTube para publicar.');return;}
      let music:Memory['music'];
      if(musicChoice==='custom'){
        const id=spotifyId(String(data.get('spotifyUrl')));
        const title=String(data.get('songTitle')??'').trim(),artist=String(data.get('songArtist')??'').trim();
        if(!id||!title||!artist){setError('Completá el enlace de una canción de Spotify, el título y el artista.');return;}
        music={spotifyId:id,title,artist};
      }else if(musicChoice){const track=tracks.find(t=>t.spotifyId===musicChoice);if(track)music={spotifyId:track.spotifyId,title:track.title,artist:track.artist};}
      const result = await onSave({
        ...initial,
        image: undefined,
        music: undefined,
        media:normalizeAttachment({kind:mediaKind,url:mediaUrl}),
        ...(mediaKind==='image'&&!youtubeId(mediaUrl)?{image:mediaUrl}:{}),
        ...(music?{music}:{}),
        id: initial?.id ?? crypto.randomUUID(),
        title,
        place,
        year,
        category: data.get("category") as Memory["category"],
        description,
        author: "Vos",
        source: "local",
        ...point,
      });
      if (typeof result === "string") setError(result);
    }
    return (
      <dialog
        ref={dialog}
        className="memory-dialog"
        onCancel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requestClose();
        }}
        onKeyDown={(e) => e.stopPropagation()}
        aria-labelledby="form-title"
      >
        <div className="dialog-heading">
          <span className="eyebrow">UNA HISTORIA MÁS EN EL MAPA</span>
          <button
            className="icon-button"
            onClick={requestClose}
            aria-label="Cerrar formulario"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="form-title">{initial ? "Editar mi recuerdo" : "¿Qué pasó en este lugar?"}</h2>
        <p>Publicar en: <strong>{groupName ?? "Recuerdos generales"}</strong></p>
        <p className="muted">Los pequeños recuerdos también merecen un pin.</p>
        <div className="coordinate-label">
          <MapPin size={16} /> Ubicación elegida: {point.lat.toFixed(4)},{" "}
          {point.lng.toFixed(4)}
        </div>
        <form onSubmit={submit} onChange={() => {dirty.current = true;}}>
          <label>
            Título del recuerdo
            <input
              ref={titleInput}
              name="title" defaultValue={initial?.title}
              autoFocus
              required
              maxLength={90}
              placeholder="Ese verano que no me olvido"
            />
          </label>
          <div className="form-row">
            <label>
              Año
              <input
                name="year"
                type="number"
                required
                min="1970"
                max="2009"
                defaultValue={initial?.year ?? decade + 5}
              />
            </label>
            <label>
              Categoría
              <select name="category" defaultValue={initial?.category ?? "Personales"}>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Nombre del lugar
            <input
              name="place" defaultValue={initial?.place}
              required
              maxLength={120}
              placeholder="Una plaza, tu barrio, aquel café…"
            />
          </label>
          <label>
            Tu historia
            <textarea
              name="description" defaultValue={initial?.description}
              required
              minLength={1}
              maxLength={1800}
              rows={4}
              placeholder="Contanos qué hace especial a este recuerdo."
            />
          </label>
          <fieldset className="media-fields"><legend>Foto o video · obligatorio</legend>
            <label>Tipo de adjunto<select value={mediaKind} onChange={e=>{fileVersion.current++;setLoadingFile(false);setMediaKind(e.target.value as typeof mediaKind);setMediaUrl('');}}><option value="image">Foto</option><option value="video">Video</option><option value="youtube">YouTube</option></select></label>
            {mediaKind!=='youtube'&&<label>Subir archivo (hasta 2 MB)<input type="file" accept={mediaKind==='image'?'image/jpeg,image/png,image/webp,image/gif':'video/mp4,video/webm,video/ogg'} onChange={e=>readFile(e.target.files?.[0])}/></label>}
            <label>{mediaKind==='youtube'?'Enlace de YouTube':'O pegá un enlace HTTPS al archivo'}<input type="url" value={mediaUrl.startsWith('data:')?'':mediaUrl} placeholder={mediaKind==='youtube'?'https://www.youtube.com/watch?v=…':'https://…'} onChange={e=>{fileVersion.current++;setLoadingFile(false);const url=e.target.value.trim();setMediaUrl(url);if(youtubeId(url))setMediaKind('youtube');}}/></label>
            {loadingFile&&<small role="status">Cargando archivo…</small>}
            {mediaUrl.startsWith('data:')&&<small>Archivo adjunto listo.</small>}
            {mediaKind==='image'&&safeMediaUrl(mediaUrl,'image')&&<img className="attachment-preview" src={mediaUrl} alt="Vista previa del adjunto"/>}
          </fieldset>
          <fieldset className="media-fields"><legend>Música de fondo · opcional</legend><label>Elegir canción<select value={musicChoice} onChange={e=>setMusicChoice(e.target.value)}><option value="">Sin música</option>{tracks.map(track=><option key={track.spotifyId} value={track.spotifyId}>{track.title} — {track.artist}</option>)}<option value="custom">Otra canción de Spotify…</option></select></label>
          {musicChoice==='custom'&&<><label>Enlace de Spotify<input name="spotifyUrl" defaultValue={initial?.music ? `https://open.spotify.com/track/${initial.music.spotifyId}` : ""} type="url" required placeholder="https://open.spotify.com/track/…"/></label><label>Tema<input name="songTitle" defaultValue={initial?.music?.title} required maxLength={120}/></label><label>Artista<input name="songArtist" defaultValue={initial?.music?.artist} required maxLength={120}/></label></>}
          <small>El tema y el artista aparecerán arriba del recuerdo. Tocá Escuchar para reproducir desde Spotify.</small></fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="local-note">
            Se guarda solo en este navegador. No se comparte con otros
            dispositivos.
          </p>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={requestClose}>
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              <Save size={17} /> {loadingFile ? "Cargando…" : "Guardar recuerdo"}
            </button>
          </div>
        </form>
      </dialog>
    );
  }
