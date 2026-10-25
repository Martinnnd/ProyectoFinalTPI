"use client";
import DeleteMemoryDialog from "./components/DeleteMemoryDialog";

import Chat from "./components/Chat";
import CommunityControls from "./components/CommunityControls";
import { demoGroups, loadGroups, filterCommunity } from "./groups";
import { demoGroupMemories } from "./groupMemories";
import type { CommunityGroup } from "./types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, Plus, X, Newspaper, UserRound, MessageCircle, ChevronDown, LogIn } from "lucide-react";
import {
  categories,
  filterMemories,
  symbols,
  type Category,
  type Decade,
  type Memory,
  type Period,
  type TierProgress,
} from "./types";
import { eraContent, resolveUserCategory } from "./data";
import { updateNostalgiaRating, type NostalgiaRatings } from "./nostalgiaRatings";
import { getMemories, isOwnMemory, getSesion, type UsuarioSesion, eliminarPublicacion } from "./api";
import LoginDialog from "./components/LoginDialog";
import MapModal from "./components/MapModal";
import MainMap from "./components/MainMap";
import Profile from "./components/Profile";
import SocialFeed from "./components/social/SocialFeed";
import type { FeedTab } from "./socialTypes";
import EraTimeline from "./components/EraTimeline";
import { flushSync } from "react-dom";
import MemoryMap, { type Point } from "./components/MemoryMap";
import MemoryForm from "./components/MemoryForm";
import SidePanel from "./components/SidePanel";
import Player from "./components/Player";
import EraFacts from "./components/EraFacts";
import EraChrome, { EraIcon } from "./components/EraChrome";
import { availableDecades } from "./eras/registry";
import { eraThemes } from "./themes";

import { getMapPublications, getPublication, publicationId, type MapBounds } from './publicationsApi';
import { dejarDeSeguir, getSeguidores, getSeguidos, seguir, type FollowedUser } from './seguimientosApi';

