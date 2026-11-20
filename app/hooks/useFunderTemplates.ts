import { useMemo } from "react";
import {
  PaginationOptions,
  VersionedTemplateLink,
  VersionedTemplateSearchResult,
} from "@/generated/graphql";
import { stubFunderTemplates } from "./funderTemplatesStubData";

export type FunderTemplateLink = Pick<VersionedTemplateLink, "id" | "url" | "text">;

export type FunderTemplate = Pick<
  VersionedTemplateSearchResult,
  "templateId" | "ownerDisplayName" | "ownerURI" | "modified"
> & {
  id: number;
  name: string;
  funderLinks: FunderTemplateLink[];
  samplePlanLinks: FunderTemplateLink[];
};

export interface FunderTemplatesQueryData {
  publishedFunderTemplates: {
    __typename?: "PublishedTemplateSearchResults";
    items: FunderTemplate[];
    totalCount: number;
    limit: number;
    currentOffset: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    availableSortFields: string[];
  };
}

export interface FunderTemplatesQueryOptions {
  variables: {
    term?: string;
    paginationOptions?: PaginationOptions;
  };
}

export type TemplateDownloadFormat = "docx" | "pdf";

export const FUNDER_TEMPLATE_SORT_FIELDS = ["vt.name", "a.displayName", "vt.modified"] as const;
type FunderTemplateSortField = typeof FUNDER_TEMPLATE_SORT_FIELDS[number];

const DEFAULT_LIMIT = 10;

const sortValue: Record<FunderTemplateSortField, (template: FunderTemplate) => string | number> = {
  "vt.name": (template) => template.name.toLowerCase(),
  "a.displayName": (template) => (template.ownerDisplayName ?? "").toLowerCase(),
  "vt.modified": (template) => new Date(template.modified ?? 0).getTime(),
};

const isSortField = (field: string | null | undefined): field is FunderTemplateSortField =>
  FUNDER_TEMPLATE_SORT_FIELDS.includes(field as FunderTemplateSortField);
// TODO: Neither dmptool-apollo-server nor dmptool-narrative-generator can export a template yet.
// Replace this with the real download URL once that endpoint exists.
export const templateDownloadHref = (versionedTemplateId: number, format: TemplateDownloadFormat) =>
  `/api/download-template?versionedTemplateId=${versionedTemplateId}&format=${format}`;

// Stand-in until dmptool-apollo-server adds a query for the Funder Requirements page (#609). That query must work
// without a login, return only published templates whose owner is a funder and whose visibility is PUBLIC, and
// include each template's FUNDER and SAMPLE_PLAN links. It returns the same response shape as useQuery, so it can be
// replaced with useQuery(<new>Document, { variables }).
export function useFunderTemplates({ variables }: FunderTemplatesQueryOptions) {
  const { term = "", paginationOptions } = variables;
  const offset = paginationOptions?.offset ?? 0;
  const limit = paginationOptions?.limit ?? DEFAULT_LIMIT;
  const sortField = isSortField(paginationOptions?.sortField) ? paginationOptions.sortField : "vt.name";
  const sortDir = paginationOptions?.sortDir === "DESC" ? "DESC" : "ASC";

  const data = useMemo<FunderTemplatesQueryData>(() => {
    const searchTerm = term.trim().toLowerCase();
    const matches = stubFunderTemplates.filter((template) =>
      !searchTerm
      || template.name.toLowerCase().includes(searchTerm)
      || (template.ownerDisplayName ?? "").toLowerCase().includes(searchTerm)
    );

    const getValue = sortValue[sortField];
    const direction = sortDir === "ASC" ? 1 : -1;
    const sorted = [...matches].sort((a, b) => {
      const valueA = getValue(a);
      const valueB = getValue(b);
      if (valueA < valueB) return -1 * direction;
      if (valueA > valueB) return 1 * direction;
      return 0;
    });

    return {
      publishedFunderTemplates: {
        __typename: "PublishedTemplateSearchResults",
        items: sorted.slice(offset, offset + limit),
        totalCount: sorted.length,
        limit,
        currentOffset: offset,
        hasNextPage: offset + limit < sorted.length,
        hasPreviousPage: offset > 0,
        availableSortFields: [...FUNDER_TEMPLATE_SORT_FIELDS],
      },
    };
  }, [term, offset, limit, sortField, sortDir]);

  return {
    data,
    previousData: undefined as FunderTemplatesQueryData | undefined,
    loading: false,
    error: undefined as Error | undefined,
  };
}
