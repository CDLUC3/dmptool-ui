import { GuidanceSourceType } from "@/generated/graphql";
import { EMPTY_GUIDANCE_LOOKUP } from "@/components/PlanPreview/previewGuidance";
import type {
  CustomizationPreviewData,
  CustomizationPreviewQuestion,
  CustomizationPreviewSection,
} from "../customizationPreviewData";
import { toCustomizationPreviewModel } from "../toCustomizationPreviewModel";

const OWNER = { uri: "https://ror.org/funder", displayName: "National Science Foundation", displayAbbreviation: "NSF" };
const ORG = { uri: "https://ror.org/uni", displayName: "University of Example", displayAbbreviation: "UoE" };

const baseQuestion = (overrides: Partial<CustomizationPreviewQuestion> = {}): CustomizationPreviewQuestion => ({
  identity: { kind: "base", versionedQuestionId: 11 },
  questionText: "Base question",
  requirementText: null,
  guidanceText: "<p>Owner question guidance</p>",
  sampleText: null,
  useSampleTextAsDefault: false,
  required: false,
  json: '{"type":"textArea"}',
  ...overrides,
});

const customQuestion = (overrides: Partial<CustomizationPreviewQuestion> = {}): CustomizationPreviewQuestion => ({
  identity: { kind: "custom", customQuestionId: 31 },
  questionText: "Custom question",
  requirementText: "<p>Custom requirement</p>",
  guidanceText: "<p>Org question guidance</p>",
  sampleText: "Custom sample",
  useSampleTextAsDefault: false,
  required: true,
  json: '{"type":"textArea"}',
  ...overrides,
});

const baseSection = (questions: CustomizationPreviewQuestion[]): CustomizationPreviewSection => ({
  identity: { kind: "base", versionedSectionId: 1 },
  name: "Base section",
  introduction: null,
  requirements: null,
  guidance: "<p>Owner section guidance</p>",
  customizationGuidance: "<p>Org section guidance</p>",
  tagIds: [5],
  questions,
});

const data = (sections: CustomizationPreviewSection[], overrides: Partial<CustomizationPreviewData> = {}): CustomizationPreviewData => ({
  templateName: "NSF DMP",
  templateVersion: "v3",
  owner: OWNER,
  org: ORG,
  sections,
  guidance: {
    bestPractice: [{ tagId: 5, guidanceText: "<p>Best practice</p>" }],
    owner: [{ tagId: 5, guidanceText: "<p>Owner tag</p>" }],
    org: [{ tagId: 5, guidanceText: "<p>Org tag</p>" }],
  },
  ...overrides,
});

const tabs = (question: { guidanceSources: { type: GuidanceSourceType; label: string; bodyHtml: string }[] }) =>
  question.guidanceSources.map(({ type, label, bodyHtml }) => ({ type, label, bodyHtml }));

describe("toCustomizationPreviewModel", () => {
  it("gives a base question best practice, the org's guidance, then the owner's", () => {
    const model = toCustomizationPreviewModel(
      data([baseSection([baseQuestion({ customization: { guidanceText: "<p>Org question guidance</p>", sampleText: null } })])])
    );

    expect(tabs(model.sections[0].questions[0])).toEqual([
      { type: GuidanceSourceType.BestPractice, label: "DMP Tool", bodyHtml: "<p>Best practice</p>" },
      {
        type: GuidanceSourceType.UserAffiliation,
        label: ORG.displayName,
        bodyHtml: "<p>Org section guidance</p><p>Org question guidance</p><p>Org tag</p>",
      },
      {
        type: GuidanceSourceType.TemplateOwner,
        label: OWNER.displayName,
        bodyHtml: "<p>Owner section guidance</p><p>Owner question guidance</p><p>Owner tag</p>",
      },
    ]);
  });

  it("gives a custom question in a base section only its own guidance, under the org", () => {
    const model = toCustomizationPreviewModel(data([baseSection([customQuestion()])]));

    expect(tabs(model.sections[0].questions[0])).toEqual([
      { type: GuidanceSourceType.UserAffiliation, label: ORG.displayName, bodyHtml: "<p>Org question guidance</p>" },
    ]);
  });

  it("adds a custom section's guidance to its custom questions", () => {
    const section: CustomizationPreviewSection = {
      ...baseSection([customQuestion()]),
      identity: { kind: "custom", customSectionId: 4 },
      guidance: "<p>Custom section guidance</p>",
      customizationGuidance: null,
    };
    const model = toCustomizationPreviewModel(data([section]));

    expect(tabs(model.sections[0].questions[0])).toEqual([
      {
        type: GuidanceSourceType.UserAffiliation,
        label: ORG.displayName,
        bodyHtml: "<p>Custom section guidance</p><p>Org question guidance</p>",
      },
    ]);
  });

  it("merges the tabs when the customizing org owns the template", () => {
    const model = toCustomizationPreviewModel(
      data(
        [baseSection([baseQuestion({ customization: { guidanceText: "<p>Org question guidance</p>", sampleText: null } })])],
        { org: OWNER, guidance: EMPTY_GUIDANCE_LOOKUP }
      )
    );

    expect(tabs(model.sections[0].questions[0])).toEqual([
      {
        type: GuidanceSourceType.TemplateOwner,
        label: OWNER.displayName,
        bodyHtml:
          "<p>Org section guidance</p><p>Org question guidance</p><p>Owner section guidance</p><p>Owner question guidance</p>",
      },
    ]);
  });

  it("labels sample text and requirements with the org that wrote them", () => {
    const model = toCustomizationPreviewModel(
      data([
        baseSection([
          baseQuestion({ sampleText: "Owner sample", customization: { guidanceText: null, sampleText: "Org sample" } }),
          customQuestion(),
        ]),
      ])
    );
    const [base, custom] = model.sections[0].questions;

    expect(base).toMatchObject({
      sampleText: "Owner sample",
      sampleTextOrgLabel: OWNER.displayName,
      customizationSampleText: "Org sample",
      customizationSampleOrgLabel: ORG.displayName,
    });
    expect(custom).toMatchObject({
      sampleText: "Custom sample",
      sampleTextOrgLabel: ORG.displayName,
      requirementOrgLabel: ORG.displayName,
    });
    expect(custom.customizationSampleText).toBeUndefined();
  });
});
