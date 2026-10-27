"use client";

import React, { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, X, Newspaper, MessageCircle, SlidersHorizontal, CircleCheck, Music2 } from "lucide-react";
import { useEra } from "../../context/EraContext";
import { useAuth } from "../auth/AuthProvider";
import { useFollow } from "../../context/FollowContext";
import EraTimeline from "../EraTimeline";
import EraChrome, { EraIcon } from "../EraChrome";
import Player from "../Player";
import UserSearch from "../UserSearch";
import AuthMenu from "../auth/AuthMenu";
import { useRatings } from "../../context/RatingsContext";
import AchievementToast from "../AchievementToast";
import useAchievementNotifications from "../../hooks/useAchievementNotifications";
import Notification from "../Notification";
import type { Period } from '../../types';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const {
    period,
    changePeriod,
    theme,
    musicOpen,
    setMusicOpen,
    factsOpen,
    setFactsOpen,
    panelOpen,
    setPanelOpen,
  } = useEra();

  const { followingUsers, toggleFollow } = useFollow();
  const { notice, setNotice } = useRatings();
  const achievementNotice = useAchievementNotifications(session?.usuarioId ?? null, session?.token);

  const mobileOptions = useRef<HTMLDialogElement>(null);
  const mobileOptionsTrigger = useRef<HTMLButtonElement>(null);

  function handlePeriodChange(next: Period) {
    if (pathname.startsWith('/recuerdo/')) {
      const requestedReturn = new URLSearchParams(window.location.search).get('returnTo');
      const destination = requestedReturn && /^\/perfil(?:\/[^/?#]+)?$/.test(requestedReturn)
        ? requestedReturn : '/feed';
      // La sincronización de la época escribe la URL; navegar después evita que
      // history.replaceState restaure la ruta de detalle sobre el router.push.
      changePeriod(next, () => queueMicrotask(() => router.push(destination)));
      return;
    }
    changePeriod(next);
  }

  let currentView: "map" | "feed" | "profile" | "chat" = "map";
  if (pathname.startsWith("/feed") || pathname.startsWith("/recuerdo")) {
    currentView = "feed";
  } else if (pathname.startsWith("/chat")) {
    currentView = "chat";
  } else if (pathname.startsWith("/perfil")) {
    currentView = "profile";
  } else if (pathname.startsWith("/explorar")) {
    currentView = "map";
  }

  const handleNavigate = (destination: "map" | "stories" | "facts" | "music") => {
    if (destination === "music") {
      setMusicOpen(!musicOpen);
      if (window.innerWidth < 900) {
        setPanelOpen(false);
        setFactsOpen(false);
      }
      return;
    }
    if (destination === "map") {
      if (window.innerWidth < 900) setMusicOpen(false);
      setPanelOpen(false);
      setFactsOpen(false);
      router.push("/explorar");
      return;
    }
    if (destination === "stories") {
      if (window.innerWidth < 900) { setMusicOpen(false); setFactsOpen(false); }
      setPanelOpen(!panelOpen);
      return;
    }
    if (destination === "facts") {
      if (window.innerWidth < 900) { setMusicOpen(false); setPanelOpen(false); }
      setFactsOpen(!factsOpen);
      return;
    }
  };

  const handleRecordar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nostalgiar:start-recordar"));
    }
    router.push("/explorar?action=recordar");
  };

  return (
    <div
      style={theme.tokens}
      className={`app map-app view-${currentView} era-${period.decade} ${
        panelOpen ? "stories-open" : ""
      } ${musicOpen ? "music-open" : ""}`}
    >
      <EraTimeline
        period={period}
        onChange={handlePeriodChange}
        action={
          <button
            aria-label="Recordar"
            className="primary-button time-add-memory"
            onClick={handleRecordar}
          >
            <Plus size={16} />
            <span>Recordar</span>
          </button>
        }
      />

      <div className="mobile-appbar">
        <div className="mobile-page-title">
          <span>Nostalgiar</span>
          <strong>
            {currentView === "map"
              ? "Explorar"
              : currentView === "feed"
              ? "Feed"
              : currentView === "chat"
              ? "Chat"
              : "Mi perfil"}
          </strong>
        </div>
        <button
          className="mobile-add-button"
          aria-label="Sumar mi recuerdo"
          onClick={handleRecordar}
        >
          <Plus size={23} />
        </button>
      </div>

      <button
        ref={mobileOptionsTrigger}
        className="mobile-era-button mobile-map-options"
        onClick={() => mobileOptions.current?.showModal()}
        aria-label="Abrir opciones de exploración"
        title="Opciones de exploración"
      >
        <SlidersHorizontal size={20} />
      </button>
      <button
        className="mobile-era-button mobile-music-access"
        type="button"
        onClick={() => handleNavigate("music")}
        aria-label={musicOpen ? "Cerrar reproductor de música" : "Abrir reproductor de música"}
        aria-controls="music-player"
        aria-pressed={musicOpen}
        title="Música de la época"
      >
        <Music2 size={20} aria-hidden="true" />
      </button>

      <dialog
        ref={mobileOptions}
        className="mobile-options"
        onClick={(e) => {
          if (e.target === e.currentTarget) mobileOptions.current?.close();
        }}
        onClose={() => mobileOptionsTrigger.current?.focus()}
        aria-labelledby="mobile-options-title"
      >
        <header>
          <h2 id="mobile-options-title">Opciones de exploración</h2>
          <button
            className="icon-button"
            aria-label="Cerrar opciones"
            onClick={() => mobileOptions.current?.close()}
          >
            <X />
          </button>
        </header>
        <div id="mobile-category-slot" />
        <div className="mobile-tools">
          {(["stories", "facts", "music"] as const).map((destination) => (
            <button
              key={destination}
              onClick={() => {
                mobileOptions.current?.close();
                handleNavigate(destination);
              }}
            >
              <EraIcon decade={period.decade} destination={destination} />
              <span>
                {destination === "stories"
                  ? "Recuerdos"
                  : destination === "facts"
                  ? "Efemérides"
                  : "Música"}
              </span>
            </button>
          ))}
        </div>
        <button
          className="primary-button mobile-options-done"
          onClick={() => mobileOptions.current?.close()}
        >
          Ver selección
        </button>
      </dialog>

      <EraChrome
        period={period}
        count={0}
        panelOpen={panelOpen}
        factsOpen={factsOpen}
        musicOpen={musicOpen}
        onNavigate={handleNavigate}
      />

      <nav className="navigation-rail" aria-label="Navegación principal">
        <button
          aria-label="Explorar mapa"
          title="Explorar mapa"
          className={currentView === "map" && !panelOpen ? "rail-active" : ""}
          onClick={() => {
            setPanelOpen(false);
            setFactsOpen(false);
            router.push("/explorar");
          }}
        >
          <EraIcon decade={period.decade} destination="map" />
          <span>Explorar</span>
        </button>
        <button
          aria-current={currentView === "feed" ? "page" : undefined}
          title="Feed"
          className={currentView === "feed" ? "rail-active" : ""}
          onClick={() => {
            setPanelOpen(false);
            setFactsOpen(false);
            router.push("/feed");
          }}
        >
          <Newspaper />
          <span>Feed</span>
        </button>
        {session && (
          <button
            aria-current={currentView === "chat" ? "page" : undefined}
            title="Chat"
            className={currentView === "chat" ? "rail-active" : ""}
            onClick={() => {
              setPanelOpen(false);
              setFactsOpen(false);
              router.push("/chat");
            }}
          >
            <MessageCircle />
            <span>Chat</span>
          </button>
        )}
        {session && (
          <Notification
            hidden={false}
            onOpenChat={() => {
              setPanelOpen(false);
              setFactsOpen(false);
              router.push("/chat");
            }}
          />
        )}
        {session ? (
          <div className="account-navigation">
            <UserSearch
              currentUserId={session.usuarioId}
              followedUsers={followingUsers}
              onFollow={toggleFollow}
              onOpenProfile={(u) => router.push(`/perfil/${u.username}`)}
            />
            <AuthMenu
              profileActive={pathname === "/perfil"}
              onOpenProfile={() => router.push("/perfil")}
            />
          </div>
        ) : (
          <AuthMenu profileActive={false} onOpenProfile={() => router.push("/perfil")} />
        )}
      </nav>

      {children}

      <Player
        key={period.decade}
        decade={period.decade}
        expanded={musicOpen}
        onToggle={() => {
          setMusicOpen(!musicOpen);
          if (window.innerWidth < 900) {
            setPanelOpen(false);
          }
        }}
      />

      {notice && (
        <div
          className={`toast${notice === "¡Recuerdo guardado! Ya tiene su lugar en el mapa." ? " memory-saved-notice" : ""}`}
          role="status"
          aria-atomic="true"
        >
          {notice === "¡Recuerdo guardado! Ya tiene su lugar en el mapa." && (
            <CircleCheck size={24} aria-hidden="true" />
          )}
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Cerrar aviso"
            onClick={() => setNotice(null)}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {achievementNotice.achievement && (
        <AchievementToast
          key={`${session?.usuarioId}:${achievementNotice.achievement.id}`}
          achievement={achievementNotice.achievement}
          onDismiss={achievementNotice.dismiss}
        />
      )}
    </div>
  );
}
