import {
  getMemoryAttachments,
  publicationAttachmentsError,
  REQUIRE_PUBLICATION_MEDIA,
} from "../publicationMedia";
import { spotifyId } from "../media";
import { eraRegistry } from "../eras/registry";
import { extractHashtags } from "../hashtags";
import { localToday, memoryDateIso } from "../memoryDate";
import { getGroups } from "../groupsApi";
import { buscarUsuarios, type UsuarioBusqueda } from "../userApi";
import { useOptionalAuth } from "./auth/AuthProvider";
import { useNotice } from "../context/NoticeProvider";
import MemoryAttachmentsField from "./MemoryAttachmentsField";
import AccountCategoryStatus from "./account/AccountCategoryStatus";
import { useAccountCategory } from "../context/AccountCategoryContext";
import { creationRestriction } from "../accountCategories";
import MemoryDatePicker from "./MemoryDatePicker";
import DiscardDraftDialog from "./DiscardDraftDialog";
import MemoryEditForm from "./MemoryEditForm";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { X, Save, Loader2, LockKeyhole, Users, UserPlus } from "lucide-react";
import {
  categories,
  type Memory,
  type MemoryAttachment,
  type Decade,
  type CommunityGroup,
} from "../types";
import type { Point } from "./MemoryMap";
function MemoryCreationForm({
  initial,
  defaultHashtags = [],
  groupId,
  point,
  decade,
  onCancel,
  onSave,
}: {
  initial?: Memory;
  defaultHashtags?: string[];
  groupName?: string;
  groupId?: string;
  point: Point;
  decade: Decade;
  onCancel: () => void;
  onSave: (m: Memory) => string | null | Promise<string | null | void> | void;
}) {
  const dirty = useRef(false);
  const auth = useOptionalAuth();
  const showToast = useNotice((state) => state.showToast);
  const session = auth?.session;
  const { account, hasPermission, refresh } = useAccountCategory();
  const canTagUsers = hasPermission("EtiquetarUsuario");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  function requestClose() {
    if (saving) return;
    if (dirty.current) {
      setConfirmDiscard(true);
      return;
    }
    onCancel();
  }
  const dialog = useRef<HTMLDialogElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const steps = ["Foto o video", "Tu historia", "Lugar y fecha", "Música"];
  const [description, setDescription] = useState(() => {
    const text = initial?.description ?? "";
    const existing = extractHashtags(text).tags;
    const missing = (initial?.hashtags ?? defaultHashtags).filter((tag) => !existing.includes(tag));
    return [text, missing.map((tag) => `#${tag}`).join(" ")].filter(Boolean).join("\n\n");
  });
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId ?? "");
  useEffect(() => {
    const controller = new AbortController();
    getGroups(controller.signal)
      .then((result) => {
        const memberships = result.filter((group) => group.isMember);
        setGroups(memberships);
        setSelectedGroupId((current) =>
          current && !memberships.some((group) => group.id === current) ? "" : current,
        );
        setGroupsError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSelectedGroupId("");
          setGroupsError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setGroupsLoading(false);
      });
    return () => controller.abort();
  }, []);
  const [taggedUsers, setTaggedUsers] = useState<UsuarioBusqueda[]>(() => {
    const list = initial?.taggedUsers ? [...initial.taggedUsers] : [];
    return list.filter((u) => {
      if (session?.usuarioId && u.id === session.usuarioId) return false;
      if (session?.username && u.username.toLowerCase() === session.username.toLowerCase())
        return false;
      return true;
    });
  });
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<UsuarioBusqueda[]>([]);
  const [tagSearching, setTagSearching] = useState(false);

  useEffect(() => {
    const q = tagQuery.trim();
    if (!canTagUsers || q.length < 2) {
      setTagResults([]);
      setTagSearching(false);
      return;
    }

    const currentUserId = session?.usuarioId;
    const currentUsername = session?.username?.toLowerCase();

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setTagSearching(true);
      buscarUsuarios(q, controller.signal)
        .then((users) => {
          if (!controller.signal.aborted) {
            setTagResults(
              users.filter((u) => {
                if (currentUserId && u.id === currentUserId) return false;
                if (currentUsername && u.username.toLowerCase() === currentUsername) return false;
                if (taggedUsers.some((t) => t.id === u.id)) return false;
                return true;
              }),
            );
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setTagResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setTagSearching(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [tagQuery, taggedUsers, session, canTagUsers]);
  const detectedHashtags = extractHashtags(description);
  const [attachments, setAttachments] = useState<MemoryAttachment[]>(() =>
    initial ? getMemoryAttachments(initial) : [],
  );
  const [mediaBusy, setMediaBusy] = useState(false);
  const [pendingLink, setPendingLink] = useState(false);
  const [musicChoice, setMusicChoice] = useState(initial?.music ? "custom" : "");
  const tracks = eraRegistry[decade].content.music;
  const canAddMusic = hasPermission("AgregarMusicaAPublicacion");
  const canSuggestMusic = hasPermission("SugerirMusica");
  const [error, setError] = useState("");
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    stepHeading.current?.focus();
    return () => {
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    stepHeading.current?.focus();
  }, [step]);
  function validateStep(form: HTMLFormElement, index: number): boolean {
    if (index === 0) {
      if (mediaBusy) {
        setError("Esperá a que termine de cargar el archivo.");
        return false;
      }
      if (pendingLink) {
        setError("Agregá el enlace al recuerdo o borrá el campo antes de continuar.");
        return false;
      }
      const mediaError = publicationAttachmentsError(attachments, account?.maximoAdjuntos ?? 1);
      if (mediaError) {
        setError(mediaError);
        return false;
      }
    }
    const fields = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(
      `[data-form-step="${index}"] input, [data-form-step="${index}"] textarea, [data-form-step="${index}"] select`,
    );
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
      if (field.required && !field.value.trim()) {
        setError("Completá los campos obligatorios.");
        field.focus();
        return false;
      }
    }
    if (index === 1 && detectedHashtags.error) {
      setError(detectedHashtags.error);
      return false;
    }
    setError("");
    return true;
  }
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || mediaBusy) return;
    if (!validateStep(event.currentTarget, step)) return;
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    for (let index = 0; index < steps.length; index++) {
      if (!validateStep(event.currentTarget, index)) {
        setStep(index);
        return;
      }
    }
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim(),
      place = String(data.get("place")).trim(),
      description = String(data.get("description")).trim();
    const date = String(data.get("date") ?? "");
    const year = Number(date.slice(0, 4));
    const hashtags = extractHashtags(description);
    if (hashtags.error) {
      setError(hashtags.error);
      return;
    }
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
    const restriction = creationRestriction(account);
    if (restriction) {
      setError(restriction);
      return;
    }
    if (musicChoice && !canAddMusic) {
      setError("La música en publicaciones se habilita desde Aedo.");
      setStep(3);
      return;
    }
    if (taggedUsers.length && !canTagUsers) {
      setError("Publicá tu primer recuerdo para habilitar las etiquetas a otros usuarios.");
      setStep(1);
      return;
    }
    let music: Memory["music"];
    if (musicChoice === "custom") {
      const id = spotifyId(String(data.get("spotifyUrl")));
      const title = String(data.get("songTitle") ?? "").trim();
      const artist = String(data.get("songArtist") ?? "").trim();
      if (!id || !title || !artist) {
        setError("Completá el enlace de una canción de Spotify, el título y el artista.");
        return;
      }
      music = { spotifyId: id, title, artist };
    } else if (musicChoice) {
      const track = tracks.find((item) => item.spotifyId === musicChoice);
      if (track) music = { spotifyId: track.spotifyId, title: track.title, artist: track.artist };
    }
    setSaving(true);
    setError("");

    try {
      const result = await onSave({
        ...initial,
        image: undefined,
        music: undefined,
        attachments,
        media: attachments[0],
        ...(attachments[0]?.kind === "image" ? { image: attachments[0].url } : {}),
        ...(music ? { music } : {}),
        id: initial?.id ?? crypto.randomUUID(),
        title,
        place,
        year,
        date,
        category: data.get("category") as Memory["category"],
        description,
        groupId: selectedGroupId || undefined,
        hashtags: hashtags.tags,
        taggedUsers: taggedUsers
          .filter((u) => {
            if (session?.usuarioId && u.id === session.usuarioId) return false;
            if (session?.username && u.username.toLowerCase() === session.username.toLowerCase())
              return false;
            return true;
          })
          .map((u) => ({ id: u.id, username: u.username })),
        createdAt: initial?.createdAt ?? (initial ? undefined : new Date().toISOString()),
        author: "Vos",
        source: "local",
        lat: point.lat,
        lng: point.lng,
      });

      if (typeof result === "string") {
        setError(result);
        showToast(result, "error");
      }
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : "No se pudo guardar el recuerdo. Tus datos siguen acá; intentá de nuevo.";
      setError(message);
      showToast(message, "error");
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
        <button className="icon-button" onClick={requestClose} aria-label="Cerrar formulario">
          <X size={20} />
        </button>
      </div>
      <h2 id="form-title">{initial ? "Editar mi recuerdo" : "¿Qué pasó en este lugar?"}</h2>
      <AccountCategoryStatus compact />
      <ol className="memory-form-progress" aria-label="Pasos del recuerdo">
        {steps.map((label, index) => (
          <li key={label} aria-current={step === index ? "step" : undefined}>
            <span aria-hidden="true">{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <h3 ref={stepHeading} tabIndex={-1} className="memory-form-step-title">
        Paso {step + 1} de {steps.length}: {steps[step]}
        {step === 3 || (step === 0 && !REQUIRE_PUBLICATION_MEDIA) ? " · opcional" : ""}
      </h3>
      <form
        noValidate
        onSubmit={submit}
        onChangeCapture={() => {
          dirty.current = true;
          setError("");
        }}
      >
        <div data-form-step="0" hidden={step !== 0}>
          <MemoryAttachmentsField
            value={attachments}
            maxAttachments={account?.maximoAdjuntos ?? 1}
            disabled={saving || !account}
            required={REQUIRE_PUBLICATION_MEDIA}
            onChange={(value) => {
              dirty.current = true;
              setAttachments(value);
              setError("");
            }}
            onBusyChange={setMediaBusy}
            onPendingChange={setPendingLink}
            onError={setError}
          />
          {!REQUIRE_PUBLICATION_MEDIA && attachments.length === 0 && (
            <button
              type="button"
              className="secondary-button"
              disabled={saving || mediaBusy || pendingLink}
              onClick={() => {
                setError("");
                setStep(1);
              }}
            >
              Continuar sin adjunto
            </button>
          )}
          {step === 0 && error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div data-form-step="1" hidden={step !== 1}>
          <label>
            Título del recuerdo
            <input
              name="title"
              defaultValue={initial?.title}
              required
              maxLength={90}
              placeholder="Ese verano que no me olvido"
            />
          </label>
          <label>
            Tu historia
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-describedby="hashtags-help"
              required
              minLength={1}
              maxLength={1800}
              rows={4}
              placeholder="Contanos qué hace especial a este recuerdo."
            />
          </label>
          <small id="hashtags-help">
            Agregá #palabras en tu historia para crear hashtags. Hasta 5, de 32 caracteres cada uno.
          </small>
          <div className="memory-form-tags" aria-live="polite">
            {detectedHashtags.error ? (
              <small className="form-error">{detectedHashtags.error}</small>
            ) : (
              detectedHashtags.tags.map((tag) => <span key={tag}>#{tag}</span>)
            )}
          </div>
          <div className="memory-group-choice">
            <label htmlFor="memory-group-select">Publicar en</label>
            <select
              id="memory-group-select"
              value={selectedGroupId}
              disabled={groupsLoading || groupsError || saving}
              onChange={(event) => {
                setSelectedGroupId(event.target.value);
                dirty.current = true;
              }}
            >
              <option value="">Recuerdos generales</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <small role="status">
              {groupsLoading
                ? "Buscando tus grupos…"
                : groupsError
                  ? "No se pudieron cargar tus grupos. Podés publicar en recuerdos generales."
                  : groups.length
                    ? "Elegí uno de los grupos a los que pertenecés o publicá para todos."
                    : "Todavía no te uniste a ningún grupo. Tu recuerdo se publicará para todos."}
            </small>
          </div>
          <div className="memory-tag-users-section">
            <label htmlFor="tag-user-input" className="tag-users-label">
              <Users size={15} /> ¿Quiénes estuvieron ahí?
            </label>
            <div className="tag-users-input-wrapper">
              <input
                id="tag-user-input"
                type="text"
                value={tagQuery}
                disabled={saving || !canTagUsers}
                placeholder="Buscá amigos por @username..."
                onChange={(e) => setTagQuery(e.target.value)}
                autoComplete="off"
              />
              {tagSearching && <Loader2 size={14} className="tag-search-spinner spin" />}
            </div>

            {!canTagUsers && (
              <small>
                Publicá tu primer recuerdo para habilitar las etiquetas a otros usuarios.
              </small>
            )}
            {canTagUsers && tagResults.length > 0 && (
              <ul className="tag-users-dropdown" role="listbox">
                {tagResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        if (session?.usuarioId && u.id === session.usuarioId) return;
                        if (
                          session?.username &&
                          u.username.toLowerCase() === session.username.toLowerCase()
                        )
                          return;
                        setTaggedUsers((prev) =>
                          prev.some((p) => p.id === u.id) ? prev : [...prev, u],
                        );
                        setTagQuery("");
                        setTagResults([]);
                        dirty.current = true;
                      }}
                    >
                      <UserPlus size={14} /> @{u.username}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {taggedUsers.length > 0 && (
              <div className="tagged-users-chips" aria-label="Amigos etiquetados">
                {taggedUsers.map((u) => (
                  <span key={u.id} className="tagged-chip">
                    @{u.username}
                    <button
                      type="button"
                      aria-label={`Quitar @${u.username}`}
                      disabled={saving}
                      onClick={() => {
                        setTaggedUsers((prev) => prev.filter((item) => item.id !== u.id));
                        dirty.current = true;
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div data-form-step="2" hidden={step !== 2}>
          <label>
            Nombre del lugar
            <input
              name="place"
              defaultValue={initial?.place ?? point.label}
              required
              maxLength={120}
              placeholder="Una plaza, tu barrio, aquel café…"
            />
          </label>
          <div className="form-row">
            <MemoryDatePicker
              initialDate={initial?.date}
              decade={decade}
              onChange={() => {
                dirty.current = true;
                setError("");
              }}
            />
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
          <fieldset className="media-fields">
            <legend>Música de fondo · opcional</legend>
            {canAddMusic ? (
              <>
                <label>
                  Elegir canción
                  <select
                    value={musicChoice}
                    onChange={(event) => setMusicChoice(event.target.value)}
                  >
                    <option value="">Sin música</option>
                    {canSuggestMusic &&
                      tracks.map((track) => (
                        <option key={track.spotifyId} value={track.spotifyId}>
                          {track.title} — {track.artist}
                        </option>
                      ))}
                    <option value="custom">Otra canción de Spotify…</option>
                  </select>
                </label>
                {canSuggestMusic && (
                  <small>Estas sugerencias acompañan la época que estás recorriendo.</small>
                )}
                {musicChoice === "custom" && (
                  <>
                    <label>
                      Enlace de Spotify
                      <input
                        name="spotifyUrl"
                        defaultValue={
                          initial?.music
                            ? "https://open.spotify.com/track/" + initial.music.spotifyId
                            : ""
                        }
                        type="url"
                        required
                        placeholder="https://open.spotify.com/track/…"
                      />
                    </label>
                    <label>
                      Tema
                      <input
                        name="songTitle"
                        defaultValue={initial?.music?.title}
                        required
                        maxLength={120}
                      />
                    </label>
                    <label>
                      Artista
                      <input
                        name="songArtist"
                        defaultValue={initial?.music?.artist}
                        required
                        maxLength={120}
                      />
                    </label>
                  </>
                )}
              </>
            ) : (
              <p className="account-permission-note">
                <LockKeyhole size={17} aria-hidden="true" />
                La música se habilita desde Aedo, cuando uno de tus recuerdos recibe 30 puntos de
                nostalgia.
              </p>
            )}
            <small>Podés guardar tu recuerdo sin agregar música.</small>
          </fieldset>
        </div>
        {step !== 0 && error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="local-note">Revisá tu historia antes de guardar el recuerdo.</p>
        <div className="dialog-actions">
          {step > 0 && (
            <button
              type="button"
              className="secondary-button"
              disabled={saving || mediaBusy}
              onClick={() => {
                setError("");
                setStep(step - 1);
              }}
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            className="secondary-button"
            onClick={requestClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="primary-button"
            type="submit"
            disabled={saving || mediaBusy || !account || account.publicacionesRestantes === 0}
          >
            {saving ? (
              <>
                <Loader2 size={17} style={{ animation: "device-spin 1s linear infinite" }} />{" "}
                Guardando...
              </>
            ) : (
              <>
                {step === steps.length - 1 && <Save size={17} />}{" "}
                {mediaBusy
                  ? "Cargando archivo…"
                  : step < steps.length - 1
                    ? "Continuar"
                    : "Guardar recuerdo"}
              </>
            )}
          </button>
        </div>
      </form>
      {confirmDiscard && (
        <DiscardDraftDialog
          decade={decade}
          onContinue={() => setConfirmDiscard(false)}
          onDiscard={onCancel}
        />
      )}
    </dialog>
  );
}

export default function MemoryForm(props: ComponentProps<typeof MemoryCreationForm>) {
  return props.initial ? (
    <MemoryEditForm initial={props.initial} onCancel={props.onCancel} onSave={props.onSave} />
  ) : (
    <MemoryCreationForm {...props} />
  );
}
