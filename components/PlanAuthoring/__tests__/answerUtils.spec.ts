import { getAnswerValue, getOptions } from "../answerUtils";

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
});
