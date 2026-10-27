import type { ApolloClient } from "@apollo/client";
import {
  CustomizableObjectOwnership,
  CustomizationPreviewConditionGroupsDocument,
  CustomizationPreviewCustomQuestionDocument,
  CustomizationPreviewCustomSectionDocument,
  CustomizationPreviewOverviewDocument,
  CustomizationPreviewQuestionCustomizationDocument,
  CustomizationPreviewSectionCustomizationDocument,
  CustomizationPreviewTemplateDocument,
} from "@/generated/graphql";
import type { PlanQuestionIdentity, PlanSectionIdentity } from "@/components/PlanAuthoring/model";
import type { PreviewDisplayLogic } from "@/components/PlanPreview/displayLogic";
import { loadPreviewGuidance } from "@/components/PlanPreview/loadPreviewGuidance";
import { PreviewNotFoundError } from "@/components/PlanPreview/previewError";
import { byDisplayOrder } from "@/components/PlanPreview/previewModel";
import { previewTagIds, type PreviewGuidanceLookup, type PreviewOrg } from "@/components/PlanPreview/previewGuidance";

export interface CustomizationPreviewQuestion {
  identity: PlanQuestionIdentity;
  questionText: string | null;
  requirementText: string | null;
  /** The template owner's for a base question; the customizing org's for a custom one. */
  guidanceText: string | null;
  sampleText: string | null;
  useSampleTextAsDefault: boolean;
  required: boolean;
  json: string | null;
  customization?: { guidanceText: string | null; sampleText: string | null };
}

export interface CustomizationPreviewSection {
  identity: PlanSectionIdentity;
  name: string;
  introduction: string | null;
  requirements: string | null;
  /** The template owner's for a base section; the customizing org's for a custom one. */
  guidance: string | null;
  customizationGuidance: string | null;
  tagIds: number[];
  questions: CustomizationPreviewQuestion[];
}

export interface CustomizationPreviewData {
  templateName: string;
  templateVersion: string;
  owner: PreviewOrg | null;
  /** The customizing org, which researchers using the customization belong to. */
  org: PreviewOrg | null;
  sections: CustomizationPreviewSection[];
  guidance: PreviewGuidanceLookup;
  /** Keyed by versionedQuestionId. Custom questions have no display logic. */
  displayLogic: Map<number, PreviewDisplayLogic>;
}

async function loadByIds<T>(ids: number[], load: (id: number) => Promise<T | null | undefined>) {
  const unique = [...new Set(ids)];
  const results = await Promise.all(unique.map(load));
  return new Map(unique.map((id, index) => [id, results[index] ?? null]));
}

