"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useEra } from "../../context/EraContext";

const STORAGE_KEY = "nostalgiar_guest_first_memory_v1";

type GuestAccess = {
  firstMemoryId: string | null;
  ready: boolean;
  canViewMemory: (id: string) => boolean;
  requireAccount: () => boolean;
};

const GuestAccessContext = createContext<GuestAccess | null>(null);

export function GuestAccessProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  const { period } = useEra();
  const dialog = useRef<HTMLDialogElement>(null);
  const firstId = useRef<string | null>(null);
  const [firstMemoryId, setFirstMemoryId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState(false);

  useEffect(() => {
    try {
      firstId.current = window.localStorage.getItem(STORAGE_KEY);
      setFirstMemoryId(firstId.current);
    } catch {
      // El límite sigue activo durante esta visita si el almacenamiento está bloqueado.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (prompt && !node.open) node.showModal();
    if (!prompt && node.open) node.close();
  }, [prompt]);

  useEffect(() => {
    if (status === "authenticated") setPrompt(false);
  }, [status]);

  const requireAccount = useCallback(() => {
    if (status === "authenticated") return true;
    if (status === "loading" || !ready) return false;
    setPrompt(true);
    return false;
  }, [status, ready]);

  const canViewMemory = useCallback(
    (id: string) => {
      if (status === "authenticated") return true;
      if (status === "loading" || !ready) return false;
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && stored !== firstId.current) {
          firstId.current = stored;
          setFirstMemoryId(stored);
        }
      } catch {
        /* Mantener el recuerdo registrado en esta visita. */
      }
      if (firstId.current && firstId.current !== id) {
        setPrompt(true);
        return false;
      }
      if (!firstId.current) {
        firstId.current = id;
        setFirstMemoryId(id);
        try {
          window.localStorage.setItem(STORAGE_KEY, id);
        } catch {
          /* Sesión actual solamente. */
        }
      }
      return true;
    },
    [status, ready],
  );

  function goToAuth(mode: "login" | "registro") {
    setPrompt(false);
    const returnTo = encodeURIComponent(`/explorar?era=${period.decade}`);
    router.push(`/auth/${mode}?returnTo=${returnTo}`);
  }

  return (
    <GuestAccessContext.Provider value={{ firstMemoryId, ready, canViewMemory, requireAccount }}>
      {children}
      <dialog
        ref={dialog}
        className="guest-access-dialog"
        data-era={period.decade}
        aria-labelledby="guest-access-title"
        aria-describedby="guest-access-description"
        onClose={() => setPrompt(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPrompt(false);
        }}
      >
        <div className="guest-access-card">
          <div className="guest-access-top">
            <span>NOSTALGIAR · {period.decade}s</span>
            <button type="button" aria-label="Cerrar aviso" onClick={() => setPrompt(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="guest-access-device" aria-hidden="true">
            <LockKeyhole size={30} />
            <span>EL VIAJE CONTINÚA</span>
          </div>
          <div className="guest-access-copy">
            <span className="guest-access-eyebrow">Ya descubriste un recuerdo</span>
            <h2 id="guest-access-title">Hay muchas historias más para vos.</h2>
            <p id="guest-access-description">
              Creá una cuenta o iniciá sesión para seguir viendo recuerdos, recorrer el feed y
              descubrir todas las épocas.
            </p>
          </div>
          <div className="guest-access-actions">
            <button
              type="button"
              className="guest-access-primary"
              onClick={() => goToAuth("registro")}
            >
              Crear cuenta <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="guest-access-secondary"
              onClick={() => goToAuth("login")}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </dialog>
    </GuestAccessContext.Provider>
  );
}

export function useGuestAccess(): GuestAccess {
  const context = useContext(GuestAccessContext);
  if (!context) throw new Error("useGuestAccess requiere GuestAccessProvider.");
  return context;
}
