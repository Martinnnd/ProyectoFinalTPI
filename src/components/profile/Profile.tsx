import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { describeTiers, resolveAchievements, resolveUserCategory } from "../../data";
import type { Achievement, Memory, Period, TierProgress, UserCategory } from "../../types";
import type { FollowedUser } from "../../seguimientosApi";
import ProfileDialogs from "./ProfileDialogs";
import ProfileHeader from "./ProfileHeader";
import ProfileMapDialog from "./ProfileMapDialog";
import ProfilePosts from "./ProfilePosts";
import ProfileShortcuts from "./ProfileShortcuts";
import type { ProfilePresentation } from "./profileTypes";

const presentations: Record<Period["decade"], ProfilePresentation> = {
  1970: { title: "Historias con nombre propio", label: "Suplemento personal", collection: "Mis recuerdos", map: "Lugares de una vida", footer: "Cada vida merece ser contada" },
  1980: { title: "Archivo de videoclub", label: "Colección personal · VHS", collection: "Mis cintas", map: "Locaciones", footer: "Rebobiná. Volvé a esos días." },
  1990: { title: "Archivo personal — Nostalgiar 95", label: "Mi PC / Personas / Archivo personal", collection: "Recuerdos", map: "Mapa de lugares", footer: "Archivo de recuerdos" },
  2000: { title: "Mi espacio — Nostalgiar Messenger", label: "Un espacio para volver a conectar", collection: "Álbum de recuerdos", map: "Mis lugares", footer: "Historias que nos conectan" },
};

