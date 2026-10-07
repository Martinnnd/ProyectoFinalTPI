import {
  commentReactions,
  reactionEmoji,
  reactionLabel,
  type CommentReaction,
} from "../../socialTypes";

export default function ReactionPicker({
  selected,
  onSelect,
}: {
  selected?: CommentReaction;
  onSelect: (reaction: CommentReaction) => void;
}) {
  return (
    <div className="reaction-picker" role="toolbar" aria-label="Reacciones">
      {commentReactions.map((reaction) => (
        <button
          type="button"
          key={reaction}
          aria-label={reactionLabel[reaction]}
          aria-pressed={selected === reaction}
          title={reactionLabel[reaction]}
          onClick={() => onSelect(reaction)}
        >
          {reactionEmoji[reaction]}
        </button>
      ))}
    </div>
  );
}
