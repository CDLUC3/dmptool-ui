import { CURRENT_SCHEMA_VERSION } from "@dmptool/types";
import {
  GuidanceSourceType,
  type MeQuery,
  type PlanAuthoringQuery,
} from "@/generated/graphql";
import {
  DATE_RANGE_QUESTION_TYPE,
  NUMBER_RANGE_QUESTION_TYPE,
} from "@/lib/constants";
import { isValidQuestionType } from "@/components/hooks/getParsedQuestionJSON";
import { formatRelativeFromTimestamp } from "@/utils/dateUtils";
import {
  deriveCommentActions,
  deriveCommentCapabilities,
  type NewCommentTarget,
} from "./commentCapabilities";
import {
  computeProgress,
  questionKey,
  type PlanAuthoringModel,
  type PlanComment,
  type PlanGuidanceOrgOption,
  type PlanGuidanceSource,
  type PlanQuestionDefinition,
  type PlanQuestionIdentity,
  type PlanQuestionJsonError,
  type PlanSectionDefinition,
  type PlanSectionIdentity,
} from "./model";

export type PlanAuthoringPlan = NonNullable<PlanAuthoringQuery["plan"]>;
export type PlanAuthoringSection = NonNullable<PlanAuthoringPlan["sections"]>[number];
export type PlanAuthoringQuestion = NonNullable<PlanAuthoringSection["questions"]>[number];
export type PlanAuthoringAnswer = NonNullable<PlanAuthoringQuestion["answer"]>;
export type PlanAuthoringGuidanceSource = NonNullable<
  PlanAuthoringQuestion["guidanceSources"]
>[number];
export type PlanAuthoringAvailableGuidanceSource = NonNullable<
  PlanAuthoringPlan["availableGuidanceSources"]
>[number];
export type PlanAuthoringMe = MeQuery["me"];

/** Everything the model needs that the plan query does not carry. */
export interface PlanAuthoringViewer {
  currentUserId: number;
  currentUserName: string;
  affiliationName: string;
  canComment: boolean;
  canModerateComments: boolean;
  /** Read by the data source only; never reaches the model. */
  newCommentTarget: NewCommentTarget;
  canCustomizeGuidance: boolean;
  formatCommentCreated: (created: string) => string;
}

export const EMPTY_PLAN_AUTHORING_VIEWER: PlanAuthoringViewer = {
  currentUserId: 0,
  currentUserName: "",
  affiliationName: "",
  canComment: false,
  canModerateComments: false,
  newCommentTarget: { kind: "answer" },
  canCustomizeGuidance: false,
  formatCommentCreated: (created) => created,
};

type Nullable<T> = T | null | undefined;

// Stored ranges are { start, end }; the renderer reads and emits these keys.
const RANGE_ANSWER_KEYS: Record<string, readonly [string, string]> = {
  [DATE_RANGE_QUESTION_TYPE]: ["startDate", "endDate"],
  [NUMBER_RANGE_QUESTION_TYPE]: ["startNumber", "endNumber"],
};

const CUSTOMIZATION_SOURCE_PREFIX = "customization-";

