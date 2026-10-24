"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, MapPin } from "lucide-react";
import FeedPost from "../../../../components/social/FeedPost";
import { getPublication } from "../../../../publicationsApi";
import { useEra } from "../../../../context/EraContext";
import { useAuth } from "../../../../components/auth/AuthProvider";
import { useFollow } from "../../../../context/FollowContext";
import { useRatings } from "../../../../context/RatingsContext";
import useMemoryInteractions from "../../../../hooks/useMemoryInteractions";
import type { Decade, Memory } from "../../../../types";

export default function RecuerdoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { id } = resolvedParams;

  const { period, changePeriod } = useEra();
  const { session } = useAuth();
  const { followingUsers, toggleFollow } = useFollow();
  const { ratings, rateMemory } = useRatings();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLiked, toggleLike } = useMemoryInteractions();

  useEffect(() => {
    if (!id) return;
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
          changePeriod(memoryDecade, data.year);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el recuerdo.");
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [id]);

  const isFollowing = memory ? followingUsers.some((u) => u.username === memory.author) : false;

  return (
    <div className="social-feed" style={{ maxWidth: "780px", margin: "0 auto", padding: "16px" }}>
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          className="secondary-button"
          onClick={() => router.back()}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        {memory && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => router.push(`/explorar?recuerdo=${memory.id}`)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <MapPin size={16} /> Ver en el mapa
          </button>
        )}
      </div>

      {loading && (
        <div className="feed-loading" role="status" style={{ padding: "40px 0" }}>
          <LoaderCircle size={24} className="animate-spin" />
          <span>Cargando recuerdo…</span>
        </div>
      )}

      {error && (
        <div className="feed-load-error" role="alert" style={{ padding: "40px 0" }}>
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      )}

      {memory && !loading && (
        <FeedPost
          memory={memory}
          selected={true}
          active={true}
          following={isFollowing}
          liked={isLiked(memory.id, memory.viewerLiked)}
          commentMemoryId={memory.id}
          rating={ratings[memory.id] ?? memory.viewerRating}
          canRate={true}
          reposted={false}
          saved={false}
          onDelete={() => {}}
          onEdit={() => {}}
          onProfile={(m) => router.push(session?.username === m.author ? "/perfil" : `/perfil/${m.author}`)}
          onFollow={toggleFollow}
          onOpen={() => {}}
          onOpenRelated={(related) => router.push(`/recuerdo/${related.id}`)}
          onMap={(m) => router.push(`/explorar?recuerdo=${m.id}`)}
          onRate={(score) => rateMemory(memory.id, score)}
          onLike={() => toggleLike(memory.id, memory.viewerLiked)}
          onRepost={() => {}}
          onSave={() => {}}
          onHashtag={(tag) => router.push(`/feed?tag=${encodeURIComponent(tag)}`)}
        />
      )}
    </div>
  );
}
