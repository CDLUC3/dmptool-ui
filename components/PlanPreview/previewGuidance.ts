import { GuidanceSourceType } from "@/generated/graphql";
import {
  BEST_PRACTICE_GUIDANCE_LABEL,
  type PlanGuidanceSource,
} from "@/components/PlanAuthoring/model";

export interface PreviewOrg {
  uri: string;
  displayName: string;
  displayAbbreviation?: string | null;
  acronyms?: (string | null)[] | null;
}

interface PreviewTagGuidance {
  tagId?: number | null;
  guidanceText?: string | null;
}

export interface PreviewGuidanceLookup {
  bestPractice: PreviewTagGuidance[];
  owner: PreviewTagGuidance[];
  org: PreviewTagGuidance[];
}

export const EMPTY_GUIDANCE_LOOKUP: PreviewGuidanceLookup = { bestPractice: [], owner: [], org: [] };

export interface PreviewExampleGuidance {
  label: string;
  shortName: string;
  bodyHtml: string;
  /** Added after bodyHtml when the template has no guidance of its own for the question. */
  noTemplateGuidanceNoteHtml: string;
}

export type PreviewResearcherGuidance =
  | { kind: "example"; example: PreviewExampleGuidance }
  /** guidanceHtml is the org's own customization guidance, shown before its tag guidance. */
  | { kind: "org"; org: PreviewOrg; guidanceHtml?: (string | null | undefined)[] }
  | { kind: "none" };

export const EXAMPLE_ORG_GUIDANCE_ID = "template-preview-example-org";

function orgShortName(org: PreviewOrg): string {
  return org.displayAbbreviation || org.acronyms?.find(Boolean) || org.displayName;
}

interface PreviewTag {
  id?: number | null;
}

/** A question's own tags, or its section's when it has none, as the API does. */
export function previewTagIds(
  questionTags: (PreviewTag | null)[] | null | undefined,
  sectionTags: (PreviewTag | null)[] | null | undefined
): number[] {
  const ids = (tags: (PreviewTag | null)[] | null | undefined) =>
    (tags ?? []).map((tag) => tag?.id).filter((id): id is number => id != null);
  const own = ids(questionTags);
  return own.length > 0 ? own : ids(sectionTags);
}

function nonBlank(html: (string | null | undefined)[] | undefined): string[] {
  return (html ?? []).filter((item): item is string => Boolean(item?.trim()));
}

function tagGuidanceHtml(items: PreviewTagGuidance[], tagIds: number[]): string[] {
  return tagIds.flatMap((tagId) =>
    items
      .filter((item) => item.tagId === tagId && item.guidanceText)
      .map((item) => item.guidanceText as string)
  );
}

function orgSource(
  org: PreviewOrg,
  type: GuidanceSourceType,
  html: string[]
): PlanGuidanceSource[] {
  return html.length > 0
    ? [
        {
          id: org.uri,
          type,
          label: org.displayName,
          shortName: orgShortName(org),
          locked: true,
          bodyHtml: html.join(""),
        },
      ]
    : [];
}

/** The guidance tabs a researcher would see on a question, in the API's order. */
export function toPreviewGuidanceSources({
  tagIds,
  guidance,
  owner,
  ownerGuidanceHtml,
  researcher,
}: {
  tagIds: number[];
  guidance: PreviewGuidanceLookup;
  owner: PreviewOrg | null | undefined;
  /** Section then question guidance, shown before the owner's tag guidance. */
  ownerGuidanceHtml?: (string | null | undefined)[];
  researcher: PreviewResearcherGuidance;
}): PlanGuidanceSource[] {
  const bestPracticeHtml = tagGuidanceHtml(guidance.bestPractice, tagIds);
  const bestPractice: PlanGuidanceSource[] =
    bestPracticeHtml.length > 0
      ? [
          {
            id: "bestPractice",
            type: GuidanceSourceType.BestPractice,
            label: BEST_PRACTICE_GUIDANCE_LABEL,
            shortName: BEST_PRACTICE_GUIDANCE_LABEL,
            bodyHtml: bestPracticeHtml.join(""),
          },
        ]
      : [];

  const ownerSources = owner
    ? orgSource(owner, GuidanceSourceType.TemplateOwner, [
        ...nonBlank(ownerGuidanceHtml),
        ...tagGuidanceHtml(guidance.owner, tagIds),
      ])
    : [];

  if (researcher.kind === "org") {
    const orgHtml = [...nonBlank(researcher.guidanceHtml), ...tagGuidanceHtml(guidance.org, tagIds)];
    // The plan shows one tab per org, with the customization's guidance first.
    if (owner && owner.uri === researcher.org.uri) {
      const merged = orgSource(owner, GuidanceSourceType.TemplateOwner, [
        ...nonBlank(researcher.guidanceHtml),
        ...nonBlank(ownerGuidanceHtml),
        ...tagGuidanceHtml(guidance.owner, tagIds),
      ]);
      return [...bestPractice, ...merged];
    }
    const orgSources = orgSource(researcher.org, GuidanceSourceType.UserAffiliation, orgHtml);
    return [...bestPractice, ...orgSources, ...ownerSources];
  }
  if (researcher.kind === "none") {
    return [...bestPractice, ...ownerSources];
  }

  const { label, shortName, bodyHtml, noTemplateGuidanceNoteHtml } = researcher.example;
  return [
    ...bestPractice,
    ...ownerSources,
    {
      id: EXAMPLE_ORG_GUIDANCE_ID,
      // USER_AFFILIATION would be selected by default; this keeps the template's own guidance selected.
      type: GuidanceSourceType.UserSelected,
      label,
      shortName,
      bodyHtml: ownerSources.length > 0 ? bodyHtml : bodyHtml + noTemplateGuidanceNoteHtml,
    },
  ];
}
