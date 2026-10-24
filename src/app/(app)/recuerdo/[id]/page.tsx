"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import SocialFeed from "../../../../components/social/SocialFeed";
import DeleteMemoryDialog from "../../../../components/DeleteMemoryDialog";
import MemoryForm from "../../../../components/MemoryForm";
import { getPublication } from "../../../../publicationsApi";
import { eliminarPublicacion } from "../../../../api";
import { useEra } from "../../../../context/EraContext";
import { useAuth } from "../../../../components/auth/AuthProvider";
import { useFollow } from "../../../../context/FollowContext";
import { useRatings } from "../../../../context/RatingsContext";
import type { Decade, Memory } from "../../../../types";
import type { FeedTab } from "../../../../socialTypes";

export default function RecuerdoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { id } = resolvedParams;

  const { period, changePeriod } = useEra();
  const { session, status } = useAuth();
  const { followingUsers, toggleFollow, followingRevision } = useFollow();
  const { ratings, pointsMap, rateMemory, setNotice } = useRatings();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);

  const followingUsernames = followingUsers.map((u) => u.username);

  useEffect(() => {
    if (!id || status === "loading") return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getPublication(id, false, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setMemory(data);
        setLoading(false);
        const memoryDecade = (Math.floor(data.year / 10) * 10) as Decade;
        if (memoryDecade !== period.decade) {
          changePeriod({ decade: memoryDecade, year: null });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el recuerdo.");
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [id, status, changePeriod, period.decade]);

  const handleProfile = useCallback(
    (targetMemory: Memory) => {
      if (session && targetMemory.author === session.username) {
        router.push("/perfil");
      } else {
        router.push(`/perfil/${targetMemory.author}`);
      }
    },
    [router, session]
  );

  const handleMap = useCallback(
    (targetMemory: Memory) => {
      router.push(`/explorar?recuerdo=${targetMemory.id}`);
    },
    [router]
  );

  const handleSelect = useCallback(
    (selectedMemory: Memory | null) => {
      if (!selectedMemory) {
        router.push("/feed");
      } else if (selectedMemory.id !== id) {
        router.push(`/recuerdo/${selectedMemory.id}`);
      }
    },
    [id, router]
  );

  const confirmDelete = useCallback(
    (targetMemory: Memory): string | null => {
      eliminarPublicacion(targetMemory.id).catch(console.error);
      setNotice("Recuerdo eliminado.");
      router.push("/feed");
      return null;
    },
    [router, setNotice]
  );

  const saveEdit = useCallback(
    (updated: Memory): string | null => {
      setMemory(updated);
      setEditing(null);
      setNotice("Recuerdo modificado.");
      return null;
    },
    [setNotice]
  );

  if (loading) {
    return (
      <div className="feed-loading" role="status" style={{ padding: "60px 0" }}>
        <LoaderCircle size={28} className="animate-spin" />
        <span>Cargando recuerdo…</span>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="feed-load-error" role="alert" style={{ padding: "60px 0", textAlign: "center" }}>
        <p>{error ?? "No se encontró el recuerdo solicitado."}</p>
        <button type="button" className="secondary-button" onClick={() => router.push("/feed")}>
          Volver al feed
        </button>
      </div>
    );
  }

  const effectiveMemory: Memory = {
    ...memory,
    points: pointsMap[memory.id] ?? memory.points,
    viewerRating: ratings[memory.id] ?? memory.viewerRating,
  };

  return (
    <>
      <SocialFeed
        key={memory.id}
        active={true}
        onItems={() => {}}
        filterFeed={(items) => items}
        onAddHashtag={(tag) =>
          router.push(`/explorar?action=recordar&tag=${encodeURIComponent(tag)}`)
        }
        onTabChange={(_tab: FeedTab) => router.push("/feed")}
        onEdit={(m) => setEditing(m)}
        onDelete={(m) => setDeleting(m)}
        onProfile={handleProfile}
        groupIds={[]}
        suggestedAuthors={[]}
        groupOpenRequest={0}
        onRepostCreated={(_repostId) => {}}
        decade={period.decade}
        memories={[effectiveMemory]}
        following={followingUsernames}
        followingRevision={followingRevision}
        onFollow={toggleFollow}
        ratings={ratings}
        pointsMap={pointsMap}
        canRate={true}
        onRate={rateMemory}
        selected={effectiveMemory}
        onSelect={handleSelect}
        onMap={handleMap}
        onAdd={() => router.push("/explorar?action=recordar")}
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
