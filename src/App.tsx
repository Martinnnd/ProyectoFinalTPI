"use client";
import DeleteMemoryDialog from "./components/DeleteMemoryDialog";

import Chat from "./components/Chat";
import CommunityControls from "./components/CommunityControls";
import { demoGroups, loadGroups, filterCommunity } from "./groups";
import type { CommunityGroup } from "./types";
import { useEffect, useRef, useState } from "react";
import { Compass, Plus, X, Newspaper, UserRound, MessageCircle, ChevronDown } from "lucide-react";
import {
  categories,
  filterMemories,
  symbols,
  type Achievement,
  type Category,
  type Decade,
  type Memory,
  type Period,
  type TierProgress,
} from "./types";
import { achievements, eraContent, initialMemories } from "./data";
import { loadMemories, saveMemories } from "./storage";
import AchievementToast from "./components/AchievementToast";
import MapModal from "./components/MapModal";
import MainMap from "./components/MainMap";
import Profile from "./components/Profile";
import SocialFeed from "./components/social/SocialFeed";
import Timeline from "./components/Timeline";
import MemoryMap, { type Point } from "./components/MemoryMap";
import MemoryForm from "./components/MemoryForm";
import SidePanel from "./components/SidePanel";
import Player from "./components/Player";
import EraFacts from "./components/EraFacts";
import EraChrome, { EraIcon } from "./components/EraChrome";
import { availableDecades } from "./eras/registry";
import { eraThemes } from "./themes";

