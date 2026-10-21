export type NewCommentTarget =
  | { kind: "answer" }
  | { kind: "feedback"; planFeedbackId: number };

export interface CommentPermissionFacts {
  role?: string | null;
  myAccessLevel?: string | null;
  feedbackRounds: {
    id?: number | null;
    requested?: string | null;
    completed?: string | null;
  }[];
}

export interface CommentCapabilities {
  canModerateComments: boolean;
  newCommentTarget: NewCommentTarget;
}

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

export function deriveCommentCapabilities({
  role,
  myAccessLevel,
  feedbackRounds,
}: CommentPermissionFacts): CommentCapabilities {
  const openRoundId = feedbackRounds.find(
    (round) => round.requested != null && round.completed == null
  )?.id;

  return {
    canModerateComments: myAccessLevel === "PRIMARY",
    newCommentTarget:
      ADMIN_ROLES.has(role ?? "") && openRoundId != null
        ? { kind: "feedback", planFeedbackId: openRoundId }
        : { kind: "answer" },
  };
}

export function deriveCommentActions(
  authorId: number,
  viewer: { currentUserId: number; canModerateComments: boolean }
): { canEdit: boolean; canDelete: boolean } {
  const isOwn = viewer.currentUserId !== 0 && authorId === viewer.currentUserId;
  return { canEdit: isOwn, canDelete: isOwn || viewer.canModerateComments };
}
