import { questionKey } from "@/components/PlanAuthoring/model";
import { EMPTY_GUIDANCE_LOOKUP } from "@/components/PlanPreview/previewGuidance";
import { NEW_QUESTION_ID, type QuestionPreviewDraft } from "@/components/QuestionPreviewLink/questionPreviewDraft";
import type {
  CustomizationPreviewData,
  CustomizationPreviewQuestion,
  CustomizationPreviewSection,
} from "../../customizationPreviewData";
import {
  buildCustomizationQuestionPreview,
  parseCustomizationQuestionKey,
  UNSAVED_CUSTOM_QUESTION_ID,
} from "../buildCustomizationQuestionPreview";

const ORG = { uri: "https://ror.org/uni", displayName: "University of Example" };

const question = (identity: CustomizationPreviewQuestion["identity"], questionText: string): CustomizationPreviewQuestion => ({
  identity,
  questionText,
  requirementText: null,
  guidanceText: null,
  sampleText: null,
  useSampleTextAsDefault: false,
  required: false,
  json: '{"type":"textArea"}',
});

const section = (
  identity: CustomizationPreviewSection["identity"],
  name: string,
  questions: CustomizationPreviewQuestion[]
): CustomizationPreviewSection => ({
  identity,
  name,
  introduction: null,
  requirements: null,
  guidance: null,
  customizationGuidance: null,
  tagIds: [],
  questions,
});

const DATA: CustomizationPreviewData = {
  templateName: "NSF DMP",
  templateVersion: "v3",
  owner: null,
  org: ORG,
  guidance: EMPTY_GUIDANCE_LOOKUP,
  sections: [
    section({ kind: "base", versionedSectionId: 1 }, "Base section", [
      question({ kind: "base", versionedQuestionId: 11 }, "Base question"),
      question({ kind: "custom", customQuestionId: 31 }, "Custom question"),
    ]),
    section({ kind: "custom", customSectionId: 4 }, "Custom section", [
      question({ kind: "custom", customQuestionId: 41 }, "Custom section question"),
    ]),
  ],
};

const FULL_DRAFT: QuestionPreviewDraft = {
  sectionId: 4,
  questionText: "Draft question",
  requirementText: null,
  guidanceText: "<p>Draft guidance</p>",
  sampleText: null,
  useSampleTextAsDefault: false,
  required: true,
  json: '{"type":"text"}',
};

const titles = (preview: ReturnType<typeof buildCustomizationQuestionPreview>) =>
  preview!.model.sections[0].questions.map((q) => q.title);

describe("parseCustomizationQuestionKey", () => {
  it("reads base and custom question keys", () => {
    expect(parseCustomizationQuestionKey("base-question-11")).toEqual({ kind: "base", versionedQuestionId: 11 });
    expect(parseCustomizationQuestionKey("custom-question-31")).toEqual({ kind: "custom", customQuestionId: 31 });
    expect(parseCustomizationQuestionKey("11")).toBeNull();
  });
});

describe("buildCustomizationQuestionPreview", () => {
  it("shows the saved question in its section", () => {
    const preview = buildCustomizationQuestionPreview(DATA, { questionKey: "custom-question-31", draft: null });

    expect(preview!.model.sections[0].title).toBe("Base section");
    expect(preview!.currentKey).toBe("custom-question-31");
    expect(titles(preview)).toEqual(["Base question", "Custom question"]);
  });

  it("adds a base question's draft customization as the org's guidance", () => {
    const preview = buildCustomizationQuestionPreview(DATA, {
      questionKey: "base-question-11",
      draft: { guidanceText: "<p>Unsaved org guidance</p>", sampleText: "Unsaved sample" },
    });
    const current = preview!.model.sections[0].questions[0];

    expect(current.title).toBe("Base question");
    expect(current.guidanceSources).toEqual([
      expect.objectContaining({ label: ORG.displayName, bodyHtml: "<p>Unsaved org guidance</p>" }),
    ]);
    expect(current.customizationSampleText).toBe("Unsaved sample");
  });

  it("replaces a custom question with its draft", () => {
    const preview = buildCustomizationQuestionPreview(DATA, { questionKey: "custom-question-41", draft: FULL_DRAFT });

    expect(titles(preview)).toEqual(["Draft question"]);
    expect(preview!.model.sections[0].questions[0]).toMatchObject({ required: true, questionType: "text" });
  });

  it("ignores a full draft sent for a base question", () => {
    const preview = buildCustomizationQuestionPreview(DATA, { questionKey: "base-question-11", draft: FULL_DRAFT });

    expect(titles(preview)).toEqual(["Base question", "Custom question"]);
  });

  it("adds a new question to the end of the section it's being added to", () => {
    const preview = buildCustomizationQuestionPreview(DATA, {
      questionKey: NEW_QUESTION_ID,
      sectionId: 1,
      draft: FULL_DRAFT,
    });

    expect(preview!.model.sections[0].title).toBe("Base section");
    expect(titles(preview)).toEqual(["Custom question", "Draft question"]);
    expect(preview!.currentKey).toBe(questionKey({ kind: "custom", customQuestionId: UNSAVED_CUSTOM_QUESTION_ID }));
  });

  it("falls back to the draft's section when the URL has none", () => {
    const preview = buildCustomizationQuestionPreview(DATA, { questionKey: NEW_QUESTION_ID, draft: FULL_DRAFT });

    expect(preview!.model.sections[0].title).toBe("Custom section");
  });

  it("returns null for an unknown question, or a new question with no draft", () => {
    expect(buildCustomizationQuestionPreview(DATA, { questionKey: "base-question-99", draft: null })).toBeNull();
    expect(buildCustomizationQuestionPreview(DATA, { questionKey: NEW_QUESTION_ID, sectionId: 1, draft: null })).toBeNull();
    expect(
      buildCustomizationQuestionPreview(DATA, { questionKey: NEW_QUESTION_ID, sectionId: 99, draft: FULL_DRAFT })
    ).toBeNull();
  });
});
