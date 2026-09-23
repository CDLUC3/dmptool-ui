"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PlanSectionDefinition,
  questionAnchorId,
  sectionAnchorId,
  sectionKey,
} from "./model";

interface UsePlanSectionNavigationArgs {
  sections: PlanSectionDefinition[];
  /**
   * Distance in pixels from the top of the viewport used as the scroll-spy
   * reference line. Should clear the sticky section navigation bar.
   */
  spyOffset?: number;
}

interface UsePlanSectionNavigationResult {
  activeSectionKey: string | null;
  activeSection: PlanSectionDefinition | null;
  activeIndex: number;
  /** 0–1 scroll progress through the active section. */
  activeSectionProgress: number;
  jumpToSection: (section: PlanSectionDefinition) => void;
}

export function usePlanSectionNavigation({
  sections,
  spyOffset = 140,
}: UsePlanSectionNavigationArgs): UsePlanSectionNavigationResult {
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(
    sections[0] ? sectionKey(sections[0].identity) : null
  );
  const [activeSectionProgress, setActiveSectionProgress] = useState(0);

  const sectionByKey = useMemo(() => {
    return new Map(
      sections.map((section) => [sectionKey(section.identity), section])
    );
  }, [sections]);

  // Scroll-position-based spy. IntersectionObserver with ratio thresholds
  // breaks down for sections taller than the viewport (the ratio never
  // reaches the threshold), so track the last section whose top has crossed
  // the reference line instead.
  useEffect(() => {
    if (!sections.length) {
      setActiveSectionKey(null);
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;

      let currentKey = sectionKey(sections[0].identity);
      let currentNode: HTMLElement | null = null;

      for (const section of sections) {
        const node = document.getElementById(
          sectionAnchorId(section.identity)
        );
        if (!node) {
          continue;
        }
        const top = node.getBoundingClientRect().top;
        if (top <= spyOffset) {
          currentKey = sectionKey(section.identity);
          currentNode = node;
        } else {
          break;
        }
      }

      // At the very bottom of the page the last section should win even if
      // its top never crosses the reference line.
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const atBottom = docHeight - scrollBottom < 2;
      if (atBottom) {
        currentKey = sectionKey(sections[sections.length - 1].identity);
        currentNode = document.getElementById(
          sectionAnchorId(sections[sections.length - 1].identity)
        );
      }

      let progress = 0;
      if (atBottom) {
        progress = 1;
      } else if (currentNode) {
        const rect = currentNode.getBoundingClientRect();
        const scrollable = Math.max(rect.height - spyOffset, 1);
        progress = Math.min(Math.max((spyOffset - rect.top) / scrollable, 0), 1);
      }

      setActiveSectionKey(currentKey);
      setActiveSectionProgress(progress);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections, spyOffset]);

  const jumpToSection = useCallback((section: PlanSectionDefinition) => {
    const sectionNode = document.getElementById(
      sectionAnchorId(section.identity)
    );
    if (!sectionNode) {
      return;
    }

    setActiveSectionKey(sectionKey(section.identity));
    sectionNode.scrollIntoView({ behavior: "smooth", block: "start" });

    // Prefer focusing the first question so keyboard / screen-reader users
    // land in the interactive content of the section, not just the header.
    const firstQuestion = section.questions[0];
    const focusTarget = firstQuestion
      ? document.getElementById(questionAnchorId(firstQuestion.identity))
          ?.querySelector<HTMLElement>("h3") ??
        document.getElementById(questionAnchorId(firstQuestion.identity))
      : sectionNode.querySelector<HTMLElement>("h2");

    if (focusTarget) {
      if (!focusTarget.hasAttribute("tabindex")) {
        focusTarget.setAttribute("tabindex", "-1");
      }
      // Delay past React Aria dialog focus restoration (picker close) so the
      // first question keeps keyboard focus after a jump.
      window.setTimeout(() => {
        focusTarget.focus({ preventScroll: true });
      }, 50);
    }
  }, []);

  const activeSection = activeSectionKey
    ? sectionByKey.get(activeSectionKey) ?? null
    : null;
  const activeIndex = activeSection
    ? sections.findIndex(
        (section) =>
          sectionKey(section.identity) === sectionKey(activeSection.identity)
      )
    : -1;

  return {
    activeSectionKey,
    activeSection,
    activeIndex,
    activeSectionProgress,
    jumpToSection,
  };
}
