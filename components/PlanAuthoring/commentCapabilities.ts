export type NewCommentTarget =
  | { kind: "answer" }
  | { kind: "feedback"; planFeedbackId: number };

export interface CommentPermissionFacts {
  me: {
    id?: number | null;
    role?: string | null;
    affiliationUri?: string | null;
  };
  plan: {
    createdById?: number | null;
    creatorAffiliationUri?: string | null;
    collaborators: { userId?: number | null; accessLevel?: string | null }[];
    feedbackRounds: { id?: number | null; completed?: string | null }[];
  };
}

export interface CommentCapabilities {
  canComment: boolean;
  canModerateComments: boolean;
  newCommentTarget: NewCommentTarget;
}

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

function isKnownId(id: number | null | undefined): id is number {
  return id != null;
}

export function deriveCommentCapabilities({
  me,
  plan,
}: CommentPermissionFacts): CommentCapabilities {
  const isAdmin = ADMIN_ROLES.has(me.role ?? "");
  const planOrgUri = plan.creatorAffiliationUri ?? "";
  const openRound = plan.feedbackRounds.find((round) => round.completed == null);
  const collaboratorIds = plan.collaborators
    .map((collaborator) => collaborator.userId)
    .filter(isKnownId);
  const planOwnerIds = [
    plan.createdById,
    ...plan.collaborators
      .filter((collaborator) => collaborator.accessLevel === "OWN")
      .map((collaborator) => collaborator.userId),
  ].filter(isKnownId);
  const isMember =
    me.id != null &&
    (collaboratorIds.includes(me.id) || planOwnerIds.includes(me.id));

  const openRoundId = openRound?.id;

  return {
    canComment:
      (isAdmin && me.affiliationUri === planOrgUri && openRound != null) ||
      isMember,
    // Mirrors the server's canDeleteComment: the author or a PRIMARY collaborator.
    canModerateComments:
      me.id != null &&
      plan.collaborators.some(
        (collaborator) =>
          collaborator.userId === me.id && collaborator.accessLevel === "PRIMARY"
      ),
    // Unlike canComment, the kind check does not compare the admin's org to the plan's.
    newCommentTarget:
      isAdmin && planOrgUri !== "" && openRoundId != null
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
