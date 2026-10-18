import { useState } from "react";
import type {
  CommentReaction,
  CommentsByMemory,
  MemoryComment,
} from "../socialTypes";
import { demoComments } from "@/components/social/demoComments";

function updateReaction(
  comment: MemoryComment,
  reaction: CommentReaction,
): MemoryComment {
  const reactions = { ...comment.reactions };
  const previous = comment.viewerReaction;

  if (previous) {
    const previousCount = reactions[previous] ?? 0;
    if (previousCount <= 1) delete reactions[previous];
    else reactions[previous] = previousCount - 1;
  }

  if (previous === reaction) {
    return { ...comment, reactions, viewerReaction: undefined };
  }

  reactions[reaction] = (reactions[reaction] ?? 0) + 1;
  return { ...comment, reactions, viewerReaction: reaction };
}

export default function useMemoryInteractions() {
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [commentsByMemory, setCommentsByMemory] = useState<CommentsByMemory>(demoComments);


  function isLiked(memoryId: string, initial = false) {
    return likes[memoryId] ?? initial;
  }

  function toggleLike(memoryId: string, initial = false) {
    setLikes(current => ({ ...current, [memoryId]: !(current[memoryId] ?? initial) }));
  }

  function setLiked(memoryId: string, liked: boolean) {
    setLikes(current => ({ ...current, [memoryId]: liked }));
  }

  function getComments(memoryId: string) {
    return commentsByMemory[memoryId] ?? [];
  }

  function addComment(memoryId: string, text: string, parentId?: string) {
    const cleanText = text.trim();
    if (!cleanText) return;

    const comment: MemoryComment = {
      id: crypto.randomUUID(),
      memoryId,
      parentId,
      author: "Vos",
      text: cleanText,
      createdAt: new Date().toISOString(),
      reactions: {},
    };

    setCommentsByMemory((current) => ({
      ...current,
      [memoryId]: [...(current[memoryId] ?? []), comment],
    }));
  }

  function reactToComment(
    memoryId: string,
    commentId: string,
    reaction: CommentReaction,
  ) {
    setCommentsByMemory((current) => ({
      ...current,
      [memoryId]: (current[memoryId] ?? []).map((comment) =>
        comment.id === commentId ? updateReaction(comment, reaction) : comment,
      ),
    }));
  }

  return {
    addComment,
    getComments,
    isLiked,
    setLiked,
    reactToComment,
    toggleLike,
  };
}
