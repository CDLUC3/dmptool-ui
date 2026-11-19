import { Author } from "@/generated/graphql";
import {
  formatAuthorNameAbrev,
  formatAuthorNameFirstLast,
  formatAuthorNames,
  formatSubtitle,
} from "@/lib/relatedWorks";

const author = (overrides: Author): Author => ({ ...overrides });

const ADA = author({ givenName: "Ada", firstInitial: "A", surname: "Lovelace", full: "Ada Lovelace" });
const ALAN = author({ givenName: "Alan", firstInitial: "A", middleInitials: "M", surname: "Turing", full: "Alan Turing" });
const GRACE = author({ givenName: "Grace", firstInitial: "G", surname: "Hopper", full: "Grace Hopper" });

describe("formatAuthorNameAbrev", () => {
  it("should combine initials with the surname", () => {
    expect(formatAuthorNameAbrev(ADA)).toBe("A Lovelace");
    expect(formatAuthorNameAbrev(ALAN)).toBe("AM Turing");
  });

  it("should fall back to the full name, or null when there is no name", () => {
    expect(formatAuthorNameAbrev(author({ full: "The Polar Consortium" }))).toBe("The Polar Consortium");
    expect(formatAuthorNameAbrev(author({}))).toBeNull();
  });
});

describe("formatAuthorNameFirstLast", () => {
  it("should show the given name before the surname", () => {
    expect(formatAuthorNameFirstLast(ADA)).toBe("Ada Lovelace");
  });

  it("should fall back to the full name, or null when there is no name", () => {
    expect(formatAuthorNameFirstLast(author({ surname: "Lovelace", full: "Lovelace, A." }))).toBe("Lovelace, A.");
    expect(formatAuthorNameFirstLast(author({}))).toBeNull();
  });
});

describe("formatAuthorNames", () => {
  it("should list every author when they fit", () => {
    expect(formatAuthorNames([ADA, ALAN, GRACE], 100)).toBe("A Lovelace, AM Turing, G Hopper");
  });

  it("should stop at the character limit and add et al", () => {
    // "A Lovelace" (10) + "AM Turing" (9) reaches the limit of 15
    expect(formatAuthorNames([ADA, ALAN, GRACE], 15)).toBe("A Lovelace, AM Turing, et al");
  });

  it("should not add et al when the last author reaches the limit", () => {
    expect(formatAuthorNames([ADA, ALAN], 15)).toBe("A Lovelace, AM Turing");
  });

  it("should skip authors without a name", () => {
    expect(formatAuthorNames([author({}), GRACE], 100)).toBe("G Hopper");
    expect(formatAuthorNames([], 100)).toBe("");
  });
});

describe("formatSubtitle", () => {
  it("should build a citation-style subtitle", () => {
    expect(formatSubtitle([ADA, GRACE], "Nature", "2024-05-01", 100)).toEqual({
      authorNames: "A Lovelace, G Hopper. ",
      containerTitle: " Nature, ",
      publicationYear: "2024.",
    });
  });

  it("should end the venue with a full stop when there is no date", () => {
    expect(formatSubtitle([ADA], "Nature", null, 100)).toEqual({
      authorNames: "A Lovelace. ",
      containerTitle: " Nature.",
      publicationYear: "",
    });
  });

  it("should leave out a missing venue", () => {
    expect(formatSubtitle([ADA], undefined, "2024-05-01", 100).containerTitle).toBe("");
  });
});