export default function App() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const reportBounds = useCallback((next: MapBounds) => setBounds(current => JSON.stringify(current) === JSON.stringify(next) ? current : next), []);
  const [remotePins, setRemotePins] = useState<Memory[]>([]);
  const [feedItems, setFeedItems] = useState<Memory[]>([]);
  const [remoteSelected, setRemoteSelected] = useState<Memory | null>(null);
  const selectedSeed = useRef<Memory | null>(null);
  const [apiStatus, setApiStatus] = useState('');
  const [mapRevision, setMapRevision] = useState(0);
  const [groups,setGroups] = useState<CommunityGroup[]>(demoGroups);
  const [scope,setScope] = useState('all');
  const [query,setQuery] = useState('');
  useEffect(()=>setGroups(loadGroups()),[]);
  const mobileOptions = useRef<HTMLDialogElement>(null);
  const mobileOptionsTrigger = useRef<HTMLButtonElement>(null);
  const mapExpandButton = useRef<HTMLButtonElement>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<FollowedUser[]>([]);
  const [followers, setFollowers] = useState<FollowedUser[]>([]);
  const [followingRevision, setFollowingRevision] = useState(0);
  const pendingFollows = useRef(new Set<number>());
  const creationOrigin = useRef(false);
  const [profileAuthor, setProfileAuthor] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "feed" | "profile" | "chat">("map");
  const [period, setPeriod] = useState<Period>(() => {
    const requested = Number(
      new URLSearchParams(window.location.search).get("era"),
    );
    return {
      decade: availableDecades.find((year) => year === requested) ?? 1990,
      year: null,
    };
  });
  const [category, setCategory] = useState<Category | "Todas">("Todas");
  const [dbMemories, setDbMemories] = useState<Memory[]>([]);
  const [repostedPublicationIds, setRepostedPublicationIds] = useState<string[]>([]);
  const [groupOpenRequest, setGroupOpenRequest] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentSesion, setCurrentSesion] = useState<UsuarioSesion | null>(null);
  const currentUserId = currentSesion?.usuarioId ?? 1;
  const following = followingUsers.map(user => user.username);

  useEffect(() => {
    const controller = new AbortController();
    setFollowingUsers([]);
    setFollowers([]);
    Promise.all([getSeguidos(currentUserId, controller.signal), getSeguidores(currentUserId, controller.signal)])
      .then(([nextFollowing, nextFollowers]) => {
        if (!controller.signal.aborted) { setFollowingUsers(nextFollowing); setFollowers(nextFollowers); }
      })
      .catch(error => { if (!controller.signal.aborted) setNotice(`No se pudieron cargar los seguimientos: ${error.message}`); });
    return () => controller.abort();
  }, [currentUserId]);

  async function toggleFollow(author: string, authorId?: number) {
    const targetId = authorId ?? [...feedItems, ...dbMemories].find(memory => memory.author === author)?.authorId;
    if (!targetId) { setNotice(`No se puede seguir a ${author}: falta su identificador de usuario.`); return; }
    if (targetId === currentUserId || pendingFollows.current.has(targetId)) return;
    pendingFollows.current.add(targetId);
    try {
      if (followingUsers.some(user => user.id === targetId)) {
        await dejarDeSeguir(currentUserId, targetId);
        setFollowingUsers(current => current.filter(user => user.id !== targetId));
      } else {
        await seguir(currentUserId, targetId);
        setFollowingUsers(current => [...current, { id: targetId, username: author }]);
      }
      setFollowingRevision(revision => revision + 1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo actualizar el seguimiento.');
    } finally {
      pendingFollows.current.delete(targetId);
    }
  }

  const reloadMemories = async () => {
    try {
      const data = await getMemories();
      setDbMemories(data);
    } catch (e) {
      console.error("Error al cargar publicaciones:", e);
    }
  };

  useEffect(() => {
    setCurrentSesion(getSesion());
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setDbMemories([]);
    if (currentSesion) getMemories(controller.signal).then(data => {
      if (!controller.signal.aborted) setDbMemories(data);
    }).catch(error => { if (!controller.signal.aborted) setNotice(`No se pudieron cargar tus recuerdos: ${error.message}`); });
    return () => controller.abort();
  }, [currentSesion]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [draft, setDraft] = useState<Point | null>(null);
  const [draftHashtags, setDraftHashtags] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [ratings, setRatings] = useState<NostalgiaRatings>({});
  const tierProgress: TierProgress = {
    memories: dbMemories.filter(m => isOwnMemory(m)).length,
    points: 0,
    subscribed: false,
  };
  const canRate = resolveUserCategory(tierProgress) !== 'Errante';
  function rateMemory(postId: string, score: number) {
    if (!canRate) return;
    const next = updateNostalgiaRating(ratings, postId, score);
    setRatings(next);
  }
  const [panelOpen, setPanelOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  useEffect(() => { setMusicOpen(window.innerWidth >= 900); }, []);
  const addButton = useRef<HTMLButtonElement>(null);
  const storiesButton = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const closeMenus = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      document
        .querySelectorAll<HTMLDetailsElement>(".compact-menu[open]")
        .forEach((menu) => {
          if (
            event instanceof KeyboardEvent ||
            !menu.contains(event.target as Node)
          )
            menu.open = false;
        });
    };
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("click", closeMenus);
      document.removeEventListener("keydown", closeMenus);
    };
  }, []);
  useEffect(() => {
    if (!bounds || view !== 'map') return;
    const controller = new AbortController();
    setApiStatus('');
    const loadingTimer = setTimeout(() => setApiStatus('Actualizando publicaciones…'), 1000);
    const timer = setTimeout(() => {
      getMapPublications(bounds, period, category, controller.signal).then(result => {
        if (controller.signal.aborted) return;
        clearTimeout(loadingTimer);
        setRemotePins(result.memories);
        setApiStatus(result.hayMas ? 'Hay más publicaciones: acercá el mapa para verlas.' : '');
      }).catch(error => { if (!controller.signal.aborted) { clearTimeout(loadingTimer); setApiStatus(`No se pudieron cargar las publicaciones: ${error.message}`); } });
    }, 300);
    return () => { clearTimeout(timer); clearTimeout(loadingTimer); controller.abort(); };
  }, [bounds, period, category, view, mapRevision]);
  useEffect(() => {
    setRemoteSelected(current => current?.id === selectedId ? current : null);
    if (!selectedId) return;
    const pin = [selectedSeed.current, remoteSelected, ...remotePins, ...dbMemories].find(memory => memory?.id === selectedId);
    if (!pin || !publicationId(pin)) return;
    const controller = new AbortController();
    setApiStatus(view === 'map' ? 'Cargando resumen…' : 'Cargando publicación…');
    getPublication(pin, view === 'map', controller.signal).then(memory => {
      if (controller.signal.aborted) return;
      setRemoteSelected(memory); setApiStatus('');
    }).catch(error => { if (!controller.signal.aborted) { setRemoteSelected(null); setApiStatus(`No se pudo abrir la publicación: ${error.message}`); } });
    return () => controller.abort();
  }, [selectedId, view, mapRevision]);
  const memories = filterMemories(
    filterCommunity(view === 'map' ? remotePins : view === 'feed' ? feedItems : dbMemories,view === "map" ? "all" : scope,groups,view === "map" ? "" : query),
    period,
    category,
  );
  const profileMemories = profileAuthor === null
    ? dbMemories.filter(m => isOwnMemory(m))
    : dbMemories.filter(m => m.author === profileAuthor);
  const visibleMemories = view === "profile" ? profileMemories : memories;
  const selected = remoteSelected?.id === selectedId ? remoteSelected : visibleMemories.find((m) => m.id === selectedId) ?? remotePins.find(m => m.id === selectedId) ?? null;
  function chooseScope(value:string) {
    setScope(value);setQuery('');setSelectedId(null);
    const group=groups.find(g=>g.id===value);
    if(group){setPeriod({decade:group.decade,year:null});setCategory('Todas');}
    setPanelOpen(false);
  }
  function createGroup(group:CommunityGroup) {
    if(groups.some(g=>g.name.toLocaleLowerCase()===group.name.toLocaleLowerCase())) return 'Ya existe un grupo con ese nombre.';
    const next=[...groups,group];
    try {localStorage.setItem('nostalgia.groups.v1',JSON.stringify(next.filter(g=>!demoGroups.some(d=>d.id===g.id))));} catch {return 'No se pudo guardar el grupo. Revisá el espacio del navegador.';}
    setGroups(next);setScope(group.id);setSelectedId(null);setQuery('');setCategory('Todas');setPeriod({decade:group.decade,year:null});return null;
  }
  const communityControls = (profile=false) => <CommunityControls groups={groups} scope={scope} query={query} decade={period.decade} profile={profile} onQuery={value=>{setQuery(value);setSelectedId(null);}} onScope={value=>{chooseScope(value);if(profile){setGroupOpenRequest(current=>current+1);setView('feed');}}} onCreate={createGroup}/>;
  const eraTransition = useRef<ViewTransition | null>(null);
  useEffect(() => () => { eraTransition.current?.skipTransition(); }, []);
  function changePeriod(next: Period) {
    if (next.decade === period.decade && next.year === period.year) return;
    const update = () => applyPeriod(next);
    if (next.decade === period.decade || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); return; }
    if (document.startViewTransition) {
      eraTransition.current?.skipTransition();
      document.documentElement.classList.add("switching-era");
      const transition = document.startViewTransition(() => flushSync(update));
      eraTransition.current = transition;
      void transition.finished.catch(() => {}).finally(() => {
        if (eraTransition.current === transition) {
          document.documentElement.classList.remove("switching-era");
          eraTransition.current = null;
        }
      });
    } else {
      flushSync(update);
      document.querySelector(".app")?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 600, easing: "ease-out" });
    }
  }
  function applyPeriod(next: Period) {
    setPeriod(next);
    if(groups.some(g=>g.id===scope && g.decade!==next.decade)) setScope("all");
    setSelectedId(null);
    setFactsOpen(false);
    setPanelOpen(false);
  }
  function openProfile(memory: Memory) {
    setProfileAuthor(isOwnMemory(memory) ? null : memory.author);
    setSelectedId(null); setPanelOpen(false); setFactsOpen(false); setPicking(false);
    setCategory("Todas"); setPeriod(p => ({...p, year: null}));
    setView("profile");
  }
  function openPublication(memory: Memory) {
    selectedSeed.current = memory;
    setPeriod({decade: Math.floor(memory.year / 10) * 10 as Decade, year: null});setCategory("Todas");
    setScope('all');setQuery('');setSelectedId(memory.id);setPanelOpen(false);setMapExpanded(false);setView('feed');
  }
  function select(memory: Memory) {
    selectedSeed.current = memory;
    setSelectedId(memory.id);
    setPanelOpen(false);
    if (window.innerWidth < 900) {
      setFactsOpen(false);
    }
  }
  function closeStories() {
    setPanelOpen(false);
    setSelectedId(null);
    storiesButton.current?.focus();
  }
  function startAdding() {
    setDraftHashtags([]);
    creationOrigin.current = view === "profile";
    setProfileAuthor(null);
    setView("map");
    setPicking(true);
    setSelectedId(null);
    setPanelOpen(false);
    setFactsOpen(false);
    setMusicOpen(false);
  }
  function cancel() {
    if (draftHashtags.length) setView("feed");
    if (creationOrigin.current) setView("profile");
    setPicking(false);
    setDraft(null);
    window.setTimeout(() => addButton.current?.focus(), 0);
  }
  useEffect(() => {
    if (draft || mapExpanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (picking) cancel();
      else if (panelOpen) closeStories();
      else {
        setFactsOpen(false);
        setMusicOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [picking, panelOpen, draft, mapExpanded]);
  function editMemory(memory: Memory) {
    if (dbMemories.some(m => m.id === memory.id && isOwnMemory(m))) setEditing(memory);
  }
  function deleteMemory(memory: Memory) {
    setDeleting(memory);
  }
  function confirmDelete(memory: Memory): string | null {
    eliminarPublicacion(memory.id)
      .then(() => {
        setMapRevision(value => value + 1);
        setRemoteSelected(current => current?.id === memory.id ? null : current);
        getMemories().then(data => setDbMemories(data)).catch(console.error);
      })
      .catch((err) =>
        console.warn("Backend falló al eliminar publicación:", err)
      );

    setDbMemories(prev => prev.filter(m => m.id !== memory.id));
    if (selectedId === memory.id) setSelectedId(null);
    setNotice("Recuerdo eliminado.");
    return null;
  }
  function saveEdit(memory: Memory): string | null {
    const original = dbMemories.find(m => m.id === editing?.id);
    if (!original) return "Este recuerdo ya no está disponible.";
    const group = groups.find(g => g.id === original.groupId);
    if (group && (memory.year < group.decade || memory.year > group.decade + 9)) return `Elegí un año entre ${group.decade} y ${group.decade + 9} para este grupo.`;
    const updated = {...memory, id: original.id, groupId: original.groupId, source: original.source, author: original.author};
    setDbMemories(prev => prev.map(m => m.id === original.id ? updated : m));
    setEditing(null);
    setPeriod({decade: Math.floor(memory.year / 10) * 10 as Decade, year: null});setCategory("Todas");setQuery("");
    setNotice("Recuerdo actualizado.");
    return null;
  }
  async function save(memory: Memory) {
    const destinationGroup=groups.find(g=>g.id===scope);
    if(destinationGroup) {
      if(memory.year < destinationGroup.decade || memory.year > destinationGroup.decade+9) return `Elegí un año entre ${destinationGroup.decade} y ${destinationGroup.decade+9} para este grupo.`;
      memory={...memory,groupId:scope};
    }

    try {
      const { crearPublicacion } = await import("./api");
      const res = await crearPublicacion(memory);
      if (res && res.id) {
        memory = { ...memory, id: res.id.toString() };
      }
      await reloadMemories();
    } catch (err) {
      console.warn("Backend falló al crear publicación.", err);
      return "Falló la conexión con el servidor. No se pudo guardar el recuerdo.";
    }

    setMapRevision(value => value + 1);
    setPeriod({
      decade: (Math.floor(memory.year / 10) * 10) as Decade,
      year: null,
    });
    setCategory("Todas");
    setDraft(null);
    setPicking(false);
    select(memory);
    if (creationOrigin.current) {
      setView("profile");
      setPanelOpen(false);
    }
    if (draftHashtags.length) {
      setView("feed"); setSelectedId(null); setPanelOpen(false); setQuery("");
      setDraftHashtags([]);
    }
    setNotice("¡Recuerdo guardado! Ya tiene su lugar en el mapa.");
    window.setTimeout(() => addButton.current?.focus(), 0);
    return null;
  }
  function navigate(destination: "map" | "stories" | "facts" | "music") {
    setPicking(false);
    if (destination === "music") {
      setMusicOpen(!musicOpen);
      if (window.innerWidth < 900) { setPanelOpen(false); setFactsOpen(false); }
      return;
    }
    if (destination === "stories") storiesButton.current = document.activeElement as HTMLElement | null;
    setView("map");
    setPanelOpen(destination === "stories" && (view !== "map" || !panelOpen));
    setFactsOpen(destination === "facts" && (view !== "map" || !factsOpen));
    if (destination === "map") setSelectedId(null);
  }
  const theme = eraThemes[period.decade];
  return (
    <div
      style={theme.tokens}
      className={`app map-app view-${view} era-${period.decade} ${panelOpen ? "stories-open" : ""} ${musicOpen ? "music-open" : ""}`}
    >
      <EraTimeline period={period} onChange={changePeriod} memories={view === 'profile' ? profileMemories : undefined} action={
        <button
          ref={addButton}
          aria-label="Recordar"
          className="primary-button time-add-memory"
          onClick={startAdding}
          disabled={picking || !!draft}
        >
          <Plus size={16} />
          <span>Recordar</span>
        </button>
      }/>
      <div className="mobile-appbar">
        <div className="mobile-page-title"><span>Nostalgiar</span><strong>{view === 'map' ? 'Explorar' : view === 'feed' ? 'Feed' : view === 'chat' ? 'Chat' : 'Mi perfil'}</strong></div>
        <button ref={mobileOptionsTrigger} className="mobile-era-button" onClick={() => mobileOptions.current?.showModal()} aria-label="Abrir opciones"><strong>Opciones</strong><ChevronDown size={15}/></button>
        <button className="mobile-add-button" aria-label="Sumar mi recuerdo" onClick={startAdding} disabled={picking || !!draft}><Plus size={23}/></button>
      </div>
      <dialog ref={mobileOptions} className="mobile-options" onClick={e=>{if(e.target===e.currentTarget)mobileOptions.current?.close();}} onClose={()=>mobileOptionsTrigger.current?.focus()} aria-labelledby="mobile-options-title">
        <header><h2 id="mobile-options-title">Opciones de exploración</h2><button className="icon-button" aria-label="Cerrar opciones" onClick={()=>mobileOptions.current?.close()}><X/></button></header>
        <label className="mobile-category">Categoría<select value={category} onChange={e=>{setCategory(e.target.value as Category | 'Todas');setSelectedId(null);}}>{['Todas',...categories].map(c=><option key={c}>{c}</option>)}</select></label>
        <div className="mobile-tools">{(['stories','facts','music'] as const).map(destination=><button key={destination} onClick={()=>{mobileOptions.current?.close();navigate(destination);}}><EraIcon decade={period.decade} destination={destination}/><span>{destination==='stories'?'Recuerdos':destination==='facts'?'Efemérides':'Música'}</span></button>)}</div>
        <button className="primary-button mobile-options-done" onClick={()=>mobileOptions.current?.close()}>Ver selección</button>
      </dialog>
      <a className="skip-link" href="#explore">
        Saltar al mapa
      </a>
        <main id="explore" className="map-canvas" style={view === 'map' ? undefined : { display: 'none' }}>
          <MainMap
            active={view === 'map'}
            showEmptyState={false}
            onBoundsChange={reportBounds}
            memories={filterMemories(remotePins, period, category)}
            selected={view === 'map' ? selected : null}
            onSelect={select}
            onOpen={openPublication}
            picking={picking}
            onPick={(point) => {
              setDraft(point);
              setPicking(false);
            }}
            draft={draft}
            onCancel={cancel}
          />
        </main>
      <EraChrome
        period={period}
        count={visibleMemories.length}
        panelOpen={panelOpen}
        factsOpen={factsOpen}
        musicOpen={musicOpen}
        onNavigate={navigate}
      />
      <nav className="navigation-rail" aria-label="Navegación principal">
        <button
          aria-label="Explorar mapa"
          className={view === "map" && !panelOpen ? "rail-active" : ""}
          onClick={() => navigate("map")}
        >
          <EraIcon decade={period.decade} destination="map" />
          <span>Explorar</span>
        </button>
        <button
          aria-current={view === "feed" ? "page" : undefined}
          className={view === "feed" ? "rail-active" : ""}
          onClick={() => {
            setView("feed");
            setSelectedId(null);
            setPanelOpen(false);
            setFactsOpen(false);
            setPicking(false);
          }}
        >
          <Newspaper />
          <span>Feed</span>
        </button>
        <button aria-current={view === "chat" ? "page" : undefined} className={view === "chat" ? "rail-active" : ""} onClick={() => {setView("chat");setPicking(false);setPanelOpen(false);setFactsOpen(false);}}><MessageCircle/><span>Chat</span></button>
        <button
          aria-current={view === "profile" ? "page" : undefined}
          className={`rail-profile ${view === "profile" ? "rail-active" : ""}`}
          onClick={() => {
            setProfileAuthor(null);
            setView("profile");
            setMusicOpen(false);
            setSelectedId(null);
            setPanelOpen(false);
            setFactsOpen(false);
            setPicking(false);
          }}
        >
          <UserRound />
          <span>Perfil</span>
        </button>
        <button
          aria-label={currentSesion ? `Cuenta: ${currentSesion.username}` : "Iniciar sesión"}
          className={loginOpen ? "rail-active" : ""}
          onClick={() => setLoginOpen(true)}
          title={currentSesion ? `Sesión: ${currentSesion.username}` : "Iniciar sesión"}
          style={currentSesion ? { color: "var(--accent, #4ade80)" } : undefined}
        >
          <LogIn />
          <span>{currentSesion ? currentSesion.username : "Login"}</span>
        </button>
      </nav>
      <header className="map-toolbar">
        <div className="compact-selectors">
          <div id="place-search-slot" />
          <details className="filters compact-menu">
            <summary>
              {category === "Todas" ? "Categorías" : category === "Personales" ? "Recuerdos personales" : category}
              <span aria-hidden="true">...</span>
              <span className="sr-only">Elegir categoría</span>
            </summary>
            <div
              className="category-options"
              role="group"
              aria-label="Filtrar por categoría"
            >
              {(["Todas", ...categories] as const).map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? "active" : ""}
                  onClick={(event) => {
                    setCategory(c);
                    setSelectedId(null);
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                  }}
                >
                  <span aria-hidden="true">
                    {c === "Todas" ? "✳" : symbols[c]}
                  </span>
                  {c === "Personales" ? "Recuerdos personales" : c}
                </button>
              ))}
            </div>
          </details>
        </div>

      </header>

      
      {view === "map" && panelOpen && (
        <div className="stories-drawer stories-index">
          <div className="drawer-heading">
            <span className="eyebrow">{theme.storiesTitle}</span>
            <button
              className="icon-button"
              aria-label="Cerrar historias"
              onClick={closeStories}
            >
              <X size={19} />
            </button>
          </div>
          <SidePanel
            selected={selected}
            memories={memories}
            onSelect={(memory) => {
              openPublication(memory);
            }}
          />
        </div>
      )}
      {view === "map" && factsOpen && !picking && !draft && (
        <EraFacts
          key={`${period.decade}-${period.year}`}
          period={period}
          onClose={() => setFactsOpen(false)}
        />
      )}
      {view === "profile" && (
        <Profile
          onEdit={editMemory}
          onDelete={deleteMemory}
          onOpen={openPublication}
          key={`${currentSesion?.usuarioId ?? 'guest'}:${profileAuthor ?? 'own'}`}
          author={profileAuthor ?? undefined}
          onBack={() => {setSelectedId(null);setView("feed");}}
          userId={currentSesion?.usuarioId ?? null}
          onRequireLogin={() => setLoginOpen(true)}
          repostedPublicationIds={repostedPublicationIds}
          period={period}
          selected={selected}
          onSelect={(m) => { selectedSeed.current = m; setRemoteSelected(m); setSelectedId(m?.id ?? null); }}
          onAdd={startAdding}
        />
      )}
      <div hidden={view !== "feed"}>
        <SocialFeed
          key={currentSesion?.usuarioId ?? 'guest'}
          active={view === 'feed'}
          onItems={setFeedItems}
          filterFeed={items => filterMemories(filterCommunity(items, scope, groups, query), period, category)}
          onAddHashtag={tag => { startAdding(); setDraftHashtags([tag]); }}
          onTabChange={(tab: FeedTab) => {
            if (tab !== 'groups' && groups.some(group => group.id === scope)) {
              setScope('all');
              setQuery('');
            }
          }}
          onEdit={editMemory}
          onDelete={deleteMemory}
          onProfile={openProfile}
          groupIds={groups.map(group => group.id)}
          suggestedAuthors={[
            ...dbMemories.filter(memory => memory.authorId).map(memory => ({ name: memory.author, id: memory.authorId! })),
            ...followers.map(user => ({ name: user.username, id: user.id })),
          ]}
          groupOpenRequest={groupOpenRequest}
          community={communityControls()}
          groupName={groups.find(g=>g.id===scope)?.name}
          decade={period.decade}
          memories={filterMemories(filterCommunity([...dbMemories, ...demoGroupMemories], scope, groups, query), period, category)}
          following={following}
          followingRevision={followingRevision}
          onFollow={toggleFollow}
          ratings={ratings}
          canRate={canRate}
          onRate={rateMemory}
          selected={selected}
          onSelect={(m) => { selectedSeed.current = m; setRemoteSelected(m); setSelectedId(m?.id ?? null); }}
          onMap={(m) => {
            selectedSeed.current = m;
            setRemoteSelected(m);
            setView("map");
            setSelectedId(m.id);
            setPanelOpen(false);
            setFactsOpen(false);
          }}
          onAdd={startAdding}
          onReloadMemories={reloadMemories}
          onRepostCreated={id => setRepostedPublicationIds(current => [...new Set([...current, id])])}
          onRequireLogin={() => setLoginOpen(true)}
        />
      </div>
      <Chat decade={period.decade} fullPage={view === "chat"} onOpenPage={() => {setView("chat");setPanelOpen(false);setFactsOpen(false);setPicking(false);}} hidden={picking || !!draft}/>
      <Player
        key={period.decade}
        decade={period.decade}
        expanded={musicOpen}
        onToggle={() => {
          setMusicOpen(!musicOpen);
          if (window.innerWidth < 900) {
            setPanelOpen(false);
            setFactsOpen(false);
          }
        }}
      />
      {apiStatus && <div className="toast" role="status">{apiStatus}{apiStatus.startsWith('No se pud') && <button onClick={() => setMapRevision(value => value + 1)}>Reintentar</button>}</div>}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Cerrar aviso"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {mapExpanded && view === "feed" && (
        <MapModal
          onOpen={openPublication}
          memories={memories}
          selected={selected}
          onSelect={(m) => setSelectedId(m.id)}
          onClose={() => {
            setMapExpanded(false);
            requestAnimationFrame(() => mapExpandButton.current?.focus());
          }}
        />
      )}
      {deleting && <DeleteMemoryDialog memory={deleting} onCancel={() => setDeleting(null)} onConfirm={() => confirmDelete(deleting)}/>}
      {editing && <MemoryForm key={editing.id} initial={editing} point={{lat:editing.lat,lng:editing.lng}} decade={Math.floor(editing.year / 10) * 10 as Decade} groupName={groups.find(g => g.id === editing.groupId)?.name} onCancel={() => setEditing(null)} onSave={saveEdit}/>}
      {draft && (
        <MemoryForm
          defaultHashtags={draftHashtags}
          groupName={groups.find(g=>g.id===scope)?.name}
          point={draft}
          decade={period.decade}
          onCancel={cancel}
          onSave={save}
        />
      )}
      <LoginDialog
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSesionChange={() => {
          setCurrentSesion(getSesion());
        }}
      />
    </div>
  );
}
