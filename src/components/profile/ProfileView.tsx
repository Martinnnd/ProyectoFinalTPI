"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import Profile from "./Profile";
import { useAuth } from "../auth/AuthProvider";
import { useEra } from "../../context/EraContext";
import { useFollow } from "../../context/FollowContext";
import { getPerfilUsuario, getPublicacionesUsuario, type UsuarioPerfil } from "../../userApi";
import { achievements } from "../../data";
import type { Achievement, Memory, TierProgress } from "../../types";

export default function ProfileView({ targetUsername }: { targetUsername?: string }) {
  const router = useRouter();
  const { session, status } = useAuth();
  const { period } = useEra();
  const { followingUsers, followers, toggleFollow } = useFollow();

  const isOwnProfile = !targetUsername || targetUsername === session?.username;
  const usernameToFetch = targetUsername ?? session?.username;

  const [profileUser, setProfileUser] = useState<UsuarioPerfil | null>(null);
  const [profileMemories, setProfileMemories] = useState<Memory[]>([]);
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

  const isFollowing = followingUsers.some((u) => u.id === profileUser.id);

  const tierProgress: TierProgress = {
    memories: profileUser.cantidadPublicaciones ?? profileMemories.length,
    points: profileUser.puntosNostalgia ?? 0,
    subscribed: false,
  };

  const earned: Achievement[] = [
    ...(profileMemories.length > 0 ? [achievements[0]] : []),
  ];

  return (
    <Profile
      onEdit={() => {}}
      onDelete={() => {}}
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
      onToggleFollow={
        !isOwnProfile
          ? async () => {
              await toggleFollow(profileUser.username, profileUser.id);
            }
          : undefined
      }
    />
  );
}
