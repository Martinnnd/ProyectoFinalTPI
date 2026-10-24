"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import MainMap from "../MainMap";
import SidePanel from "../SidePanel";
import EraFacts from "../EraFacts";
import MemoryForm from "../MemoryForm";
import { useEra } from "../../context/EraContext";
import { useAuth } from "../auth/AuthProvider";
import {
  categories,
  filterMemories,
  symbols,
  type Category,
  type Decade,
  type Memory,
} from "../../types";
import {
  getMapPublications,
  getPublication,
  publicationId,
  type MapBounds,
} from "../../publicationsApi";
import type { Point } from "../MemoryMap";
import { availableDecades } from "../../eras/registry";
import { useRatings } from "../../context/RatingsContext";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recuerdoParam = searchParams.get("recuerdo");
  const actionParam = searchParams.get("action");
  const groupIdParam = searchParams.get("groupId");
  const tagParam = searchParams.get("tag");

  const {
    period,
    setPeriod,
    changePeriod,
    theme,
    factsOpen,
    setFactsOpen,
    panelOpen,
    setPanelOpen,
  } = useEra();

  const { session, status } = useAuth();
  const { setNotice } = useRatings();

  const [category, setCategory] = useState<Category | "Todas">("Todas");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const reportBounds = useCallback(
    (next: MapBounds) =>
      setBounds((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next)),
    []
  );

  const [remotePins, setRemotePins] = useState<Memory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(recuerdoParam);
  const [remoteSelected, setRemoteSelected] = useState<Memory | null>(null);
  const selectedSeed = useRef<Memory | null>(null);

  const [picking, setPicking] = useState(actionParam === "recordar");
  const [draft, setDraft] = useState<Point | null>(null);
  const [mapRevision, setMapRevision] = useState(0);

  // Redirección retrocompatible si alguien accede con ?view=feed, ?view=chat o ?view=profile
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "feed") router.replace("/feed");
    else if (viewParam === "chat") router.replace("/chat");
    else if (viewParam === "profile") router.replace("/perfil");
  }, [searchParams, router]);

  // Cargar publicaciones del mapa según el área visible
  useEffect(() => {
    if (!bounds) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getMapPublications(bounds, period, category, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setRemotePins(result.memories);
          }
        })
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [bounds, period, category, mapRevision]);

  // Si viene ?recuerdo=123 en la URL o se selecciona un pin
  useEffect(() => {
    if (!selectedId) {
      setRemoteSelected(null);
      return;
    }
    if (status === "loading") return;
    const pin = [selectedSeed.current, remoteSelected, ...remotePins].find((m) => m?.id === selectedId);
    const controller = new AbortController();

    getPublication(pin ?? selectedId, true, controller.signal)
      .then((memory) => {
        if (!controller.signal.aborted) {
          setRemoteSelected(memory);
          const memoryDecade = (Math.floor(memory.year / 10) * 10) as Decade;
          if (availableDecades.includes(memoryDecade) && memoryDecade !== period.decade) {
            changePeriod({ decade: memoryDecade, year: null });
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setRemoteSelected(null);
      });

    return () => controller.abort();
  }, [selectedId, mapRevision, status]);

  const memories = filterMemories(remotePins, period, category);
  const selected =
    remoteSelected?.id === selectedId
      ? remoteSelected
      : selectedSeed.current?.id === selectedId
      ? selectedSeed.current
      : memories.find((m) => m.id === selectedId) ?? null;

  function select(memory: Memory) {
    selectedSeed.current = memory;
    setRemoteSelected(memory);
    setSelectedId(memory.id);
    setPanelOpen(false);
    if (typeof window !== "undefined" && window.innerWidth < 900) {
      setFactsOpen(false);
    }
  }

  function selectMapPin(memory: Memory) {
    if (selectedId === memory.id) {
      closeMapPreview();
      return;
    }
    select(memory);
  }

  function selectRelatedMemory(memory: Memory) {
    const decade = (Math.floor(memory.year / 10) * 10) as Decade;
    if (!availableDecades.includes(decade)) {
      setNotice("Este recuerdo pertenece a una década que todavía no está disponible en el mapa.");
      return;
    }
    changePeriod({ decade, year: null }, () => {
      setCategory("Todas");
      select(memory);
    });
  }

  function closeMapPreview() {
    selectedSeed.current = null;
    setRemoteSelected(null);
    setSelectedId(null);
  }

  function openPublication(memory: Memory) {
    router.push(`/recuerdo/${memory.id}`);
  }

  function startAdding() {
    setPicking(true);
    setSelectedId(null);
    setPanelOpen(false);
    setFactsOpen(false);
  }

  function cancelCreation() {
    setPicking(false);
    setDraft(null);
  }

  async function saveCreation(memory: Memory) {
    try {
      let res;
      if (groupIdParam) {
        const { createGroupMemory } = await import("../../groupsApi");
        res = await createGroupMemory(groupIdParam, memory);
      } else {
        const { crearPublicacion } = await import("../../api");
        res = await crearPublicacion(memory);
      }
      if (res && res.id) {
        memory = { ...memory, id: res.id.toString(), source: "backend", groupId: groupIdParam ?? undefined };
      }
      setRemotePins((curr) => [memory, ...curr.filter((m) => m.id !== memory.id)]);
      setMapRevision((r) => r + 1);
      setDraft(null);
      setPicking(false);
      selectMapPin(memory);
      setNotice("¡Recuerdo guardado! Ya tiene su lugar en el mapa.");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo guardar el recuerdo.";
    }
  }

  return (
    <>
      <a className="skip-link" href="#explore">
        Saltar al mapa
      </a>

      <header className="map-toolbar">
        <div className="compact-selectors">
          <div id="place-search-slot" />
          <details className="filters compact-menu">
            <summary>
              {category === "Personales" ? "Recuerdos personales" : category}
              <span aria-hidden="true">...</span>
              <span className="sr-only">Elegir categoría</span>
            </summary>
            <div className="category-options" role="group" aria-label="Filtrar por categoría">
              {(["Todas", ...categories] as const).map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? "active" : ""}
                  onClick={(event) => {
                    setCategory(c);
                    setSelectedId(null);
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  <span aria-hidden="true">{c === "Todas" ? "✳" : symbols[c]}</span>
                  {c === "Personales" ? "Recuerdos personales" : c}
                </button>
              ))}
            </div>
          </details>
        </div>
      </header>

      <main id="explore" className="map-canvas">
        <MainMap
          active={true}
          showEmptyState={false}
          onBoundsChange={reportBounds}
          memories={memories}
          selected={selected}
          onSelect={selectMapPin}
          onClosePreview={closeMapPreview}
          onSelectRelated={selectRelatedMemory}
          onOpen={openPublication}
          picking={picking}
          onPick={(point) => {
            setDraft(point);
            setPicking(false);
          }}
          draft={draft}
          onCancel={cancelCreation}
        />
      </main>

      {panelOpen && (
        <div className="stories-drawer stories-index">
          <div className="drawer-heading">
            <span className="eyebrow">{theme.storiesTitle}</span>
            <button className="icon-button" aria-label="Cerrar historias" onClick={() => setPanelOpen(false)}>
              <X size={19} />
            </button>
          </div>
          <SidePanel selected={selected} memories={memories} onSelect={openPublication} />
        </div>
      )}

      {factsOpen && !picking && !draft && (
        <EraFacts key={`${period.decade}-${period.year}`} period={period} onClose={() => setFactsOpen(false)} />
      )}

      {draft && (
        <MemoryForm
          point={draft}
          defaultHashtags={tagParam ? [tagParam] : undefined}
          decade={period.decade}
          onCancel={cancelCreation}
          onSave={saveCreation}
        />
      )}
    </>
  );
}

export default function ExploreView() {
  return (
    <Suspense fallback={<p role="status">Cargando mapa…</p>}>
      <ExploreContent />
    </Suspense>
  );
}
