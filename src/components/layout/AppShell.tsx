"use client";

import React, { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, X, Newspaper, MessageCircle, ChevronDown, CircleCheck } from "lucide-react";
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
  const { notice, setNotice, celebrating, setCelebrating } = useRatings();

  const mobileOptions = useRef<HTMLDialogElement>(null);
  const mobileOptionsTrigger = useRef<HTMLButtonElement>(null);

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
      setPanelOpen(false);
      setFactsOpen(false);
      router.push("/explorar");
      return;
    }
    if (destination === "stories") {
      setPanelOpen(!panelOpen);
      return;
    }
    if (destination === "facts") {
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
        onChange={changePeriod}
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
          ref={mobileOptionsTrigger}
          className="mobile-era-button"
          onClick={() => mobileOptions.current?.showModal()}
          aria-label="Abrir opciones"
        >
          <strong>Opciones</strong>
          <ChevronDown size={15} />
        </button>
        <button
          className="mobile-add-button"
          aria-label="Sumar mi recuerdo"
          onClick={handleRecordar}
        >
          <Plus size={23} />
        </button>
      </div>

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

      {celebrating && (
        <AchievementToast
          key={celebrating.id}
          achievement={celebrating}
          onDismiss={() => setCelebrating(null)}
        />
      )}
    </div>
  );
}
