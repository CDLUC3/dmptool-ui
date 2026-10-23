import type { TemplatePreviewQuery } from "@/generated/graphql";
import { byDisplayOrder, PREVIEW_CAPABILITIES } from "@/components/PlanPreview/previewModel";
import {
  computeProgress,
  type PlanAuthoringModel,
  type PlanQuestionDefinition,
  type PlanSectionDefinition,
  type PlanSectionIdentity,
} from "@/components/PlanAuthoring/model";
import { parseQuestionJson } from "@/components/PlanAuthoring/toPlanAuthoringModel";
import type { PreviewDisplayLogic } from "@/components/PlanPreview/displayLogic";
import {
  EMPTY_GUIDANCE_LOOKUP,
  previewTagIds,
  toPreviewGuidanceSources,
  type PreviewExampleGuidance,
  type PreviewGuidanceLookup,
} from "@/components/PlanPreview/previewGuidance";

export { EXAMPLE_ORG_GUIDANCE_ID } from "@/components/PlanPreview/previewGuidance";
export type TemplatePreviewExampleGuidance = PreviewExampleGuidance;

export type TemplatePreviewTemplate = NonNullable<TemplatePreviewQuery["template"]>;
type TemplatePreviewOwner = TemplatePreviewTemplate["owner"];
export type TemplatePreviewSection = NonNullable<
  NonNullable<TemplatePreviewTemplate["sections"]>[number]
>;
export type TemplatePreviewQuestion = NonNullable<TemplatePreviewSection["questions"]>[number];

export interface TemplatePreviewData {
  template: TemplatePreviewTemplate;
  guidance: PreviewGuidanceLookup;
}

function withId<T extends { id?: number | null }>(
  items: (T | null)[] | null | undefined
): (T & { id: number })[] {
  return (items ?? []).filter(
    (item): item is T & { id: number } => item?.id != null
  );
}

export function templateTagIds(template: TemplatePreviewTemplate): number[] {
  return withId(template.sections).flatMap((section) => [
    ...previewTagIds(section.tags, null),
    ...(section.questions ?? []).flatMap((question) => previewTagIds(question?.tags, null)),
  ]);
}

function toQuestion(
  question: TemplatePreviewQuestion & { id: number },
  section: TemplatePreviewSection,
  sectionIdentity: PlanSectionIdentity,
  owner: TemplatePreviewOwner,
  guidance: PreviewGuidanceLookup,
  exampleGuidance: PreviewExampleGuidance
): PlanQuestionDefinition {
  const { parsedJson, jsonError } = parseQuestionJson(question.json);
  const ownerName = owner?.displayName;

  return {
    // Draft ids stand in for versioned ids; they are only used as keys and anchors.
    identity: { kind: "base", versionedQuestionId: question.id },
    sectionIdentity,
    title: question.questionText ?? "",
    requirementHtml: question.requirementText ?? undefined,
    requirementOrgLabel: question.requirementText ? ownerName : undefined,
    required: question.required ?? false,
    questionType: typeof parsedJson.type === "string" ? parsedJson.type : "",
    parsedJson,
    jsonError,
    answerJson: null,
    hasAnswer: false,
    guidanceSources: toPreviewGuidanceSources({
      tagIds: previewTagIds(question.tags, section.tags),
      guidance,
      owner,
      ownerGuidanceHtml: [section.guidance, question.guidanceText],
      researcher: { kind: "example", example: exampleGuidance },
    }),
    comments: [],
    useSampleTextAsDefault: question.useSampleTextAsDefault ?? false,
    ...(question.sampleText
      ? { sampleText: question.sampleText, sampleTextOrgLabel: ownerName }
      : {}),
  };
}

function toSection(
  section: TemplatePreviewSection & { id: number },
  owner: TemplatePreviewOwner,
  guidance: PreviewGuidanceLookup,
  exampleGuidance: PreviewExampleGuidance
): PlanSectionDefinition {
  const identity: PlanSectionIdentity = {
    kind: "base",
    versionedSectionId: section.id,
  };
  return {
    identity,
    title: section.name,
    introductionHtml: section.introduction ?? undefined,
    requirementsHtml: section.requirements ?? undefined,
    questions: withId(section.questions)
      .sort(byDisplayOrder)
      .map((question) => toQuestion(question, section, identity, owner, guidance, exampleGuidance)),
  };
}

export function toTemplatePreviewModel(
  template: TemplatePreviewTemplate,
  exampleGuidance: PreviewExampleGuidance,
  guidance: PreviewGuidanceLookup = EMPTY_GUIDANCE_LOOKUP
): PlanAuthoringModel {
  const sections = withId(template.sections)
    .sort(byDisplayOrder)
    .map((section) => toSection(section, template.owner, guidance, exampleGuidance));

  return {
    title: template.name,
    templateName: template.name,
    affiliationName: template.owner?.displayName ?? "",
    templateVersion: template.latestPublishVersion ?? "",
    funderName: "",
    membersLabel: "",
    progress: computeProgress(sections),
    capabilities: PREVIEW_CAPABILITIES,
    sections,
    availableGuidanceOrgs: [],
    selectedGuidanceOrgIds: [],
  };
}

/** Draft question ids are what the condition groups' trigger ids refer to. */
export function toTemplateDisplayLogic(
  template: TemplatePreviewTemplate
): Map<number, PreviewDisplayLogic> {
  const logic = new Map<number, PreviewDisplayLogic>();
  for (const section of withId(template.sections)) {
    for (const question of withId(section.questions)) {
      const groups = (question.conditionGroups ?? []).filter((group) => group != null);
      if (groups.length > 0) {
        logic.set(question.id, {
          action: question.displayLogicAction,
          matchType: question.displayLogicMatchType,
          groups: groups.map((group) => ({
            triggerQuestionId: group.triggerQuestionId,
            conditions: (group.conditions ?? [])
              .filter((condition) => condition != null)
              .map((condition) => ({
                conditionType: condition.conditionType,
                conditionMatch: condition.conditionMatch,
              })),
          })),
        });
      }
    }
  }
  return logic;
}
