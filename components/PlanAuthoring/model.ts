export type PlanSectionIdentity =
  | { kind: "base"; versionedSectionId: number }
  | { kind: "custom"; customSectionId: number };

export type PlanQuestionIdentity =
  | { kind: "base"; versionedQuestionId: number }
  | { kind: "custom"; customQuestionId: number };

export type PlanQuestionMode = "view" | "editing";

export type PlanQuestionSaveState =
  | "clean"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

export interface PlanCapabilities {
  canEditAnswers: boolean;
  canComment: boolean;
  /** Plan owners / moderators can delete any comment (mirrors planOwners in useComments). */
  canModerateComments: boolean;
  canCustomizeGuidance: boolean;
  canPublish: boolean;
}

export interface PlanGuidanceSource {
  id: string;
  label: string;
  shortName: string;
  orgURI?: string;
  locked?: boolean;
  bodyHtml: string;
}

export interface PlanGuidanceOrgOption {
  id: string;
  label: string;
  shortName: string;
  orgURI: string;
}

export interface PlanComment {
  id: number;
  /** Author user id — compared to currentUserId for edit/delete (mirrors MergedComment.user.id). */
  authorId: number;
  authorName: string;
  createdLabel: string;
  text: string;
  isFeedback?: boolean;
  /** True when modified differs from created (mirrors CommentList edited indicator). */
  isEdited?: boolean;
}

export interface PlanQuestionDefinition {
  identity: PlanQuestionIdentity;
  sectionIdentity: PlanSectionIdentity;
  title: string;
  requirementHtml?: string;
  required: boolean;
  questionType: string;
  parsedJson: Record<string, unknown>;
  answerJson: unknown | null;
  hasAnswer: boolean;
  guidanceSources: PlanGuidanceSource[];
  comments: PlanComment[];
  displayOrder: number;
  sampleText?: string | null;
  customizationSampleText?: string | null;
  useSampleTextAsDefault?: boolean;
  sampleTextOrgLabel?: string;
  customizationSampleOrgLabel?: string;
}

export interface PlanSectionDefinition {
  identity: PlanSectionIdentity;
  title: string;
  introductionHtml?: string;
  requirementsHtml?: string;
  displayOrder: number;
  questions: PlanQuestionDefinition[];
}

export interface PlanAuthoringProgress {
  answeredQuestions: number;
  totalQuestions: number;
  percentComplete: number;
}

export type PlanAuthoringVariant = "questions" | "document";

export interface PlanDocument {
  fileName: string;
  fileType?: string;
  doi?: string | null;
  modified?: string | null;
  created?: string | null;
  downloadHref?: string;
}

export interface PlanAuthoringModel {
  title: string;
  templateName: string;
  affiliationName: string;
  templateVersion: string;
  funderName: string;
  membersLabel: string;
  relatedWorksLabel: string;
  /** Signed-in user id — mirrors me.me.id for comment ownership checks. */
  currentUserId: number;
  currentUserName: string;
  progress: PlanAuthoringProgress;
  capabilities: PlanCapabilities;
  sections: PlanSectionDefinition[];
  availableGuidanceOrgs: PlanGuidanceOrgOption[];
  selectedGuidanceOrgIds: string[];
}

export function sectionKey(identity: PlanSectionIdentity): string {
  return identity.kind === "base"
    ? `base-section-${identity.versionedSectionId}`
    : `custom-section-${identity.customSectionId}`;
}

export function questionKey(identity: PlanQuestionIdentity): string {
  return identity.kind === "base"
    ? `base-question-${identity.versionedQuestionId}`
    : `custom-question-${identity.customQuestionId}`;
}

export function sectionAnchorId(identity: PlanSectionIdentity): string {
  return `plan-section-${sectionKey(identity)}`;
}

export function questionAnchorId(identity: PlanQuestionIdentity): string {
  return `plan-question-${questionKey(identity)}`;
}

export function computeProgress(
  sections: PlanSectionDefinition[]
): PlanAuthoringProgress {
  const totalQuestions = sections.reduce(
    (sum, section) => sum + section.questions.length,
    0
  );
  const answeredQuestions = sections.reduce(
    (sum, section) =>
      sum + section.questions.filter((question) => question.hasAnswer).length,
    0
  );
  const percentComplete =
    totalQuestions === 0
      ? 0
      : Math.round((answeredQuestions / totalQuestions) * 100);

  return { answeredQuestions, totalQuestions, percentComplete };
}

export function collectLockedGuidanceOrgIds(
  sections: PlanSectionDefinition[]
): string[] {
  const locked = new Set<string>();
  sections.forEach((section) => {
    section.questions.forEach((question) => {
      question.guidanceSources.forEach((source) => {
        if (source.locked) {
          locked.add(source.id);
        }
      });
    });
  });
  return Array.from(locked);
}
