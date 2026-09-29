import { CURRENT_SCHEMA_VERSION } from "@dmptool/types";
import { GuidanceSourceType, UserRole } from "@/generated/graphql";
import type { CommentPermissionFacts } from "../commentCapabilities";
import type {
  PlanAuthoringModel,
  PlanComment,
  PlanGuidanceOrgOption,
  PlanGuidanceSource,
  PlanQuestionDefinition,
  PlanSectionDefinition,
} from "../model";
import {
  EMPTY_PLAN_AUTHORING_VIEWER,
  type PlanAuthoringAnswer,
  type PlanAuthoringGuidanceSource,
  type PlanAuthoringMe,
  type PlanAuthoringPlan,
  type PlanAuthoringQuestion,
  type PlanAuthoringSection,
  type PlanAuthoringViewer,
} from "../toPlanAuthoringModel";

export function makeQuestion(
  overrides: Partial<PlanQuestionDefinition> = {}
): PlanQuestionDefinition {
  const questionType = overrides.questionType ?? "text";
  return {
    identity: { kind: "base", versionedQuestionId: 101 },
    sectionIdentity: { kind: "base", versionedSectionId: 1 },
    title: "What data will you collect?",
    required: false,
    questionType,
    parsedJson: { type: questionType, attributes: {} },
    answerJson: null,
    hasAnswer: false,
    guidanceSources: [],
    comments: [],
    displayOrder: 1,
    ...overrides,
  };
}

export function makeSection(
  overrides: Partial<PlanSectionDefinition> = {}
): PlanSectionDefinition {
  return {
    identity: { kind: "base", versionedSectionId: 1 },
    title: "Data collection",
    displayOrder: 1,
    questions: [],
    ...overrides,
  };
}

export function makeModel(
  overrides: Partial<PlanAuthoringModel> = {}
): PlanAuthoringModel {
  return {
    title: "Ocean Currents DMP",
    templateName: "NSF Template",
    affiliationName: "CDL",
    templateVersion: "v2",
    funderName: "NSF",
    membersLabel: "Ada Lovelace",
    currentUserId: 1,
    currentUserName: "Ada Lovelace",
    progress: { answeredQuestions: 1, totalQuestions: 2, percentComplete: 50 },
    capabilities: {
      canEditAnswers: true,
      canComment: true,
      canModerateComments: false,
      canCustomizeGuidance: false,
    },
    sections: [
      makeSection({
        introductionHtml: "<p>How you gather data.</p>",
        requirementsHtml: "<p>Funder requirements for data.</p>",
        questions: [
          makeQuestion({
            identity: { kind: "base", versionedQuestionId: 11 },
            required: true,
            answerJson: { type: "text", answer: "Surveys" },
            hasAnswer: true,
          }),
        ],
      }),
      makeSection({
        identity: { kind: "custom", customSectionId: 2 },
        title: "Custom sharing section",
        displayOrder: 2,
        questions: [
          makeQuestion({
            identity: { kind: "custom", customQuestionId: 21 },
            sectionIdentity: { kind: "custom", customSectionId: 2 },
            title: "Who can access the data?",
          }),
        ],
      }),
    ],
    availableGuidanceOrgs: [],
    selectedGuidanceOrgIds: [],
    ...overrides,
  };
}

export function makeViewer(
  overrides: Partial<PlanAuthoringViewer> = {}
): PlanAuthoringViewer {
  return { ...EMPTY_PLAN_AUTHORING_VIEWER, ...overrides };
}

export function makeComment(overrides: Partial<PlanComment> = {}): PlanComment {
  return {
    id: "answer-1",
    authorId: 1,
    authorName: "Ada Lovelace",
    createdLabel: "2 days ago",
    text: "First comment",
    canEdit: true,
    canDelete: true,
    ...overrides,
  };
}

export function makeGuidanceSource(
  overrides: Partial<PlanGuidanceSource> = {}
): PlanGuidanceSource {
  return {
    id: "nsf",
    type: "TEMPLATE_OWNER",
    label: "NSF guidance label",
    shortName: "NSF",
    bodyHtml: "<p>NSF says hello</p>",
    ...overrides,
  };
}

