import { Bookmark, MessageCircle, Repeat2 } from "lucide-react";
import LikeButton from "./LikeButton";

export default function PostActions({
  memoryTitle,
  liked,
  likeCount,
  commentCount,
  reposted,
  saved,
  onLike,
  onOpenComments,
  onRepost,
  onSave,
}: {
  memoryTitle: string;
  liked: boolean;
  likeCount?: number;
  commentCount: number;
  reposted: boolean;
  saved: boolean;
  onLike: () => void;
  onOpenComments: () => void;
  onRepost: () => void;
  onSave: () => void;
}) {
  return (
    <footer>
      <LikeButton liked={liked} count={likeCount} memoryTitle={memoryTitle} onToggle={onLike} />
      <button onClick={onOpenComments}>
        <MessageCircle size={17} />
        {commentCount} Comentar
      </button>
      <button
        type="button"
        className={`repost-button${reposted ? " is-reposted" : ""}`}
        aria-label={reposted ? `Deshacer repost: ${memoryTitle}` : `Repostear: ${memoryTitle}`}
        title={reposted ? "Deshacer repost" : "Repostear"}
        aria-pressed={reposted}
        style={reposted ? { color: '#10b981', fontWeight: 600 } : undefined}
        onClick={onRepost}
      >
        <Repeat2 size={17} style={reposted ? { stroke: '#10b981', strokeWidth: 2.5 } : undefined} />
        {reposted ? "Reposteado" : "Repostear"}
      </button>
      <button
        aria-label={`Guardar: ${memoryTitle}`}
        aria-pressed={saved}
        onClick={onSave}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        {saved ? "Guardado" : "Guardar"}
      </button>
    </footer>
  );
}
