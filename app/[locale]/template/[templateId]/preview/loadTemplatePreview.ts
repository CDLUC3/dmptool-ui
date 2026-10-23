import type { ApolloClient } from "@apollo/client";
import { TemplatePreviewDocument } from "@/generated/graphql";
import type { LoadedPreview } from "@/components/PlanPreview/createLoadedPreviewDataSource";
import { loadPreviewGuidance } from "@/components/PlanPreview/loadPreviewGuidance";
import { PreviewNotFoundError } from "@/components/PlanPreview/previewError";
import {
  templateTagIds,
  toTemplateDisplayLogic,
  toTemplatePreviewModel,
  type TemplatePreviewData,
  type TemplatePreviewExampleGuidance,
} from "./toTemplatePreviewModel";

export async function loadTemplatePreview(
  client: ApolloClient,
  templateId: number
): Promise<TemplatePreviewData> {
  const { data } = await client.query({
    query: TemplatePreviewDocument,
    variables: { templateId },
    fetchPolicy: "network-only",
  });
  const template = data?.template;
  if (!template) {
    throw new PreviewNotFoundError();
  }
  const guidance = await loadPreviewGuidance(client, {
    tagIds: templateTagIds(template),
    ownerAffiliationId: template.owner?.uri,
  });
  return { template, guidance };
}

export async function loadTemplatePreviewPlan(
  client: ApolloClient,
  templateId: number,
  exampleGuidance: TemplatePreviewExampleGuidance
): Promise<LoadedPreview> {
  const { template, guidance } = await loadTemplatePreview(client, templateId);
  return {
    model: toTemplatePreviewModel(template, exampleGuidance, guidance),
    displayLogic: toTemplateDisplayLogic(template),
  };
}
