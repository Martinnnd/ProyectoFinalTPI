"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, MessageCircle, Minus, User, Star, Trophy, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth/AuthProvider";
import { useFollow } from "../context/FollowContext";
import type { NotificationDto, NotificationType } from "../notifications/types";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../notifications/notificationApi";
import { useNotificationConnection } from "../notifications/useNotificationConnection";
import { getNotificationText, getNotificationNavigation } from "../notifications/notificationUtils";

function NotificationIcon({ type }: { type: NotificationType }) {
  const props = { size: 18 };
  switch (type) {
    case "newFollower":
      return <User {...props} />;
    case "publicationComment":
      return <MessageCircle {...props} />;
    case "publicationRating":
      return <Star {...props} />;
    case "categoryPromotion":
      return <Trophy {...props} />;
    case "emailMessages":
      return <Mail {...props} />;
    case "chatMessage":
      return <MessageCircle {...props} />;
    default:
      return <Bell {...props} />;
  }
}

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

export default function Notification({
  hidden,
  onOpenChat,
}: {
  hidden: boolean;
  onOpenChat: () => void;
}) {
  const { session } = useAuth();
  const { isFollowing, toggleFollow } = useFollow();
  const [pendingFollows, setPendingFollows] = useState<Set<string>>(new Set());
  const followRequests = useRef(new Set<string>());
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useRef<HTMLButtonElement>(null);

  const handleNotificationReceived = useCallback((notification: NotificationDto) => {
    setNotifications((previous) => {
      const alreadyExists = previous.some((item) => item.id === notification.id);
      if (alreadyExists) return previous;
      return [notification, ...previous];
    });
  }, []);

  useNotificationConnection({
    enabled: !!session,
    onNotificationReceived: handleNotificationReceived,
  });

  useEffect(() => {
    if (!session) {
      setNotifications([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch((requestError) => {
        if (!cancelled) console.error("[Notifications] Error loading:", requestError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.usuarioId]);

  function closePopup() {
    setOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  async function handleNotificationClick(notification: NotificationDto) {
    if (!notification.isRead) {
      setNotifications((previous) =>
        previous.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
      );
      markNotificationAsRead(notification.id).catch((requestError) => {
        console.error("[Notifications] Error marking as read:", requestError);
        setNotifications((previous) =>
          previous.map((item) => (item.id === notification.id ? { ...item, isRead: false } : item)),
        );
      });
    }

    const nav = getNotificationNavigation(notification);
    if (nav.kind === "push") {
      closePopup();
      router.push(nav.path);
    } else if (nav.kind === "openChat") {
      closePopup();
      onOpenChat();
    }
  }

  async function handleMarkAllRead() {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    setError(null);
    setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "No se pudieron marcar las notificaciones.";
      setError(message);
      getNotifications()
        .then(setNotifications)
        .catch(() => {
          // Preserve the original error if refreshing the list also fails.
        });
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleFollow(notification: NotificationDto) {
    const username = notification.senderUsername;
    if (!username) return;
    const key = String(notification.senderId ?? username.toLowerCase());
    if (followRequests.current.has(key)) return;
    followRequests.current.add(key);
    setPendingFollows(new Set(followRequests.current));
    try {
      await toggleFollow(
        username,
        notification.senderId,
        isFollowing(notification.senderId ?? username),
      );
    } finally {
      followRequests.current.delete(key);
      setPendingFollows(new Set(followRequests.current));
    }
  }

  if (hidden) return null;

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const hasUnread = unreadCount > 0;

  const notificationList = (
    <div className="notif-list">
      {loading && <p className="notif-loading">Cargando notificaciones…</p>}
      {!loading && notifications.length === 0 && (
        <p className="notif-empty">No tenés notificaciones nuevas.</p>
      )}
      {notifications.map((item) => (
        <div key={item.id} className={`notif-item ${item.isRead ? "" : "unread"}`}>
          <button
            className="notif-item-link"
            onClick={() => handleNotificationClick(item)}
            aria-label={getNotificationText(item)}
          >
            <span className="notif-item-icon">
              <NotificationIcon type={item.type} />
            </span>
            <span className="notif-item-body">
              <p>{getNotificationText(item)}</p>
              <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
            </span>
            {!item.isRead && <span className="notif-unread-dot" aria-label="No leída" />}
          </button>
          {item.type === "newFollower" &&
            item.senderUsername &&
            item.senderId !== session?.usuarioId && (
              <button
                className="notif-follow-button"
                aria-label={`${isFollowing(item.senderId ?? item.senderUsername) ? "Dejar de seguir a" : "Seguir a"} @${item.senderUsername}`}
                aria-pressed={isFollowing(item.senderId ?? item.senderUsername)}
                disabled={pendingFollows.has(
                  String(item.senderId ?? item.senderUsername.toLowerCase()),
                )}
                onClick={() => void handleFollow(item)}
              >
                {pendingFollows.has(String(item.senderId ?? item.senderUsername.toLowerCase()))
                  ? "Actualizando…"
                  : isFollowing(item.senderId ?? item.senderUsername)
                    ? "Dejar de seguir"
                    : "Seguir"}
              </button>
            )}
        </div>
      ))}
    </div>
  );

  const panel = (
    <>
      <header className="notif-titlebar">
        <Bell size={18} />
        <strong>Notificaciones</strong>
        <button className="icon-button" onClick={closePopup} aria-label="Minimizar notificaciones">
          <Minus size={18} />
        </button>
      </header>
      {hasUnread && (
        <div className="notif-actions">
          <button className="notif-mark-all" onClick={handleMarkAllRead} disabled={markingAllRead}>
            Marcar todas como leídas
          </button>
        </div>
      )}
      {notificationList}
      {error && <div className="notif-error">{error}</div>}
    </>
  );

  const popup = open && (
    <section id="notif-popup" className="notif-popup" aria-label="Notificaciones">
      {panel}
    </section>
  );

  const dock = (
    <button
      ref={trigger}
      className="notif-launcher"
      title="Notificaciones"
      aria-expanded={open}
      aria-controls="notif-popup"
      onClick={() => setOpen((isOpen) => !isOpen)}
    >
      <Bell aria-hidden="true" />
      <span className="notif-label">Notifi&shy;caciones</span>
      {hasUnread && (
        <small className="notif-badge" aria-label={`${unreadCount} notificaciones sin leer`}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </small>
      )}
    </button>
  );

  const appRoot =
    typeof document !== "undefined" ? (document.querySelector(".app") ?? document.body) : null;

  if (appRoot) {
    return (
      <>
        {createPortal(popup, appRoot)}
        {dock}
      </>
    );
  }

  return dock;
}
