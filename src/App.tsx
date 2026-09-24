"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, Plus, X, Newspaper, UserRound } from "lucide-react";
import {
  categories,
  filterMemories,
  symbols,
  type Category,
  type Decade,
  type Memory,
  type Period,
} from "./types";
import { eraContent, initialMemories } from "./data";
import { loadMemories, saveMemories } from "./storage";
import MapModal from "./components/MapModal";
import MainMap from "./components/MainMap";
//import Profile from "./components/Profile";
import SocialFeed from "./components/SocialFeed";
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
  const mapExpandButton = useRef<HTMLButtonElement>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);
  const creationOrigin = useRef(false);
  const [view, setView] = useState<"map" | "feed" | "profile">("map");
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
  const [draft, setDraft] = useState<Point | null>(null);
  const [notice, setNotice] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(true);
  const [musicOpen, setMusicOpen] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const storiesButton = useRef<HTMLButtonElement>(null);
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
    [...initialMemories, ...local],
    period,
    category,
  );
  const ownMemories = filterMemories(local, period, category);
  const visibleMemories = view === "profile" ? ownMemories : memories;
  const selected = visibleMemories.find((m) => m.id === selectedId) ?? null;
  function changePeriod(next: Period) {
    setPeriod(next);
    setSelectedId(null);
    setFactsOpen(view === "map");
    setPanelOpen(false);
    if (next.decade !== period.decade) setMusicOpen(false);
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
  function save(memory: Memory) {
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
    window.setTimeout(() => addButton.current?.focus(), 0);
    return null;
  }
  function toggleStories() {
    setView("map");
    setPanelOpen(!panelOpen);
    if (window.innerWidth < 900) {
      setFactsOpen(false);
      setMusicOpen(false);
    }
  }
  function navigate(destination: "map" | "stories" | "facts" | "music") {
    setView("map");
    setPicking(false);
    setPanelOpen(destination === "stories");
    setFactsOpen(destination === "facts");
    setMusicOpen(destination === "music");
    if (destination === "map") setSelectedId(null);
  }
  const theme = eraThemes[period.decade];
  const ActiveMap = view === "map" ? MainMap : MemoryMap;
  return (
    <div
      style={theme.tokens}
      className={`app map-app view-${view} era-${period.decade} ${panelOpen ? "stories-open" : ""} ${musicOpen ? "music-open" : ""}`}
    >
      <a className="skip-link" href="#explore">
        Saltar al mapa
      </a>
      {view !== "profile" && (
        <main id="explore" className="map-canvas">
          <ActiveMap
            memories={memories}
            selected={selected}
            onSelect={select}
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
        musicOpen={musicOpen}
        onNavigate={navigate}
      />
      <nav className="navigation-rail" aria-label="Navegación principal">
        <span className="rail-logo" aria-hidden="true">
          n<span>✳</span>
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
        <button
          aria-current={view === "profile" ? "page" : undefined}
          className={view === "profile" ? "rail-active" : ""}
          onClick={() => {
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
        <button
          ref={storiesButton}
          aria-expanded={panelOpen}
          aria-controls="stories"
          className={panelOpen ? "rail-active" : ""}
          onClick={toggleStories}
        >
          <EraIcon decade={period.decade} destination="stories" />
          <span>Historias</span>
        </button>
        <button
          aria-expanded={factsOpen}
          aria-controls="era-facts"
          onClick={() => {
            setView("map");
            setFactsOpen(view !== "map" || !factsOpen);
            if (window.innerWidth < 900) {
              setPanelOpen(false);
              setMusicOpen(false);
            }
          }}
        >
          <EraIcon decade={period.decade} destination="facts" />
          <span>La época</span>
        </button>
        <button
          aria-expanded={musicOpen}
          aria-controls="music-player"
          onClick={() => {
            setMusicOpen(!musicOpen);
            if (window.innerWidth < 900) {
              setPanelOpen(false);
              setFactsOpen(false);
            }
          }}
        >
          <EraIcon decade={period.decade} destination="music" />
          <span>Música</span>
        </button>
        <span className="rail-footer">
          UNLaM
          <br />
          <strong>DEMO</strong>
        </span>
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
          <span>Agregar un recuerdo</span>
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
        <div className="stories-drawer">
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
            period={period}
            selected={selected}
            onBack={() => setSelectedId(null)}
            memories={memories}
            onSelect={select}
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
      {/*view === "profile" && (
        <Profile
          memories={ownMemories}
          allMemories={local}
          following={following}
          period={period}
          selected={selected}
          onSelect={(m) => setSelectedId(m?.id ?? null)}
          onAdd={startAdding}
        />
      )*/}
      <div hidden={view !== "feed"}>
        <SocialFeed
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
      {mapExpanded && view === "feed" && (
        <MapModal
          memories={memories}
          selected={selected}
          onSelect={(m) => setSelectedId(m.id)}
          onClose={() => {
            setMapExpanded(false);
            requestAnimationFrame(() => mapExpandButton.current?.focus());
          }}
        />
      )}
      {draft && (
        <MemoryForm
          point={draft}
          decade={period.decade}
          onCancel={cancel}
          onSave={save}
        />
      )}
    </div>
  );
}
