"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SocialFeed from "../../../components/social/SocialFeed";
import DeleteMemoryDialog from "../../../components/DeleteMemoryDialog";
import MemoryForm from "../../../components/MemoryForm";
import { useEra } from "../../../context/EraContext";
import { useAuth } from "../../../components/auth/AuthProvider";
import { useFollow } from "../../../context/FollowContext";
import { useRatings } from "../../../context/RatingsContext";
import { eliminarPublicacion } from "../../../api";
import { filterMemories, type Memory, type Decade } from "../../../types";
import type { FeedTab } from "../../../socialTypes";

export default function FeedPage() {
  const router = useRouter();
  const { period } = useEra();
  const { session } = useAuth();
  const { followingUsers, followers, followingRevision, toggleFollow } = useFollow();
  const { ratings, pointsMap, rateMemory } = useRatings();

  const [feedItems, setFeedItems] = useState<Memory[]>([]);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);

  const followingUsernames = followingUsers.map((u) => u.username);

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
        router.push(`/recuerdo/${memory.id}`);
      }
    },
    [router]
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
    return null;
  }, []);

  return (
    <>
      <SocialFeed
        key={session?.usuarioId ?? "guest"}
        active={true}
        onItems={setFeedItems}
        filterFeed={(items) => filterMemories(items, period, "Todas")}
        onAddHashtag={handleAddHashtag}
        onTabChange={(_tab: FeedTab) => {}}
        onEdit={(m) => setEditing(m)}
        onDelete={(m) => setDeleting(m)}
        onProfile={handleProfile}
        groupIds={[]}
        suggestedAuthors={followers.map((u) => ({ name: u.username, id: u.id }))}
        groupOpenRequest={0}
        onRepostCreated={(_id) => {}}
        decade={period.decade}
        memories={feedItems}
        following={followingUsernames}
        followingRevision={followingRevision}
        onFollow={toggleFollow}
        ratings={ratings}
        pointsMap={pointsMap}
        canRate={true}
        onRate={rateMemory}
        selected={null}
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
          decade={Math.floor(editing.year / 10) * 10 as Decade}
          onCancel={() => setEditing(null)}
          onSave={async () => {
            setEditing(null);
            return null;
          }}
        />
      )}
    </>
  );
}
