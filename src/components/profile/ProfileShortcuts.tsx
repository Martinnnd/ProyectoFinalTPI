import { Grid3x3, MapPin } from "lucide-react";
import type { ProfilePresentation } from "./profileTypes";

export default function ProfileShortcuts({
  author,
  presentation,
  memoryCount,
  mapOpened,
  onOpenCollection,
  onOpenMap,
}: {
  author?: string;
  presentation: ProfilePresentation;
  memoryCount: number;
  mapOpened: boolean;
  onOpenCollection: () => void;
  onOpenMap: () => void;
}) {
  return (
    <nav className="profile-shortcuts" aria-label="Secciones del perfil">
      <button onClick={onOpenCollection}>
        <Grid3x3 size={16} />
        {author ? "Su colección" : presentation.collection}
        <span>{memoryCount}</span>
      </button>
      <button onClick={onOpenMap} aria-haspopup="dialog" aria-expanded={mapOpened}>
        <MapPin size={16} />
        {author ? "Sus lugares" : "Mis lugares"}
      </button>
      <span className="profile-motto">{presentation.footer}</span>
    </nav>
  );
}
