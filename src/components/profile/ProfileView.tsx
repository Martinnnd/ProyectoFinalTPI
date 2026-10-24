"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import Profile from "./Profile";
import DeleteMemoryDialog from "../DeleteMemoryDialog";
import MemoryForm from "../MemoryForm";
import { useAuth } from "../auth/AuthProvider";
import { useEra } from "../../context/EraContext";
import { useFollow } from "../../context/FollowContext";
import { useRatings } from "../../context/RatingsContext";
import { eliminarPublicacion } from "../../api";
import { getPerfilUsuario, getPublicacionesUsuario, type UsuarioPerfil } from "../../userApi";
import { achievements } from "../../data";
import type { Achievement, Decade, Memory, TierProgress } from "../../types";

export default function ProfileView({ targetUsername }: { targetUsername?: string }) {
  const router = useRouter();
  const { session, status } = useAuth();
  const { period } = useEra();
  const { followingUsers, followers, toggleFollow } = useFollow();
  const { setNotice } = useRatings();

  const isOwnProfile = !targetUsername || targetUsername === session?.username;
  const usernameToFetch = targetUsername ?? session?.username;

  const [profileUser, setProfileUser] = useState<UsuarioPerfil | null>(null);
  const [profileMemories, setProfileMemories] = useState<Memory[]>([]);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (isOwnProfile && !session) {
      router.push("/auth/login?returnTo=/perfil");
      return;
    }

    if (!usernameToFetch) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getPerfilUsuario(usernameToFetch, controller.signal)
      .then(async (perfil) => {
        if (controller.signal.aborted) return;
        setProfileUser(perfil);
        const mems = await getPublicacionesUsuario(perfil.id, controller.signal);
        if (controller.signal.aborted) return;
        setProfileMemories(mems);
        setLoading(false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el perfil.");
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [usernameToFetch, isOwnProfile, session, status, router]);

  if (loading) {
    return (
      <div className="feed-loading" role="status" style={{ padding: "60px 0" }}>
        <LoaderCircle size={28} className="animate-spin" />
        <span>Cargando perfil…</span>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="feed-load-error" role="alert" style={{ padding: "60px 0", textAlign: "center" }}>
        <p>{error ?? "No se encontró el perfil de usuario."}</p>
        <button type="button" className="secondary-button" onClick={() => router.push("/feed")}>
          Volver al feed
        </button>
      </div>
    );
  }

  const isFollowing = profileUser
    ? Boolean(
        profileUser.loSigo ||
        followingUsers.some(
          (u) =>
            u.id === profileUser.id ||
            u.username.toLowerCase() === profileUser.username.toLowerCase()
        )
      )
    : false;

  const tierProgress: TierProgress = {
    memories: Math.max(profileUser.cantidadPublicaciones ?? 0, profileMemories.length),
    points: Math.max(
      profileUser.puntosNostalgia ?? 0,
      profileMemories.reduce((max, m) => Math.max(max, m.points ?? 0), 0)
    ),
    subscribed: false,
  };

  const earned: Achievement[] = [
    ...(profileMemories.length > 0 ? [achievements[0]] : []),
  ];

  const handleToggleFollow = async () => {
    if (!profileUser) return;
    const currentlyFollowing = isFollowing;
    const ok = await toggleFollow(profileUser.username, profileUser.id, currentlyFollowing);
    if (ok) {
      setProfileUser((curr) =>
        curr
          ? {
              ...curr,
              loSigo: !currentlyFollowing,
              cantidadSeguidores: Math.max(
                0,
                curr.cantidadSeguidores + (currentlyFollowing ? -1 : 1)
              ),
            }
          : curr
      );
    }
  };

  const confirmDelete = (memory: Memory): string | null => {
    eliminarPublicacion(memory.id).catch((err) => {
      console.error("Error al eliminar recuerdo:", err);
    });
    setProfileMemories((prev) => prev.filter((m) => m.id !== memory.id));
    setProfileUser((prev) =>
      prev
        ? {
            ...prev,
            cantidadPublicaciones: Math.max(0, (prev.cantidadPublicaciones ?? 1) - 1),
          }
        : prev
    );
    setNotice("Recuerdo eliminado.");
    return null;
  };

  const saveEdit = (updatedDraft: Memory) => {
    setProfileMemories((prev) =>
      prev.map((m) => (m.id === updatedDraft.id ? { ...m, ...updatedDraft } : m))
    );
    setEditing(null);
    setNotice("Recuerdo modificado.");
    return null;
  };

  return (
    <>
      <Profile
        userId={profileUser.id}
        onEdit={(m) => setEditing(m)}
        onDelete={(m) => setDeleting(m)}
        username={session?.username ?? profileUser.username}
        author={isOwnProfile ? undefined : profileUser.username}
        reputation={profileUser.reputacion}
        followerCount={profileUser.cantidadSeguidores}
        followingCount={profileUser.cantidadSeguidos}
        isFollowing={isFollowing}
        onBack={() => router.back()}
        allMemories={profileMemories}
        repostedPublicationIds={[]}
        tierProgress={tierProgress}
        followers={followers}
        followedUsers={followingUsers}
        period={period}
        selected={null}
        earned={earned}
        onSelect={() => {}}
        onOpen={(m) => router.push(`/recuerdo/${m.id}`)}
        onAdd={() => router.push("/explorar?action=recordar")}
        onIniciarChat={(user) => router.push(`/chat?con=${user}`)}
        onToggleFollow={!isOwnProfile ? handleToggleFollow : undefined}
      />

      {deleting && (
        <DeleteMemoryDialog
          memory={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={() => confirmDelete(deleting)}
        />
      )}

      {editing && (
        <MemoryForm
          key={editing.id}
          initial={editing}
          point={{ lat: editing.lat, lng: editing.lng }}
          decade={(Math.floor(editing.year / 10) * 10) as Decade}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
    </>
  );
}