export async function loadCustomizationPreview(
  client: ApolloClient,
  templateCustomizationId: number
): Promise<CustomizationPreviewData> {
  if (!Number.isInteger(templateCustomizationId) || templateCustomizationId <= 0) {
    throw new PreviewNotFoundError();
  }
  const { data } = await client.query({
    query: CustomizationPreviewOverviewDocument,
    variables: { templateCustomizationId },
    fetchPolicy: "network-only",
  });
  const overview = data?.templateCustomizationOverview;
  if (!overview?.versionedTemplateId) {
    throw new PreviewNotFoundError();
  }
  const overviewSections = (overview.sections ?? []).slice().sort(byDisplayOrder);
  const isCustom = (type: CustomizableObjectOwnership) => type === CustomizableObjectOwnership.Custom;
  const overviewQuestions = overviewSections.flatMap((section) => section.questions ?? []);

  const [template, sectionCustomizations, customSections, questionCustomizations, customQuestions] =
    await Promise.all([
      client
        .query({
          query: CustomizationPreviewTemplateDocument,
          variables: { versionedTemplateId: overview.versionedTemplateId },
          fetchPolicy: "network-only",
        })
        .then(({ data }) => data?.versionedTemplate),
      loadByIds(
        overviewSections
          .filter((section) => !isCustom(section.sectionType) && section.sectionCustomizationId)
          .map((section) => section.sectionCustomizationId as number),
        (sectionCustomizationId) =>
          client
            .query({
              query: CustomizationPreviewSectionCustomizationDocument,
              variables: { sectionCustomizationId },
              fetchPolicy: "network-only",
            })
            .then(({ data }) => data?.sectionCustomization)
      ),
      loadByIds(
        overviewSections.filter((section) => isCustom(section.sectionType)).map((section) => section.id),
        (customSectionId) =>
          client
            .query({
              query: CustomizationPreviewCustomSectionDocument,
              variables: { customSectionId },
              fetchPolicy: "network-only",
            })
            .then(({ data }) => data?.customSection)
      ),
      loadByIds(
        overviewQuestions
          .filter((question) => !isCustom(question.questionType) && question.questionCustomizationId)
          .map((question) => question.questionCustomizationId as number),
        (questionCustomizationId) =>
          client
            .query({
              query: CustomizationPreviewQuestionCustomizationDocument,
              variables: { questionCustomizationId },
              fetchPolicy: "network-only",
            })
            .then(({ data }) => data?.questionCustomization)
      ),
      loadByIds(
        overviewQuestions.filter((question) => isCustom(question.questionType)).map((question) => question.id),
        (customQuestionId) =>
          client
            .query({
              query: CustomizationPreviewCustomQuestionDocument,
              variables: { customQuestionId },
              fetchPolicy: "network-only",
            })
            .then(({ data }) => data?.customQuestion)
      ),
    ]);
  if (!template) {
    throw new PreviewNotFoundError();
  }

  const baseSections = new Map(
    (template.versionedSections ?? []).flatMap((section) => (section.id != null ? [[section.id, section]] : []))
  );
  const baseQuestions = new Map(
    [...baseSections.values()].flatMap((section) =>
      (section.versionedQuestions ?? []).flatMap((question) =>
        question.id != null ? [[question.id, question] as const] : []
      )
    )
  );

  const sections = overviewSections.flatMap((overviewSection): CustomizationPreviewSection[] => {
    const questions = (overviewSection.questions ?? [])
      .slice()
      .sort(byDisplayOrder)
      .flatMap((overviewQuestion): CustomizationPreviewQuestion[] => {
        if (isCustom(overviewQuestion.questionType)) {
          const question = customQuestions.get(overviewQuestion.id);
          return question
            ? [
                {
                  identity: { kind: "custom", customQuestionId: overviewQuestion.id },
                  questionText: question.questionText ?? null,
                  requirementText: question.requirementText ?? null,
                  guidanceText: question.guidanceText ?? null,
                  sampleText: question.sampleText ?? null,
                  useSampleTextAsDefault: question.useSampleTextAsDefault ?? false,
                  required: question.required ?? false,
                  json: question.json ?? null,
                },
              ]
            : [];
        }
        const question = baseQuestions.get(overviewQuestion.id);
        const customization = overviewQuestion.questionCustomizationId
          ? questionCustomizations.get(overviewQuestion.questionCustomizationId)
          : null;
        return question
          ? [
              {
                identity: { kind: "base", versionedQuestionId: overviewQuestion.id },
                questionText: question.questionText ?? null,
                requirementText: question.requirementText ?? null,
                guidanceText: question.guidanceText ?? null,
                sampleText: question.sampleText ?? null,
                useSampleTextAsDefault: question.useSampleTextAsDefault ?? false,
                required: question.required ?? false,
                json: question.json ?? null,
                ...(customization
                  ? {
                      customization: {
                        guidanceText: customization.guidanceText ?? null,
                        sampleText: customization.sampleText ?? null,
                      },
                    }
                  : {}),
              },
            ]
          : [];
      });

    if (isCustom(overviewSection.sectionType)) {
      const section = customSections.get(overviewSection.id);
      return section
        ? [
            {
              identity: { kind: "custom", customSectionId: overviewSection.id },
              name: section.name ?? "",
              introduction: section.introduction ?? null,
              requirements: section.requirements ?? null,
              guidance: section.guidance ?? null,
              customizationGuidance: null,
              // Custom sections' tags aren't in the API.
              tagIds: [],
              questions,
            },
          ]
        : [];
    }
    const section = baseSections.get(overviewSection.id);
    return section
      ? [
          {
            identity: { kind: "base", versionedSectionId: overviewSection.id },
            name: section.name,
            introduction: section.introduction ?? null,
            requirements: section.requirements ?? null,
            guidance: section.guidance ?? null,
            customizationGuidance: overviewSection.sectionCustomizationId
              ? sectionCustomizations.get(overviewSection.sectionCustomizationId)?.guidance ?? null
              : null,
            // Versioned questions don't expose their own tags, so section tags stand in.
            tagIds: previewTagIds(null, section.tags),
            questions,
          },
        ]
      : [];
  });

  const affiliation = data?.me?.affiliation;
  const org: PreviewOrg | null = affiliation
    ? { uri: affiliation.uri, displayName: affiliation.displayName, acronyms: affiliation.acronyms }
    : null;
  const owner = template.owner ?? null;
  const [guidance, conditionGroups] = await Promise.all([
    loadPreviewGuidance(client, {
      tagIds: sections.flatMap((section) => section.tagIds),
      ownerAffiliationId: owner?.uri,
      orgAffiliationId: org?.uri,
    }),
    loadByIds(
      [...baseQuestions.values()]
        .filter((question) => (question.versionedQuestionConditions ?? []).length > 0)
        .map((question) => question.id as number),
      (versionedQuestionId) =>
        client
          .query({
            query: CustomizationPreviewConditionGroupsDocument,
            variables: { versionedQuestionId },
            fetchPolicy: "network-only",
          })
          .then(({ data }) => data?.publishedConditionGroupsForQuestion)
    ),
  ]);

  // Trigger ids are the draft questions' ids, as in a plan.
  const versionedIdByQuestionId = new Map(
    [...baseQuestions.values()].flatMap((question) =>
      question.questionId != null ? [[question.questionId, question.id as number] as const] : []
    )
  );
  const displayLogic = new Map<number, PreviewDisplayLogic>();
  for (const [versionedQuestionId, groups] of conditionGroups) {
    const question = baseQuestions.get(versionedQuestionId);
    const presentGroups = (groups ?? []).filter((group) => group != null);
    if (!question || presentGroups.length === 0) {
      continue;
    }
    displayLogic.set(versionedQuestionId, {
      action: question.displayLogicAction,
      matchType: question.displayLogicMatchType,
      groups: presentGroups.map((group) => ({
        triggerQuestionId: versionedIdByQuestionId.get(group.triggerQuestionId) ?? null,
        conditions: (group.conditions ?? [])
          .filter((condition) => condition != null)
          .map(({ conditionType, conditionMatch }) => ({ conditionType, conditionMatch })),
      })),
    });
  }

  return {
    templateName: overview.versionedTemplateName ?? template.name,
    templateVersion: overview.versionedTemplateVersion ?? template.version,
    owner,
    org,
    sections,
    guidance,
    displayLogic,
  };
}
