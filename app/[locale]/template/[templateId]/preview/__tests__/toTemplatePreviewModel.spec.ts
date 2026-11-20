import { GuidanceSourceType } from "@/generated/graphql";
import type { PreviewGuidanceLookup } from "@/components/PlanPreview/previewGuidance";
import {
  EXAMPLE_ORG_GUIDANCE_ID,
  toTemplatePreviewModel as mapTemplate,
  type TemplatePreviewTemplate,
} from "../toTemplatePreviewModel";

const EXAMPLE_GUIDANCE = {
  label: "Researcher's organization (example)",
  shortName: "Their organization",
  bodyHtml: "<p>Example</p>",
  noTemplateGuidanceNoteHtml: "<p>Preview only note</p>",
};

const toTemplatePreviewModel = (template: TemplatePreviewTemplate) =>
  mapTemplate(template, EXAMPLE_GUIDANCE);

const OWNER: TemplatePreviewTemplate["owner"] = {
  id: 1,
  uri: "https://ror.org/nsf",
  displayName: "National Science Foundation",
  displayAbbreviation: "NSF",
  acronyms: ["NSF"],
};

function makeTemplate(
  overrides: Partial<TemplatePreviewTemplate> = {}
): TemplatePreviewTemplate {
  return {
    id: 7,
    name: "NSF DMP",
    latestPublishVersion: "v2",
    owner: OWNER,
    sections: [],
    ...overrides,
  };
}

describe("toTemplatePreviewModel", () => {
  it("orders sections and questions by displayOrder and skips ones without an id", () => {
    const model = toTemplatePreviewModel(
      makeTemplate({
        sections: [
          {
            id: 2,
            name: "Second",
            displayOrder: 2,
            questions: [
              { id: 21, displayOrder: 2, questionText: "B", json: '{"type":"text"}' },
              { id: 20, displayOrder: 1, questionText: "A", json: '{"type":"text"}' },
              { id: null, displayOrder: 3, questionText: "Unsaved", json: '{"type":"text"}' },
            ],
          },
          { id: 1, name: "First", displayOrder: 1, questions: [] },
          null,
        ],
      })
    );

    expect(model.sections.map((section) => section.title)).toEqual(["First", "Second"]);
    expect(model.sections[1].questions.map((question) => question.title)).toEqual(["A", "B"]);
    expect(model.sections[1].questions[0].identity).toEqual({
      kind: "base",
      versionedQuestionId: 20,
    });
  });

  it("maps a question with no answer and the owner's guidance, requirements and sample text", () => {
    const model = toTemplatePreviewModel(
      makeTemplate({
        sections: [
          {
            id: 1,
            name: "Data",
            introduction: "<p>Intro</p>",
            requirements: "<p>Req</p>",
            displayOrder: 1,
            questions: [
              {
                id: 10,
                displayOrder: 1,
                questionText: "Describe your data",
                requirementText: "<p>Required by NSF</p>",
                guidanceText: "<p>Think about formats</p>",
                sampleText: "<p>We will collect...</p>",
                useSampleTextAsDefault: true,
                required: true,
                json: '{"type":"text"}',
              },
            ],
          },
        ],
      })
    );

    const [section] = model.sections;
    expect(section.introductionHtml).toBe("<p>Intro</p>");
    expect(section.requirementsHtml).toBe("<p>Req</p>");

    const [question] = section.questions;
    expect(question).toMatchObject({
      title: "Describe your data",
      questionType: "text",
      required: true,
      answerJson: null,
      hasAnswer: false,
      comments: [],
      requirementHtml: "<p>Required by NSF</p>",
      requirementOrgLabel: "National Science Foundation",
      sampleText: "<p>We will collect...</p>",
      sampleTextOrgLabel: "National Science Foundation",
      useSampleTextAsDefault: true,
    });
    expect(question.isHidden).toBeFalsy();
    expect(question.guidanceSources).toEqual([
      {
        id: "https://ror.org/nsf",
        type: GuidanceSourceType.TemplateOwner,
        label: "National Science Foundation",
        shortName: "NSF",
        locked: true,
        bodyHtml: "<p>Think about formats</p>",
      },
      {
        id: EXAMPLE_ORG_GUIDANCE_ID,
        type: GuidanceSourceType.UserSelected,
        label: "Researcher's organization (example)",
        shortName: "Their organization",
        bodyHtml: "<p>Example</p>",
      },
    ]);
  });

  it("shows only the example organization guidance, with the preview-only note, when the question has no guidance text", () => {
    const model = toTemplatePreviewModel(
      makeTemplate({
        sections: [
          {
            id: 1,
            name: "Data",
            displayOrder: 1,
            questions: [{ id: 10, displayOrder: 1, json: '{"type":"text"}' }],
          },
        ],
      })
    );

    const sources = model.sections[0].questions[0].guidanceSources;
    expect(sources.map((source) => source.id)).toEqual([EXAMPLE_ORG_GUIDANCE_ID]);
    expect(sources[0].bodyHtml).toBe("<p>Example</p><p>Preview only note</p>");
  });

  it("puts each tag name above its tagged guidance, and leaves the question's own guidance untitled", () => {
    const guidance: PreviewGuidanceLookup = {
      bestPractice: [{ tagId: 5, guidanceText: "<p>Best</p>" }],
      owner: [
        { tagId: 5, guidanceText: "<p>Owner tag</p>" },
        { tagId: 4, guidanceText: "<p>Unused section tag</p>" },
      ],
      org: [],
    };
    const model = mapTemplate(
      makeTemplate({
        sections: [
          {
            id: 1,
            name: "Data",
            displayOrder: 1,
            guidance: "<p>Section</p>",
            tags: [{ id: 4, name: "Storage" }],
            questions: [
              {
                id: 10,
                displayOrder: 1,
                guidanceText: "<p>Question guidance</p>",
                json: '{"type":"text"}',
                tags: [{ id: 5, name: "Data & <Metadata>" }],
              },
            ],
          },
        ],
      }),
      EXAMPLE_GUIDANCE,
      guidance
    );

    expect(model.sections[0].questions[0].guidanceSources.map(({ label, bodyHtml }) => [label, bodyHtml])).toEqual([
      ["DMP Tool", "<h5>Data &amp; &lt;Metadata&gt;</h5><p>Best</p>"],
      [
        "National Science Foundation",
        "<p>Section</p><p>Question guidance</p><h5>Data &amp; &lt;Metadata&gt;</h5><p>Owner tag</p>",
      ],
      ["Researcher's organization (example)", "<p>Example</p>"],
    ]);
  });

  it("flags question JSON that can't be rendered", () => {
    const model = toTemplatePreviewModel(
      makeTemplate({
        sections: [
          {
            id: 1,
            name: "Data",
            displayOrder: 1,
            questions: [{ id: 10, displayOrder: 1, json: null }],
          },
        ],
      })
    );

    expect(model.sections[0].questions[0].jsonError).toBe("missing");
  });

  it("allows answering and shows customize guidance, but turns off comments", () => {
    const model = toTemplatePreviewModel(makeTemplate());

    expect(model.capabilities).toEqual({
      canEditAnswers: true,
      canComment: false,
      canModerateComments: false,
      canCustomizeGuidance: true,
      isPreview: true,
    });
    expect(model).toMatchObject({
      title: "NSF DMP",
      templateName: "NSF DMP",
      affiliationName: "National Science Foundation",
      templateVersion: "v2",
      progress: { answeredQuestions: 0, totalQuestions: 0, percentComplete: 0 },
    });
  });
});
