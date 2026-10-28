import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { userTiers } from "../../data";
import type { Achievement, DescribedTier, Memory, Period, TierProgress, UserCategory } from "../../types";
import type { FollowedUser } from "../../seguimientosApi";
import { LoaderCircle } from "lucide-react";
import ProfileDialogs from "./ProfileDialogs";
import ProfileHeader from "./ProfileHeader";
import ProfileMapDialog from "./ProfileMapDialog";
import ProfilePosts from "./ProfilePosts";
import ProfileShortcuts from "./ProfileShortcuts";
import type { ProfilePresentation } from "./profileTypes";
import { getPublicacionesGuardadasUsuario } from "../../userApi";

const presentations: Record<Period["decade"], ProfilePresentation> = {
  1970: { title: "Historias con nombre propio", label: "Suplemento personal", collection: "Mis recuerdos", map: "Lugares de una vida", footer: "Cada vida merece ser contada" },
  1980: { title: "Archivo de videoclub", label: "Colección personal · VHS", collection: "Mis cintas", map: "Locaciones", footer: "Rebobiná. Volvé a esos días." },
  1990: { title: "Archivo personal — Nostalgiar 95", label: "Mi PC / Personas / Archivo personal", collection: "Recuerdos", map: "Mapa de lugares", footer: "Archivo de recuerdos" },
  2000: { title: "Mi espacio — Nostalgiar Messenger", label: "Un espacio para volver a conectar", collection: "Álbum de recuerdos", map: "Mis lugares", footer: "Historias que nos conectan" },
  2010: { title: "Mi diario fotográfico", label: "Momentos que quedaron en el carrete", collection: "Mi álbum", map: "Mis lugares", footer: "Una imagen puede traerlo todo de vuelta" },
  2020: { title: "Mi espacio", label: "Momentos para volver a vivir", collection: "Mis recuerdos", map: "Mis lugares", footer: "Cada historia encuentra su lugar" },
};

export default function Profile({
  userId,
  onEdit,
  onDelete,
  username,
  fotoPerfilUrl,
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
  catalogue,
  currentUserId,
  myFollowingUsers,
  onSelect,
  onOpen,
  onAdd,
  onIniciarChat,
  onNavigateToProfile,
  onFollow,
  onToggleFollow,
  onEditProfile,
}: {
  userId?: number;
  onEdit: (memory: Memory) => void;
  onDelete: (memory: Memory) => void;
  username: string;
  fotoPerfilUrl?: string | null;
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
  catalogue: Achievement[];
  currentUserId?: number;
  myFollowingUsers?: FollowedUser[];
  onOpen?: (memory: Memory) => void;
  onSelect: (memory: Memory | null) => void;
  onAdd: () => void;
  onIniciarChat?: (username: string) => void;
  onNavigateToProfile?: (username: string) => void;
  onFollow?: (author: string, authorId: number) => void;
  onToggleFollow?: () => void | Promise<void>;
  onEditProfile?: () => void;
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
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [savedMemories, setSavedMemories] = useState<Memory[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);

  const presentation = presentations[period.decade];
  const unlocked = catalogue.filter((achievement) => achievement.unlocked);

  const ownMemories = useMemo(() => allMemories.filter((m) => !m.repost), [allMemories]);

  const userCategory = (reputation ?? "Errante") as UserCategory;
  const tiers = useMemo<DescribedTier[]>(() => {
    const current = userTiers.findIndex(tier => tier.name === userCategory);
    return userTiers.map((tier, index) => ({
      ...tier, state: index === current ? 'current' : index < current ? 'reached' : 'locked',
    }));
  }, [userCategory]);

  useEffect(() => () => clearTimeout(mapCloseTimer.current), []);

  async function handleOpenSaved() {
    setActiveTab("saved");
    album.current?.scrollIntoView({ block: "start", behavior: "instant" });
    if (userId) {
      setLoadingSaved(true);
      try {
        const mems = await getPublicacionesGuardadasUsuario(userId);
        setSavedMemories(mems);
        setSavedLoaded(true);
      } catch (err) {
        console.error("Error al cargar guardados:", err);
      } finally {
        setLoadingSaved(false);
      }
    }
  }

  function handleOpenCollection() {
    setActiveTab("posts");
    album.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

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
          fotoPerfilUrl={fotoPerfilUrl}
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
          onEditProfile={onEditProfile}
          onToggleFollowUser={onFollow}
        />
        <ProfileShortcuts
          author={author}
          presentation={presentation}
          memoryCount={allMemories.length}
          savedCount={savedLoaded ? savedMemories.length : undefined}
          activeTab={activeTab}
          mapOpened={mapOpened}
          onOpenCollection={handleOpenCollection}
          onOpenSaved={userId ? handleOpenSaved : undefined}
          onOpenMap={openMap}
        />
        <ProfileMapDialog
          dialogRef={mapDialog}
          author={author}
          period={period}
          memories={ownMemories}
          selected={selected}
          opened={mapOpened}
          closing={mapClosing}
          onSelect={onSelect}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={closeMap}
        />
        {loadingSaved ? (
          <div className="personal-empty profile-loading" style={{ padding: "40px", textAlign: "center" }}>
            <LoaderCircle className="animate-spin" size={24} style={{ margin: "0 auto" }} />
            <p style={{ marginTop: "12px", color: "var(--muted)" }}>Cargando recuerdos guardados...</p>
          </div>
        ) : (
          <ProfilePosts
            ref={album}
            author={author}
            username={username}
            memories={activeTab === "saved" ? savedMemories : allMemories}
            selected={selected}
            isSavedTab={activeTab === "saved"}
            repostedPublicationIds={repostedPublicationIds}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpen={onOpen}
            onSelectOnMap={(memory) => { onSelect(memory); openMap(); }}
            onAdd={onAdd}
          />
        )}
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
      {community && <aside className="profile-groups" aria-label="Mis grupos"><details className="profile-groups-disclosure"><summary>Mis grupos y comunidades</summary>{community}</details></aside>}
    </main>
  );
}
