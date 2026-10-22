import { ArrowLeft } from "lucide-react";
import type { FeedTab } from "../../socialTypes";

export default function FeedHeader({
  title,
  tab,
  selected,
  scrollHidden = false,
  onBack,
  onTabChange,
}: {
  title: string;
  tab: FeedTab;
  selected: boolean;
  scrollHidden?: boolean;
  onBack: () => void;
  onTabChange: (tab: FeedTab) => void;
}) {
  return (
    <>
      <header className={`feed-heading${scrollHidden ? ' is-scroll-hidden' : ''}`}>
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
