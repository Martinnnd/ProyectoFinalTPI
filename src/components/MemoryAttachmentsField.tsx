"use client";

import { useEffect, useRef, useState } from "react";
import { Images, Link2, Upload, X } from "lucide-react";
import type { MemoryAttachment } from "../types";
import { normalizeAttachment, youtubeId } from "../media";
import { publicationMediaError } from "../publicationMedia";
import GooglePhotosPicker from "./GooglePhotosPicker";

// Se conserva la disponibilidad definida en develop para la presentación.
const GOOGLE_PHOTOS_AVAILABLE = false;

type Props = {
  value: MemoryAttachment[];
  maxAttachments: number;
  disabled: boolean;
  required: boolean;
  onChange: (value: MemoryAttachment[]) => void;
  onBusyChange: (busy: boolean) => void;
  onPendingChange: (pending: boolean) => void;
  onError: (error: string) => void;
};

export default function MemoryAttachmentsField(props: Props) {
  const { value, maxAttachments, disabled, required, onBusyChange, onPendingChange } = props;
  const [source, setSource] = useState<"file" | "google" | "link">("file");
  const [link, setLink] = useState("");
  const [kind, setKind] = useState<MemoryAttachment["kind"]>("image");
  const [reading, setReading] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const callbacks = useRef(props);
  callbacks.current = props;
  const version = useRef(0);
  const readers = useRef(new Set<FileReader>());
  const full = value.length >= maxAttachments;
  const busy = reading || googleBusy;

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    onPendingChange(!full && source === "link" && Boolean(link.trim()));
  }, [full, source, link, onPendingChange]);
  useEffect(
    () => () => {
      ++version.current;
      for (const reader of readers.current) reader.abort();
      onBusyChange(false);
      onPendingChange(false);
    },
    [onBusyChange, onPendingChange],
  );

  function read(file: File): Promise<MemoryAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      readers.current.add(reader);
      const done = () => readers.current.delete(reader);
      reader.onload = () => {
        done();
        resolve({
          kind: file.type.startsWith("image/") ? "image" : "video",
          url: String(reader.result),
        });
      };
      reader.onerror = () => {
        done();
        reject(new Error("No se pudo leer el archivo."));
      };
      reader.onabort = () => {
        done();
        reject(new DOMException("Lectura cancelada", "AbortError"));
      };
      reader.readAsDataURL(file);
    });
  }

  async function addFiles(files: File[]) {
    if (!files.length || disabled) return;
    const current = callbacks.current;
    if (current.value.length + files.length > current.maxAttachments) {
      current.onError(
        "Tu categoría admite hasta " +
          current.maxAttachments +
          " adjunto" +
          (current.maxAttachments === 1 ? "" : "s") +
          " por recuerdo.",
      );
      return;
    }
    if (
      files.some(
        (file) =>
          file.size === 0 || file.size > (file.type.startsWith("image/") ? 5 : 2) * 1024 * 1024,
      )
    ) {
      current.onError(
        "Cada archivo debe tener contenido. Las fotos admiten hasta 5 MB y los videos hasta 2 MB; para archivos más grandes, usá un enlace.",
      );
      return;
    }
    if (
      files.some((file) => !/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|ogg))$/.test(file.type))
    ) {
      current.onError("Elegí fotos JPG, PNG, WebP o GIF, o videos MP4, WebM u Ogg.");
      return;
    }
    const run = ++version.current;
    setReading(true);
    current.onError("");
    try {
      const loaded = await Promise.all(files.map(read));
      if (run !== version.current) return;
      const latest = callbacks.current;
      if (latest.value.length + loaded.length > latest.maxAttachments)
        throw new Error("La cantidad de adjuntos supera el máximo de tu categoría.");
      latest.onChange([...latest.value, ...loaded]);
    } catch (reason) {
      if (run === version.current)
        callbacks.current.onError(
          reason instanceof Error ? reason.message : "No se pudo cargar el archivo.",
        );
    } finally {
      if (run === version.current) setReading(false);
    }
  }

  function addLink() {
    const url = link.trim();
    const error = publicationMediaError(url, kind, true);
    if (error) {
      callbacks.current.onError(error);
      return;
    }
    if (full) {
      callbacks.current.onError("Quitá un adjunto antes de agregar otro.");
      return;
    }
    callbacks.current.onChange([...value, normalizeAttachment({ kind, url })]);
    setLink("");
    callbacks.current.onError("");
  }

  return (
    <fieldset className="media-fields">
      <legend>Foto o video · {required ? "obligatorio" : "opcional"}</legend>
      {!required && (
        <small>Podés publicar tu historia sin agregar una foto, un video ni un enlace.</small>
      )}
      <small className="memory-attachment-count">
        {value.length} de {maxAttachments} adjuntos · fotos hasta 5 MB y videos hasta 2 MB
      </small>
      {value.length > 0 && (
        <div className="memory-attachments" aria-label="Adjuntos del recuerdo">
          {value.map((attachment, index) => (
            <div className="memory-attachment-card" key={index}>
              {attachment.kind === "image" && (
                <img src={attachment.url} alt={"Vista previa del adjunto " + (index + 1)} />
              )}
              {attachment.kind === "video" && (
                <video src={attachment.url} controls preload="metadata" />
              )}
              {attachment.kind === "youtube" && (
                <img
                  src={"https://img.youtube.com/vi/" + youtubeId(attachment.url) + "/hqdefault.jpg"}
                  alt={"Vista previa del video de YouTube " + (index + 1)}
                />
              )}
              <small>
                {index + 1}.{" "}
                {attachment.kind === "image"
                  ? "Foto"
                  : attachment.kind === "video"
                    ? "Video"
                    : "YouTube"}
              </small>
              <button
                type="button"
                className="memory-attachment-remove"
                aria-label={"Quitar adjunto " + (index + 1)}
                disabled={disabled || busy}
                onClick={() => {
                  callbacks.current.onChange(value.filter((_, position) => position !== index));
                  callbacks.current.onError("");
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="media-source-selector" role="group" aria-label="Origen del adjunto">
        <button
          type="button"
          aria-pressed={source === "file"}
          disabled={disabled || busy || full}
          onClick={() => {
            setSource("file");
            callbacks.current.onError("");
          }}
        >
          <Upload size={18} />
          Archivo
        </button>
        <button
          type="button"
          className="google-photos-coming-soon"
          title="Google Photos: próximamente"
          aria-pressed={source === "google"}
          disabled={!GOOGLE_PHOTOS_AVAILABLE || disabled || busy || full}
          onClick={() => {
            setSource("google");
            callbacks.current.onError("");
          }}
        >
          <span className="google-photos-soon-badge">Próximamente</span>
          <Images size={18} />
          Google Photos
        </button>
        <button
          type="button"
          aria-pressed={source === "link"}
          disabled={disabled || busy || full}
          onClick={() => {
            setSource("link");
            callbacks.current.onError("");
          }}
        >
          <Link2 size={18} />
          Enlace
        </button>
      </div>
      <div className="media-source-panel" hidden={full}>
        {source === "file" && (
          <label>
            Subir fotos o videos
            <input
              type="file"
              multiple={maxAttachments > 1}
              disabled={disabled || busy}
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void addFiles(files);
              }}
            />
          </label>
        )}
        {source === "google" && (
          <GooglePhotosPicker
            disabled={disabled}
            onFile={(file) => addFiles([file])}
            onBusyChange={setGoogleBusy}
          />
        )}
        {source === "link" && (
          <div className="media-link-fields">
            <label>
              Tipo de adjunto
              <select
                value={kind}
                disabled={disabled || busy}
                onChange={(event) => setKind(event.target.value as MemoryAttachment["kind"])}
              >
                <option value="image">Foto</option>
                <option value="video">Video</option>
                <option value="youtube">YouTube</option>
              </select>
            </label>
            <label>
              Enlace del adjunto
              <input
                type="url"
                value={link}
                disabled={disabled || busy}
                placeholder="https://…"
                onChange={(event) => setLink(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              disabled={disabled || busy || !link.trim()}
              onClick={addLink}
            >
              Agregar enlace
            </button>
          </div>
        )}
      </div>
      {full && (
        <small>
          Alcanzaste el máximo de adjuntos de tu categoría. Podés quitar uno para reemplazarlo.
        </small>
      )}
      {busy && (
        <p role="status">
          {googleBusy
            ? "Esperá a que termine la importación de Google Photos…"
            : "Preparando tus archivos…"}
        </p>
      )}
    </fieldset>
  );
}
