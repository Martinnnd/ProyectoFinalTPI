import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, ChevronUp, MessageCircle, Minus, Send, Trash2, X } from "lucide-react";
import type { Decade } from "../types";
import { useAuth } from "./auth/AuthProvider";
import type { MensajeChatDto, ConversacionResumenDto } from "../chat/types";
import { eliminarConversacion, obtenerConversaciones } from "../chat/chatApi";
import { useChatConnection } from "../chat/useChatConnection";

const titulosPorDecada: Record<Decade, string> = {
  1970: "Canal 70 | En contacto",
  1980: "CHAT CLUB · 80",
  1990: "Nostalgiar Chat — Conectados",
  2000: "Nostalgiar Messenger",
};

function formatearTiempo(iso: string): string {
  const fecha = new Date(iso);
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const ayer = new Date(hoy.getTime() - 86_400_000);
  const diaDeFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  if (diaDeFecha.getTime() === hoy.getTime()) {
    return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diaDeFecha.getTime() === ayer.getTime()) return "Ayer";
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

type ConversacionActiva = { usuarioId: number; username: string };

export default function Chat({
  decade,
  fullPage,
  onOpenPage,
  hidden,
  chatearCon,
}: {
  decade: Decade;
  fullPage: boolean;
  onOpenPage: () => void;
  hidden: boolean;
  chatearCon?: { usuarioId: number; username: string; ts: number } | null;
}) {
  const { session } = useAuth();

  // --- Portal al slot de la taskbar (integración con las eras) ---
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width:900px)");
    const actualizar = () =>
      setDockSlot(media.matches ? document.getElementById("chat-taskbar-slot") : null);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, [decade]);

  // --- Estado ---
  const [open, setOpen] = useState(false);
  const [conversaciones, setConversaciones] = useState<ConversacionResumenDto[]>([]);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false);
  const [conversacionActiva, setConversacionActiva] = useState<ConversacionActiva | null>(null);
  const [mensajes, setMensajes] = useState<MensajeChatDto[]>([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [inputTexto, setInputTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useRef<HTMLButtonElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversacionActivaRef = useRef<ConversacionActiva | null>(null);
  useEffect(() => { conversacionActivaRef.current = conversacionActiva; }, [conversacionActiva]);

  // --- Callbacks estables para SignalR ---
  const handleMensajeRecibido = useCallback((mensaje: MensajeChatDto) => {
    if (conversacionActivaRef.current?.usuarioId === mensaje.emisorId) {
      setMensajes(prev => [...prev, mensaje]);
    }
    setConversaciones(prev => {
      const idx = prev.findIndex(c => c.otroUsuarioId === mensaje.emisorId);
      const actualizada: ConversacionResumenDto = {
        otroUsuarioId: mensaje.emisorId,
        otroUsuarioUsername: mensaje.emisorUsername,
        ultimoMensaje: mensaje.contenido,
        fechaUltimoMensaje: mensaje.fechaEnvio,
      };
      if (idx >= 0) { const copia = [...prev]; copia[idx] = actualizada; return copia; }
      return [actualizada, ...prev];
    });
  }, []);

  const handleMensajeEnviado = useCallback((mensaje: MensajeChatDto) => {
    if (conversacionActivaRef.current?.usuarioId === mensaje.destinatarioId) {
      setMensajes(prev => [...prev, mensaje]);
    }
    const usernameDestinatario = conversacionActivaRef.current?.username ?? "";
    setConversaciones(prev => {
      const idx = prev.findIndex(c => c.otroUsuarioId === mensaje.destinatarioId);
      const actualizada: ConversacionResumenDto = {
        otroUsuarioId: mensaje.destinatarioId,
        otroUsuarioUsername: usernameDestinatario,
        ultimoMensaje: mensaje.contenido,
        fechaUltimoMensaje: mensaje.fechaEnvio,
      };
      if (idx >= 0) { const copia = [...prev]; copia[idx] = actualizada; return copia; }
      return [actualizada, ...prev];
    });
  }, []);

  // --- Conexión SignalR ---
  const { connected, enviarMensaje, obtenerHistorial } = useChatConnection({
    activo: !!session,
    onMensajeRecibido: handleMensajeRecibido,
    onMensajeEnviado: handleMensajeEnviado,
  });

  // --- Cargar conversaciones al iniciar sesión ---
  useEffect(() => {
    if (!session) { setConversaciones([]); setError(null); return; }
    let cancelado = false;
    setCargandoConversaciones(true);
    obtenerConversaciones()
      .then(data => { if (!cancelado) setConversaciones(data); })
      .catch(err => { if (!cancelado) console.error("[Chat] Error al cargar conversaciones:", err); })
      .finally(() => { if (!cancelado) setCargandoConversaciones(false); });
    return () => { cancelado = true; };
  }, [session?.usuarioId]);

  // --- Abrir conversación desde el perfil de otro usuario ---
  useEffect(() => {
    if (!chatearCon) return;
    setConversacionActiva({ usuarioId: chatearCon.usuarioId, username: chatearCon.username });
    setOpen(true);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatearCon?.ts]);

  // --- Cargar historial al seleccionar una conversación ---
  useEffect(() => {
    setConfirmandoBorrar(false);
    if (!conversacionActiva || !connected) return;
    let cancelado = false;
    setCargandoMensajes(true);
    setMensajes([]);
    setError(null);
    obtenerHistorial(conversacionActiva.usuarioId)
      .then(historial => { if (!cancelado) setMensajes(historial); })
      .catch(err => { if (!cancelado) setError(`No se pudo cargar el historial: ${err.message}`); })
      .finally(() => { if (!cancelado) setCargandoMensajes(false); });
    return () => { cancelado = true; };
  }, [conversacionActiva?.usuarioId, connected]);

  // --- Auto-scroll al último mensaje ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // --- Cerrar con Escape ---
  function close() { setOpen(false); trigger.current?.focus(); }
  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);

  // --- Resetear conversación al cambiar de época ---
  useEffect(() => { setConversacionActiva(null); }, [decade]);

  // --- Envío de mensaje ---
  async function handleEnviar() {
    if (!conversacionActiva || !inputTexto.trim() || !connected || enviando) return;
    const texto = inputTexto.trim();
    setInputTexto("");
    setEnviando(true);
    setError(null);
    try {
      await enviarMensaje(conversacionActiva.usuarioId, texto);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "No se pudo enviar el mensaje.";
      setError(mensaje);
      setInputTexto(texto);
    } finally {
      setEnviando(false);
    }
  }

  // --- Eliminación de conversación ---
  async function handleEliminarConversacion() {
    if (!conversacionActiva) return;
    setEliminando(true);
    setError(null);
    try {
      await eliminarConversacion(conversacionActiva.usuarioId);
      setConversaciones(prev => prev.filter(c => c.otroUsuarioId !== conversacionActiva.usuarioId));
      setConversacionActiva(null);
      setMensajes([]);
      setConfirmandoBorrar(false);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "No se pudo eliminar la conversación.";
      setError(mensaje);
      setConfirmandoBorrar(false);
    } finally {
      setEliminando(false);
    }
  }

  if (hidden) return null;

  const titulo = titulosPorDecada[decade];

  // ─── Lista de conversaciones ────────────────────────────────────────────────
  const listaConversaciones = (
    <div className="chat-list">
      <div className="chat-list-label">
        TUS CONVERSACIONES <span>{conversaciones.length}</span>
      </div>
      {cargandoConversaciones && (
        <p style={{ padding: "16px", fontSize: "13px", color: "var(--muted)", margin: 0 }}>
          Cargando conversaciones…
        </p>
      )}
      {!cargandoConversaciones && conversaciones.length === 0 && (
        <p style={{ padding: "16px", fontSize: "13px", color: "var(--muted)", margin: 0 }}>
          No tenés conversaciones activas. Visitá el perfil de otro usuario para iniciar un chat.
        </p>
      )}
      {conversaciones.map(conv => (
        <button
          key={conv.otroUsuarioId}
          className={`chat-contact ${conversacionActiva?.usuarioId === conv.otroUsuarioId ? "is-selected" : ""}`}
          onClick={() => { setConversacionActiva({ usuarioId: conv.otroUsuarioId, username: conv.otroUsuarioUsername }); setError(null); }}
          aria-pressed={conversacionActiva?.usuarioId === conv.otroUsuarioId}
        >
          <span className="chat-avatar">
            {conv.otroUsuarioUsername.slice(0, 1).toUpperCase()}
            {connected && <i />}
          </span>
          <span className="chat-contact-copy">
            <strong>{conv.otroUsuarioUsername}</strong>
            <small>{conv.ultimoMensaje}</small>
          </span>
          <time>{formatearTiempo(conv.fechaUltimoMensaje)}</time>
        </button>
      ))}
    </div>
  );

  // ─── Vista de conversación ──────────────────────────────────────────────────
  const vistaConversacion = conversacionActiva ? (
    <div className="chat-conversation">
      <header>
        <button
          className="icon-button"
          aria-label="Volver a conversaciones"
          onClick={() => { setConversacionActiva(null); setError(null); }}
        >
          <ArrowLeft size={18} />
        </button>
        <span className="chat-avatar">
          {conversacionActiva.username.slice(0, 1).toUpperCase()}
          {connected && <i />}
        </span>
        <div>
          <strong>{conversacionActiva.username}</strong>
          <small>{connected ? "Conectados" : "Conectando…"}</small>
        </div>
        {confirmandoBorrar ? (
          <>
            <button
              className="icon-button"
              aria-label="Confirmar eliminación de conversación"
              onClick={handleEliminarConversacion}
              disabled={eliminando}
              style={{ marginLeft: "auto", color: "var(--error, #c0392b)" }}
            >
              <Check size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Cancelar eliminación"
              onClick={() => setConfirmandoBorrar(false)}
              disabled={eliminando}
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <button
            className="icon-button"
            aria-label="Eliminar conversación"
            onClick={() => setConfirmandoBorrar(true)}
            style={{ marginLeft: "auto" }}
            title="Eliminar conversación"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      <div className="chat-messages">
        {cargandoMensajes && (
          <span className="chat-date">Cargando historial…</span>
        )}
        {!cargandoMensajes && mensajes.length === 0 && (
          <span className="chat-date">Empezá la conversación diciendo ¡Hola!</span>
        )}
        {mensajes.map(msg => (
          <p key={msg.id} className={`chat-bubble ${msg.emisorId === session?.usuarioId ? "own" : ""}`}>
            {msg.contenido}
            <br />
            <small className="chat-message-time">
              {new Date(msg.fechaEnvio).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </small>
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="chat-demo-note" style={{ color: "var(--error, #c0392b)" }}>
          {error}
        </div>
      )}

      <div className="chat-composer">
        <input
          type="text"
          value={inputTexto}
          onChange={e => setInputTexto(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
          placeholder="Escribí un mensaje…"
          disabled={!connected || enviando}
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--ink)", fontSize: "13px" }}
          aria-label="Escribir mensaje"
        />
        <button
          className="icon-button"
          onClick={handleEnviar}
          disabled={!connected || !inputTexto.trim() || enviando}
          aria-label="Enviar mensaje"
          style={{ color: "var(--accent)" }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  ) : fullPage ? (
    <div className="chat-conversation" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: "14px", textAlign: "center", padding: "24px" }}>
        Seleccioná una conversación para comenzar a chatear.
      </p>
    </div>
  ) : null;

  // ─── Panel ─────────────────────────────────────────────────────────────────
  const panel = (
    <>
      <header className="chat-titlebar">
        {connected && <span className="chat-online-dot" role="img" aria-label="Conectado" />}
        <MessageCircle size={18} />
        <strong>{titulo}</strong>
        {!fullPage && (
          <>
            <button className="icon-button" onClick={onOpenPage} aria-label="Abrir apartado de chat"><ArrowUpRight size={18} /></button>
            <button className="icon-button" onClick={close} aria-label="Minimizar mensajes"><Minus size={18} /></button>
          </>
        )}
      </header>
      <div className={`chat-content ${conversacionActiva !== null ? "has-conversation" : ""}`}>
        {(fullPage || conversacionActiva === null) && listaConversaciones}
        {(fullPage || conversacionActiva !== null) && vistaConversacion}
      </div>
    </>
  );

  if (fullPage) {
    return (
      <main className="chat-page" aria-label="Chat">
        <div className="chat-page-intro">
          <span>VOLVÉ A CONECTAR</span>
          <h1>Las historias siguen en una charla.</h1>
          <p>Un lugar para reencontrarte y compartir lo que recordás.</p>
        </div>
        <section className="chat-window">{panel}</section>
      </main>
    );
  }

  const popup = open && (
    <section id="chat-popup" className={`chat-window chat-popup${dockSlot ? " taskbar-chat-popup" : ""}`} aria-label="Mensajes">
      {panel}
    </section>
  );

  const dock = (
    <div className="chat-dock">
      {!dockSlot && popup}
      <button ref={trigger} className="chat-launcher" aria-expanded={open} aria-controls="chat-popup" onClick={() => setOpen(v => !v)}>
        {connected && <span className="chat-online-dot" role="img" aria-label="Conectado" />}
        <MessageCircle size={21} />
        <strong>Mensajes</strong>
        {conversaciones.length > 0 && <span className="chat-count">{conversaciones.length}</span>}
        {conversaciones.length > 0 && (
          <span className="chat-faces" aria-hidden="true">
            {conversaciones.slice(0, 3).map(c => <i key={c.otroUsuarioId}>{c.otroUsuarioUsername.slice(0, 1).toUpperCase()}</i>)}
          </span>
        )}
        {open ? <X size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );

  return dockSlot
    ? <>{createPortal(dock, dockSlot)}{createPortal(popup, dockSlot.closest(".app") ?? dockSlot)}</>
    : dock;
}
