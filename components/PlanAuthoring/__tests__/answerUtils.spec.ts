import {
  getAnswerValue,
  getAdditionalCommentValue,
  getOptions,
  hasAdditionalCommentKey,
  withAdditionalComment,
} from "../answerUtils";

describe("answerUtils", () => {
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
  });
});
