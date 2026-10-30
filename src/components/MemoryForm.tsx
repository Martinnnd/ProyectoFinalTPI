import { publicationMediaError, REQUIRE_PUBLICATION_MEDIA } from '../publicationMedia';
import { youtubeId, spotifyId, safeMediaUrl, normalizeAttachment } from "../media";
import { eraRegistry } from "../eras/registry";
import { extractHashtags } from "../hashtags";
import { localToday, memoryDateIso } from "../memoryDate";
import GooglePhotosPicker from "./GooglePhotosPicker";
import MemoryDatePicker from "./MemoryDatePicker";
import DiscardDraftDialog from './DiscardDraftDialog';
import MemoryEditForm from './MemoryEditForm';
import type { ComponentProps } from 'react';
const GOOGLE_PHOTOS_AVAILABLE = false;
  import { useEffect, useRef, useState } from "react";
  import { X, Save, Loader2, Upload, Images, Link } from "lucide-react";
  import { categories, type Memory, type Decade } from "../types";
  import type { Point } from "./MemoryMap";
  function MemoryCreationForm({
    initial,
    defaultHashtags = [],
    point,
    decade,
    onCancel,
    onSave,
  }: {
    initial?: Memory;
    defaultHashtags?: string[];
    groupName?: string;
    point: Point;
    decade: Decade;
    onCancel: () => void;
    onSave: (m: Memory) => string | null | Promise<string | null | void> | void;
  }) {
    const dirty = useRef(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    function requestClose() {
      if (saving) return;
      if (dirty.current) { setConfirmDiscard(true); return; }
      onCancel();
    }
    const dialog = useRef<HTMLDialogElement>(null);
    const stepHeading = useRef<HTMLHeadingElement>(null);
    const [step, setStep] = useState(0);
    const steps = ["Foto o video", "Tu historia", "Lugar y fecha", "Música"];
    const [description, setDescription] = useState(() => {
      const text = initial?.description ?? "";
      const existing = extractHashtags(text).tags;
      const missing = (initial?.hashtags ?? defaultHashtags).filter(tag => !existing.includes(tag));
      return [text, missing.map(tag => `#${tag}`).join(" ")].filter(Boolean).join("\n\n");
    });
    const detectedHashtags = extractHashtags(description);
    const [mediaKind,setMediaKind]=useState<'image'|'video'|'youtube'>(initial?.media?.kind ?? (youtubeId(initial?.image ?? '') ? 'youtube' : 'image'));
    const [mediaUrl,setMediaUrl]=useState(initial?.media?.url ?? initial?.image ?? '');
    const [mediaSelected, setMediaSelected] = useState(Boolean(initial?.media?.url ?? initial?.image));
    const [mediaSource, setMediaSource] = useState<'file' | 'google' | 'link'>(() => {
      const url = initial?.media?.url ?? initial?.image ?? '';
      return url && !url.startsWith('data:') ? 'link' : 'file';
    });
    const [loadingFile,setLoadingFile]=useState(false);
    const [googlePhotosBusy, setGooglePhotosBusy] = useState(false);
    const fileVersion=useRef(0);
    const [musicChoice,setMusicChoice]=useState(initial?.music ? 'custom' : '');
    const tracks=eraRegistry[decade].content.music;
    async function readFile(file:File|undefined){
      const version=++fileVersion.current;
      if(!file)return;
      setLoadingFile(false);
      const kind=file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':null;
      if(!kind){setError('Elegí una foto o video compatible.');return;}
      const maxSizeMB=kind==='image'?5:2;
      if(file.size>maxSizeMB*1024*1024){setError(`El archivo supera ${maxSizeMB} MB. Usá un enlace para archivos más grandes.`);return;}
      setLoadingFile(true);setError('');
      await new Promise<void>(resolve => {
        const reader=new FileReader();
        reader.onload=()=>{if(version===fileVersion.current){dirty.current=true;setMediaKind(kind);setMediaUrl(String(reader.result));setMediaSelected(true);setLoadingFile(false);}resolve();};
        reader.onerror=()=>{if(version===fileVersion.current){setError('No se pudo leer el archivo.');setLoadingFile(false);}resolve();};
        reader.readAsDataURL(file);
      });
    }
    const [error, setError] = useState("");
    useEffect(() => {
      const previous = document.activeElement as HTMLElement | null;
      dialog.current?.showModal();
      stepHeading.current?.focus();
      return () => {
        fileVersion.current++;
        previous?.focus();
      };
    }, []);
    useEffect(() => {
      stepHeading.current?.focus();
    }, [step]);
    function validateStep(form: HTMLFormElement, index: number): boolean {
      if (index === 0) {
        if (loadingFile || googlePhotosBusy) { setError("Esperá a que termine de cargar el archivo."); return false; }
        const mediaError = publicationMediaError(mediaUrl, mediaKind);
        if (mediaError) { setError(mediaError); return false; }
      }
      const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[data-form-step="${index}"] input, [data-form-step="${index}"] textarea, [data-form-step="${index}"] select`);
      for (const field of fields) {
        if (!field.checkValidity()) { field.reportValidity(); return false; }
        if (field.required && !field.value.trim()) { setError("Completá los campos obligatorios."); field.focus(); return false; }
      }
      if (index === 1 && detectedHashtags.error) { setError(detectedHashtags.error); return false; }
      setError("");
      return true;
    }
    const [saving, setSaving] = useState(false);
    async function submit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (saving || googlePhotosBusy || loadingFile) return;
      if (!validateStep(event.currentTarget, step)) return;
      if (step < steps.length - 1) { setStep(step + 1); return; }
      for (let index = 0; index < steps.length; index++) {
        if (!validateStep(event.currentTarget, index)) { setStep(index); return; }
      }
      const data = new FormData(event.currentTarget);
      const title = String(data.get("title")).trim(),
        place = String(data.get("place")).trim(),
        description = String(data.get("description")).trim();
      const date = String(data.get("date") ?? "");
      const year = Number(date.slice(0, 4));
      const hashtags = extractHashtags(description);
      if (hashtags.error) { setError(hashtags.error); return; }
      if (
        !title ||
        !place ||
        !description ||
        !memoryDateIso(date) ||
        year < 1970 ||
        date > localToday()
      ) {
        setError("Completá los campos y elegí una fecha válida entre 1970 y hoy.");
        return;
      }
      if(loadingFile){setError('Esperá a que termine de cargar el archivo.');return;}
      const mediaError = publicationMediaError(mediaUrl, mediaKind);
      if (mediaError) { setError(mediaError); return; }
      let music:Memory['music'];
      if(musicChoice==='custom'){
        const id=spotifyId(String(data.get('spotifyUrl')));
        const title=String(data.get('songTitle')??'').trim(),artist=String(data.get('songArtist')??'').trim();
        if(!id||!title||!artist){setError('Completá el enlace de una canción de Spotify, el título y el artista.');return;}
        music={spotifyId:id,title,artist};
      }else if(musicChoice){const track=tracks.find(t=>t.spotifyId===musicChoice);if(track)music={spotifyId:track.spotifyId,title:track.title,artist:track.artist};}
      
      setSaving(true);
      setError("");
      
      try {
      const result = await onSave({
        ...initial,
        image: undefined,
        music: undefined,
        media: mediaUrl ? normalizeAttachment({kind:mediaKind,url:mediaUrl}) : undefined,
        ...(mediaUrl && mediaKind==='image'&&!youtubeId(mediaUrl)?{image:mediaUrl}:{}),
        ...(music?{music}:{}),
        id: initial?.id ?? crypto.randomUUID(),
        title,
        place,
        year,
        date,
        category: data.get("category") as Memory["category"],
        description,
        hashtags: hashtags.tags,
        createdAt: initial?.createdAt ?? (initial ? undefined : new Date().toISOString()),
        author: "Vos",
        source: "local",
        lat: point.lat,
        lng: point.lng,
      });
      
      if (typeof result === "string") setError(result);
      } catch {
        setError("No se pudo guardar el recuerdo. Tus datos siguen acá; intentá de nuevo.");
      } finally {
        setSaving(false);
      }
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
        <ol className="memory-form-progress" aria-label="Pasos del recuerdo">
          {steps.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>)}
        </ol>
        <h3 ref={stepHeading} tabIndex={-1} className="memory-form-step-title">Paso {step + 1} de {steps.length}: {steps[step]}{step === 3 || (step === 0 && !REQUIRE_PUBLICATION_MEDIA) ? " · opcional" : ""}</h3>
        <form noValidate onSubmit={submit} onChangeCapture={() => {dirty.current = true; setError("");}}>
          <div data-form-step="0" hidden={step !== 0}>
          <fieldset className="media-fields"><legend>Foto o video · {REQUIRE_PUBLICATION_MEDIA ? "obligatorio" : "opcional"}</legend>
            {!REQUIRE_PUBLICATION_MEDIA && <small>Podés publicar tu historia sin agregar una foto, un video ni un enlace.</small>}
            <div className="media-source-selector" role="group" aria-label="Origen del adjunto">
              <button type="button" aria-pressed={mediaSource === 'file'} aria-controls="media-source-panel" disabled={mediaSelected || googlePhotosBusy || saving || loadingFile} onClick={() => { setMediaSource('file'); setError(''); }}><Upload size={18} aria-hidden="true" />Archivo</button>
              <button type="button" className="google-photos-coming-soon" aria-pressed={mediaSource === 'google'} aria-controls="media-source-panel" disabled={!GOOGLE_PHOTOS_AVAILABLE || mediaSelected || googlePhotosBusy || saving || loadingFile} title="Google Photos: próximamente" onClick={() => { setMediaSource('google'); setError(''); }}><span className="google-photos-soon-badge">Próximamente</span><Images size={18} aria-hidden="true" />Google Photos</button>
              <button type="button" aria-pressed={mediaSource === 'link'} aria-controls="media-source-panel" disabled={mediaSelected || googlePhotosBusy || saving || loadingFile} onClick={() => { setMediaSource('link'); setError(''); }}><Link size={18} aria-hidden="true" />Enlace</button>
            </div>
            <div id="media-source-panel" className="media-source-panel" hidden={mediaSelected}>
              {mediaSource === 'file' && <label>Subir foto (hasta 5 MB) o video (hasta 2 MB)<input type="file" disabled={saving || loadingFile} accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg" onChange={e=>{void readFile(e.target.files?.[0]);e.target.value='';}}/></label>}
              {mediaSource === 'google' && (GOOGLE_PHOTOS_AVAILABLE ? <GooglePhotosPicker disabled={saving || loadingFile} onFile={readFile} onBusyChange={setGooglePhotosBusy} /> : <p className="google-photos-unavailable">Google Photos estará disponible próximamente. Podés subir un archivo o pegar un enlace.</p>)}
              {mediaSource === 'link' && <>
                <label>Tipo de adjunto<select disabled={saving} value={mediaKind} onChange={e=>{fileVersion.current++;setLoadingFile(false);setMediaKind(e.target.value as typeof mediaKind);setMediaUrl('');}}><option value="image">Foto</option><option value="video">Video</option><option value="youtube">YouTube</option></select></label>
                <label>{mediaKind==='youtube'?'Enlace de YouTube':'O pegá un enlace HTTPS al archivo'}<input type="url" disabled={saving} value={mediaUrl.startsWith('data:')?'':mediaUrl} placeholder={mediaKind==='youtube'?'https://www.youtube.com/watch?v=…':'https://…'} onChange={e=>{fileVersion.current++;setLoadingFile(false);const url=e.target.value.trim();setMediaUrl(url);if(youtubeId(url))setMediaKind('youtube');}}/></label>
                <button type="button" className="secondary-button" onClick={() => {
                  if (!mediaUrl || (mediaKind === 'youtube' ? !youtubeId(mediaUrl) : !safeMediaUrl(mediaUrl, mediaKind))) { setError('Pegá un enlace válido para adjuntarlo.'); return; }
                  setError(''); setMediaSelected(true); dirty.current = true;
                }}>Usar enlace</button>
              </>}
            </div>
            {loadingFile&&<small role="status">Cargando archivo…</small>}
            {mediaSelected && <div className="memory-attachment-preview">
              {mediaKind === 'image' && safeMediaUrl(mediaUrl, 'image') && <img className="attachment-preview" src={mediaUrl} alt="Vista previa del adjunto" />}
              {mediaKind === 'video' && safeMediaUrl(mediaUrl, 'video') && <video src={mediaUrl} controls preload="metadata" aria-label="Vista previa del video" />}
              {mediaKind === 'youtube' && youtubeId(mediaUrl) && <>
                <img className="attachment-preview youtube-attachment-thumbnail" src={`https://i.ytimg.com/vi/${youtubeId(mediaUrl)}/hqdefault.jpg`} alt="Miniatura del video de YouTube adjunto" />
                <span className="youtube-attachment-badge">YouTube</span>
              </>}
              <button type="button" className="memory-attachment-remove" aria-label="Quitar adjunto" disabled={googlePhotosBusy || saving} onClick={() => { fileVersion.current++; setLoadingFile(false); setMediaUrl(''); setMediaSelected(false); setError(''); dirty.current=true; }}><X size={20} aria-hidden="true" /></button>
            </div>}
            {!REQUIRE_PUBLICATION_MEDIA && !mediaSelected && <button type="button" className="secondary-button"
              disabled={saving || loadingFile || googlePhotosBusy} onClick={() => {
                fileVersion.current++; setMediaUrl(''); setMediaSelected(false); setError(''); setStep(1);
              }}>Continuar sin adjunto</button>}
            {step === 0 && error && <p className="form-error" role="alert">{error}</p>}
          </fieldset>
          </div>
          <div data-form-step="1" hidden={step !== 1}>
          <label>
            Título del recuerdo
            <input
              name="title" defaultValue={initial?.title}
              required
              maxLength={90}
              placeholder="Ese verano que no me olvido"
            />
          </label>
          <label>
            Tu historia
            <textarea
              name="description" value={description} onChange={e => setDescription(e.target.value)}
              aria-describedby="hashtags-help"
              required
              minLength={1}
              maxLength={1800}
              rows={4}
              placeholder="Contanos qué hace especial a este recuerdo."
            />
          </label>
          <small id="hashtags-help">Agregá #palabras en tu historia para crear hashtags. Hasta 5, de 32 caracteres cada uno.</small>
          <div className="memory-form-tags" aria-live="polite">
            {detectedHashtags.error ? <small className="form-error">{detectedHashtags.error}</small> : detectedHashtags.tags.map(tag => <span key={tag}>#{tag}</span>)}
          </div>
          </div>
          <div data-form-step="2" hidden={step !== 2}>
          <label>
            Nombre del lugar
            <input
              name="place" defaultValue={initial?.place ?? point.label}
              required
              maxLength={120}
              placeholder="Una plaza, tu barrio, aquel café…"
            />
          </label>
          <div className="form-row">
            <MemoryDatePicker initialDate={initial?.date} decade={decade} onChange={() => { dirty.current = true; setError(''); }} />
            <label>
              Categoría
              <select name="category" defaultValue={initial?.category ?? "Personales"}>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          </div>
          <div data-form-step="3" hidden={step !== 3}>
          <fieldset className="media-fields"><legend>Música de fondo · opcional</legend><label>Elegir canción<select value={musicChoice} onChange={e=>setMusicChoice(e.target.value)}><option value="">Sin música</option>{tracks.map(track=><option key={track.spotifyId} value={track.spotifyId}>{track.title} — {track.artist}</option>)}<option value="custom">Otra canción de Spotify…</option></select></label>
          {musicChoice==='custom'&&<><label>Enlace de Spotify<input name="spotifyUrl" defaultValue={initial?.music ? `https://open.spotify.com/track/${initial.music.spotifyId}` : ""} type="url" required placeholder="https://open.spotify.com/track/…"/></label><label>Tema<input name="songTitle" defaultValue={initial?.music?.title} required maxLength={120}/></label><label>Artista<input name="songArtist" defaultValue={initial?.music?.artist} required maxLength={120}/></label></>}
          <small>Este paso es opcional. Podés guardar tu recuerdo sin agregar música.</small></fieldset>
          </div>
          {step !== 0 && error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <p className="local-note">
            Revisá tu historia antes de guardar el recuerdo.
          </p>
          <div className="dialog-actions">
            {step > 0 && <button type="button" className="secondary-button" disabled={saving || loadingFile || googlePhotosBusy} onClick={() => { setError(""); setStep(step - 1); }}>Atrás</button>}
            <button type="button" className="secondary-button" onClick={requestClose} disabled={saving}>
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={saving || loadingFile || googlePhotosBusy}>
              {saving ? (
                <><Loader2 size={17} style={{ animation: "device-spin 1s linear infinite" }} /> Guardando...</>
              ) : (
                <>{step === steps.length - 1 && <Save size={17} />} {loadingFile ? "Cargando archivo…" : step < steps.length - 1 ? "Continuar" : "Guardar recuerdo"}</>
              )}
            </button>
          </div>
        </form>
        {confirmDiscard && <DiscardDraftDialog decade={decade} onContinue={() => setConfirmDiscard(false)} onDiscard={onCancel}/>}
      </dialog>
    );
  }

export default function MemoryForm(props: ComponentProps<typeof MemoryCreationForm>) {
  return props.initial
    ? <MemoryEditForm initial={props.initial} onCancel={props.onCancel} onSave={props.onSave} />
    : <MemoryCreationForm {...props} />;
}
