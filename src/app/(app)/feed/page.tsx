"use client";

import React, { Suspense, useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SocialFeed from "../../../components/social/SocialFeed";
import DeleteMemoryDialog from "../../../components/DeleteMemoryDialog";
import MemoryForm from "../../../components/MemoryForm";
import CommunityControls from "../../../components/CommunityControls";
import GroupInfoModal from "../../../components/GroupInfoModal";
import { useEra } from "../../../context/EraContext";
import { useAuth } from "../../../components/auth/AuthProvider";
import { useFollow } from "../../../context/FollowContext";
import { useRatings } from "../../../context/RatingsContext";
import { eliminarPublicacion } from "../../../api";
import { getPublication } from "../../../publicationsApi";
import { filterCommunity } from "../../../groups";
import {
  getGroups,
  getGroupMemories,
  createGroup as createRemoteGroup,
  joinGroup as joinRemoteGroup,
  type CreateGroupInput,
  type GroupMember,
} from "../../../groupsApi";
import { filterMemories, type Memory, type Decade, type CommunityGroup } from "../../../types";
import type { FeedTab } from "../../../socialTypes";
import { isHashtag, normalizeHashtag } from "../../../hashtags";

export default function FeedPage() {
  return <Suspense fallback={<div className="feed-loading" role="status">Cargando feed…</div>}>
    <FeedPageContent />
  </Suspense>;
}

function FeedPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnQuery = searchParams.get("returnTo")?.split("?")[1] ?? "";
  const requestedTag = normalizeHashtag(searchParams.get("tag") ?? new URLSearchParams(returnQuery).get("tag") ?? "");
  const initialHashtag = isHashtag(requestedTag) ? requestedTag : null;
  const { period, changePeriod } = useEra();
  const { session } = useAuth();
  const { followingUsers, followers, followingRevision, toggleFollow } = useFollow();
  const { ratings, pointsMap, rateMemory, setNotice } = useRatings();

  const [feedItems, setFeedItems] = useState<Memory[]>([]);
  const [selected, setSelected] = useState<Memory | null>(null);
  useEffect(() => {
    if (pathname === '/feed') setSelected(null);
  }, [pathname]);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);

  // Grupos y comunidad
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const myGroups = groups.filter((g) => g.isMember);
  const requestedScope = searchParams.get("scope");
  const [scope, setScope] = useState(requestedScope ?? "all");
  useEffect(() => {
    if (requestedScope) setScope(requestedScope);
  }, [requestedScope]);
  const [query, setQuery] = useState("");
  const [groupMemories, setGroupMemories] = useState<Memory[]>([]);
  const [groupInfoId, setGroupInfoId] = useState<string | null>(null);
  const [groupOpenRequest, setGroupOpenRequest] = useState(0);
  const [repostedPublicationIds, setRepostedPublicationIds] = useState<string[]>([]);

  const followingUsernames = followingUsers.map((u) => u.username);

  // Cargar grupos disponibles
  useEffect(() => {
    const controller = new AbortController();
    getGroups(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setGroups(res);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setNotice(err instanceof Error ? err.message : "No se pudieron cargar los grupos.");
        }
      });
    return () => controller.abort();
  }, [session, setNotice]);

  // Cargar recuerdos del grupo seleccionado
  useEffect(() => {
    const activeGroup = groups.find((g) => g.id === scope);
    setGroupMemories([]);
    if (!activeGroup) return;

    const controller = new AbortController();
    getGroupMemories(activeGroup.id, controller.signal)
      .then((mems) => {
        if (!controller.signal.aborted) setGroupMemories(mems);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setNotice(err instanceof Error ? err.message : "No se pudieron cargar los recuerdos del grupo.");
        }
      });
    return () => controller.abort();
  }, [groups, scope, setNotice]);

  // Soporte para popstate (navegador atrás / adelante)
  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname.startsWith("/recuerdo/")) {
        const id = window.location.pathname.replace("/recuerdo/", "");
        const found = feedItems.find((m) => m.id === id);
        if (found) {
          setSelected(found);
        } else if (id) {
          getPublication(id, false).then(setSelected).catch(() => {});
        }
      } else {
        setSelected(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [feedItems]);

  const handleProfile = useCallback(
    (memory: Memory) => {
      if (session && memory.author === session.username) {
        router.push("/perfil");
      } else {
        router.push(`/perfil/${memory.author}`);
      }
    },
    [router, session]
  );

  const handleMap = useCallback(
    (memory: Memory) => {
      router.push(`/explorar?recuerdo=${memory.id}`);
    },
    [router]
  );

  const handleSelect = useCallback(
    (memory: Memory | null) => {
      if (memory) {
        const decade = (Math.floor(memory.year / 10) * 10) as Decade;
        if (decade !== period.decade) {
          changePeriod({ decade, year: null });
        }
        setSelected(memory);
        const returnTo = initialHashtag ? `/feed?tag=${encodeURIComponent(initialHashtag)}` : "/feed";
        window.history.pushState(null, "", `/recuerdo/${memory.id}?returnTo=${encodeURIComponent(returnTo)}`);
      } else {
        setSelected(null);
        window.history.pushState(null, "", initialHashtag ? `/feed?tag=${encodeURIComponent(initialHashtag)}` : "/feed");
      }
    },
    [period.decade, changePeriod, initialHashtag]
  );

  const chooseScope = useCallback(
    (value: string) => {
      setScope(value);
      setQuery("");
      setSelected(null);
      const group = groups.find((g) => g.id === value);
      if (group) {
        changePeriod({ decade: group.decade, year: null });
      }
    },
    [groups, changePeriod]
  );

  const handleTabChange = useCallback(
    (tab: FeedTab) => {
      if (tab === "groups") {
        chooseScope("groups");
        return;
      }
      if (scope === "groups" || groups.some((g) => g.id === scope)) {
        chooseScope("all");
      }
    },
    [scope, groups, chooseScope]
  );

  const createGroup = useCallback(
    async (group: CreateGroupInput): Promise<string | null> => {
      if (groups.some((g) => g.name.toLowerCase() === group.name.toLowerCase())) {
        return "Ya existe un grupo con ese nombre.";
      }
      try {
        const created = await createRemoteGroup(group);
        setGroups((curr) => [...curr, created]);
        setScope(created.id);
        setSelected(null);
        setQuery("");
        changePeriod({ decade: created.decade, year: null });
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "No se pudo crear el grupo.";
      }
    },
    [groups, changePeriod]
  );

  const joinGroup = useCallback(
    async (groupId: string): Promise<string | null> => {
      try {
        await joinRemoteGroup(groupId);
        setGroups((curr) => curr.map((g) => (g.id === groupId ? { ...g, isMember: true } : g)));
        setNotice("Ya sos integrante del grupo.");
        return null;
      } catch (err) {
        return err instanceof Error ? err.message : "No se pudo completar la unión al grupo.";
      }
    },
    [setNotice]
  );

  const groupUpdated = useCallback(
    (updated: CommunityGroup) => {
      setGroups((curr) => curr.map((g) => (g.id === updated.id ? updated : g)));
      if (scope === updated.id) changePeriod({ decade: updated.decade, year: null });
    },
    [scope, changePeriod]
  );

  const groupRemoved = useCallback(
    (groupId: string, message: string) => {
      setGroups((curr) => curr.filter((g) => g.id !== groupId));
      setGroupMemories([]);
      setGroupInfoId(null);
      setScope("groups");
      setSelected(null);
      setQuery("");
      setNotice(message);
    },
    [setNotice]
  );

  const openMemberProfile = useCallback(
    (member: GroupMember) => {
      setGroupInfoId(null);
      if (session && member.id === session.usuarioId) {
        router.push("/perfil");
      } else {
        router.push(`/perfil/${member.username}`);
      }
    },
    [router, session]
  );

  const handleAdd = useCallback(() => {
    router.push("/explorar?action=recordar");
  }, [router]);

  const handleAddHashtag = useCallback(
    (tag: string) => {
      router.push(`/explorar?action=recordar&tag=${encodeURIComponent(tag)}`);
    },
    [router]
  );

  const confirmDelete = useCallback((memory: Memory): string | null => {
    eliminarPublicacion(memory.id).catch(console.error);
    setFeedItems((current) => current.filter((m) => m.id !== memory.id));
    if (selected?.id === memory.id) {
      setSelected(null);
      window.history.pushState(null, "", "/feed");
    }
    setNotice("Recuerdo eliminado.");
    return null;
  }, [selected, setNotice]);

  const saveEdit = useCallback(
    (memory: Memory): string | null => {
      const original = feedItems.find((m) => m.id === editing?.id);
      if (!original) return "Este recuerdo ya no está disponible.";
      const group = groups.find((g) => g.id === original.groupId);
      if (group && (memory.year < group.decade || memory.year > group.decade + 9)) {
        return `Elegí un año entre ${group.decade} y ${group.decade + 9} para este grupo.`;
      }
      const updated: Memory = {
        ...memory,
        id: original.id,
        groupId: original.groupId,
        source: original.source,
        author: original.author,
      };
      setFeedItems((prev) => prev.map((m) => (m.id === original.id ? updated : m)));
      if (selected?.id === original.id) {
        setSelected(updated);
      }
      setEditing(null);
      setNotice("Recuerdo modificado.");
      return null;
    },
    [feedItems, editing, groups, selected, setNotice]
  );

  const viewingGroup = groups.some((g) => g.id === scope);
  const communityMemories = viewingGroup ? groupMemories : feedItems;
  const filteredMemories = filterMemories(
    filterCommunity(communityMemories, scope, groups, query),
    period,
    "Todas"
  );

  const communityControls = (
    <CommunityControls
      groups={myGroups}
      searchGroups={groups}
      scope={scope}
      query={query}
      decade={period.decade}
      profile={false}
      canCreate={!!session}
      onQuery={(val) => {
        setQuery(val);
        setSelected(null);
      }}
      onScope={chooseScope}
      onCreate={createGroup}
      onJoinGroup={joinGroup}
      onAddToGroup={(groupId) => router.push(`/explorar?action=recordar&groupId=${groupId}`)}
      onShowInfo={setGroupInfoId}
    />
  );

  const activeGroupInfo = groups.find((g) => g.id === groupInfoId);

  return (
    <>
      <SocialFeed
        key={session?.usuarioId ?? "guest"}
        initialHashtag={initialHashtag}
        active={true}
        onItems={setFeedItems}
        filterFeed={(items) =>
          filterMemories(filterCommunity(items, scope, myGroups, query), period, "Todas")
        }
        onAddHashtag={handleAddHashtag}
        onTabChange={handleTabChange}
        onEdit={(m) => setEditing(m)}
        onDelete={(m) => setDeleting(m)}
        onProfile={handleProfile}
        groupIds={groups.map((g) => g.id)}
        groupNames={Object.fromEntries(groups.map((g) => [g.id, g.name]))}
        suggestedAuthors={[
          ...feedItems
            .filter((m) => m.authorId)
            .map((m) => ({ name: m.author, id: m.authorId! })),
          ...followers.map((u) => ({ name: u.username, id: u.id })),
        ]}
        groupOpenRequest={groupOpenRequest}
        community={communityControls}
        groupName={groups.find((g) => g.id === scope)?.name}
        onRepostCreated={(id) =>
          setRepostedPublicationIds((curr) => [...new Set([...curr, id])])
        }
        decade={period.decade}
        memories={filteredMemories}
        following={followingUsernames}
        followingRevision={followingRevision}
        onFollow={toggleFollow}
        ratings={ratings}
        pointsMap={pointsMap}
        canRate={true}
        onRate={rateMemory}
        selected={selected}
        onSelect={handleSelect}
        onMap={handleMap}
        onAdd={handleAdd}
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
          groupName={myGroups.find((g) => g.id === editing.groupId)?.name}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}

      {activeGroupInfo && (
        <GroupInfoModal
          key={activeGroupInfo.id}
          group={activeGroupInfo}
          memoryCount={scope === activeGroupInfo.id ? groupMemories.length : 0}
          onClose={() => setGroupInfoId(null)}
          onUpdated={groupUpdated}
          onDeleted={(groupId) =>
            groupRemoved(
              groupId,
              "Grupo eliminado. Sus recuerdos se conservaron como publicaciones generales."
            )
          }
          onLeft={(groupId) => groupRemoved(groupId, "Saliste del grupo.")}
          onOpenMember={openMemberProfile}
        />
      )}
    </>
  );
}
