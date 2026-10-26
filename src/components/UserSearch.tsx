"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buscarUsuarios, type UsuarioBusqueda } from "../userApi";
import type { FollowedUser } from "../seguimientosApi";
import styles from "./UserSearch.module.css";

type UserSearchProps = {
  currentUserId: number;
  followedUsers: FollowedUser[];
  onFollow: (username: string, userId: number) => unknown;
  onOpenProfile: (user: UsuarioBusqueda) => void;
};

export default function UserSearch({ currentUserId, followedUsers, onFollow, onOpenProfile }: UserSearchProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UsuarioBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  useEffect(() => {
    const search = query.trim();
    setError("");
    if (!open || search.length < 2) {
      setLoading(false);
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      buscarUsuarios(search, controller.signal)
        .then((users) => {
          if (!controller.signal.aborted) setResults(users);
        })
        .catch((searchError) => {
          if (!controller.signal.aborted) {
            setResults([]);
            setError(searchError instanceof Error ? searchError.message : "No pudimos realizar la búsqueda.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  function show() {
    setOpen(true);
    requestAnimationFrame(() => {
      if (!dialog.current?.open) dialog.current?.showModal();
      input.current?.focus();
    });
  }

  function close() {
    if (dialog.current?.open) dialog.current.close();
    setOpen(false);
    setQuery("");
    setResults([]);
    setError("");
  }

  async function toggleFollow(user: UsuarioBusqueda) {
    if (pendingUserId !== null) return;
    setPendingUserId(user.id);
    try {
      await onFollow(user.username, user.id);
    } finally {
      setPendingUserId(null);
    }
  }

  const status = query.trim().length < 2
    ? "Escribí al menos 2 caracteres para buscar."
    : loading
      ? "Buscando usuarios…"
      : error
        ? error
        : results.length === 0
          ? "No encontramos usuarios con ese nombre."
          : `${results.length} ${results.length === 1 ? "usuario encontrado" : "usuarios encontrados"}.`;

  return <>
    <button
      ref={trigger}
      type="button"
      aria-label="Buscar usuarios"
      title="Buscar usuarios"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={show}
    >
      <Search />
      <span>Buscar</span>
    </button>
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="user-search-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={() => { setOpen(false); trigger.current?.focus(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <div className={styles.panel}>
        <header className={styles.heading}>
          <div>
            <small>PERSONAS</small>
            <h2 id="user-search-title">Buscar usuarios</h2>
          </div>
          <button type="button" className={styles.closeButton} aria-label="Cerrar búsqueda de usuarios" onClick={close}>
            <X size={20} />
          </button>
        </header>
        <label className={styles.searchField}>
          <span className="sr-only">Nombre de usuario</span>
          <Search size={20} aria-hidden="true" />
          <input
            ref={input}
            type="search"
            value={query}
            maxLength={50}
            autoComplete="off"
            placeholder="Escribí un nombre de usuario"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p className={error ? styles.error : styles.status} role={error ? "alert" : "status"}>{status}</p>
        {results.length > 0 && <ul className={styles.results} aria-label="Resultados de usuarios">
          {results.map((user) => {
            const ownUser = user.id === currentUserId;
            const followed = followedUsers.some((followedUser) => followedUser.id === user.id);
            const pending = pendingUserId === user.id;
            return <li key={user.id}>
              <span className={styles.avatar} aria-hidden="true">{user.username.trim().charAt(0).toLocaleUpperCase()}</span>
              <strong>{user.username}</strong>
              <button type="button" className={styles.profileButton} onClick={() => { close(); onOpenProfile(user); }}>
                {ownUser ? "Tu perfil" : "Ver perfil"}
              </button>
              {!ownUser && <button
                type="button"
                className={followed ? styles.unfollowButton : styles.followButton}
                disabled={pendingUserId !== null}
                onClick={() => void toggleFollow(user)}
              >
                {pending ? "Actualizando…" : followed ? "Dejar de seguir" : "Seguir"}
              </button>}
            </li>;
          })}
        </ul>}
      </div>
    </dialog>
  </>;
}
