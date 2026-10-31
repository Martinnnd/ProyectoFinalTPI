export const commentReactions = ["like", "love", "laugh", "surprise", "sad"] as const;

export type CommentReaction = (typeof commentReactions)[number];

export const reactionEmoji: Record<CommentReaction, string> = {
  like: "👍",
  love: "❤️",
  laugh: "😂",
  surprise: "😮",
  sad: "😢",
};

export const reactionLabel: Record<CommentReaction, string> = {
  like: "Me gusta",
  love: "Me encanta",
  laugh: "Me divierte",
  surprise: "Me sorprende",
  sad: "Me entristece",
};

export interface MemoryComment {
  id: string;
  memoryId: string;
  parentId?: string;
  author?: string;
  text?: string;
  createdAt: string;
  deleted: boolean;
  canDelete: boolean;
  replyCount: number;
  repliesCursor?: string | null;
  reactions: Partial<Record<CommentReaction, number>>;
  viewerReaction?: CommentReaction;
}

export type FeedTab = "all" | "following" | "groups";