export function makeGuidanceOrg(
  overrides: Partial<PlanGuidanceOrgOption> = {}
): PlanGuidanceOrgOption {
  return {
    id: "org-1",
    label: "University of Example",
    shortName: "UoE",
    orgURI: "https://ror.org/example",
    ...overrides,
  };
}

export function makeRawQuestion(
  overrides: Partial<PlanAuthoringQuestion> = {}
): PlanAuthoringQuestion {
  const identity =
    overrides.questionType === "CUSTOM"
      ? { questionType: "CUSTOM", customQuestionId: 200 }
      : { questionType: "BASE", versionedQuestionId: 100 };
  return {
    ...identity,
    json: '{"type":"text"}',
    guidanceSources: [],
    ...overrides,
  };
}

export function makeRawSection(
  overrides: Partial<PlanAuthoringSection> = {}
): PlanAuthoringSection {
  const identity =
    overrides.sectionType === "CUSTOM"
      ? { sectionType: "CUSTOM", customSectionId: 20 }
      : { sectionType: "BASE", versionedSectionId: 10 };
  return {
    ...identity,
    title: "Section",
    displayOrder: 1,
    questions: [],
    ...overrides,
  };
}

export function makeRawPlan(
  overrides: Partial<PlanAuthoringPlan> = {}
): PlanAuthoringPlan {
  return {
    id: 7,
    title: "Ocean plan",
    readOnly: false,
    versionedTemplate: { id: 55, name: "NSF", version: "v2" },
    project: { collaborators: [] },
    feedback: [],
    members: [],
    fundings: [],
    sections: [],
    ...overrides,
  };
}

/** A stored answer: `{ type, answer, meta }` JSON, as the API returns it. */
export function makeRawAnswer(
  type: string,
  answer: unknown,
  overrides: Partial<PlanAuthoringAnswer> = {}
): PlanAuthoringAnswer {
  return {
    id: 1,
    json: JSON.stringify({
      type,
      answer,
      meta: { schemaVersion: CURRENT_SCHEMA_VERSION },
    }),
    comments: [],
    feedbackComments: [],
    ...overrides,
  };
}

// Without __typename it fits both answer.comments and answer.feedbackComments.
type RawComment = Omit<NonNullable<PlanAuthoringAnswer["comments"]>[number], "__typename">;

export function makeRawComment(overrides: Partial<RawComment> = {}): RawComment {
  return {
    id: 1,
    commentText: "Please expand",
    created: "1000",
    user: { id: 3, givenName: "Ann", surName: "Lee" },
    ...overrides,
  };
}

/** An org's guidance on one question; the resolver ids it `affiliation-<uri>`. */
export function makeRawGuidanceSource(
  overrides: Partial<PlanAuthoringGuidanceSource> & { orgURI: string }
): PlanAuthoringGuidanceSource {
  return {
    id: `affiliation-${overrides.orgURI}`,
    type: GuidanceSourceType.UserSelected,
    label: overrides.orgURI,
    shortName: overrides.orgURI,
    items: [],
    ...overrides,
  };
}

export function makeRawMe(
  overrides: Partial<NonNullable<PlanAuthoringMe>> = {}
): NonNullable<PlanAuthoringMe> {
  return {
    id: 1,
    givenName: "Ada",
    surName: "Lovelace",
    languageId: "en-US",
    role: UserRole.Researcher,
    affiliation: {
      name: "California Digital Library",
      displayName: "California Digital Library",
      searchName: "California Digital Library",
      uri: "https://ror.org/03yrm5c26",
      feedbackEnabled: false,
    },
    ...overrides,
  };
}

export function makeCommentPermissionPlan(
  overrides: Partial<CommentPermissionFacts["plan"]> = {}
): CommentPermissionFacts["plan"] {
  return {
    createdById: 1,
    creatorAffiliationUri: "https://ror.org/ucop",
    collaborators: [
      { userId: 2, accessLevel: "EDIT" },
      { userId: 4, accessLevel: "OWN" },
      { userId: 5, accessLevel: "PRIMARY" },
      { userId: 6, accessLevel: "COMMENT" },
    ],
    feedbackRounds: [
      { id: 30, completed: "1751929006000" },
      { id: 31, completed: null },
    ],
    ...overrides,
  };
}
