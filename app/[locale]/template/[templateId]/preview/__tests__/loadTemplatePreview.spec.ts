import type { ApolloClient } from "@apollo/client";
import { PreviewGuidanceDocument, TemplatePreviewDocument } from "@/generated/graphql";
import { PreviewNotFoundError } from "@/components/PlanPreview/previewError";
import { loadTemplatePreview, loadTemplatePreviewPlan } from "../loadTemplatePreview";
import type { TemplatePreviewTemplate } from "../toTemplatePreviewModel";

const TEMPLATE: TemplatePreviewTemplate = {
  id: 7,
  name: "NSF DMP",
  latestPublishVersion: "v1",
  owner: { id: 1, uri: "https://ror.org/nsf", displayName: "NSF" },
  sections: [
    {
      id: 1,
      name: "Data",
      displayOrder: 1,
      tags: [{ id: 5, name: "Storage" }],
      questions: [
        { id: 10, displayOrder: 1, questionText: "Q1", json: '{"type":"text"}' },
        { id: 11, displayOrder: 2, questionText: "Q2", json: '{"type":"text"}', tags: [{ id: 6, name: "Sharing" }] },
      ],
    },
  ],
};

const EXAMPLE_GUIDANCE = { label: "Example org", shortName: "Example", bodyHtml: "<p>Example</p>", noTemplateGuidanceNoteHtml: "" };

function clientReturning(template: TemplatePreviewTemplate | null) {
  const query = jest.fn(({ query: document }) =>
    Promise.resolve(
      document === TemplatePreviewDocument
        ? { data: { template } }
        : { data: { bestPracticeGuidance: [{ tagId: 5, guidanceText: "<p>Best practice</p>" }], ownerGuidance: [] } }
    )
  );
  return { client: { query } as unknown as ApolloClient, query };
}

describe("loadTemplatePreview", () => {
  it("loads the draft template, then the published guidance for its tags", async () => {
    const { client, query } = clientReturning(TEMPLATE);

    const { template, guidance } = await loadTemplatePreview(client, 7);

    expect(template).toBe(TEMPLATE);
    expect(query).toHaveBeenNthCalledWith(1, {
      query: TemplatePreviewDocument,
      variables: { templateId: 7 },
      fetchPolicy: "network-only",
    });
    expect(query).toHaveBeenNthCalledWith(2, expect.objectContaining({
      query: PreviewGuidanceDocument,
      variables: { tagIds: [5, 6], ownerAffiliationId: "https://ror.org/nsf", orgAffiliationId: "", includeOrg: false },
    }));
    expect(guidance.bestPractice).toEqual([{ tagId: 5, guidanceText: "<p>Best practice</p>" }]);
  });

  it("reports a missing template as not found", async () => {
    const { client } = clientReturning(null);

    await expect(loadTemplatePreview(client, 7)).rejects.toBeInstanceOf(PreviewNotFoundError);
  });
});

describe("loadTemplatePreviewPlan", () => {
  it("builds the plan model and display logic", async () => {
    const { client } = clientReturning(TEMPLATE);

    const { model, displayLogic } = await loadTemplatePreviewPlan(client, 7, EXAMPLE_GUIDANCE);

    expect(model.templateName).toBe("NSF DMP");
    expect(model.progress.totalQuestions).toBe(2);
    expect(model.sections[0].questions[0].guidanceSources.map((source) => source.label)).toEqual([
      "DMP Tool",
      "Example org",
    ]);
    expect(displayLogic?.size).toBe(0);
  });
});
