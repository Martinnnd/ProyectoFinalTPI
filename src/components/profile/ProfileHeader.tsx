import { LoaderCircle, MessageCircle, UserMinus, UserPlus, UserRound, X } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth/AuthProvider";
import { useFollow } from "../../context/FollowContext";
import { getSeguidores, getSeguidos, type FollowedUser } from "../../seguimientosApi";
import type { Achievement, Period } from "../../types";
import type { ProfilePresentation } from "./profileTypes";

type FollowList = "followers" | "following";

export default function ProfileHeader({
  userId,
  author,
  username,
  presentation,
  period,
  memoryCount,
  followers,
  followedUsers,
  followerCount,
  followingCount,
  isFollowing = false,
  userCategory,
  unlocked,
  achievementCount,
  achievementsOpen,
  tiersOpen,
  currentUserId,
  myFollowingUsers,
  onBack,
  onOpenAchievements,
  onOpenTiers,
  onIniciarChat,
  onNavigateToProfile,
  onToggleFollow,
  onToggleFollowUser,
}: {
  userId?: number;
  author?: string;
  username: string;
  presentation: ProfilePresentation;
  period: Period;
  memoryCount: number;
  followers: FollowedUser[];
  followedUsers: FollowedUser[];
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  userCategory: string;
  unlocked: Achievement[];
  achievementCount: number;
  achievementsOpen: boolean;
  tiersOpen: boolean;
  currentUserId?: number;
  myFollowingUsers?: FollowedUser[];
  onBack?: () => void;
  onOpenAchievements: () => void;
  onOpenTiers: () => void;
  onIniciarChat?: (username: string) => void;
  onNavigateToProfile?: (username: string) => void;
  onToggleFollow?: () => void | Promise<void>;
  onToggleFollowUser?: (author: string, authorId: number) => void;
}) {
  const router = useRouter();
  const { session } = useAuth();
  const { isFollowing: checkIsFollowing, toggleFollow } = useFollow();

  const followDialog = useRef<HTMLDialogElement>(null);
  const [followList, setFollowList] = useState<FollowList>("followers");
  const [followBusy, setFollowBusy] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState<FollowedUser[] | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [pendingUserIds, setPendingUserIds] = useState<Set<number>>(new Set());

  const isOwnProfile = !author;
  const displayName = author ?? username;
  const totalFollowers = isOwnProfile ? followers.length : (followerCount ?? followers.length);
  const totalFollowed = isOwnProfile ? followedUsers.length : (followingCount ?? followedUsers.length);

  async function openFollowList(list: FollowList) {
    setFollowList(list);
    setFetchedUsers(null);
    followDialog.current?.showModal();
    const targetUserId = userId ?? (isOwnProfile ? session?.usuarioId : undefined);
    if (targetUserId) {
      setLoadingList(true);
      try {
        const users = list === "followers"
          ? await getSeguidores(targetUserId)
          : await getSeguidos(targetUserId);
        setFetchedUsers(users);
      } catch (err) {
        console.error("Error al cargar lista de seguimiento", err);
        setFetchedUsers([]);
      } finally {
        setLoadingList(false);
      }
    } else {
      setFetchedUsers(list === "followers" ? followers : followedUsers);
    }
  }

  const visibleUsers = fetchedUsers !== null
    ? fetchedUsers
    : (followList === "followers" ? followers : followedUsers);

  return (
    <>
      {author && (
        <button className="feed-back" onClick={onBack}>
          ← Volver al feed
        </button>
      )}
      <div className="profile-era-bar">
        <span className="profile-era-mark" aria-hidden="true"><UserRound size={18} /></span>
        <strong>{presentation.title}</strong>
        <span className="profile-edition">{period.decade}—{period.decade + 9}</span>
      </div>
      <header className="personal-header">
        <div className="profile-portrait" aria-hidden="true">
          <span className="visitor-initial">{displayName.slice(0, 1).toUpperCase()}</span>
        </div>
        <div className="personal-identity">
          <div className="personal-identity-text">
            <span className="eyebrow">{presentation.label}</span>
            <div className="profile-name-row">
              <h2>{displayName}</h2>
              {isOwnProfile ? (
                <button
                  className="profile-note"
                  onClick={onOpenTiers}
                  aria-haspopup="dialog"
                  aria-expanded={tiersOpen}
                >
                  {userCategory}
                </button>
              ) : userCategory ? (
                <span className="profile-note">{userCategory}</span>
              ) : null}
            </div>
            <div className="personal-counts">
              <span><strong>{memoryCount}</strong> Recuerdos</span>
              <button type="button" aria-haspopup="dialog" onClick={() => openFollowList("followers")}>
                <strong>{totalFollowers}</strong> Seguidores
              </button>
              <button type="button" aria-haspopup="dialog" onClick={() => openFollowList("following")}>
                <strong>{totalFollowed}</strong> Seguidos
              </button>
            </div>
          </div>
          {!isOwnProfile && (onIniciarChat || onToggleFollow) && (
            <div className="profile-visitor-actions">
              {onIniciarChat && <button className="secondary-button" onClick={() => onIniciarChat(author!)}>
                <MessageCircle size={14} /> Iniciar chat
              </button>}
              {onToggleFollow && <button
                className={isFollowing ? "secondary-button profile-unfollow-button" : "primary-button profile-follow-button"}
                disabled={followBusy}
                onClick={async () => {
                  setFollowBusy(true);
                  try { await onToggleFollow(); } finally { setFollowBusy(false); }
                }}
              >
                {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                {followBusy ? "Actualizando…" : isFollowing ? "Dejar de seguir" : "Seguir"}
              </button>}
            </div>
          )}
          {isOwnProfile && (
            <div className="achievements">
              <div className="achievements-heading">
                <h3>
                  <button
                    type="button"
                    className="profile-achievements-trigger"
                    onClick={onOpenAchievements}
                    aria-haspopup="dialog"
                    aria-expanded={achievementsOpen}
                  >
                    Logros
                  </button>
                </h3>
                <span className="achievements-count">{unlocked.length}/{achievementCount}</span>
              </div>
              {unlocked.length ? (
                <ul className="achievement-rail">
                  {unlocked.map((achievement) => (
                    <li key={achievement.id}>
                      <img src={achievement.image} alt={achievement.name} title={achievement.name} width={40} height={40} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="achievements-empty">Todavía no conseguiste ninguna insignia.</p>
              )}
            </div>
          )}
        </div>
      </header>

      <dialog
        ref={followDialog}
        className="profile-follow-dialog"
        aria-labelledby="profile-follow-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) followDialog.current?.close();
        }}
      >
        <header>
          <h2 id="profile-follow-title">
            {isOwnProfile
              ? (followList === "followers" ? "Seguidores" : "Seguidos")
              : (followList === "followers" ? `Seguidores de ${displayName}` : `Seguidos por ${displayName}`)}
          </h2>
          <button className="icon-button" aria-label="Cerrar lista" onClick={() => followDialog.current?.close()}>
            <X size={20} />
          </button>
        </header>
        {loadingList ? (
          <div className="profile-follow-loading">
            <LoaderCircle size={20} className="animate-spin" />
            <span>Cargando lista…</span>
          </div>
        ) : visibleUsers.length ? (
          <ul>
            {visibleUsers.map((user) => {
              const effectiveMyId = currentUserId ?? session?.usuarioId;
              const isMe =
                (effectiveMyId && user.id === effectiveMyId) ||
                (session?.username && user.username.toLowerCase() === session.username.toLowerCase());
              const followingUser = myFollowingUsers
                ? myFollowingUsers.some((u) => u.id === user.id)
                : (checkIsFollowing(user.id) || checkIsFollowing(user.username));
              const isPending = pendingUserIds.has(user.id);

              return (
                <li key={user.id} className="profile-follow-row">
                  <button
                    type="button"
                    className="profile-follow-user-link profile-follow-user"
                    onClick={() => {
                      followDialog.current?.close();
                      if (onNavigateToProfile) {
                        onNavigateToProfile(user.username);
                      } else if (isMe) {
                        router.push("/perfil");
                      } else {
                        router.push(`/perfil/${encodeURIComponent(user.username)}`);
                      }
                    }}
                    title={`Ver perfil de ${user.username}`}
                  >
                    <span aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
                    <strong>{user.username}</strong>
                  </button>
                  {!isMe && (
                    <button
                      type="button"
                      className={followingUser ? "secondary-button profile-item-follow-btn follow-button" : "primary-button profile-item-follow-btn follow-button"}
                      aria-pressed={followingUser}
                      disabled={isPending}
                      onClick={async () => {
                        if (onToggleFollowUser) {
                          onToggleFollowUser(user.username, user.id);
                          return;
                        }
                        setPendingUserIds((prev) => new Set(prev).add(user.id));
                        try {
                          await toggleFollow(user.username, user.id, followingUser);
                        } finally {
                          setPendingUserIds((prev) => {
                            const next = new Set(prev);
                            next.delete(user.id);
                            return next;
                          });
                        }
                      }}
                    >
                      {isPending ? "…" : followingUser ? "Dejar de seguir" : "Seguir"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>
            {isOwnProfile
              ? (followList === "followers" ? "Todavía no tenés seguidores." : "Todavía no seguís a nadie.")
              : (followList === "followers" ? `${displayName} todavía no tiene seguidores.` : `${displayName} todavía no sigue a nadie.`)}
          </p>
        )}
      </dialog>
    </>
  );
}
