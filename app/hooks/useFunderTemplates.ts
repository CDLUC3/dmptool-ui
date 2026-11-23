import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  PaginationOptions,
  PublishedFunderTemplatesDocument,
  PublishedFunderTemplatesQuery,
} from "@/generated/graphql";

type FunderTemplateResults = NonNullable<PublishedFunderTemplatesQuery["publishedFunderTemplates"]>;
type FunderTemplateItem = NonNullable<NonNullable<FunderTemplateResults["items"]>[number]>;

export type FunderTemplateLink = NonNullable<FunderTemplateItem["funderLinks"]>[number];

// The API returns null when a Template has no links, so the hook always gives the page lists
export type FunderTemplate = Omit<FunderTemplateItem, "funderLinks" | "samplePlanLinks"> & {
  funderLinks: FunderTemplateLink[];
  samplePlanLinks: FunderTemplateLink[];
};

export interface FunderTemplatesQueryData {
  publishedFunderTemplates: Omit<FunderTemplateResults, "items" | "totalCount"> & {
    items: FunderTemplate[];
    totalCount: number;
  };
}

export interface FunderTemplatesQueryOptions {
  variables: {
    term?: string;
    paginationOptions?: PaginationOptions;
  };
}

export type TemplateDownloadFormat = "docx" | "pdf";

// The sort fields that the publishedFunderTemplates query accepts
export const FUNDER_TEMPLATE_SORT_FIELDS = ["vt.name", "a.displayName", "vt.modified"] as const;

// The /api/download-template route fetches the file from dmptool-narrative-generator
export const templateDownloadHref = (versionedTemplateId: number, format: TemplateDownloadFormat) =>
  `/api/download-template?versionedTemplateId=${versionedTemplateId}&format=${format}`;

// Transform the query results into the shape the page uses: drop empty items, and use 0 and [] in place of a null
// total count or link list, so the page does not need null checks
const transformResults = (data?: PublishedFunderTemplatesQuery): FunderTemplatesQueryData | undefined => {
  const results = data?.publishedFunderTemplates;
  if (!results) return undefined;

  return {
    publishedFunderTemplates: {
      ...results,
      totalCount: results.totalCount ?? 0,
      items: (results.items ?? [])
        .filter((item): item is FunderTemplateItem => !!item)
        .map((item) => ({
          ...item,
          funderLinks: item.funderLinks ?? [],
          samplePlanLinks: item.samplePlanLinks ?? [],
        })),
    },
  };
};

// Search the published, public funder Templates for the Funder Requirements page. The query does not need a login.
//   - data: the results for the current variables. It is undefined while a request for new variables (a search,
//     sort or page change) loads, unless those results are already cached
//   - previousData: the results from the last request that finished. The page shows these while new results load,
//     so the table stays on screen (see the page's `results`)
export function useFunderTemplates({ variables }: FunderTemplatesQueryOptions) {
  const { data, previousData, loading, error } = useQuery(PublishedFunderTemplatesDocument, { variables });
  const transformedData = useMemo(() => transformResults(data), [data]);
  const transformedPreviousData = useMemo(() => transformResults(previousData), [previousData]);

  return {
    data: transformedData,
    previousData: transformedPreviousData,
    loading,
    error,
  };
}
