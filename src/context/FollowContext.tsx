"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../components/auth/AuthProvider";
import { dejarDeSeguir, getSeguidores, getSeguidos, seguir, type FollowedUser } from "../seguimientosApi";

interface FollowContextType {
  followingUsers: FollowedUser[];
  followers: FollowedUser[];
  followingRevision: number;
  toggleFollow: (author: string, authorId?: number) => Promise<void>;
  refreshFollows: () => void;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
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

  const toggleFollow = useCallback(
    async (author: string, authorId?: number) => {
      if (!currentUserId || !authorId) return;
      if (authorId === currentUserId || pendingFollows.current.has(authorId)) return;

      const wasFollowing = followingUsers.some((u) => u.id === authorId);
      pendingFollows.current.add(authorId);
      try {
        if (wasFollowing) {
          await dejarDeSeguir(currentUserId, authorId);
          setFollowingUsers((curr) => curr.filter((u) => u.id !== authorId));
        } else {
          await seguir(currentUserId, authorId);
          setFollowingUsers((curr) => [...curr, { id: authorId, username: author }]);
        }
        setFollowingRevision((r) => r + 1);
      } finally {
        pendingFollows.current.delete(authorId);
      }
    },
    [currentUserId, followingUsers]
  );

  return (
    <FollowContext.Provider
      value={{
        followingUsers,
        followers,
        followingRevision,
        toggleFollow,
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
