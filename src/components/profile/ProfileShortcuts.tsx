import { Bookmark, Grid3x3, MapPin } from "lucide-react";
import type { ProfilePresentation } from "./profileTypes";

export default function ProfileShortcuts({
  author,
  presentation,
  memoryCount,
  savedCount,
  activeTab = "posts",
  mapOpened,
  onOpenCollection,
  onOpenSaved,
  onOpenMap,
}: {
  author?: string;
  presentation: ProfilePresentation;
  memoryCount: number;
  savedCount?: number;
  activeTab?: "posts" | "saved";
  mapOpened: boolean;
  onOpenCollection: () => void;
  onOpenSaved?: () => void;
  onOpenMap: () => void;
}) {
  return (
    <nav className="profile-shortcuts" aria-label="Secciones del perfil">
      <button
        type="button"
        onClick={onOpenCollection}
        aria-pressed={activeTab === "posts"}
        className={activeTab === "posts" ? "active" : undefined}
      >
        <Grid3x3 size={16} />
        {author ? "Su colección" : presentation.collection}
        <span>{memoryCount}</span>
      </button>
      {onOpenSaved && (
        <button
          type="button"
          onClick={onOpenSaved}
          aria-pressed={activeTab === "saved"}
          className={activeTab === "saved" ? "active" : undefined}
        >
          <Bookmark size={16} />
          {author ? "Sus guardados" : "Recuerdos guardados"}
          {savedCount !== undefined && <span>{savedCount}</span>}
        </button>
      )}
      <button type="button" onClick={onOpenMap} aria-haspopup="dialog" aria-expanded={mapOpened}>
        <MapPin size={16} />
        {author ? "Sus lugares" : "Mis lugares"}
      </button>
      <span className="profile-motto">{presentation.footer}</span>
    </nav>
  );
}
