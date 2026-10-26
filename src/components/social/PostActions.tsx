import { Bookmark, Link2, MessageCircle, Quote, Repeat2, Send, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LikeButton from "./LikeButton";

export default function PostActions({
  memoryTitle,
  memoryId,
  memoryYear,
  liked,
  likeCount,
  commentCount,
  reposted,
  directUnrepost = false,
  repostCount,
  saved,
  onLike,
  onOpenComments,
  onSimpleRepost,
  onUnrepost,
  onQuote,
  onRepost,
  onSave,
}: {
  memoryTitle: string;
  memoryId?: string;
  memoryYear?: number;
  liked: boolean;
  likeCount?: number;
  commentCount: number;
  reposted: boolean;
  directUnrepost?: boolean;
  repostCount?: number;
  saved: boolean;
  onLike: () => void;
  onOpenComments: () => void;
  onSimpleRepost?: () => void;
  onUnrepost?: () => void | Promise<void>;
  onQuote?: () => void;
  onRepost?: () => void;
  onSave: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [removingRepost, setRemovingRepost] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const repostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [shareOpen]);

  useEffect(() => {
    if (!repostOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (repostRef.current && !repostRef.current.contains(event.target as Node)) {
        setRepostOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [repostOpen]);

  const shareUrl = typeof window !== "undefined"
    ? (memoryId ? `${window.location.origin}/recuerdo/${memoryId}` : window.location.href)
    : `/recuerdo/${memoryId ?? ""}`;
  const shareText = `Mirá este recuerdo${memoryYear ? ` de ${memoryYear}` : ""} en Nostalgiar: "${memoryTitle}"`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <footer>
      <LikeButton liked={liked} count={likeCount} memoryTitle={memoryTitle} onToggle={onLike} />
      <button onClick={onOpenComments}>
        <MessageCircle size={17} />
        {commentCount} Comentar
      </button>
      <div className="share-menu repost-menu" ref={repostRef}>
        <button
          type="button"
          className={`repost-button${reposted ? " is-reposted" : ""}`}
          aria-label={reposted && directUnrepost ? `Deshacer repost: ${memoryTitle}` : reposted ? `Opciones de repost (reposteado): ${memoryTitle}` : `Opciones de repost: ${memoryTitle}`}
          aria-expanded={reposted && directUnrepost ? undefined : repostOpen}
          aria-pressed={reposted}
          disabled={removingRepost}
          style={reposted ? { color: '#10b981', fontWeight: 600 } : undefined}
          onClick={async (event) => {
            event.stopPropagation();
            setShareOpen(false);
            if (reposted && directUnrepost) {
              if (removingRepost) return;
              setRepostOpen(false);
              setRemovingRepost(true);
              try {
                if (onUnrepost) await onUnrepost();
                else onRepost?.();
              } finally {
                setRemovingRepost(false);
              }
              return;
            }
            setRepostOpen((open) => !open);
          }}
        >
          <Repeat2 size={17} style={reposted ? { stroke: '#10b981', strokeWidth: 2.5 } : undefined} />
          {Boolean(repostCount && repostCount > 0) && <span>{repostCount} </span>}
          {reposted ? "Reposteado" : "Repostear"}
        </button>
        {repostOpen && (
          <div
            className="share-menu-panel repost-menu-panel"
            role="menu"
            onClick={(event) => event.stopPropagation()}
          >
            <span>{reposted ? "Opciones de repost" : "Difundir"}</span>
            <button
              type="button"
              onClick={() => {
                setRepostOpen(false);
                if (reposted) {
                  if (onUnrepost) onUnrepost();
                  else onRepost?.();
                } else {
                  if (onSimpleRepost) onSimpleRepost();
                  else onRepost?.();
                }
              }}
            >
              <Repeat2 size={15} style={reposted ? { stroke: '#ef4444' } : { stroke: '#10b981' }} />
              {reposted ? "Deshacer repost" : "Repostear"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRepostOpen(false);
                if (onQuote) onQuote();
                else onRepost?.();
              }}
            >
              <Quote size={15} />
              Citar recuerdo
            </button>
          </div>
        )}
      </div>
      <button
        aria-label={`Guardar: ${memoryTitle}`}
        aria-pressed={saved}
        onClick={onSave}
      >
        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
        {saved ? "Guardado" : "Guardar"}
      </button>
      <div className="share-menu" ref={shareRef}>
        <button
          type="button"
          aria-label={`Compartir: ${memoryTitle}`}
          aria-expanded={shareOpen}
          onClick={(event) => {
            event.stopPropagation();
            setRepostOpen(false);
            setShareOpen((open) => !open);
          }}
        >
          <Share2 size={17} />
          Compartir
        </button>
        {shareOpen && (
          <div
            className="share-menu-panel"
            role="menu"
            onClick={(event) => event.stopPropagation()}
          >
            <span>Compartir recuerdo</span>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)}>
              <Send size={15} /> WhatsApp
            </a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)}>
              <Link2 size={15} /> Facebook
            </a>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShareOpen(false)}>
              <span aria-hidden="true">𝕏</span> X
            </a>
            <button
              type="button"
              onClick={async (event) => {
                event.stopPropagation();
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                  setShareOpen(false);
                }, 2000);
              }}
            >
              <Link2 size={15} />
              {copied ? "¡Enlace copiado!" : "Copiar enlace"}
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
