import { Bookmark, MessageCircle, Repeat2 } from "lucide-react";
import LikeButton from "./LikeButton";

export default function PostActions({
  memoryTitle,
  liked,
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
      <LikeButton liked={liked} memoryTitle={memoryTitle} onToggle={onLike} />
      <button onClick={onOpenComments}>
        <MessageCircle size={17} />
        {commentCount || ""} Comentar
      </button>
      <button
        aria-label={`Repostear: ${memoryTitle}`}
        aria-pressed={reposted}
        onClick={onRepost}
      >
        <Repeat2 size={17} />
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
