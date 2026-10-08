import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, MapPin, Plus, LoaderCircle } from "lucide-react";
import type { Point } from "./MemoryMap";
import { findPlaces, type PlaceResult } from "../placeSearch";

export default function PlaceSearch({ target, onChoose, onCreate }: {
  target: Point | null;
  onChoose: (point: Point | null) => void;
  onCreate: (point: Point) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancelSearch = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    request.current?.abort();
  }, []);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  function close() {
    cancelSearch(); setBusy(false); setResults([]); setStatus(""); setOpen(false);
    trigger.current?.focus();
  }
  const search = useCallback(async (value: string) => {
    if (value.trim().length < 3) { setStatus("Escribí al menos 3 caracteres."); return; }
    cancelSearch();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setStatus("Buscando lugares…"); setResults([]);
    try {
      const places = await findPlaces(value.trim(), controller.signal);
      if (controller.signal.aborted) return;
      setResults(places);
      setStatus(places.length ? `${places.length} lugares encontrados. Elegí uno.` : "No encontramos ese lugar. Probá agregando la ciudad o provincia.");
    } catch {
      if (!controller.signal.aborted) setStatus("No pudimos buscar ahora. Revisá tu conexión y volvé a intentar.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }, [cancelSearch]);
  useEffect(() => {
    cancelSearch();
    if (open && !target && query.trim().length >= 3) {
      timer.current = setTimeout(() => { void search(query); }, 350);
    }
    return cancelSearch;
  }, [open, query, target, search, cancelSearch]);
  return <aside className="place-search" aria-label="Buscador de lugares" onKeyDown={e => {
    e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); close(); }
  }}>
    <button ref={trigger} aria-label="Buscar un lugar" className="place-search-trigger" aria-expanded={open} aria-controls="place-search-panel" onClick={() => open ? close() : setOpen(true)}>
      <Search size={19}/><span>Buscar un lugar</span>
    </button>
    {open && <section id="place-search-panel" className="place-search-panel" data-has-target={!!target}>
      <header><strong>¿Dónde pasó tu recuerdo?</strong><button aria-label="Cerrar buscador" onClick={close}><X size={18}/></button></header>
      <form onSubmit={e => { e.preventDefault(); void search(query); }} role="search">
        <label htmlFor="place-query">Dirección o nombre del lugar</label>
        <div className="place-search-field"><input ref={input} id="place-query" value={query} maxLength={200} autoComplete="off" placeholder="Ej.: Parque Centenario, Buenos Aires" onChange={e => {
          cancelSearch(); setBusy(false); setQuery(e.target.value); setResults([]); setStatus(""); if (target) onChoose(null);
        }}/><button type="submit" disabled={busy || query.trim().length < 3} aria-label="Buscar dirección">{busy ? <LoaderCircle size={19}/> : <Search size={19}/>}</button></div>
      </form>
      <p className="place-search-status" role="status">{status || "Escribí al menos 3 caracteres para ver sugerencias."}</p>
      {results.length > 0 && <ul className="place-search-results">{results.map(place => <li key={place.id}><button onClick={() => { cancelSearch(); setBusy(false); onChoose(place); setResults([]); setStatus(""); }}><MapPin size={18}/><span>{place.label}</span></button></li>)}</ul>}
      {target && <div className="place-search-chosen"><strong><MapPin size={16}/> {target.label || "Ubicación elegida"}</strong><p>Podés arrastrar el pin para ajustar la ubicación.</p><button className="place-search-again" onClick={() => { onChoose(null); requestAnimationFrame(() => input.current?.focus()); }}>Buscar otro lugar</button><div><button className="place-search-create" onClick={() => { onCreate(target); onChoose(null); close(); }}><Plus size={17}/> Crear recuerdo acá</button><button aria-label="Quitar ubicación encontrada" onClick={() => onChoose(null)}><X size={17}/></button></div></div>}
      <footer>Datos de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://photon.komoot.io" target="_blank" rel="noreferrer">Photon</a></footer>
    </section>}
  </aside>;
}