export default function Profile({
  userId,
  onEdit,
  onDelete,
  username,
  author,
  reputation,
  followerCount,
  followingCount,
  isFollowing,
  onBack,
  community,
  allMemories,
  repostedPublicationIds,
  tierProgress,
  followers,
  followedUsers,
  period,
  selected,
  earned,
  currentUserId,
  myFollowingUsers,
  onSelect,
  onOpen,
  onAdd,
  onIniciarChat,
  onNavigateToProfile,
  onFollow,
  onToggleFollow,
}: {
  userId?: number;
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  username: string;
  author?: string;
  reputation?: string;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  onBack?: () => void;
  community?: ReactNode;
  allMemories: Memory[];
  repostedPublicationIds: string[];
  tierProgress: TierProgress;
  followers: FollowedUser[];
  followedUsers: FollowedUser[];
  period: Period;
  selected: Memory | null;
  earned: Achievement[];
  currentUserId?: number;
  myFollowingUsers?: FollowedUser[];
  onOpen?: (memory: Memory) => void;
  onSelect: (memory: Memory | null) => void;
  onAdd: () => void;
  onIniciarChat?: (username: string) => void;
  onNavigateToProfile?: (username: string) => void;
  onFollow?: (author: string, authorId: number) => void;
  onToggleFollow?: () => void | Promise<void>;
}) {
  const album = useRef<HTMLElement>(null);
  const mapDialog = useRef<HTMLDialogElement>(null);
  const mapReturnFocus = useRef<HTMLElement | null>(null);
  const mapCloseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const catalogueDialog = useRef<HTMLDialogElement>(null);
  const tiersDialog = useRef<HTMLDialogElement>(null);
  const [mapOpened, setMapOpened] = useState(false);
  const [mapClosing, setMapClosing] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [tiersOpen, setTiersOpen] = useState(false);

  const presentation = presentations[period.decade];
  const catalogue = useMemo(() => resolveAchievements(earned), [earned]);
  const unlocked = catalogue.filter((achievement) => achievement.unlocked);

  const effectiveProgress: TierProgress = useMemo(
    () => ({
      memories: Math.max(tierProgress?.memories ?? 0, allMemories.length),
      points: Math.max(
        tierProgress?.points ?? 0,
        allMemories.reduce((max, m) => Math.max(max, m.points ?? 0), 0),
      ),
      subscribed: Boolean(tierProgress?.subscribed),
    }),
    [tierProgress, allMemories],
  );

  const tierOrder: Record<string, number> = {
    Errante: 0,
    "Nostálgico": 1,
    Aedo: 2,
    Mnemosine: 3,
  };
  const calculatedCategory = resolveUserCategory(effectiveProgress);
  const userCategory =
    reputation && (tierOrder[reputation] ?? -1) > (tierOrder[calculatedCategory] ?? 0)
      ? (reputation as UserCategory)
      : calculatedCategory;
  const tiers = useMemo(() => describeTiers(effectiveProgress), [effectiveProgress]);

  useEffect(() => () => clearTimeout(mapCloseTimer.current), []);

  function openMap() {
    clearTimeout(mapCloseTimer.current);
    mapReturnFocus.current = document.activeElement as HTMLElement | null;
    setMapClosing(false);
    setMapOpened(true);
    mapDialog.current?.showModal();
  }

  function closeMap(after?: () => void) {
    if (mapClosing) return;
    setMapClosing(true);
    mapCloseTimer.current = setTimeout(() => {
      mapDialog.current?.close();
      setMapOpened(false);
      setMapClosing(false);
      mapReturnFocus.current?.focus({ preventScroll: true });
      after?.();
    }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320);
  }

  function openCatalogue() {
    setAchievementsOpen(true);
    catalogueDialog.current?.showModal();
  }

  function closeCatalogue() {
    setAchievementsOpen(false);
    catalogueDialog.current?.close();
  }

  function openTiers() {
    setTiersOpen(true);
    tiersDialog.current?.showModal();
  }

  function closeTiers() {
    setTiersOpen(false);
    tiersDialog.current?.close();
  }

  return (
    <main id="explore" className="personal-profile" data-visitor={!!author} aria-label={author ? `Perfil de ${author}` : `Perfil de ${username}`}>
      <div className="profile-main">
        <ProfileHeader
          userId={userId}
          author={author}
          username={username}
          presentation={presentation}
          period={period}
          memoryCount={allMemories.length}
          followers={followers}
          followedUsers={followedUsers}
          followerCount={followerCount}
          followingCount={followingCount}
          isFollowing={isFollowing}
          userCategory={userCategory}
          unlocked={unlocked}
          achievementCount={catalogue.length}
          achievementsOpen={achievementsOpen}
          tiersOpen={tiersOpen}
          onBack={onBack}
          onOpenAchievements={openCatalogue}
          onOpenTiers={openTiers}
          onIniciarChat={onIniciarChat}
          currentUserId={currentUserId}
          myFollowingUsers={myFollowingUsers}
          onNavigateToProfile={onNavigateToProfile}
          onToggleFollow={onToggleFollow}
          onToggleFollowUser={onFollow}
        />
        <ProfileShortcuts
          author={author}
          presentation={presentation}
          memoryCount={allMemories.length}
          mapOpened={mapOpened}
          onOpenCollection={() => album.current?.scrollIntoView({ block: "start", behavior: "instant" })}
          onOpenMap={openMap}
        />
        <ProfileMapDialog
          dialogRef={mapDialog}
          author={author}
          period={period}
          memories={allMemories}
          selected={selected}
          opened={mapOpened}
          closing={mapClosing}
          onSelect={onSelect}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={closeMap}
        />
        <ProfilePosts
          ref={album}
          author={author}
          username={username}
          memories={allMemories}
          selected={selected}
          repostedPublicationIds={repostedPublicationIds}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpen={onOpen}
          onSelectOnMap={(memory) => { onSelect(memory); openMap(); }}
          onAdd={onAdd}
        />
        <ProfileDialogs
          catalogueDialog={catalogueDialog}
          tiersDialog={tiersDialog}
          catalogue={catalogue}
          unlockedCount={unlocked.length}
          tiers={tiers}
          onCloseCatalogue={closeCatalogue}
          onCloseTiers={closeTiers}
        />
      </div>
      {community && <aside className="profile-groups" aria-label="Mis grupos">{community}</aside>}
    </main>
  );
}
