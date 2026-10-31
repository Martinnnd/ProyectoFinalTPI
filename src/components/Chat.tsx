import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronUp,
  MessageCircle,
  Minus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { Decade } from "../types";
import { useAuth } from "./auth/AuthProvider";
import type { ChatMessageDto, ConversationSummaryDto } from "../chat/types";
import { deleteConversation, getConversations } from "../chat/chatApi";
import { useChatConnection } from "../chat/useChatConnection";

const conversationTitlesByDecade: Record<Decade, string> = {
  1970: "Canal 70 | En contacto",
  1980: "CHAT CLUB · 80",
  1990: "Nostalgiar Chat — Conectados",
  2000: "Nostalgiar Messenger",
  2010: "Nostalgiar · Mensajes",
  2020: "Nostalgiar · Conversaciones",
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (dateDay.getTime() === today.getTime()) {
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  if (dateDay.getTime() === yesterday.getTime()) return "Ayer";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

type ActiveConversation = { userId: number; username: string };

export default function Chat({
  decade,
  fullPage,
  onOpenPage,
  hidden,
  chatWith,
}: {
  decade: Decade;
  fullPage: boolean;
  onOpenPage: () => void;
  hidden: boolean;
  chatWith?: { userId: number; username: string; ts: number } | null;
}) {
  const { session } = useAuth();

  // --- Portal to the taskbar slot (era integration) ---
  const [dockSlot, setDockSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width:900px)");
    const updateDockSlot = () =>
      setDockSlot(media.matches ? document.getElementById("chat-taskbar-slot") : null);
    updateDockSlot();
    media.addEventListener("change", updateDockSlot);
    return () => media.removeEventListener("change", updateDockSlot);
  }, [decade]);

  // --- Estado ---
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummaryDto[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useRef<HTMLButtonElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeConversationRef = useRef<ActiveConversation | null>(null);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const handleMessageReceived = useCallback((message: ChatMessageDto) => {
    if (activeConversationRef.current?.userId === message.senderId) {
      setMessages((previous) => [...previous, message]);
    }
    setConversations((previous) => {
      const index = previous.findIndex(
        (conversation) => conversation.otherUserId === message.senderId,
      );
      const updatedConversation: ConversationSummaryDto = {
        otherUserId: message.senderId,
        otherUsername: message.senderUsername,
        lastMessage: message.content,
        lastMessageAt: message.sentAt,
      };
      if (index >= 0) {
        const nextConversations = [...previous];
        nextConversations[index] = updatedConversation;
        return nextConversations;
      }
      return [updatedConversation, ...previous];
    });
  }, []);

  const handleMessageSent = useCallback((message: ChatMessageDto) => {
    if (activeConversationRef.current?.userId === message.recipientId) {
      setMessages((previous) => [...previous, message]);
    }
    const recipientUsername = activeConversationRef.current?.username ?? "";
    setConversations((previous) => {
      const index = previous.findIndex(
        (conversation) => conversation.otherUserId === message.recipientId,
      );
      const updatedConversation: ConversationSummaryDto = {
        otherUserId: message.recipientId,
        otherUsername: recipientUsername,
        lastMessage: message.content,
        lastMessageAt: message.sentAt,
      };
      if (index >= 0) {
        const nextConversations = [...previous];
        nextConversations[index] = updatedConversation;
        return nextConversations;
      }
      return [updatedConversation, ...previous];
    });
  }, []);

  const { connected, sendMessage, getHistory } = useChatConnection({
    enabled: !!session,
    onMessageReceived: handleMessageReceived,
    onMessageSent: handleMessageSent,
  });

  // --- Load conversations after sign-in ---
  useEffect(() => {
    if (!session) {
      setConversations([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoadingConversations(true);
    getConversations()
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .catch((error) => {
        if (!cancelled) console.error("[Chat] Error loading conversations:", error);
      })
      .finally(() => {
        if (!cancelled) setLoadingConversations(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.usuarioId]);

  // --- Open a conversation from another user's profile ---
  useEffect(() => {
    if (!chatWith) return;
    setActiveConversation({ userId: chatWith.userId, username: chatWith.username });
    setOpen(true);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatWith?.ts]);

  // --- Load history when selecting a conversation ---
  useEffect(() => {
    setConfirmingDelete(false);
    if (!activeConversation || !connected) return;
    let cancelled = false;
    setLoadingMessages(true);
    setMessages([]);
    setError(null);
    getHistory(activeConversation.userId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((error) => {
        if (!cancelled) setError(`No se pudo cargar el historial: ${error.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConversation?.userId, connected]);

  // --- Auto-scroll to the latest message ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => {
    setActiveConversation(null);
  }, [decade]);

  async function handleSend() {
    if (!activeConversation || !messageText.trim() || !connected || sending) return;
    const content = messageText.trim();
    setMessageText("");
    setSending(true);
    setError(null);
    try {
      await sendMessage(activeConversation.userId, content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo enviar el mensaje.";
      setError(errorMessage);
      setMessageText(content);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteConversation() {
    if (!activeConversation) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteConversation(activeConversation.userId);
      setConversations((previous) =>
        previous.filter((conversation) => conversation.otherUserId !== activeConversation.userId),
      );
      setActiveConversation(null);
      setMessages([]);
      setConfirmingDelete(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "No se pudo eliminar la conversación.";
      setError(errorMessage);
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  if (hidden) return null;

  const title = conversationTitlesByDecade[decade];

  const conversationList = (
    <div className="chat-list">
      <div className="chat-list-label">
        TUS CONVERSACIONES <span>{conversations.length}</span>
      </div>
      {loadingConversations && (
        <p style={{ padding: "16px", fontSize: "13px", color: "var(--muted)", margin: 0 }}>
          Cargando conversaciones…
        </p>
      )}
      {!loadingConversations && conversations.length === 0 && (
        <p style={{ padding: "16px", fontSize: "13px", color: "var(--muted)", margin: 0 }}>
          No tenés conversaciones activas. Visitá el perfil de otro usuario para iniciar un chat.
        </p>
      )}
      {conversations.map((conversation) => (
        <button
          key={conversation.otherUserId}
          className={`chat-contact ${activeConversation?.userId === conversation.otherUserId ? "is-selected" : ""}`}
          onClick={() => {
            setActiveConversation({
              userId: conversation.otherUserId,
              username: conversation.otherUsername,
            });
            setError(null);
          }}
          aria-pressed={activeConversation?.userId === conversation.otherUserId}
        >
          <span className="chat-avatar">
            {conversation.otherUsername.slice(0, 1).toUpperCase()}
            {connected && <i />}
          </span>
          <span className="chat-contact-copy">
            <strong>{conversation.otherUsername}</strong>
            <small>{conversation.lastMessage}</small>
          </span>
          <time>{formatTime(conversation.lastMessageAt)}</time>
        </button>
      ))}
    </div>
  );

  const conversationView = activeConversation ? (
    <div className="chat-conversation">
      <header>
        <button
          className="icon-button"
          aria-label="Volver a conversaciones"
          onClick={() => {
            setActiveConversation(null);
            setError(null);
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <span className="chat-avatar">
          {activeConversation.username.slice(0, 1).toUpperCase()}
          {connected && <i />}
        </span>
        <div>
          <strong>{activeConversation.username}</strong>
          <small>{connected ? "Conectados" : "Conectando…"}</small>
        </div>
        {confirmingDelete ? (
          <>
            <button
              className="icon-button"
              aria-label="Confirmar eliminación de conversación"
              onClick={handleDeleteConversation}
              disabled={deleting}
              style={{ marginLeft: "auto", color: "var(--error, #c0392b)" }}
            >
              <Check size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Cancelar eliminación"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              <X size={18} />
            </button>
          </>
        ) : (
          <button
            className="icon-button"
            aria-label="Eliminar conversación"
            onClick={() => setConfirmingDelete(true)}
            style={{ marginLeft: "auto" }}
            title="Eliminar conversación"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      <div className="chat-messages">
        {loadingMessages && <span className="chat-date">Cargando historial…</span>}
        {!loadingMessages && messages.length === 0 && (
          <span className="chat-date">Empezá la conversación diciendo ¡Hola!</span>
        )}
        {messages.map((message) => (
          <p
            key={message.id}
            className={`chat-bubble ${message.senderId === session?.usuarioId ? "own" : ""}`}
          >
            {message.content}
            <br />
            <small className="chat-message-time">
              {new Date(message.sentAt).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribí un mensaje…"
          disabled={!connected || sending}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            color: "var(--ink)",
            fontSize: "13px",
          }}
          aria-label="Escribir mensaje"
        />
        <button
          className="icon-button"
          onClick={handleSend}
          disabled={!connected || !messageText.trim() || sending}
          aria-label="Enviar mensaje"
          style={{ color: "var(--accent)" }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  ) : fullPage ? (
    <div className="chat-conversation chat-conversation-empty">
      <p style={{ color: "var(--muted)", fontSize: "14px", textAlign: "center", padding: "24px" }}>
        Seleccioná una conversación para comenzar a chatear.
      </p>
    </div>
  ) : null;

  const panel = (
    <>
      <header className="chat-titlebar">
        {connected && <span className="chat-online-dot" role="img" aria-label="Conectado" />}
        <MessageCircle size={18} />
        <strong>{title}</strong>
        {!fullPage && (
          <>
            <button
              className="icon-button"
              onClick={onOpenPage}
              aria-label="Abrir apartado de chat"
            >
              <ArrowUpRight size={18} />
            </button>
            <button className="icon-button" onClick={close} aria-label="Minimizar mensajes">
              <Minus size={18} />
            </button>
          </>
        )}
      </header>
      <div className={`chat-content ${activeConversation !== null ? "has-conversation" : ""}`}>
        {(fullPage || activeConversation === null) && conversationList}
        {(fullPage || activeConversation !== null) && conversationView}
      </div>
    </>
  );

  if (fullPage) {
    return (
      <main className="chat-page" aria-label="Chat">
        <section className="chat-window">{panel}</section>
      </main>
    );
  }

  const popup = open && (
    <section
      id="chat-popup"
      className={`chat-window chat-popup${dockSlot ? " taskbar-chat-popup" : ""}`}
      aria-label="Mensajes"
    >
      {panel}
    </section>
  );

  const dock = (
    <div className="chat-dock">
      {!dockSlot && popup}
      <button
        ref={trigger}
        className="chat-launcher"
        aria-expanded={open}
        aria-controls="chat-popup"
        onClick={() => setOpen((value) => !value)}
      >
        {connected && <span className="chat-online-dot" role="img" aria-label="Conectado" />}
        <MessageCircle size={21} />
        <strong>Mensajes</strong>
        {conversations.length > 0 && <span className="chat-count">{conversations.length}</span>}
        {conversations.length > 0 && (
          <span className="chat-faces" aria-hidden="true">
            {conversations.slice(0, 3).map((conversation) => (
              <i key={conversation.otherUserId}>
                {conversation.otherUsername.slice(0, 1).toUpperCase()}
              </i>
            ))}
          </span>
        )}
        {open ? <X size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  );

  return dockSlot ? (
    <>
      {createPortal(dock, dockSlot)}
      {createPortal(popup, dockSlot.closest(".app") ?? dockSlot)}
    </>
  ) : (
    dock
  );
}