export default function App() {
  const [groups,setGroups] = useState<CommunityGroup[]>(demoGroups);
  const [scope,setScope] = useState('all');
  const [query,setQuery] = useState('');
  useEffect(()=>setGroups(loadGroups()),[]);
  const mobileOptions = useRef<HTMLDialogElement>(null);
  const mobileOptionsTrigger = useRef<HTMLButtonElement>(null);
  const mapExpandButton = useRef<HTMLButtonElement>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);
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
  const [local, setLocal] = useState<Memory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [draft, setDraft] = useState<Point | null>(null);
  const [notice, setNotice] = useState("");
  const [celebrating, setCelebrating] = useState<Achievement | null>(null);
  // Badge 01 means "you published a first memory", so it is derived from the
  // visitor's own data instead of being stored again. That way it survives a
  // reload with no extra storage key, and dismissing the banner cannot revoke it.
  const earned: Achievement[] = local.length > 0 ? [achievements[0]] : [];
  // Nostalgia points and monthly subscriptions have no data source yet, so
  // Aedo and Mnemosine stay locked: their rules are declared, their inputs are
  // not. Wire the real values here and both tiers unlock with no other change.
  const tierProgress: TierProgress = {
    memories: local.length,
    points: 0,
    subscribed: false,
  };
  const [panelOpen, setPanelOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 900 && view !== "map") setMusicOpen(false);
  }, [view]);
  const addButton = useRef<HTMLButtonElement>(null);
  const storiesButton = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      const loaded = loadMemories(window.localStorage);
      setLocal(loaded.memories);
      setNotice(loaded.warning);
    } catch {
      setNotice(
        "El almacenamiento está desactivado en este navegador. Podés explorar los recuerdos de demostración.",
      );
    }
  }, []);
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
  const memories = filterMemories(
    filterCommunity([...initialMemories, ...local],view === "map" ? "all" : scope,groups,view === "map" ? "" : query),
    period,
    category,
  );
  const profileMemories = profileAuthor === null ? local : initialMemories.filter(m => m.author === profileAuthor);
  const ownMemories = filterMemories(profileMemories, period, category);
  const visibleMemories = view === "profile" ? profileMemories : memories;
  const selected = visibleMemories.find((m) => m.id === selectedId) ?? null;
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
  const communityControls = (profile=false) => <CommunityControls groups={groups} scope={scope} query={query} decade={period.decade} profile={profile} onQuery={value=>{setQuery(value);setSelectedId(null);}} onScope={value=>{chooseScope(value);if(profile)setView('feed');}} onCreate={createGroup}/>;
  function changePeriod(next: Period) {
    setPeriod(next);
    if(groups.some(g=>g.id===scope && g.decade!==next.decade)) setScope("all");
    setSelectedId(null);
    setFactsOpen(false);
    setPanelOpen(false);
    if (next.decade !== period.decade) setMusicOpen(false);
  }
  function openProfile(memory: Memory) {
    setProfileAuthor(memory.source === "local" ? null : memory.author);
    setSelectedId(null); setPanelOpen(false); setFactsOpen(false); setPicking(false);
    setCategory("Todas"); setPeriod(p => ({...p, year: null}));
    setView("profile");
  }
  function openPublication(memory: Memory) {
    setPeriod({decade: Math.floor(memory.year / 10) * 10 as Decade, year: null});setCategory("Todas");
    setScope('all');setQuery('');setSelectedId(memory.id);setPanelOpen(false);setMapExpanded(false);setView('feed');
  }
  function select(memory: Memory) {
    setSelectedId(memory.id);
    setPanelOpen(view === "map");
    if (window.innerWidth < 900) {
      setFactsOpen(false);
      setMusicOpen(false);
    }
  }
  function closeStories() {
    setPanelOpen(false);
    setSelectedId(null);
    storiesButton.current?.focus();
  }
  function startAdding() {
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
    if (local.some(m => m.id === memory.id)) setEditing(memory);
  }
  function deleteMemory(memory: Memory) {
    if (!local.some(m => m.id === memory.id)) return;
    setDeleting(memory);
  }
  function confirmDelete(memory: Memory): string | null {
    if (!local.some(m => m.id === memory.id)) return "Este recuerdo ya no está disponible.";
    const next = local.filter(m => m.id !== memory.id);
    if (!saveMemories(next, window.localStorage)) return "No se pudo eliminar el recuerdo. Intentá nuevamente.";
    setLocal(next);
    if (selectedId === memory.id) setSelectedId(null);
    setNotice("Recuerdo eliminado.");
    return null;
  }
  function saveEdit(memory: Memory): string | null {
    const original = local.find(m => m.id === editing?.id);
    if (!original) return "Este recuerdo ya no está disponible.";
    const group = groups.find(g => g.id === original.groupId);
    if (group && (memory.year < group.decade || memory.year > group.decade + 9)) return `Elegí un año entre ${group.decade} y ${group.decade + 9} para este grupo.`;
    const updated = {...memory, id: original.id, groupId: original.groupId, source: original.source, author: original.author};
    const next = local.map(m => m.id === original.id ? updated : m);
    if (!saveMemories(next, window.localStorage)) return "No se pudo guardar. Revisá el espacio del navegador e intentá nuevamente.";
    setLocal(next);setEditing(null);
    setPeriod({decade: Math.floor(memory.year / 10) * 10 as Decade, year: null});setCategory("Todas");setQuery("");
    setNotice("Recuerdo actualizado.");
    return null;
  }
  function save(memory: Memory) {
    const destinationGroup=groups.find(g=>g.id===scope);
    if(destinationGroup) {
      if(memory.year < destinationGroup.decade || memory.year > destinationGroup.decade+9) return `Elegí un año entre ${destinationGroup.decade} y ${destinationGroup.decade+9} para este grupo.`;
      memory={...memory,groupId:scope};
    }
    const isFirstMemory = local.length === 0;
    const next = [...local, memory];
    try {
      if (!saveMemories(next, window.localStorage))
        return "No se pudo guardar: el almacenamiento está lleno o bloqueado. Tu formulario sigue abierto para que no pierdas lo escrito.";
    } catch {
      return "Tu navegador no permite guardar recuerdos. Habilitá el almacenamiento y volvé a intentar.";
    }
    setLocal(next);
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
    setNotice("¡Recuerdo guardado! Ya tiene su lugar en el mapa.");
    // Hardcoded unlock: the very first memory the visitor creates earns badge 01.
    // It only sets this state, so the popup never moves them off the current view.
    if (isFirstMemory) setCelebrating(achievements[0]);
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
    if (window.innerWidth < 900 || destination === "map") setMusicOpen(false);
    if (destination === "map") setSelectedId(null);
  }
  const theme = eraThemes[period.decade];
  const ActiveMap = view === "map" ? MainMap : MemoryMap;
  return (
    <div
      style={theme.tokens}
      className={`app map-app view-${view} era-${period.decade} ${panelOpen ? "stories-open" : ""} ${musicOpen ? "music-open" : ""}`}
    >
      <div className="mobile-appbar">
        <div className="mobile-page-title"><span>Nostalgiar</span><strong>{view === 'map' ? 'Explorar' : view === 'feed' ? 'Feed' : view === 'chat' ? 'Chat' : 'Mi perfil'}</strong></div>
        <button ref={mobileOptionsTrigger} className="mobile-era-button" onClick={() => mobileOptions.current?.showModal()} aria-label="Abrir épocas y opciones"><span className="mobile-era-dot" aria-hidden="true"/><strong>{period.decade === 2000 ? '2000s' : `${String(period.decade).slice(2)}s`}</strong><ChevronDown size={15}/></button>
        <button className="mobile-add-button" aria-label="Sumar mi recuerdo" onClick={startAdding} disabled={picking || !!draft}><Plus size={23}/></button>
      </div>
      <dialog ref={mobileOptions} className="mobile-options" onClick={e=>{if(e.target===e.currentTarget)mobileOptions.current?.close();}} onClose={()=>mobileOptionsTrigger.current?.focus()} aria-labelledby="mobile-options-title">
        <header><h2 id="mobile-options-title">Tu viaje en el tiempo</h2><button className="icon-button" aria-label="Cerrar opciones" onClick={()=>mobileOptions.current?.close()}><X/></button></header>
        <Timeline period={period} onChange={changePeriod}/>
        <label className="mobile-category">Categoría<select value={category} onChange={e=>{setCategory(e.target.value as Category | 'Todas');setSelectedId(null);}}>{['Todas',...categories].map(c=><option key={c}>{c}</option>)}</select></label>
        <div className="mobile-tools">{(['stories','facts','music'] as const).map(destination=><button key={destination} onClick={()=>{mobileOptions.current?.close();navigate(destination);}}><EraIcon decade={period.decade} destination={destination}/><span>{destination==='stories'?'Recuerdos':destination==='facts'?'Efemérides':'Música'}</span></button>)}</div>
        <button className="primary-button mobile-options-done" onClick={()=>mobileOptions.current?.close()}>Ver selección</button>
      </dialog>
      <a className="skip-link" href="#explore">
        Saltar al mapa
      </a>
      {view !== "profile" && view !== "chat" && (
        <main id="explore" className="map-canvas">
          <ActiveMap
            memories={memories}
            selected={selected}
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
          {view === "feed" && (
            <button
              ref={mapExpandButton}
              className="mini-map-expand"
              aria-label="Ampliar mapa"
              aria-haspopup="dialog"
              onClick={() => setMapExpanded(true)}
            >
              <span>Ampliar mapa</span>
            </button>
          )}
        </main>
      )}
      <EraChrome
        period={period}
        count={visibleMemories.length}
        panelOpen={panelOpen}
        factsOpen={factsOpen}
        musicOpen={musicOpen}
        onNavigate={navigate}
      />
      <nav className="navigation-rail" aria-label="Navegación principal">
        <span className="rail-logo" aria-hidden="true">
          N
        </span>
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
            setSelectedId(null);
            setPanelOpen(false);
            setFactsOpen(false);
            setPicking(false);
          }}
        >
          <UserRound />
          <span>Perfil</span>
        </button>
        
      </nav>
      <header className="map-toolbar">
        <div className="brand-card">
          <span className="brand-era-label" aria-hidden="true">
            {theme.brandLabel}
          </span>
          <h1>
            {theme.brand}
            <span>.</span>
          </h1>
          <span>{theme.subtitle}</span>
        </div>
        <div className="compact-selectors">
          <Timeline period={period} onChange={changePeriod} />
          <details className="filters compact-menu">
            <summary>
              {category === "Personales" ? "Recuerdos personales" : category}
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
        <button
          ref={addButton}
          className="primary-button add-button"
          onClick={startAdding}
          disabled={picking || !!draft}
        >
          <Plus size={18} />
          <span>Sumar mi recuerdo</span>
        </button>
      </header>

      <div className="map-period">
        <Compass size={17} />
        <strong>{eraContent[period.decade].label}</strong>
        <span>{period.year ?? `${period.decade} — ${period.decade + 9}`}</span>
        <i />
        <span>{memories.length} recuerdos</span>
      </div>
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
              setSelectedId(memory.id);
              setPanelOpen(false);
              setView("feed");
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
          key={profileAuthor ?? "own"}
          author={profileAuthor ?? undefined}
          onBack={() => {setSelectedId(null);setView("feed");}}
          community={profileAuthor === null ? communityControls(true) : undefined}
          memories={ownMemories}
          allMemories={profileMemories}
          tierProgress={tierProgress}
          following={following}
          period={period}
          selected={selected}
          earned={earned}
          onSelect={(m) => setSelectedId(m?.id ?? null)}
          onAdd={startAdding}
        />
      )}
      <div hidden={view !== "feed"}>
        <SocialFeed
          onEdit={editMemory}
          onDelete={deleteMemory}
          onProfile={openProfile}
          groupIds={groups.map(group => group.id)}
          community={communityControls()}
          groupName={groups.find(g=>g.id===scope)?.name}
          decade={period.decade}
          memories={memories}
          following={following}
          onFollow={(author) =>
            setFollowing((v) =>
              v.includes(author)
                ? v.filter((a) => a !== author)
                : [...v, author],
            )
          }
          selected={selected}
          onSelect={(m) => setSelectedId(m?.id ?? null)}
          onMap={(m) => {
            setView("map");
            setSelectedId(m.id);
            setPanelOpen(true);
            setFactsOpen(false);
          }}
          onAdd={startAdding}
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
      {celebrating && (
        <AchievementToast
          key={celebrating.id}
          achievement={celebrating}
          onDismiss={() => setCelebrating(null)}
        />
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
          groupName={groups.find(g=>g.id===scope)?.name}
          point={draft}
          decade={period.decade}
          onCancel={cancel}
          onSave={save}
        />
      )}
    </div>
  );
}
