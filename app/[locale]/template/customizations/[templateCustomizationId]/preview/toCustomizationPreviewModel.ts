import {
  computeProgress,
  type PlanAuthoringModel,
  type PlanQuestionDefinition,
  type PlanSectionDefinition,
} from "@/components/PlanAuthoring/model";
import { parseQuestionJson } from "@/components/PlanAuthoring/toPlanAuthoringModel";
import {
  EMPTY_GUIDANCE_LOOKUP,
  toPreviewGuidanceSources,
  type PreviewResearcherGuidance,
} from "@/components/PlanPreview/previewGuidance";
import { PREVIEW_CAPABILITIES } from "@/components/PlanPreview/previewModel";
import type {
  CustomizationPreviewData,
  CustomizationPreviewQuestion,
  CustomizationPreviewSection,
} from "./customizationPreviewData";

function toQuestion(
  question: CustomizationPreviewQuestion,
  section: CustomizationPreviewSection,
  { owner, org, guidance }: CustomizationPreviewData
): PlanQuestionDefinition {
  const { parsedJson, jsonError } = parseQuestionJson(question.json);
  const isCustom = question.identity.kind === "custom";
  const authorName = isCustom ? org?.displayName : owner?.displayName;
  const orgGuidanceHtml = isCustom
    ? // The plan only adds a custom section's guidance to its custom questions.
      [section.identity.kind === "custom" ? section.guidance : null, question.guidanceText]
    : [section.customizationGuidance, question.customization?.guidanceText];
  const researcher: PreviewResearcherGuidance = org
    ? { kind: "org", org, guidanceHtml: orgGuidanceHtml }
    : { kind: "none" };
  const customizationSampleText = question.customization?.sampleText;

  return {
    identity: question.identity,
    sectionIdentity: section.identity,
    title: question.questionText ?? "",
    requirementHtml: question.requirementText ?? undefined,
    requirementOrgLabel: question.requirementText ? authorName : undefined,
    required: question.required,
    questionType: typeof parsedJson.type === "string" ? parsedJson.type : "",
    parsedJson,
    jsonError,
    answerJson: null,
    hasAnswer: false,
    // Custom questions only get their org's guidance in a plan.
    guidanceSources: isCustom
      ? toPreviewGuidanceSources({ tagIds: [], guidance: EMPTY_GUIDANCE_LOOKUP, owner: null, researcher })
      : toPreviewGuidanceSources({
          tagIds: section.tagIds,
          guidance,
          owner,
          ownerGuidanceHtml: [section.guidance, question.guidanceText],
          researcher,
        }),
    comments: [],
    useSampleTextAsDefault: question.useSampleTextAsDefault,
    ...(question.sampleText ? { sampleText: question.sampleText, sampleTextOrgLabel: authorName } : {}),
    ...(customizationSampleText?.trim()
      ? { customizationSampleText, customizationSampleOrgLabel: org?.displayName }
      : {}),
  };
}

function toSection(section: CustomizationPreviewSection, data: CustomizationPreviewData): PlanSectionDefinition {
  return {
    identity: section.identity,
    title: section.name,
    introductionHtml: section.introduction ?? undefined,
    requirementsHtml: section.requirements ?? undefined,
    questions: section.questions.map((question) => toQuestion(question, section, data)),
  };
}

export function toCustomizationPreviewModel(data: CustomizationPreviewData): PlanAuthoringModel {
  const sections = data.sections.map((section) => toSection(section, data));
  return {
    title: data.templateName,
    templateName: data.templateName,
    affiliationName: data.owner?.displayName ?? "",
    templateVersion: data.templateVersion,
    funderName: "",
    membersLabel: "",
    progress: computeProgress(sections),
    capabilities: PREVIEW_CAPABILITIES,
    sections,
    availableGuidanceOrgs: [],
    selectedGuidanceOrgIds: [],
  };
}
