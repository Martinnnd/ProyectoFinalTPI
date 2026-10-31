"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/AuthProvider";
import { useRatings } from "./RatingsContext";
import { dejarDeSeguir, getSeguidores, getSeguidos, seguir, type FollowedUser } from "../seguimientosApi";

interface FollowContextType {
  followingUsers: FollowedUser[];
  followers: FollowedUser[];
  followingRevision: number;
  toggleFollow: (author: string, authorId?: number, currentlyFollowing?: boolean) => Promise<boolean>;
  isFollowing: (userIdOrUsername: number | string) => boolean;
  refreshFollows: () => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const { setNotice } = useRatings();
  const currentUserId = session?.usuarioId;

  const [followingUsers, setFollowingUsers] = useState<FollowedUser[]>([]);
  const [followers, setFollowers] = useState<FollowedUser[]>([]);
  const [followingRevision, setFollowingRevision] = useState(0);
  const pendingFollows = useRef(new Set<number>());

  const refreshFollows = useCallback(() => {
    setFollowingRevision((r) => r + 1);
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setFollowingUsers([]);
      setFollowers([]);
      return;
    }
    const controller = new AbortController();
    Promise.all([
      getSeguidos(currentUserId, controller.signal),
      getSeguidores(currentUserId, controller.signal),
    ])
      .then(([followed, followersList]) => {
        if (!controller.signal.aborted) {
          setFollowingUsers(followed);
          setFollowers(followersList);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [currentUserId, followingRevision]);

  const isFollowing = useCallback(
    (target: number | string) => {
      if (typeof target === "number") {
        return followingUsers.some((u) => u.id === target);
      }
      return followingUsers.some((u) => u.username.toLowerCase() === target.toLowerCase());
    },
    [followingUsers]
  );

  const toggleFollow = useCallback(
    async (author: string, authorId?: number, currentlyFollowing?: boolean): Promise<boolean> => {
      if (!currentUserId) {
        if (typeof window !== "undefined") {
          router.push(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        }
        setNotice("Debés iniciar sesión para seguir a otros usuarios.");
        return false;
      }

      let targetId = authorId ?? followingUsers.find((u) => u.username.toLowerCase() === author.toLowerCase())?.id;
      if (!targetId) {
        try {
          const { getUserByUsername } = await import("../chat/chatApi");
          const user = await getUserByUsername(author);
          targetId = user.userId;
        } catch {
          // Si no se encuentra
        }
      }

      if (!targetId) {
        setNotice(`No se puede seguir a ${author}: falta su identificador de usuario.`);
        return false;
      }

      if (targetId === currentUserId) {
        setNotice("No podés seguirte a vos mismo.");
        return false;
      }

      if (pendingFollows.current.has(targetId)) return false;
      pendingFollows.current.add(targetId);

      const wasFollowing =
        currentlyFollowing !== undefined
          ? currentlyFollowing
          : followingUsers.some((u) => u.id === targetId || u.username.toLowerCase() === author.toLowerCase());

      try {
        if (wasFollowing) {
          await dejarDeSeguir(currentUserId, targetId);
          setFollowingUsers((curr) =>
            curr.filter((u) => u.id !== targetId && u.username.toLowerCase() !== author.toLowerCase())
          );
          setNotice(`Dejaste de seguir a ${author}.`);
        } else {
          await seguir(currentUserId, targetId);
          setFollowingUsers((curr) => [
            ...curr.filter((u) => u.id !== targetId && u.username.toLowerCase() !== author.toLowerCase()),
            { id: targetId, username: author },
          ]);
          setNotice(`Ahora seguís a ${author}.`);
        }
        setFollowingRevision((r) => r + 1);
        return true;
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "No se pudo actualizar el seguimiento.");
        return false;
      } finally {
        pendingFollows.current.delete(targetId);
      }
    },
    [currentUserId, followingUsers, router, setNotice]
  );

  return (
    <FollowContext.Provider
      value={{
        followingUsers,
        followers,
        followingRevision,
        toggleFollow,
        isFollowing,
        refreshFollows,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
}
