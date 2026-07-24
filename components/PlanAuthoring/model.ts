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
  authorName: string;
  createdLabel: string;
  text: string;
  isFeedback?: boolean;
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

export interface PlanAuthoringModel {
  title: string;
  templateName: string;
  affiliationName: string;
  templateVersion: string;
  funderName: string;
  membersLabel: string;
  relatedWorksLabel: string;
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
