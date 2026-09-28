import { youtubeId, spotifyId, safeMediaUrl } from "../media";
import { eraRegistry } from "../eras/registry";
  import { useEffect, useRef, useState } from "react";
  import { X, MapPin, Save } from "lucide-react";
  import { categories, type Memory, type Decade } from "../types";
  import type { Point } from "./MemoryMap";
  export default function MemoryForm({
    groupName,
    point,
    decade,
    onCancel,
    onSave,
  }: {
    groupName?: string;
    point: Point;
    decade: Decade;
    onCancel: () => void;
    onSave: (m: Memory) => string | null;
  }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleInput = useRef<HTMLInputElement>(null);
    const [mediaKind,setMediaKind]=useState<'image'|'video'|'youtube'>('image');
    const [mediaUrl,setMediaUrl]=useState('');
    const [loadingFile,setLoadingFile]=useState(false);
    const fileVersion=useRef(0);
    const [musicChoice,setMusicChoice]=useState('');
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
    function submit(event: React.FormEvent<HTMLFormElement>) {
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
      const result = onSave({
        media:{kind:mediaKind,url:mediaUrl},
        ...(mediaKind==='image'?{image:mediaUrl}:{}),
        ...(music?{music}:{}),
        id: crypto.randomUUID(),
        title,
        place,
        year,
        category: data.get("category") as Memory["category"],
        description,
        author: "Vos",
        source: "local",
        ...point,
      });
      if (result) setError(result);
    }
    return (
      <dialog
        ref={dialog}
        className="memory-dialog"
        onCancel={(e) => {
          e.preventDefault();
          onCancel();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
        aria-labelledby="form-title"
      >
        <div className="dialog-heading">
          <span className="eyebrow">UNA HISTORIA MÁS EN EL MAPA</span>
          <button
            className="icon-button"
            onClick={onCancel}
            aria-label="Cerrar formulario"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="form-title">¿Qué pasó en este lugar?</h2>
        <p>Publicar en: <strong>{groupName ?? "Recuerdos generales"}</strong></p>
        <p className="muted">Los pequeños recuerdos también merecen un pin.</p>
        <div className="coordinate-label">
          <MapPin size={16} /> Ubicación elegida: {point.lat.toFixed(4)},{" "}
          {point.lng.toFixed(4)}
        </div>
        <form onSubmit={submit}>
          <label>
            Título del recuerdo
            <input
              ref={titleInput}
              name="title"
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
                defaultValue={decade + 5}
              />
            </label>
            <label>
              Categoría
              <select name="category" defaultValue="Personales">
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Nombre del lugar
            <input
              name="place"
              required
              maxLength={120}
              placeholder="Una plaza, tu barrio, aquel café…"
            />
          </label>
          <label>
            Tu historia
            <textarea
              name="description"
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
            <label>{mediaKind==='youtube'?'Enlace de YouTube':'O pegá un enlace HTTPS al archivo'}<input type="url" value={mediaUrl.startsWith('data:')?'':mediaUrl} placeholder={mediaKind==='youtube'?'https://www.youtube.com/watch?v=…':'https://…'} onChange={e=>{fileVersion.current++;setLoadingFile(false);setMediaUrl(e.target.value.trim());}}/></label>
            {loadingFile&&<small role="status">Cargando archivo…</small>}
            {mediaUrl.startsWith('data:')&&<small>Archivo adjunto listo.</small>}
            {mediaKind==='image'&&safeMediaUrl(mediaUrl,'image')&&<img className="attachment-preview" src={mediaUrl} alt="Vista previa del adjunto"/>}
          </fieldset>
          <fieldset className="media-fields"><legend>Música de fondo · opcional</legend><label>Elegir canción<select value={musicChoice} onChange={e=>setMusicChoice(e.target.value)}><option value="">Sin música</option>{tracks.map(track=><option key={track.spotifyId} value={track.spotifyId}>{track.title} — {track.artist}</option>)}<option value="custom">Otra canción de Spotify…</option></select></label>
          {musicChoice==='custom'&&<><label>Enlace de Spotify<input name="spotifyUrl" type="url" required placeholder="https://open.spotify.com/track/…"/></label><label>Tema<input name="songTitle" required maxLength={120}/></label><label>Artista<input name="songArtist" required maxLength={120}/></label></>}
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
            <button type="button" className="secondary-button" onClick={onCancel}>
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
