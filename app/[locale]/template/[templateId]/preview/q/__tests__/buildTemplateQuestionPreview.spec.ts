import { questionKey } from "@/components/PlanAuthoring/model";
import type { TemplatePreviewTemplate } from "../../toTemplatePreviewModel";
import { EMPTY_GUIDANCE_LOOKUP } from "@/components/PlanPreview/previewGuidance";
import { withAnswersFrom } from "@/components/PlanPreview/questionPreviewSlice";
import {
  buildTemplateQuestionPreview,
  UNSAVED_QUESTION_ID,
  type TemplateQuestionPreviewTarget,
} from "../buildTemplateQuestionPreview";
import type { QuestionPreviewDraft } from "@/components/QuestionPreviewLink/questionPreviewDraft";

const EXAMPLE_GUIDANCE = {
  label: "Example org",
  shortName: "Example",
  bodyHtml: "<p>Example</p>",
  noTemplateGuidanceNoteHtml: "",
};

const question = (id: number, displayOrder: number) => ({
  id,
  displayOrder,
  questionText: `Question ${id}`,
  json: '{"type":"text"}',
});

const TEMPLATE: TemplatePreviewTemplate = {
  id: 7,
  name: "NSF DMP",
  latestPublishVersion: "v2",
  owner: null,
  sections: [
    { id: 2, name: "Second", displayOrder: 2, questions: [question(23, 3), question(21, 1), question(22, 2), question(24, 4)] },
    { id: 1, name: "First", displayOrder: 1, questions: [question(11, 1)] },
    { id: 3, name: "Third", displayOrder: 3, questions: [] },
  ],
};

const DRAFT: QuestionPreviewDraft = {
  sectionId: 2,
  questionText: "Edited question",
  requirementText: null,
  guidanceText: "<p>Draft guidance</p>",
  sampleText: null,
  useSampleTextAsDefault: false,
  required: true,
  json: '{"type":"textArea"}',
};

const buildQuestionPreview = (template: TemplatePreviewTemplate, target: TemplateQuestionPreviewTarget, example = EXAMPLE_GUIDANCE) =>
  buildTemplateQuestionPreview({ template, guidance: EMPTY_GUIDANCE_LOOKUP }, target, example);

const titles = (preview: ReturnType<typeof buildQuestionPreview>) =>
  preview!.model.sections[0].questions.map((q) => q.title);

describe("buildTemplateQuestionPreview", () => {
  it("shows only the question's section with the questions either side of it", () => {
    const preview = buildQuestionPreview(TEMPLATE, { questionId: "22", draft: null }, EXAMPLE_GUIDANCE);

    expect(preview!.model.sections).toHaveLength(1);
    expect(preview!.model.sections[0].title).toBe("Second");
    expect(titles(preview)).toEqual(["Question 21", "Question 22", "Question 23"]);
    expect(preview!.sectionIndex).toBe(1);
    expect(preview!.totalSections).toBe(3);
    expect(preview!.currentKey).toBe(questionKey({ kind: "base", versionedQuestionId: 22 }));
  });

  it("leaves out the neighbours that don't exist", () => {
    expect(titles(buildQuestionPreview(TEMPLATE, { questionId: "21", draft: null }, EXAMPLE_GUIDANCE))).toEqual([
      "Question 21",
      "Question 22",
    ]);
    expect(titles(buildQuestionPreview(TEMPLATE, { questionId: "24", draft: null }, EXAMPLE_GUIDANCE))).toEqual([
      "Question 23",
      "Question 24",
    ]);
    expect(titles(buildQuestionPreview(TEMPLATE, { questionId: "11", draft: null }, EXAMPLE_GUIDANCE))).toEqual([
      "Question 11",
    ]);
  });

  it("applies the editor's unsaved draft to the question", () => {
    const preview = buildQuestionPreview(TEMPLATE, { questionId: "22", draft: DRAFT }, EXAMPLE_GUIDANCE);
    const current = preview!.model.sections[0].questions[1];

    expect(current.title).toBe("Edited question");
    expect(current.required).toBe(true);
    expect(current.parsedJson?.type).toBe("textArea");
    expect(preview!.model.sections[0].questions[0].title).toBe("Question 21");
  });

  it("adds a new question to the end of its section from the draft", () => {
    const preview = buildQuestionPreview(TEMPLATE, { questionId: "new", sectionId: 2, draft: DRAFT }, EXAMPLE_GUIDANCE);

    expect(titles(preview)).toEqual(["Question 24", "Edited question"]);
    expect(preview!.currentKey).toBe(questionKey({ kind: "base", versionedQuestionId: UNSAVED_QUESTION_ID }));
    expect(preview!.model.sections[0].questions[1].identity).toEqual({
      kind: "base",
      versionedQuestionId: UNSAVED_QUESTION_ID,
    });
  });

  it("previews a new question as the only one in an empty section", () => {
    const preview = buildQuestionPreview(
      TEMPLATE,
      { questionId: "new", draft: { ...DRAFT, sectionId: 3 } },
      EXAMPLE_GUIDANCE
    );

    expect(preview!.model.sections[0].title).toBe("Third");
    expect(titles(preview)).toEqual(["Edited question"]);
  });

  it("returns null when there is nothing to preview", () => {
    expect(buildQuestionPreview(TEMPLATE, { questionId: "99", draft: null }, EXAMPLE_GUIDANCE)).toBeNull();
    expect(buildQuestionPreview(TEMPLATE, { questionId: "new", sectionId: 2, draft: null }, EXAMPLE_GUIDANCE)).toBeNull();
    expect(
      buildQuestionPreview(TEMPLATE, { questionId: "new", draft: { ...DRAFT, sectionId: 42 } }, EXAMPLE_GUIDANCE)
    ).toBeNull();
  });
});

describe("withAnswersFrom", () => {
  it("keeps answers typed in the preview when the model is rebuilt", () => {
    const first = buildQuestionPreview(TEMPLATE, { questionId: "22", draft: null }, EXAMPLE_GUIDANCE)!.model;
    const answered = {
      ...first,
      sections: first.sections.map((section) => ({
        ...section,
        questions: section.questions.map((q, index) =>
          index === 1 ? { ...q, answerJson: { type: "text", answer: "Typed" }, hasAnswer: true } : q
        ),
      })),
    };
    const rebuilt = buildQuestionPreview(TEMPLATE, { questionId: "22", draft: DRAFT }, EXAMPLE_GUIDANCE)!.model;

    const merged = withAnswersFrom(answered, rebuilt);

    expect(merged.sections[0].questions[1].title).toBe("Edited question");
    expect(merged.sections[0].questions[1].answerJson).toEqual({ type: "text", answer: "Typed" });
    expect(merged.sections[0].questions[0].hasAnswer).toBe(false);
    expect(withAnswersFrom(null, rebuilt)).toBe(rebuilt);
  });
});
