import type { ApolloClient } from "@apollo/client";
import type { DocumentNode } from "graphql";
import {
  CustomizableObjectOwnership,
  CustomizationPreviewConditionGroupsDocument,
  CustomizationPreviewCustomQuestionDocument,
  CustomizationPreviewCustomSectionDocument,
  CustomizationPreviewOverviewDocument,
  CustomizationPreviewQuestionCustomizationDocument,
  CustomizationPreviewSectionCustomizationDocument,
  CustomizationPreviewTemplateDocument,
  PreviewGuidanceDocument,
  QuestionConditionActionType,
  QuestionConditionMatchType,
  VersionedQuestionConditionCondition,
} from "@/generated/graphql";
import { PreviewNotFoundError } from "@/components/PlanPreview/previewError";
import { loadCustomizationPreview } from "../customizationPreviewData";

const { Base, Custom } = CustomizableObjectOwnership;

const OVERVIEW = {
  templateCustomizationOverview: {
    customizationId: 8,
    versionedTemplateId: 70,
    versionedTemplateName: "NSF DMP",
    versionedTemplateVersion: "v3",
    sections: [
      {
        id: 4,
        sectionType: Custom,
        sectionCustomizationId: null,
        displayOrder: 2,
        questions: [{ id: 41, questionType: Custom, questionCustomizationId: null, displayOrder: 1 }],
      },
      {
        id: 1,
        sectionType: Base,
        sectionCustomizationId: 15,
        displayOrder: 1,
        questions: [
          { id: 102, questionType: Base, questionCustomizationId: 55, displayOrder: 2 },
          { id: 101, questionType: Base, questionCustomizationId: null, displayOrder: 1 },
        ],
      },
    ],
  },
  me: { id: 3, affiliation: { uri: "https://ror.org/uni", displayName: "University of Example", acronyms: [] } },
};

const versionedQuestion = (id: number, questionId: number, conditions: { id: number }[] = []) => ({
  id,
  questionId,
  displayOrder: 1,
  questionText: `Question ${id}`,
  requirementText: null,
  guidanceText: null,
  sampleText: null,
  useSampleTextAsDefault: false,
  required: false,
  json: '{"type":"radioButtons"}',
  displayLogicAction: QuestionConditionActionType.ShowQuestion,
  displayLogicMatchType: QuestionConditionMatchType.Any,
  versionedQuestionConditions: conditions,
});

const TEMPLATE = {
  versionedTemplate: {
    id: 70,
    name: "NSF DMP",
    version: "v3",
    owner: { uri: "https://ror.org/nsf", displayName: "NSF" },
    versionedSections: [
      {
        id: 1,
        name: "Data",
        introduction: null,
        requirements: null,
        guidance: "<p>Owner section guidance</p>",
        displayOrder: 1,
        tags: [{ id: 5, name: "Storage" }],
        versionedQuestions: [versionedQuestion(101, 9001), versionedQuestion(102, 9002, [{ id: 1 }])],
      },
    ],
  },
};

const CONDITION_GROUPS = {
  publishedConditionGroupsForQuestion: [
    { triggerQuestionId: 9001, conditions: [{ conditionType: VersionedQuestionConditionCondition.Equal, conditionMatch: "yes" }] },
    { triggerQuestionId: 7777, conditions: [] },
  ],
};

function clientWith(overrides: Map<DocumentNode, unknown> = new Map()) {
  const responses = new Map<DocumentNode, unknown>([
    [CustomizationPreviewOverviewDocument, OVERVIEW],
    [CustomizationPreviewTemplateDocument, TEMPLATE],
    [CustomizationPreviewConditionGroupsDocument, CONDITION_GROUPS],
    [CustomizationPreviewSectionCustomizationDocument, { sectionCustomization: { id: 15, guidance: "<p>Org section guidance</p>" } }],
    [CustomizationPreviewQuestionCustomizationDocument, { questionCustomization: { id: 55, guidanceText: "<p>Org guidance</p>", sampleText: "Org sample" } }],
    [CustomizationPreviewCustomSectionDocument, { customSection: { id: 4, name: "Our section", introduction: null, requirements: null, guidance: "<p>Custom section guidance</p>" } }],
    [CustomizationPreviewCustomQuestionDocument, { customQuestion: { id: 41, questionText: "Our question", requirementText: null, guidanceText: null, sampleText: null, useSampleTextAsDefault: false, required: true, json: '{"type":"text"}' } }],
    [PreviewGuidanceDocument, { bestPracticeGuidance: [], ownerGuidance: [], orgGuidance: [] }],
    ...overrides,
  ]);
  const query = jest.fn(({ query: document }: { query: DocumentNode }) => Promise.resolve({ data: responses.get(document) }));
  return { client: { query } as unknown as ApolloClient, query };
}

describe("loadCustomizationPreview", () => {
  it("puts the base and custom sections and questions in display order, with the customizations", async () => {
    const { client } = clientWith();

    const data = await loadCustomizationPreview(client, 8);

    expect(data.org).toEqual({ uri: "https://ror.org/uni", displayName: "University of Example", acronyms: [] });
    expect(data.sections.map((section) => section.name)).toEqual(["Data", "Our section"]);
    const [base, custom] = data.sections;
    expect(base).toMatchObject({ customizationGuidance: "<p>Org section guidance</p>", tagIds: [5] });
    expect(base.questions.map((question) => question.identity)).toEqual([
      { kind: "base", versionedQuestionId: 101 },
      { kind: "base", versionedQuestionId: 102 },
    ]);
    expect(base.questions[1].customization).toEqual({ guidanceText: "<p>Org guidance</p>", sampleText: "Org sample" });
    expect(custom).toMatchObject({ identity: { kind: "custom", customSectionId: 4 }, guidance: "<p>Custom section guidance</p>" });
    expect(custom.questions[0]).toMatchObject({ questionText: "Our question", required: true });
  });

  it("loads display logic only for questions with conditions, keyed by versioned question id", async () => {
    const { client, query } = clientWith();

    const { displayLogic } = await loadCustomizationPreview(client, 8);

    const conditionCalls = query.mock.calls.filter(([options]) => options.query === CustomizationPreviewConditionGroupsDocument);
    expect(conditionCalls.map(([options]) => (options as { variables?: unknown }).variables)).toEqual([{ versionedQuestionId: 102 }]);
    expect([...displayLogic.keys()]).toEqual([102]);
    expect(displayLogic.get(102)).toEqual({
      action: "SHOW_QUESTION",
      matchType: "ANY",
      groups: [
        // The draft trigger id is mapped to the versioned question in this template.
        { triggerQuestionId: 101, conditions: [{ conditionType: "EQUAL", conditionMatch: "yes" }] },
        { triggerQuestionId: null, conditions: [] },
      ],
    });
  });

  it("reports a missing customization or template as not found", async () => {
    await expect(
      loadCustomizationPreview(clientWith(new Map([[CustomizationPreviewOverviewDocument, { templateCustomizationOverview: null }]])).client, 8)
    ).rejects.toBeInstanceOf(PreviewNotFoundError);
    await expect(
      loadCustomizationPreview(clientWith(new Map([[CustomizationPreviewTemplateDocument, { versionedTemplate: null }]])).client, 8)
    ).rejects.toBeInstanceOf(PreviewNotFoundError);
  });

  it.each([NaN, 0, -1, 1.5])("reports the malformed id %p as not found without asking the API", async (id) => {
    const { client, query } = clientWith();

    await expect(loadCustomizationPreview(client, id)).rejects.toBeInstanceOf(PreviewNotFoundError);
    expect(query).not.toHaveBeenCalled();
  });
});
