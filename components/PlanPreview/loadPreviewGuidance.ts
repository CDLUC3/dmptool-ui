import type { ApolloClient } from "@apollo/client";
import { PreviewGuidanceDocument } from "@/generated/graphql";
import { EMPTY_GUIDANCE_LOOKUP, type PreviewGuidanceLookup } from "./previewGuidance";

export async function loadPreviewGuidance(
  client: ApolloClient,
  {
    tagIds,
    ownerAffiliationId,
    orgAffiliationId,
  }: { tagIds: number[]; ownerAffiliationId?: string | null; orgAffiliationId?: string | null }
): Promise<PreviewGuidanceLookup> {
  if (tagIds.length === 0) {
    return EMPTY_GUIDANCE_LOOKUP;
  }
  try {
    const { data } = await client.query({
      query: PreviewGuidanceDocument,
      variables: {
        tagIds: [...new Set(tagIds)],
        ownerAffiliationId: ownerAffiliationId ?? "",
        orgAffiliationId: orgAffiliationId ?? "",
        includeOrg: Boolean(orgAffiliationId),
      },
      fetchPolicy: "network-only",
    });
    return {
      bestPractice: data?.bestPracticeGuidance ?? [],
      owner: ownerAffiliationId ? data?.ownerGuidance ?? [] : [],
      org: data?.orgGuidance ?? [],
    };
  } catch (error) {
    // The preview still works without tag guidance.
    console.error("Failed to load preview guidance", error);
    return EMPTY_GUIDANCE_LOOKUP;
  }
}
