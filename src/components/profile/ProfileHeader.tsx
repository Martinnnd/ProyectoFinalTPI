import { MessageCircle, UserRound, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Achievement, Period } from "../../types";
import type { FollowedUser } from "../../seguimientosApi";
import type { ProfilePresentation } from "./profileTypes";

type FollowList = "followers" | "following";

export default function ProfileHeader({
  author,
  username,
  presentation,
  period,
  memoryCount,
  followers,
  followedUsers,
  userCategory,
  unlocked,
  achievementCount,
  achievementsOpen,
  tiersOpen,
  onBack,
  onOpenAchievements,
  onOpenTiers,
  onIniciarChat,
}: {
  author?: string;
  username: string;
  presentation: ProfilePresentation;
  period: Period;
  memoryCount: number;
  followers: FollowedUser[];
  followedUsers: FollowedUser[];
  userCategory: string;
  unlocked: Achievement[];
  achievementCount: number;
  achievementsOpen: boolean;
  tiersOpen: boolean;
  onBack?: () => void;
  onOpenAchievements: () => void;
  onOpenTiers: () => void;
  onIniciarChat?: (username: string) => void;
}) {
  const followDialog = useRef<HTMLDialogElement>(null);
  const [followList, setFollowList] = useState<FollowList>("followers");
  const isOwnProfile = !author;
  const displayName = author ?? username;

  function openFollowList(list: FollowList) {
    setFollowList(list);
    followDialog.current?.showModal();
  }

  const visibleUsers = followList === "followers" ? followers : followedUsers;

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
              {isOwnProfile && (
                <button
                  className="profile-note"
                  onClick={onOpenTiers}
                  aria-haspopup="dialog"
                  aria-expanded={tiersOpen}
                >
                  {userCategory}
                </button>
              )}
            </div>
            <div className="personal-counts">
              <span><strong>{memoryCount}</strong> Recuerdos</span>
              {isOwnProfile && (
                <>
                  <button type="button" aria-haspopup="dialog" onClick={() => openFollowList("followers")}>
                    <strong>{followers.length}</strong> Seguidores
                  </button>
                  <button type="button" aria-haspopup="dialog" onClick={() => openFollowList("following")}>
                    <strong>{followedUsers.length}</strong> Seguidos
                  </button>
                </>
              )}
            </div>
          </div>
          {!isOwnProfile && onIniciarChat && (
            <button
              className="secondary-button"
              onClick={() => onIniciarChat(author!)}
              style={{ display: "flex", alignItems: "center", gap: "6px", alignSelf: "flex-start", marginTop: "8px" }}
            >
              <MessageCircle size={14} /> Iniciar chat
            </button>
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
          <h2 id="profile-follow-title">{followList === "followers" ? "Seguidores" : "Seguidos"}</h2>
          <button className="icon-button" aria-label="Cerrar lista" onClick={() => followDialog.current?.close()}>
            <X size={20} />
          </button>
        </header>
        {visibleUsers.length ? (
          <ul>
            {visibleUsers.map((user) => (
              <li key={user.id}>
                <span aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span>
                <strong>{user.username}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>{followList === "followers" ? "Todavía no tenés seguidores." : "Todavía no seguís a nadie."}</p>
        )}
      </dialog>
    </>
  );
}
