import { act, renderHook } from "@testing-library/react";
import { usePlanSectionNavigation } from "../usePlanSectionNavigation";
import {
  questionAnchorId,
  sectionAnchorId,
  sectionKey,
  type PlanSectionDefinition,
} from "../model";
import { makeQuestion, makeSection } from "../mocks";

function section(id: number, questionIds: number[] = []): PlanSectionDefinition {
  return makeSection({
    identity: { kind: "base", versionedSectionId: id },
    title: `Section ${id}`,
    questions: questionIds.map((questionId) =>
      makeQuestion({ identity: { kind: "base", versionedQuestionId: questionId } })
    ),
  });
}

const sections = [section(1, [11]), section(2, [21]), section(3)];

function mountSections(list: PlanSectionDefinition[]) {
  for (const item of list) {
    const node = document.createElement("section");
    node.id = sectionAnchorId(item.identity);
    node.innerHTML = "<h2>Title</h2>";
    for (const question of item.questions) {
      const article = document.createElement("article");
      article.id = questionAnchorId(question.identity);
      article.innerHTML = "<h3>Question</h3>";
      node.appendChild(article);
    }
    document.body.appendChild(node);
  }
}

function placeSection(item: PlanSectionDefinition, top: number, height = 300) {
  const node = document.getElementById(sectionAnchorId(item.identity))!;
  node.getBoundingClientRect = () => new DOMRect(0, top, 0, height);
}

function setPage({ scrollY = 0, scrollHeight = 5000 } = {}) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: scrollY });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
}

let frames: FrameRequestCallback[] = [];
const flushFrames = () =>
  act(() => {
    const pending = frames;
    frames = [];
    pending.forEach((callback) => callback(0));
  });
const scroll = () => {
  window.dispatchEvent(new Event("scroll"));
  flushFrames();
};

beforeEach(() => {
  frames = [];
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  Element.prototype.scrollIntoView = jest.fn();
  setPage();
  mountSections(sections);
  sections.forEach((item, index) => placeSection(item, 200 + index * 400));
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  document.body.innerHTML = "";
});

const enableFakeTimers = () =>
  jest.useFakeTimers({ doNotFake: ["requestAnimationFrame", "cancelAnimationFrame"] });

describe("usePlanSectionNavigation", () => {
  it("starts on the first section", () => {
    const { result } = renderHook(() => usePlanSectionNavigation({ sections }));

    expect(result.current.activeSectionKey).toBe(sectionKey(sections[0].identity));
    expect(result.current.activeSection).toBe(sections[0]);
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activeSectionProgress).toBe(0);
  });

  it("has no active section when there are no sections", () => {
    const { result } = renderHook(() => usePlanSectionNavigation({ sections: [] }));

    expect(result.current.activeSectionKey).toBeNull();
    expect(result.current.activeSection).toBeNull();
    expect(result.current.activeIndex).toBe(-1);
  });

  it("follows the last section whose top has crossed the reference line, with progress through it", () => {
    const { result } = renderHook(() => usePlanSectionNavigation({ sections }));

    placeSection(sections[0], -500);
    placeSection(sections[1], 40, 300);
    placeSection(sections[2], 400);
    scroll();

    expect(result.current.activeSection).toBe(sections[1]);
    expect(result.current.activeIndex).toBe(1);
    // (140 - 40) / (300 - 140)
    expect(result.current.activeSectionProgress).toBeCloseTo(0.625);
  });

  it("clamps progress to the section and uses a custom reference line", () => {
    const { result } = renderHook(() =>
      usePlanSectionNavigation({ sections, spyOffset: 100 })
    );

    placeSection(sections[0], -2000, 300);
    scroll();
    expect(result.current.activeSection).toBe(sections[0]);
    expect(result.current.activeSectionProgress).toBe(1);

    placeSection(sections[0], 100, 300);
    scroll();
    expect(result.current.activeSectionProgress).toBe(0);
  });

  it("makes the last section active at the bottom of the page", () => {
    const { result } = renderHook(() => usePlanSectionNavigation({ sections }));

    setPage({ scrollY: 5000 - window.innerHeight, scrollHeight: 5000 });
    scroll();

    expect(result.current.activeSection).toBe(sections[2]);
    expect(result.current.activeSectionProgress).toBe(1);
  });

  it("skips sections that aren't in the page", () => {
    document.getElementById(sectionAnchorId(sections[1].identity))!.remove();
    const { result } = renderHook(() => usePlanSectionNavigation({ sections }));

    placeSection(sections[0], -500);
    placeSection(sections[2], 0);
    scroll();

    expect(result.current.activeSection).toBe(sections[2]);
  });

  it("updates once per animation frame and stops listening on unmount", () => {
    const { unmount } = renderHook(() => usePlanSectionNavigation({ sections }));

    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    expect(frames).toHaveLength(1);

    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);

    frames = [];
    window.dispatchEvent(new Event("scroll"));
    expect(frames).toHaveLength(0);
  });

  describe("jumpToSection", () => {
    it("scrolls to the section and focuses its first question's heading", () => {
      enableFakeTimers();
      const { result } = renderHook(() => usePlanSectionNavigation({ sections }));
      const target = document.getElementById(sectionAnchorId(sections[1].identity))!;
      const heading = document
        .getElementById(questionAnchorId(sections[1].questions[0].identity))!
        .querySelector("h3")!;

      act(() => result.current.jumpToSection(sections[1]));

      expect(result.current.activeSection).toBe(sections[1]);
      expect(target.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
      expect(heading).toHaveAttribute("tabindex", "-1");
      expect(heading).not.toHaveFocus();

      act(() => jest.advanceTimersByTime(50));
      expect(heading).toHaveFocus();
    });

    it("focuses the section heading when the section has no questions", () => {
      enableFakeTimers();
      const { result } = renderHook(() => usePlanSectionNavigation({ sections }));
      const heading = document
        .getElementById(sectionAnchorId(sections[2].identity))!
        .querySelector("h2")!;

      act(() => result.current.jumpToSection(sections[2]));
      act(() => jest.advanceTimersByTime(50));

      expect(heading).toHaveFocus();
    });

    it("keeps a heading's existing tabindex", () => {
      enableFakeTimers();
      const { result } = renderHook(() => usePlanSectionNavigation({ sections }));
      const heading = document
        .getElementById(questionAnchorId(sections[0].questions[0].identity))!
        .querySelector("h3")!;
      heading.setAttribute("tabindex", "0");

      act(() => result.current.jumpToSection(sections[0]));

      expect(heading).toHaveAttribute("tabindex", "0");
    });

    it("does nothing for a section that isn't in the page", () => {
      const { result } = renderHook(() => usePlanSectionNavigation({ sections }));
      const missing = section(99);

      act(() => result.current.jumpToSection(missing));

      expect(result.current.activeSection).toBe(sections[0]);
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
