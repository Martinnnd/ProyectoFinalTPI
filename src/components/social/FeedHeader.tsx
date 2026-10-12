import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { FeedTab } from "../../socialTypes";

export default function FeedHeader({
  title,
  tab,
  community,
  selected,
  onBack,
  onTabChange,
}: {
  title: string;
  tab: FeedTab;
  community?: ReactNode;
  selected: boolean;
  onBack: () => void;
  onTabChange: (tab: FeedTab) => void;
}) {
  return (
    <>
      {!selected && community && (
        <details
          className="feed-community"
          open={window.innerWidth >= 900 ? true : undefined}
        >
          <summary>Buscar recuerdos y grupos</summary>
          {community}
        </details>
      )}
      <header className="feed-heading">
        <h2>{title}</h2>
        <div className="feed-tabs" role="group" aria-label="Publicaciones">
          <button
            aria-pressed={tab === "all"}
            onClick={() => onTabChange("all")}
          >
            Para vos
          </button>
          <button
            aria-pressed={tab === "following"}
            onClick={() => onTabChange("following")}
          >
            Seguidos
          </button>
          <button
            aria-pressed={tab === "groups"}
            onClick={() => onTabChange("groups")}
          >
            Mis grupos
          </button>
        </div>
      </header>
      {selected && (
        <button className="feed-back" onClick={onBack}>
          <ArrowLeft size={17} />
          Volver a feed
        </button>
      )}
    </>
  );
}
