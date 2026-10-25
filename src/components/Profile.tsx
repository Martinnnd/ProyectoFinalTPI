import MemoryOwnerActions from "./MemoryOwnerActions";
import PostMedia, { PostMusic } from "./PostMedia";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Grid3x3, Link2, Lock, MapPin, Plus, Repeat2, Send, Share2, UserRound, X } from "lucide-react";
import MemoryMap from "./MemoryMap";
import { userTiers } from "../data";
import type { Memory, Period } from "../types";
import useUserProfile from "../hooks/useUserProfile";
import { toAchievement } from "../profileApi";

export default function Profile({
  onEdit,
  onDelete,
  author,
  onBack,
  community,
  userId,
  onRequireLogin,
  repostedPublicationIds,
  period,
  selected,
  onSelect,
  onOpen,
  onAdd,
}: {
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  author?: string;
  onBack?: () => void;
  community?: ReactNode;
  userId: number | null;
  onRequireLogin: () => void;
  repostedPublicationIds: string[];
  period: Period;
  selected: Memory | null;
  onOpen?: (memory: Memory) => void;
  onSelect: (memory: Memory | null) => void;
  onAdd: () => void;
}) {
  const remote = useUserProfile(userId === null ? null : author ?? userId);
  const profile = remote.data?.profile;
  const allMemories = remote.data?.memories ?? [];
  const followers = remote.data?.followers ?? [];
  const followedUsers = remote.data?.following ?? [];
  const displayName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || profile?.username || '';
  const followDialog = useRef<HTMLDialogElement>(null);
  const [followList, setFollowList] = useState<"followers" | "following">("followers");
  const mapDialog = useRef<HTMLDialogElement>(null);
  const mapReturnFocus = useRef<HTMLElement | null>(null);
  const mapCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [mapOpened, setMapOpened] = useState(false);
  const [mapClosing, setMapClosing] = useState(false);
  useEffect(() => () => clearTimeout(mapCloseTimer.current), []);
  function openMap() {
    clearTimeout(mapCloseTimer.current);
    mapReturnFocus.current = document.activeElement as HTMLElement | null;
    setMapClosing(false);
    setMapOpened(true);
    mapDialog.current?.showModal();
  }
  function closeMap(after?: () => void) {
    if (mapClosing) return;
    setMapClosing(true);
    mapCloseTimer.current = setTimeout(() => {
      mapDialog.current?.close();
      setMapOpened(false);
      setMapClosing(false);
      mapReturnFocus.current?.focus({ preventScroll: true });
      after?.();
    }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320);
  }
  const openFromMap = onOpen ? (memory: Memory) => closeMap(() => onOpen(memory)) : undefined;
  const album = useRef<HTMLElement>(null);
  const presentation = {
    1970: {title: "Historias con nombre propio", label: "Suplemento personal", collection: "Mis recuerdos", map: "Lugares de una vida", footer: "Cada vida merece ser contada"},
    1980: {title: "Archivo de videoclub", label: "Colección personal · VHS", collection: "Mis cintas", map: "Locaciones", footer: "Rebobiná. Volvé a esos días."},
    1990: {title: "Archivo personal — Nostalgiar 95", label: "Mi PC / Personas / Archivo personal", collection: "Recuerdos", map: "Mapa de lugares", footer: "Archivo de recuerdos"},
    2000: {title: "Mi espacio — Nostalgiar Messenger", label: "Un espacio para volver a conectar", collection: "Álbum de recuerdos", map: "Mis lugares", footer: "Historias que nos conectan"},
  }[period.decade];
  const jumpTo = (target: HTMLElement | null) => target?.scrollIntoView({block: "start", behavior: "instant"});
  const [detailShareOpen, setDetailShareOpen] = useState(false);
  const [collectionShareOpen, setCollectionShareOpen] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState<string | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [tiersOpen, setTiersOpen] = useState(false);
  const catalogueDialog = useRef<HTMLDialogElement>(null);
  const tiersDialog = useRef<HTMLDialogElement>(null);
  const catalogue = useMemo(() => profile?.logros.map(toAchievement) ?? [], [profile]);
  const unlocked = catalogue.filter((achievement) => achievement.unlocked);
  const userCategory = profile?.reputacion;
  const currentTier = userTiers.findIndex(tier => tier.name === userCategory);
  const tiers = userTiers.map((tier, index) => ({...tier, state: index === currentTier ? 'current' : index < currentTier ? 'reached' : 'locked'}));
  function openCatalogue() {
    setAchievementsOpen(true);
    catalogueDialog.current?.showModal();
  }
  function closeCatalogue() {
    setAchievementsOpen(false);
    catalogueDialog.current?.close();
  }
  function openTiers() {
    setTiersOpen(true);
    tiersDialog.current?.showModal();
  }
  function closeTiers() {
    setTiersOpen(false);
    tiersDialog.current?.close();
  }
  if (userId === null) return <main id="explore" className="personal-profile" aria-label="Mi perfil">
    <p>Iniciá sesión para ver tu perfil y tus logros.</p>
    <button className="primary-button" onClick={onRequireLogin}>Iniciar sesión</button>
  </main>;
  if (remote.error) return <main id="explore" className="personal-profile" aria-label="Perfil">
    <p role="alert">{remote.error}</p><button onClick={remote.reload}>Reintentar</button>
    <button onClick={onRequireLogin}>Iniciar sesión</button>
    {author && <button onClick={onBack}>Volver al feed</button>}
  </main>;
  if (!profile) return <main id="explore" className="personal-profile"><p role="status">Cargando perfil y logros…</p></main>;
  return (
    <main id="explore" className="personal-profile" data-visitor={!!author} aria-label={author ? `Perfil de ${author}` : "Mi perfil"}>
      
      <div className="profile-main">
      {author && <button className="feed-back" onClick={onBack}>← Volver al feed</button>}
      <div className="profile-era-bar"><span className="profile-era-mark" aria-hidden="true"><UserRound size={18}/></span><strong>{presentation.title}</strong><span className="profile-edition">{period.decade}—{period.decade + 9}</span></div>
      <header className="personal-header">
        <div className="profile-portrait" aria-hidden="true">
          <span className="visitor-initial">{displayName.slice(0,1)}</span>
        </div>
        <div className="personal-identity">
          <div className="personal-identity-text">
            <span className="eyebrow">{presentation.label}</span>
            <div className="profile-name-row">
            <h2>{displayName}</h2>
            <span>@{profile.username}</span>
            {!author && <button
              className="profile-note"
              onClick={openTiers}
              aria-haspopup="dialog"
              aria-expanded={tiersOpen}
            >
              {userCategory}
            </button>}
            </div>
        <div className="personal-counts">
          <span><strong>{profile.cantidadPublicaciones}</strong> Recuerdos</span>
          {!author && <>
            <button type="button" aria-haspopup="dialog" onClick={() => { setFollowList("followers"); followDialog.current?.showModal(); }}><strong>{profile.cantidadSeguidores}</strong> Seguidores</button>
            <button type="button" aria-haspopup="dialog" onClick={() => { setFollowList("following"); followDialog.current?.showModal(); }}><strong>{profile.cantidadSeguidos}</strong> Seguidos</button>
          </>}
        </div>
          </div>
          {!author && <div className="achievements">
            <div className="achievements-heading">
              <h3><button type="button" className="profile-achievements-trigger" onClick={openCatalogue} aria-haspopup="dialog" aria-expanded={achievementsOpen}>Logros</button></h3>
              <span className="achievements-count">
                {unlocked.length}/{catalogue.length}
              </span>
            </div>
            {unlocked.length ? (
              <ul className="achievement-rail">
                {unlocked.map((achievement) => (
                  <li key={achievement.id}>
                    <img
                      src={achievement.image}
                      alt={achievement.name}
                      title={achievement.name}
                      width={40}
                      height={40}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="achievements-empty">
                Todavía no conseguiste ninguna insignia.
              </p>
            )}

          </div>}
        </div>



      </header>
      <dialog ref={followDialog} className="profile-follow-dialog" aria-labelledby="profile-follow-title" onClick={event => { if (event.target === event.currentTarget) followDialog.current?.close(); }}>
        <header>
          <h2 id="profile-follow-title">{followList === "followers" ? "Seguidores" : "Seguidos"}</h2>
          <button className="icon-button" aria-label="Cerrar lista" onClick={() => followDialog.current?.close()}><X size={20}/></button>
        </header>
        {(followList === "followers" ? followers : followedUsers).length ? (
          <ul>{(followList === "followers" ? followers : followedUsers).map(user => <li key={user.id}><span aria-hidden="true">{user.username.slice(0,1).toUpperCase()}</span><strong>{user.username}</strong></li>)}</ul>
        ) : <p>{followList === "followers" ? "Todavía no tenés seguidores." : "Todavía no seguís a nadie."}</p>}
      </dialog>
      <nav className="profile-shortcuts" aria-label="Secciones del perfil">
        <button onClick={() => jumpTo(album.current)}><Grid3x3 size={16}/>{author ? "Su colección" : presentation.collection}<span>{allMemories.length}</span></button>
        <button onClick={openMap} aria-haspopup="dialog" aria-expanded={mapOpened}><MapPin size={16}/>{author ? "Sus lugares" : "Mis lugares"}</button>
        <span className="profile-motto">{presentation.footer}</span>
      </nav>
      <dialog ref={mapDialog} id="profile-map-dialog" className={`timeline-drawer profile-map-dialog${mapClosing ? " is-closing" : ""}`} aria-labelledby="profile-map-dialog-title" onCancel={e => { e.preventDefault(); e.stopPropagation(); closeMap(); }} onKeyDown={e => e.stopPropagation()}>
        <header className="timeline-drawer-header"><div><span className="eyebrow">UN VIAJE POR TUS LUGARES</span><h2 id="profile-map-dialog-title">{author ? `El mapa de ${author}` : "Mi mapa de recuerdos"}</h2></div><button className="icon-button" aria-label="Cerrar mapa del perfil" onClick={() => closeMap()}><X size={22}/></button></header>
        <div className="profile-map-dialog-content">
      {mapOpened && <section className="personal-atlas">
        <div className="personal-section-title">
          <div>
            <span className="eyebrow">{author ? "GEOGRAFÍA DE RECUERDOS" : "MI GEOGRAFÍA DE RECUERDOS"}</span>
            <h3>{author ? `Los lugares de ${author}` : "Los lugares de mi historia"}</h3>
          </div>
          <span>
            Todas las épocas · {allMemories.length} recuerdos
          </span>
        </div>
        <div className="profile-atlas-workspace">
        <div className={period.decade === 1990 ? "profile-computer" : "profile-atlas-frame profile-era-device"}>
        {period.decade === 1990 && <div className="profile-computer-title"><span>▣ Mi PC — Mapa personal</span><small>Archivo de recuerdos</small></div>}
        {period.decade !== 1990 && <div className="profile-device-top" aria-hidden="true"><strong>{period.decade === 1970 ? "NOSTALGIAR · TELEVISIÓN" : period.decade === 1980 ? "MEMORY ARCADE" : "Nostalgiar · Digital Display"}</strong><small>{period.decade === 1980 ? "UN LUGAR · UNA HISTORIA" : "MAPA PERSONAL"}</small></div>}
        <div className="profile-atlas-screen">
        <div className="personal-map">
          <MemoryMap
            fitMemories
            memories={allMemories}
            selected={selected}
            onSelect={onSelect}
            onOpen={openFromMap}
            picking={false}
            onPick={() => { }}
            draft={null}
            onCancel={() => { }}
          />
        </div>

        </div>
        {period.decade !== 1990 && <div className="profile-device-bottom" aria-hidden="true"><span className="profile-device-brand">NOSTALGIAR</span><span className="profile-device-grille"/><span className="profile-device-knob"/><span className="profile-device-buttons"><i/><i/><i/></span><span className="profile-device-led"/></div>}
        {period.decade === 1990 && <div className="profile-computer-chin" aria-hidden="true"><strong>NOSTALGIAR <small>PERSONAL COMPUTER</small></strong><span className="profile-computer-vents"/><i/><span>POWER</span></div>}
        </div>
        <aside className="profile-map-list" aria-label="Recuerdos del mapa">
          <header><strong>{author ? "Sus recuerdos" : "Mis recuerdos"}</strong><small>{allMemories.length}</small></header>
          <div className="profile-map-items">{allMemories.length ? [...allMemories].sort((a,b)=>a.year-b.year).map(memory=><div className="profile-map-row" key={memory.id} data-selected={selected?.id===memory.id}>
            <button className="profile-map-select" aria-pressed={selected?.id===memory.id} onClick={()=>onSelect(memory)}><span className="profile-map-year">{memory.year}</span><span><strong>{memory.title}</strong><small>{memory.place}</small></span></button>
            {selected?.id===memory.id && <><p>{memory.description}</p>{onOpen && <button className="profile-map-open" onClick={()=>openFromMap?.(memory)}>Ver publicación →</button>}</>}
          </div>):<p className="profile-map-empty">Los recuerdos publicados aparecerán acá.</p>}</div>
        </aside>
        </div>
        {selected && (
          <article className="personal-detail">
            
            <div className="personal-detail-actions">
              <MemoryOwnerActions memory={selected} onEdit={memory => closeMap(() => onEdit(memory))} onDelete={memory => closeMap(() => onDelete(memory))}/>
              <div className="share-menu">
                <button
                  className="icon-button"
                  aria-label="Compartir recuerdo"
                  aria-expanded={detailShareOpen}
                  onClick={() => setDetailShareOpen((open) => !open)}
                >
                  <Share2 size={18} />
                </button>

                {detailShareOpen && (
                  <div className="share-menu-panel" role="menu">
                    <span>Compartir recuerdo</span>

                    <a
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Send size={15} /> WhatsApp
                    </a>

                    <a
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Link2 size={15} /> Facebook
                    </a>

                    <a
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span aria-hidden="true">𝕏</span> X
                    </a>

                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(window.location.href);
                        setCopiedShare("detail");
                      }}
                    >
                      <Link2 size={15} />
                      {copiedShare === "detail" ? "Enlace copiado" : "Copiar enlace"}
                    </button>
                  </div>
                )}
              </div>

              <button
                className="icon-button"
                aria-label="Cerrar mi recuerdo"
                onClick={() => onSelect(null)}
              >
                <X size={18} />
              </button>
            </div>
            <span className="eyebrow">
              {selected.year} / {selected.category}
            </span>
            <PostMusic key={`music-${selected.id}`} music={selected.music}/>
            <h3>{selected.title}</h3>
            <p className="personal-place">
              <MapPin size={14} />
              {selected.place}
            </p>
            <p>{selected.description}</p>
            <PostMedia key={`media-${selected.id}`} memory={selected}/>
          </article>
        )}
      </section>}
        </div>
      </dialog>
      <section ref={album} className="personal-album profile-posts">
        <div className="personal-section-title">
          <h3>{author ? `Recuerdos de ${author}` : "Mis recuerdos"}</h3>
          <span>Todas las épocas · Últimas publicaciones primero</span>
        </div>
        {allMemories.length ? (
          <div className="personal-grid profile-post-list">
            {[...allMemories].reverse().map((memory) => (
              <article
                key={memory.id}
                className="personal-memory profile-post"
                data-selected={selected?.id === memory.id}
              >
                {(memory.repost || repostedPublicationIds.includes(memory.id)) && (
                  <div className="profile-repost-badge"><Repeat2 size={15} aria-hidden="true" /> Reposteado</div>
                )}
                <div className="memory-card-top">
                  <div className="profile-post-author"><span className="profile-post-avatar" aria-hidden="true">{displayName.slice(0,1)}</span><span><strong>{displayName}</strong><small>{memory.year} · {memory.category}</small></span></div>
                  <MemoryOwnerActions memory={memory} onEdit={onEdit} onDelete={onDelete}/>

                  <div className="share-menu">
                    <button
                      className="icon-button"
                      aria-label={`Compartir ${memory.title}`}
                      aria-expanded={collectionShareOpen === memory.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setCollectionShareOpen((open) =>
                          open === memory.id ? null : memory.id
                        );
                      }}
                    >
                      <Share2 size={18} />
                    </button>

                    {collectionShareOpen === memory.id && (
                      <div
                        className="share-menu-panel"
                        role="menu"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span>Compartir recuerdo</span>

                        <a
                        >
                          <Send size={15} /> WhatsApp
                        </a>

                        <a
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Link2 size={15} /> Facebook
                        </a>

                        <a
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span aria-hidden="true">𝕏</span> X
                        </a>

                        <button
                          onClick={async (event) => {
                            event.stopPropagation();
                            await navigator.clipboard.writeText(window.location.href);
                            setCopiedShare(memory.id);
                          }}
                        >
                          <Link2 size={15} />
                          {copiedShare === memory.id
                            ? "Enlace copiado"
                            : "Copiar enlace"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="profile-post-body">
                  <h3>{memory.title}</h3>
                  <p className="profile-post-location"><MapPin size={14}/>{memory.place}</p>
                  <p className="profile-post-story">{memory.description}</p>
                  <PostMusic music={memory.music}/>
                  <PostMedia memory={memory}/>
                </div>
                <footer className="profile-post-footer">
                  {onOpen && <button onClick={() => onOpen(memory)}>Ver publicación</button>}
                  <button onClick={() => { onSelect(memory); openMap(); }}><MapPin size={16}/>Ver en el mapa</button>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="personal-empty">
            <h3>{author ? "Todavía no hay recuerdos publicados" : "Tu primer recuerdo merece un lugar"}</h3>
            <p>{author ? "Sus publicaciones aparecerán acá." : "Contá tu historia: cada recuerdo que publiques aparecerá acá, uno debajo del otro."}</p>
            {!author && <button className="primary-button" onClick={onAdd}>
              Crear un recuerdo
            </button>}
          </div>
        )}
      </section>

      <dialog
        ref={catalogueDialog}
        className="achievement-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeCatalogue();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeCatalogue();
        }}
        aria-labelledby="achievements-title"
      >
        <header>
          <div>
            <h2 id="achievements-title">Todas las insignias</h2>
            <small>
              {unlocked.length} de {catalogue.length} conseguidas
            </small>
          </div>
          <button
            className="icon-button"
            onClick={closeCatalogue}
            aria-label="Cerrar catálogo de logros"
          >
            <X size={20} />
          </button>
        </header>
        <div className="achievement-dialog-content">
          <ul className="achievement-list">
            {catalogue.map((achievement) => (
              <li
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? "is-unlocked" : "is-locked"
                  }`}
              >
                <span className="achievement-media">
                  <img
                    src={achievement.image}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                  />
                  {!achievement.unlocked && (
                    <span className="achievement-lock">
                      <Lock size={14} />
                    </span>
                  )}
                </span>
                <span className="achievement-body">
                  <strong>{achievement.name}</strong>
                  <p>{achievement.description}</p>
                  <span className="achievement-state">
                    {achievement.unlocked ? "Conseguida" : "Bloqueada"}
                  </span>
                  {achievement.unlocked && achievement.unlockedAt && <time dateTime={achievement.unlockedAt}>
                    {new Date(achievement.unlockedAt).toLocaleDateString('es-AR')}
                  </time>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
      <dialog
        ref={tiersDialog}
        className="tier-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeTiers();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeTiers();
        }}
        aria-labelledby="tiers-title"
      >
        <header>
          <div>
            <h2 id="tiers-title">Tu categoría</h2>
            <small>Así avanzás en Nostalgiar</small>
          </div>
          <button
            className="icon-button"
            onClick={closeTiers}
            aria-label="Cerrar categorías"
          >
            <X size={20} />
          </button>
        </header>
        <div className="tier-dialog-content">
          <ul className="tier-list">
            {tiers.map((tier) => (
              <li key={tier.name} className={`tier-card is-${tier.state}`}>
                <span className="tier-body">
                  <strong>{tier.name}</strong>
                  <p>{tier.requirement}</p>
                </span>
                <span className="tier-state">
                  {tier.state === "current"
                    ? "Tu categoría"
                    : tier.state === "reached"
                      ? "Alcanzada"
                      : "Bloqueada"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
      </div>
      {community && <aside className="profile-groups" aria-label="Mis grupos">{community}</aside>}
    </main>
  );
}
