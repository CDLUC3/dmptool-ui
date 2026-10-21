import {
  getAnswerValue,
  getAdditionalCommentValue,
  getOptions,
  hasAdditionalCommentKey,
  isFilledAnswer,
  withAdditionalComment,
} from "../answerUtils";

describe("answerUtils", () => {
  describe("isFilledAnswer", () => {
    it("treats empty or null text and textArea answers as unanswered", () => {
      expect(isFilledAnswer({ type: "text", answer: "" })).toBe(false);
      expect(isFilledAnswer({ type: "textArea", answer: null })).toBe(false);
      expect(isFilledAnswer({ type: "textArea" })).toBe(false);
    });

    it("counts any other answer object, as the server's progress does", () => {
      expect(isFilledAnswer({ type: "text", answer: "x" })).toBe(true);
      expect(isFilledAnswer({ type: "checkBoxes", answer: [] })).toBe(true);
      expect(isFilledAnswer({ type: "date", answer: null })).toBe(true);
    });

    it("treats a missing or non-object answer as unanswered", () => {
      expect(isFilledAnswer(null)).toBe(false);
      expect(isFilledAnswer(undefined)).toBe(false);
      expect(isFilledAnswer("text")).toBe(false);
    });
  });

  describe("getOptions", () => {
    it("returns an empty list when options are missing or not an array", () => {
      expect(getOptions({})).toEqual([]);
      expect(getOptions({ options: "nope" })).toEqual([]);
    });

    it("normalizes label/value and drops incomplete entries", () => {
      expect(
        getOptions({
          options: [
            { label: "Yes", value: "yes" },
            { text: "Maybe" },
            { label: "" },
            null,
          ],
        })
      ).toEqual([
        { label: "Yes", value: "yes" },
        { label: "Maybe", value: "Maybe" },
      ]);
    });
  });

  describe("getAnswerValue", () => {
    it("returns primitives as-is and unwraps answer objects", () => {
      expect(getAnswerValue("hello")).toBe("hello");
      expect(getAnswerValue(null)).toBeNull();
      expect(getAnswerValue({ answer: "yes" })).toBe("yes");
      expect(getAnswerValue({ answer: ["a", "b"] })).toEqual(["a", "b"]);
    });
  });

  describe("getAdditionalCommentValue", () => {
    it("returns the additional-comment string or empty when missing", () => {
      expect(getAdditionalCommentValue({ comment: "note" })).toBe("note");
      expect(getAdditionalCommentValue({ answer: "yes" })).toBe("");
      expect(getAdditionalCommentValue(null)).toBe("");
      expect(getAdditionalCommentValue({ comment: 12 })).toBe("");
    });
  });

  describe("hasAdditionalCommentKey", () => {
    it("detects the legacy comment key on answer JSON", () => {
      expect(hasAdditionalCommentKey({ comment: "" })).toBe(true);
      expect(hasAdditionalCommentKey({ answer: "yes" })).toBe(false);
      expect(hasAdditionalCommentKey(null)).toBe(false);
    });
  });

  describe("withAdditionalComment", () => {
    it("preserves type and answer while setting the comment JSON key", () => {
      expect(
        withAdditionalComment(
          { type: "radioButtons", answer: "mixed" },
          "radioButtons",
          "split explained"
        )
      ).toEqual({
        type: "radioButtons",
        answer: "mixed",
        comment: "split explained",
      });
    });

    it("builds a typed object when draft is missing", () => {
      expect(withAdditionalComment(null, "text", "note")).toEqual({
        type: "text",
        answer: null,
        comment: "note",
      });
    });

    describe("select box default option", () => {
      const parsedJson = {
        type: "selectBox",
        options: [
          { label: "Oregon", value: "Oregon" },
          { label: "California", value: "California", selected: true },
        ],
      };

      it.each([
        ["missing", null],
        ["null", { type: "selectBox", answer: null }],
        ["empty", { type: "selectBox", answer: "" }],
      ])("uses the default option when the answer is %s", (_label, draft) => {
        expect(withAdditionalComment(draft, "selectBox", "note", parsedJson)).toEqual({
          type: "selectBox",
          answer: "California",
          comment: "note",
        });
      });

      it("keeps a chosen answer over the default option", () => {
        expect(
          withAdditionalComment(
            { type: "selectBox", answer: "Oregon" },
            "selectBox",
            "note",
            parsedJson
          )
        ).toEqual({ type: "selectBox", answer: "Oregon", comment: "note" });
      });

      it("leaves the answer empty when no option is marked selected", () => {
        expect(
          withAdditionalComment(null, "selectBox", "note", {
            type: "selectBox",
            options: [{ label: "Oregon", value: "Oregon" }],
          })
        ).toEqual({ type: "selectBox", answer: null, comment: "note" });
      });
    });
  });
});
