"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/AuthProvider";
import { useNotice } from "./NoticeProvider";
import {
  dejarDeSeguir,
  getSeguidores,
  getSeguidos,
  seguir,
  type FollowedUser,
} from "../seguimientosApi";

interface FollowContextType {
  followingUsers: FollowedUser[];
  followers: FollowedUser[];
  followingRevision: number;
  toggleFollow: (
    author: string,
    authorId?: number,
    currentlyFollowing?: boolean,
  ) => Promise<boolean>;
  isFollowing: (userIdOrUsername: number | string) => boolean;
  refreshFollows: () => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const showToast = useNotice((state) => state.showToast);
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
    [followingUsers],
  );

  const toggleFollow = useCallback(
    async (author: string, authorId?: number, currentlyFollowing?: boolean): Promise<boolean> => {
      if (!currentUserId) {
        if (typeof window !== "undefined") {
          router.push(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        }
        showToast("Debés iniciar sesión para seguir a otros usuarios.", "warning");
        return false;
      }

      let targetId =
        authorId ??
        followingUsers.find((u) => u.username.toLowerCase() === author.toLowerCase())?.id;
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
        showToast(`No se puede seguir a ${author}: falta su identificador de usuario.`, "error");
        return false;
      }

      if (targetId === currentUserId) {
        showToast("No podés seguirte a vos mismo.", "warning");
        return false;
      }

      if (pendingFollows.current.has(targetId)) return false;
      pendingFollows.current.add(targetId);

      const wasFollowing =
        currentlyFollowing !== undefined
          ? currentlyFollowing
          : followingUsers.some(
              (u) => u.id === targetId || u.username.toLowerCase() === author.toLowerCase(),
            );

      try {
        if (wasFollowing) {
          await dejarDeSeguir(currentUserId, targetId);
          setFollowingUsers((curr) =>
            curr.filter(
              (u) => u.id !== targetId && u.username.toLowerCase() !== author.toLowerCase(),
            ),
          );
          showToast(`Dejaste de seguir a ${author}.`, "success");
        } else {
          await seguir(currentUserId, targetId);
          setFollowingUsers((curr) => [
            ...curr.filter(
              (u) => u.id !== targetId && u.username.toLowerCase() !== author.toLowerCase(),
            ),
            { id: targetId, username: author },
          ]);
          showToast(`Ahora seguís a ${author}.`, "success");
        }
        setFollowingRevision((r) => r + 1);
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : "No se pudo actualizar el seguimiento.", "error");
        return false;
      } finally {
        pendingFollows.current.delete(targetId);
      }
    },
    [currentUserId, followingUsers, router, showToast],
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
