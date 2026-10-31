import { useEffect, useState } from "react";
import {
  getMemoryAnalysis,
  getPublicationMoments,
  hasOtherMomentPublications,
  type AnalisisRecuerdo,
  type MomentosPublicacion,
} from "../momentosApi";
import { useAuth } from "./auth/AuthProvider";
import styles from "./moments.module.css";

export function usePublicationMoments(id: string) {
  const { session } = useAuth();
  const [associations, setAssociations] = useState<MomentosPublicacion | null>(null);
  const [analysis, setAnalysis] = useState<AnalisisRecuerdo | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let latest: AnalisisRecuerdo | null = null;
    let networkFailures = 0;
    let waiting = true;
    let associationsRevision = 0;
    setAssociations(null);
    setAnalysis(null);
    setError("");
    async function associationsRequest() {
      const requestRevision = ++associationsRevision;
      const result = await getPublicationMoments(id, controller.signal);
      const shared: MomentosPublicacion["momentos"] = [];
      for (const association of result.momentos) {
        if (controller.signal.aborted || requestRevision !== associationsRevision) return;
        if (
          await hasOtherMomentPublications(
            association.momento.id,
            result.publicacionId,
            controller.signal,
          )
        )
          shared.push(association);
      }
      if (!controller.signal.aborted && requestRevision === associationsRevision)
        setAssociations({ ...result, momentos: shared });
    }
    function schedule() {
      if (controller.signal.aborted || document.hidden || !waiting || networkFailures >= 2) return;
      clearTimeout(timer);
      timer = setTimeout(() => void check(), 5000);
    }
    async function check() {
      if (running || controller.signal.aborted || document.hidden) return;
      running = true;
      try {
        const result = await getMemoryAnalysis(id, controller.signal);
        if (controller.signal.aborted) return;
        const previous = latest;
        latest = result;
        setAnalysis(result);
        networkFailures = 0;
        waiting = result.estado === "pendiente" || result.estado === "procesando";
        if (
          (previous && (previous.versionContenido !== result.versionContenido || !waiting)) ||
          (!previous && result.estado === "completado")
        ) {
          await associationsRequest().catch(() => {
            if (!controller.signal.aborted) setError("No pudimos actualizar los momentos.");
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          networkFailures++;
          if (networkFailures >= 2) setError("No pudimos actualizar los momentos.");
        }
      } finally {
        running = false;
        schedule();
      }
    }
    void associationsRequest().catch(() => {
      if (!controller.signal.aborted) setError("No pudimos cargar los momentos.");
    });
    void check();
    function visibility() {
      clearTimeout(timer);
      if (!document.hidden && (waiting || networkFailures > 0)) {
        networkFailures = 0;
        void check();
      }
    }
    document.addEventListener("visibilitychange", visibility);
    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [id, session?.usuarioId, revision]);
  const pending = analysis?.estado === "pendiente" || analysis?.estado === "procesando";
  const unavailable = analysis?.estado === "fallido" || analysis?.estado === "sinAnalizador";
  return {
    associations,
    analysis,
    error,
    pending,
    unavailable,
    retry: () => setRevision((value) => value + 1),
  };
}

export default function PublicationMoments({
  id,
  onOpen,
}: {
  id: string;
  onOpen: (id: number) => void;
}) {
  const { associations } = usePublicationMoments(id);
  if (!associations?.momentos.length) return null;
  return (
    <div className={styles.associations}>
      {associations?.momentos.map(({ momento }) => (
        <button className={styles.link} key={momento.id} onClick={() => onOpen(momento.id)}>
          Parte de {momento.nombre} <span aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  );
}
