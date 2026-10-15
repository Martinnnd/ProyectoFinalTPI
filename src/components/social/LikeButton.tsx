import { Heart } from "lucide-react";

export default function LikeButton({
  liked,
  count,
  memoryTitle,
  onToggle,
}: {
  liked: boolean;
  count?: number;
  memoryTitle: string;
  onToggle: () => void;
}) {
  return (
    <button
      className="like-button"
      data-liked={liked}
      aria-label={`Me gusta: ${memoryTitle}`}
      aria-pressed={liked}
      onClick={onToggle}
    >
      <Heart size={17} fill={liked ? "currentColor" : "none"} />
      {count !== undefined && <span>{count} </span>}
      {liked ? "Te gusta" : "Me gusta"}
    </button>
  );
}