function compact<T>(items: Nullable<(T | null)[]>): T[] {
  return (items ?? []).filter((item): item is T => item != null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function fullName(person: Nullable<{ givenName?: string | null; surName?: string | null }>) {
  return [person?.givenName, person?.surName].filter(Boolean).join(" ");
}

export function toPlanAuthoringViewer({
  me,
  plan,
  locale,
}: {
  me: PlanAuthoringMe;
  plan: Nullable<PlanAuthoringPlan>;
  locale: string;
}): PlanAuthoringViewer {
  const { canModerateComments, newCommentTarget } =
    deriveCommentCapabilities({
      me: { role: me?.role },
      plan: {
        myAccessLevel: plan?.myAccessLevel,
        feedbackRounds: compact(plan?.feedback),
      },
    });

  return {
    currentUserId: me?.id ?? 0,
    currentUserName: fullName(me),
    affiliationName: me?.affiliation?.displayName ?? "",
    canCustomizeGuidance: plan != null && !plan.readOnly,
    // The plan query and addAnswerComment share one project permission check,
    // so anyone who loaded the plan can comment.
    canComment: plan != null,
    canModerateComments,
    newCommentTarget,
    formatCommentCreated: (created) =>
      formatRelativeFromTimestamp(created, locale),
  };
}

function toSectionIdentity(section: PlanAuthoringSection): PlanSectionIdentity {
  if (section.sectionType === "BASE" && section.versionedSectionId != null) {
    return { kind: "base", versionedSectionId: section.versionedSectionId };
  }
  if (section.sectionType === "CUSTOM" && section.customSectionId != null) {
    return { kind: "custom", customSectionId: section.customSectionId };
  }
  throw new Error(`${section.sectionType} plan section is missing its id`);
}

function toQuestionIdentity(question: PlanAuthoringQuestion): PlanQuestionIdentity {
  if (question.questionType === "BASE" && question.versionedQuestionId != null) {
    return { kind: "base", versionedQuestionId: question.versionedQuestionId };
  }
  if (question.questionType === "CUSTOM" && question.customQuestionId != null) {
    return { kind: "custom", customQuestionId: question.customQuestionId };
  }
  throw new Error(`${question.questionType} plan question is missing its id`);
}

function parseJsonObject(json: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(json);
  return isRecord(parsed) ? parsed : {};
}

function parseQuestionJson(json: Nullable<string>): {
  parsedJson: Record<string, unknown>;
  jsonError?: PlanQuestionJsonError;
} {
  if (!json) {
    return { parsedJson: {}, jsonError: "missing" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    console.error("Failed to parse plan question JSON", error);
    return { parsedJson: {}, jsonError: "parseFailed" };
  }
  if (!isRecord(parsed) || !isValidQuestionType(parsed)) {
    console.error("Unexpected plan question JSON format", parsed);
    return { parsedJson: {}, jsonError: "unexpectedFormat" };
  }
  return { parsedJson: parsed };
}

function fromStoredAnswerJson(
  questionType: string,
  json: Nullable<string>
): unknown | null {
  if (!json) {
    return null;
  }
  let stored: Record<string, unknown>;
  try {
    stored = parseJsonObject(json);
  } catch (error) {
    console.error("Failed to parse plan answer JSON", error);
    return null;
  }
  const { meta: _meta, ...answerJson } = stored;
  const rangeKeys = RANGE_ANSWER_KEYS[questionType];
  if (!rangeKeys || !isRecord(answerJson.answer)) {
    return answerJson;
  }
  const [startKey, endKey] = rangeKeys;
  return {
    ...answerJson,
    answer: {
      [startKey]: answerJson.answer.start ?? null,
      [endKey]: answerJson.answer.end ?? null,
    },
  };
}

export function toStoredAnswerJson(
  question: Pick<PlanQuestionDefinition, "questionType">,
  answerJson: unknown
): string {
  const record = isRecord(answerJson) ? answerJson : { answer: answerJson };
  const rangeKeys = RANGE_ANSWER_KEYS[question.questionType];
  const answer =
    rangeKeys && isRecord(record.answer)
      ? {
          start: record.answer[rangeKeys[0]] ?? null,
          end: record.answer[rangeKeys[1]] ?? null,
        }
      : (record.answer ?? null);
  return JSON.stringify({
    ...record,
    type: question.questionType,
    answer,
    meta: { schemaVersion: CURRENT_SCHEMA_VERSION },
  });
}

export type PlanCommentKind = "answer" | "feedback";

/** What the comment mutations need, keyed by PlanComment.id. */
export type PlanCommentRef =
  | { kind: "answer"; answerId: number; answerCommentId: number }
  | { kind: "feedback"; planFeedbackCommentId: number };

function planCommentId(kind: PlanCommentKind, id: number): string {
  return `${kind}-${id}`;
}

export function toPlanComment(
  kind: PlanCommentKind,
  comment: {
    id: number;
    authorId: number;
    authorName: string;
    created: Nullable<string>;
    text: string;
  },
  viewer: PlanAuthoringViewer
): PlanComment {
  return {
    id: planCommentId(kind, comment.id),
    authorId: comment.authorId,
    authorName: comment.authorName,
    createdLabel: comment.created
      ? viewer.formatCommentCreated(comment.created)
      : "",
    text: comment.text,
    isFeedback: kind === "feedback",
    ...deriveCommentActions(comment.authorId, viewer),
  };
}

type PlanAuthoringComment = NonNullable<PlanAuthoringAnswer["comments"]>[number];
type PlanAuthoringFeedbackComment = NonNullable<
  PlanAuthoringAnswer["feedbackComments"]
>[number];
type IdentifiedComment = (PlanAuthoringComment | PlanAuthoringFeedbackComment) & {
  id: number;
};

function answerCommentEntries(
  answer: Nullable<PlanAuthoringAnswer>
): { kind: PlanCommentKind; comment: IdentifiedComment }[] {
  const identified = (
    comments: Nullable<(PlanAuthoringComment | PlanAuthoringFeedbackComment)[]>
  ) =>
    compact(comments).filter(
      (comment): comment is IdentifiedComment => comment.id != null
    );
  return [
    ...identified(answer?.comments).map((comment) => ({
      kind: "answer" as const,
      comment,
    })),
    ...identified(answer?.feedbackComments).map((comment) => ({
      kind: "feedback" as const,
      comment,
    })),
  ];
}

function toComments(
  answer: Nullable<PlanAuthoringAnswer>,
  viewer: PlanAuthoringViewer
): PlanComment[] {
  const entries = answerCommentEntries(answer);
  // Same ordering as useComments: oldest first, undated last.
  entries.sort((a, b) => {
    if (!a.comment.created || !b.comment.created) {
      return Number(!a.comment.created) - Number(!b.comment.created);
    }
    return parseInt(a.comment.created, 10) - parseInt(b.comment.created, 10);
  });
  return entries.map(({ kind, comment }) => {
    const planComment = toPlanComment(
      kind,
      {
        id: comment.id,
        authorId: comment.user?.id ?? 0,
        authorName: fullName(comment.user),
        created: comment.created,
        text: comment.commentText ?? "",
      },
      viewer
    );
    const isEdited =
      comment.created != null &&
      comment.modified != null &&
      comment.modified !== comment.created;
    return isEdited ? { ...planComment, isEdited } : planComment;
  });
}

// Apollo always includes template owner and user affiliation guidance
// (customizations arrive as USER_AFFILIATION); only USER_SELECTED orgs come
// from planGuidance rows and can be removed.
function isAlwaysShownSource(source: PlanAuthoringGuidanceSource): boolean {
  return (
    source.type === GuidanceSourceType.TemplateOwner ||
    source.type === GuidanceSourceType.UserAffiliation
  );
}

// Both `affiliation-<uri>` and `customization-<uri>` sources can appear for
// one org on a question; they share a label, so they render as one tab keyed
// by orgURI, which is also what add/removePlanGuidance take.
function toGuidanceSources(
  sources: PlanAuthoringGuidanceSource[]
): PlanGuidanceSource[] {
  const byOrg = new Map<string, { source: PlanGuidanceSource; html: string[] }>();
  sources.forEach((source) => {
    const html = source.items.map((item) => item.guidanceText).filter(Boolean);
    const existing = byOrg.get(source.orgURI);
    if (existing) {
      existing.html = source.id.startsWith(CUSTOMIZATION_SOURCE_PREFIX)
        ? [...html, ...existing.html]
        : [...existing.html, ...html];
      existing.source.locked =
        existing.source.locked || isAlwaysShownSource(source);
      return;
    }
    byOrg.set(source.orgURI, {
      html,
      source: {
        id: source.orgURI,
        type: source.type,
        label: source.label,
        shortName: source.shortName,
        orgURI: source.orgURI,
        locked: isAlwaysShownSource(source),
        bodyHtml: "",
      },
    });
  });
  // The resolver attaches every plan source to every question, matched or not.
  return [...byOrg.values()]
    .filter(({ html }) => html.length > 0)
    .map(({ source, html }) => ({ ...source, bodyHtml: html.join("") }));
}

// The resolver carries question and customization samples on their guidance items.
function toQuestionSamples(sources: PlanAuthoringGuidanceSource[]) {
  const sampleFrom = (source: PlanAuthoringGuidanceSource | undefined) =>
    source?.items.find((item) => item.sampleText)?.sampleText;
  const questionSource = sources.find(
    (source) =>
      !source.id.startsWith(CUSTOMIZATION_SOURCE_PREFIX) &&
      sampleFrom(source) != null
  );
  const customizationSource = sources.find(
    (source) =>
      source.id.startsWith(CUSTOMIZATION_SOURCE_PREFIX) &&
      sampleFrom(source) != null
  );
  const sampleText = sampleFrom(questionSource);
  const customizationSampleText = sampleFrom(customizationSource);

  return {
    ...(sampleText && questionSource
      ? { sampleText, sampleTextOrgLabel: questionSource.label }
      : {}),
    ...(customizationSampleText && customizationSource
      ? {
          customizationSampleText,
          customizationSampleOrgLabel: customizationSource.label,
        }
      : {}),
  };
}

function toQuestion(
  question: PlanAuthoringQuestion,
  // Custom questions arrive spliced into place with no displayOrder, so the
  // resolver's array order is the display order.
  displayOrder: number,
  sectionIdentity: PlanSectionIdentity,
  plan: PlanAuthoringPlan,
  viewer: PlanAuthoringViewer
): PlanQuestionDefinition {
  const { parsedJson, jsonError } = parseQuestionJson(question.json);
  const questionType = typeof parsedJson.type === "string" ? parsedJson.type : "";
  const answerJson = fromStoredAnswerJson(questionType, question.answer?.json);
  const sources = compact(question.guidanceSources);

  return {
    identity: toQuestionIdentity(question),
    sectionIdentity,
    title: question.questionText ?? "",
    requirementHtml: question.requirementText ?? undefined,
    requirementOrgLabel: question.requirementText
      ? plan.versionedTemplate?.owner?.name
      : undefined,
    required: question.required ?? false,
    questionType,
    parsedJson,
    jsonError,
    answerJson,
    hasAnswer: question.hasAnswer ?? false,
    lastSavedAt: question.answer?.modified ?? undefined,
    guidanceSources: toGuidanceSources(sources),
    comments: toComments(question.answer, viewer),
    displayOrder,
    useSampleTextAsDefault: question.useSampleTextAsDefault ?? false,
    ...toQuestionSamples(sources),
  };
}

function toSection(
  section: PlanAuthoringSection,
  plan: PlanAuthoringPlan,
  viewer: PlanAuthoringViewer
): PlanSectionDefinition {
  const identity = toSectionIdentity(section);
  return {
    identity,
    title: section.title,
    introductionHtml: section.introduction ?? undefined,
    requirementsHtml: section.requirements ?? undefined,
    displayOrder: section.displayOrder,
    questions: compact(section.questions).map((question, index) =>
      toQuestion(question, index, identity, plan, viewer)
    ),
  };
}

// Apollo has no list of the plan's guidance selections, so they are read from
// the raw USER_SELECTED question sources, including ones with no items, so a
// selection without guidance on this plan's questions still counts.
function toUserSelectedOrgs(plan: PlanAuthoringPlan): PlanGuidanceOrgOption[] {
  return compact(plan.sections)
    .flatMap((section) => compact(section.questions))
    .flatMap((question) => compact(question.guidanceSources))
    .filter((source) => source.type === GuidanceSourceType.UserSelected)
    .map(({ label, shortName, orgURI }) => ({ id: orgURI, label, shortName, orgURI }));
}

// Displayed orgs are the always-shown sources plus every user-selected org.
function toSelectedGuidanceOrgs(
  plan: PlanAuthoringPlan,
  sections: PlanSectionDefinition[]
): PlanGuidanceOrgOption[] {
  const orgs = new Map<string, PlanGuidanceOrgOption>();
  sections
    .flatMap((section) => section.questions)
    .flatMap((question) => question.guidanceSources)
    .filter((source) => source.locked)
    .forEach(({ id, label, shortName, orgURI }) => {
      orgs.set(id, { id, label, shortName, orgURI: orgURI ?? id });
    });
  toUserSelectedOrgs(plan).forEach((org) => {
    if (!orgs.has(org.id)) {
      orgs.set(org.id, org);
    }
  });
  return [...orgs.values()];
}

function toAvailableGuidanceOrgs(
  sources: Nullable<(PlanAuthoringAvailableGuidanceSource | null)[]>,
  selected: PlanGuidanceOrgOption[]
): PlanGuidanceOrgOption[] {
  const orgs = new Map<string, PlanGuidanceOrgOption>();
  compact(sources)
    .filter(isOrganizationGuidanceSource)
    .forEach(({ label, shortName, orgURI }) => {
      orgs.set(orgURI, { id: orgURI, label, shortName, orgURI });
    });
  selected.forEach((org) => orgs.set(org.id, org));
  return [...orgs.values()];
}

function isOrganizationGuidanceSource(
  source: PlanAuthoringAvailableGuidanceSource
): boolean {
  return source.type !== GuidanceSourceType.BestPractice;
}

function toMembersLabel(plan: PlanAuthoringPlan): string {
  return compact(plan.members)
    .map((member) => {
      const roles = compact(member.memberRoles).map((role) => role.label);
      const name = fullName(member.projectMember);
      return roles.length > 0 ? `${name} (${roles.join(", ")})` : name;
    })
    .join(", ");
}

export function toPlanAuthoringModel(
  plan: PlanAuthoringPlan,
  viewer: PlanAuthoringViewer
): PlanAuthoringModel {
  const sections = compact(plan.sections).map((section) =>
    toSection(section, plan, viewer)
  );
  const guidanceOrgs = toSelectedGuidanceOrgs(plan, sections);
  const hasAvailableGuidanceOrgs = compact(
    plan.availableGuidanceSources
  ).some(isOrganizationGuidanceSource);

  return {
    title: plan.title ?? "",
    templateName: plan.versionedTemplate?.name ?? "",
    affiliationName: viewer.affiliationName,
    templateVersion: plan.versionedTemplate?.version ?? "",
    funderName:
      compact(plan.fundings)[0]?.projectFunding?.affiliation?.displayName ?? "",
    membersLabel: toMembersLabel(plan),
    currentUserId: viewer.currentUserId,
    currentUserName: viewer.currentUserName,
    // Recomputed from sections so it stays consistent with local saves.
    progress: computeProgress(sections),
    capabilities: {
      canEditAnswers: !plan.readOnly,
      canComment: viewer.canComment,
      canModerateComments: viewer.canModerateComments,
      canCustomizeGuidance:
        viewer.canCustomizeGuidance && hasAvailableGuidanceOrgs,
    },
    sections,
    availableGuidanceOrgs: toAvailableGuidanceOrgs(
      plan.availableGuidanceSources,
      guidanceOrgs
    ),
    selectedGuidanceOrgIds: guidanceOrgs.map((org) => org.id),
  };
}

/** Answer ids keyed by questionKey, so saves can choose update over add. */
export function collectAnswerIds(plan: PlanAuthoringPlan): Map<string, number> {
  const answerIds = new Map<string, number>();
  compact(plan.sections).forEach((section) => {
    compact(section.questions).forEach((question) => {
      const answerId = question.answer?.id;
      if (answerId != null) {
        answerIds.set(questionKey(toQuestionIdentity(question)), answerId);
      }
    });
  });
  return answerIds;
}

/** Comment refs keyed by questionKey, then by PlanComment.id. */
export function collectCommentRefs(
  plan: PlanAuthoringPlan
): Map<string, Map<string, PlanCommentRef>> {
  const refs = new Map<string, Map<string, PlanCommentRef>>();
  compact(plan.sections).forEach((section) => {
    compact(section.questions).forEach((question) => {
      const answerId = question.answer?.id;
      if (answerId == null) {
        return;
      }
      const questionRefs = new Map<string, PlanCommentRef>();
      answerCommentEntries(question.answer).forEach(({ kind, comment }) => {
        questionRefs.set(
          planCommentId(kind, comment.id),
          kind === "answer"
            ? { kind, answerId, answerCommentId: comment.id }
            : { kind, planFeedbackCommentId: comment.id }
        );
      });
      refs.set(questionKey(toQuestionIdentity(question)), questionRefs);
    });
  });
  return refs;
}
