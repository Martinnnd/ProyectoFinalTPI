"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import Profile from "./Profile";
import ProfileEditDialog from "./ProfileEditDialog";
import DeleteMemoryDialog from "../DeleteMemoryDialog";
import MemoryForm from "../MemoryForm";
import CommunityControls from "../CommunityControls";
import GroupInfoModal from "../GroupInfoModal";
import { useAuth } from "../auth/AuthProvider";
import { useEra } from "../../context/EraContext";
import { useFollow } from "../../context/FollowContext";
import { useRatings } from "../../context/RatingsContext";
import { eliminarPublicacion } from "../../api";
import { getPublicacionesUsuario } from "../../userApi";
import { changeOwnProfilePhoto, changeOwnUsername, getUserProfile, toAchievement, type UserProfile } from "../../profileApi";
import { ACHIEVEMENTS_UPDATED } from "../../achievementEvents";
import {
  getGroups,
  createGroup,
  joinGroup,
  leaveGroup,
  type CreateGroupInput,
} from "../../groupsApi";
import type { CommunityGroup, Decade, Memory, TierProgress } from "../../types";

export default function ProfileView(props: { targetUsername?: string }) {
  const { session } = useAuth();
  return <ProfileContent key={`${session?.usuarioId ?? 'guest'}:${props.targetUsername ?? 'own'}`} {...props} />;
}

function ProfileContent({ targetUsername }: { targetUsername?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, status } = useAuth();
  const { period } = useEra();
  const { followingUsers, followers, toggleFollow } = useFollow();
  const { setNotice } = useRatings();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const isOwnProfile = !targetUsername || targetUsername === session?.username ||
    (profileUser !== null && profileUser.id === session?.usuarioId);
  const usernameToFetch = isOwnProfile ? session?.usuarioId : targetUsername;
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener(ACHIEVEMENTS_UPDATED, refresh);
    return () => window.removeEventListener(ACHIEVEMENTS_UPDATED, refresh);
  }, []);

  const [profileMemories, setProfileMemories] = useState<Memory[]>([]);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Grupos para la barra lateral del perfil propio
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [scope, setScope] = useState("groups");
  const [query, setQuery] = useState("");
  const [groupInfoId, setGroupInfoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwnProfile || !session) return;
    const controller = new AbortController();
    getGroups(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setGroups(res);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isOwnProfile, session]);

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

    getUserProfile(usernameToFetch, controller.signal, revision ? 'no-store' : 'default')
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
  }, [usernameToFetch, isOwnProfile, session?.usuarioId, status, router, revision]);

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

  const myGroups = groups.filter((g) => g.isMember);

  const handleCreateGroup = async (groupInput: CreateGroupInput): Promise<string | null> => {
    if (groups.some((g) => g.name.toLowerCase() === groupInput.name.toLowerCase())) {
      return "Ya existe un grupo con ese nombre.";
    }
    try {
      const created = await createGroup(groupInput);
      setGroups((curr) => [...curr, created]);
      setScope(created.id);
      setNotice("¡Grupo creado con éxito!");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo crear el grupo.";
    }
  };

  const handleJoinGroup = async (groupId: string): Promise<string | null> => {
    try {
      await joinGroup(groupId);
      setGroups((curr) => curr.map((g) => (g.id === groupId ? { ...g, isMember: true } : g)));
      setNotice("Ya sos integrante del grupo.");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "No se pudo completar la unión al grupo.";
    }
  };

  const handleLeaveGroup = async (groupId: string): Promise<string | null> => {
    try {
      await leaveGroup(groupId);
      setGroups(curr => curr.map(g => g.id === groupId ? { ...g, isMember: false } : g));
      setScope('groups');
      setNotice('Saliste del grupo.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo salir del grupo.';
    }
  };

  const handleGroupScope = (value: string) => {
    if (value === "groups" || value === "all") {
      setScope("groups");
    } else {
      setScope(value);
      router.push(`/feed?tab=groups&scope=${value}`);
    }
  };

  const communityControls = isOwnProfile ? (
    <CommunityControls
      groups={myGroups}
      searchGroups={groups}
      scope={scope}
      query={query}
      decade={period.decade}
      profile={true}
      canCreate={!!session}
      onQuery={(val) => setQuery(val)}
      onScope={handleGroupScope}
      onCreate={handleCreateGroup}
      onJoinGroup={handleJoinGroup}
      onLeaveGroup={handleLeaveGroup}
      onAddToGroup={(groupId) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("nostalgiar:start-recordar"));
        }
        router.push(`/explorar?action=recordar&groupId=${groupId}`);
      }}
      onShowInfo={(groupId) => setGroupInfoId(groupId)}
    />
  ) : undefined;

  const activeGroupInfo = groups.find((g) => g.id === groupInfoId);

  return (
    <>
      <Profile
        userId={profileUser.id}
        isOwnProfile={isOwnProfile}
        onEdit={(m) => setEditing(m)}
        onDelete={(m) => setDeleting(m)}
        username={profileUser.username}
        fotoPerfilUrl={profileUser.fotoPerfilUrl}
        author={isOwnProfile ? undefined : profileUser.username}
        reputation={profileUser.reputacion}
        followerCount={profileUser.cantidadSeguidores}
        followingCount={profileUser.cantidadSeguidos}
        isFollowing={isFollowing}
        onBack={() => router.back()}
        community={communityControls}
        allMemories={profileMemories}
        repostedPublicationIds={[]}
        tierProgress={tierProgress}
        followers={followers}
        followedUsers={followingUsers}
        period={period}
        selected={null}
        catalogue={profileUser.logros.map(toAchievement)}
        onSelect={() => {}}
        onOpen={(m) => router.push(`/recuerdo/${m.id}?returnTo=${encodeURIComponent(pathname)}`)}
        onAdd={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("nostalgiar:start-recordar"));
          }
          router.push("/explorar?action=recordar");
        }}
        onStartChat={(user) => router.push(`/chat?con=${user}`)}
        onToggleFollow={!isOwnProfile ? handleToggleFollow : undefined}
        onEditProfile={isOwnProfile ? () => setEditingProfile(true) : undefined}
      />

      {editingProfile && isOwnProfile && (
        <ProfileEditDialog
          profile={profileUser}
          onClose={() => setEditingProfile(false)}
          onChangeUsername={async username => {
            const updated = await changeOwnUsername(username);
            setProfileUser(updated);
            return updated;
          }}
          onChangePhoto={async file => {
            const updated = await changeOwnProfilePhoto(file);
            setProfileUser(updated);
            return updated;
          }}
        />
      )}

      {activeGroupInfo && (
        <GroupInfoModal
          group={activeGroupInfo}
          memoryCount={0}
          onClose={() => setGroupInfoId(null)}
          onUpdated={(updatedGroup) =>
            setGroups((curr) => curr.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)))
          }
          onDeleted={(deletedId) => {
            setGroups((curr) => curr.filter((g) => g.id !== deletedId));
            setGroupInfoId(null);
            setNotice("Grupo eliminado.");
          }}
          onLeft={(leftId) => {
            setGroups((curr) => curr.map((g) => (g.id === leftId ? { ...g, isMember: false } : g)));
            setGroupInfoId(null);
            setNotice("Saliste del grupo.");
          }}
          onOpenMember={(member) => router.push(`/perfil/${member.username}`)}
        />
      )}

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
