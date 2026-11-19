import { GuidanceSourceType } from "@/generated/graphql";
import { guidanceBlockHtml } from "@/components/PlanAuthoring/guidanceHtml";
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
  name?: string | null;
}

type PreviewTags = (PreviewTag | null)[] | null | undefined;

/** A question's own tags, or its section's when it has none, as the API does. */
function questionOrSectionTags(questionTags: PreviewTags, sectionTags: PreviewTags) {
  const withId = (tags: PreviewTags) =>
    (tags ?? []).filter((tag): tag is PreviewTag & { id: number } => tag?.id != null);
  const own = withId(questionTags);
  return own.length > 0 ? own : withId(sectionTags);
}

export function previewTagIds(questionTags: PreviewTags, sectionTags: PreviewTags): number[] {
  return questionOrSectionTags(questionTags, sectionTags).map((tag) => tag.id);
}

export function previewTagNames(questionTags: PreviewTags, sectionTags: PreviewTags): ReadonlyMap<number, string> {
  return new Map(
    questionOrSectionTags(questionTags, sectionTags).flatMap((tag) =>
      tag.name ? [[tag.id, tag.name] as const] : []
    )
  );
}

function nonBlank(html: (string | null | undefined)[] | undefined): string[] {
  return (html ?? []).filter((item): item is string => Boolean(item?.trim()));
}

function tagGuidanceHtml(
  items: PreviewTagGuidance[],
  tagIds: number[],
  tagNames: ReadonlyMap<number, string>
): string[] {
  return tagIds.flatMap((tagId) => {
    const texts = items
      .filter((item) => item.tagId === tagId && item.guidanceText)
      .map((item) => item.guidanceText as string);
    const html = guidanceBlockHtml(tagNames.get(tagId), texts.join(""));
    return html ? [html] : [];
  });
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
  tagNames = new Map(),
  guidance,
  owner,
  ownerGuidanceHtml,
  researcher,
}: {
  tagIds: number[];
  tagNames?: ReadonlyMap<number, string>;
  guidance: PreviewGuidanceLookup;
  owner: PreviewOrg | null | undefined;
  /** Section then question guidance, shown before the owner's tag guidance. */
  ownerGuidanceHtml?: (string | null | undefined)[];
  researcher: PreviewResearcherGuidance;
}): PlanGuidanceSource[] {
  const bestPracticeHtml = tagGuidanceHtml(guidance.bestPractice, tagIds, tagNames);
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
        ...tagGuidanceHtml(guidance.owner, tagIds, tagNames),
      ])
    : [];

  if (researcher.kind === "org") {
    const orgHtml = [...nonBlank(researcher.guidanceHtml), ...tagGuidanceHtml(guidance.org, tagIds, tagNames)];
    // The plan shows one tab per org, with the customization's guidance first.
    if (owner && owner.uri === researcher.org.uri) {
      const merged = orgSource(owner, GuidanceSourceType.TemplateOwner, [
        ...nonBlank(researcher.guidanceHtml),
        ...nonBlank(ownerGuidanceHtml),
        ...tagGuidanceHtml(guidance.owner, tagIds, tagNames),
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
