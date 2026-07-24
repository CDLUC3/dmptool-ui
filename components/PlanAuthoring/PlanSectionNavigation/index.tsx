"use client";

import React from "react";
import { Button } from "react-aria-components";
import type { PlanSectionDefinition } from "../model";
import { sectionKey } from "../model";
import { useSectionPickerShortcutLabel } from "../useSectionPickerShortcut";
import styles from "../PlanAuthoring.module.scss";

interface PlanSectionNavigationProps {
  sections: PlanSectionDefinition[];
  activeSection: PlanSectionDefinition | null;
  activeIndex: number;
  /** 0–1 scroll progress through the active section. */
  activeSectionProgress?: number;
  onOpenPicker: () => void;
  onSelectSection?: (section: PlanSectionDefinition) => void;
  className?: string;
}

export default function PlanSectionNavigation({
  sections,
  activeSection,
  activeIndex,
  activeSectionProgress = 0,
  onOpenPicker,
  onSelectSection,
  className,
}: PlanSectionNavigationProps) {
  const shortcutLabel = useSectionPickerShortcutLabel();
  const progressPercent =
    sections.length === 0
      ? 0
      : Math.round(
          ((Math.max(activeIndex, 0) + activeSectionProgress) /
            sections.length) *
            100
        );

  return (
    <nav
      className={[styles.sectionNavigation, className].filter(Boolean).join(" ")}
      aria-label="Plan sections"
    >
      <div className={styles.sectionNavigationRow}>
        <div className={styles.sectionNavigationMeta}>
          <p className={styles.sectionMetaLine}>
            <span className={styles.eyebrow}>Section</span>
            <span className={styles.sectionCount}>
              <span className={styles.tabular}>
                {Math.max(activeIndex, 0) + 1}
              </span>{" "}
              of {sections.length}
            </span>
          </p>
          <Button
            className={styles.sectionNameButton}
            onPress={onOpenPicker}
            aria-label="Open section picker"
          >
            <span className={styles.sectionName}>
              {activeSection?.title ?? "Select a section"}
            </span>
          </Button>
          <p className={styles.hint}>
            Click section title to jump · {shortcutLabel}
          </p>
        </div>
        <div
          className="hidden-accessibly"
          aria-live="polite"
        >
          {activeSection
            ? `Current section ${activeIndex + 1} of ${sections.length}: ${activeSection.title}`
            : "No section selected"}
        </div>
        <Button
          className={styles.switchSectionButton}
          onPress={onOpenPicker}
        >
          <span aria-hidden="true">⇅</span> Jump to section…
        </Button>
      </div>
      <div
        className={styles.progressTrack}
        style={
          {
            "--progress-percent": `${progressPercent}%`,
          } as React.CSSProperties
        }
      >
        {sections.map((section, index) => {
          const key = sectionKey(section.identity);
          const isActive = activeSection
            ? sectionKey(activeSection.identity) === key
            : false;
          const isComplete = index < activeIndex;
          // Unrounded so the fill animates in fine steps as you scroll.
          const fillPercent = isComplete
            ? 100
            : isActive
              ? activeSectionProgress * 100
              : 0;
          return (
            <button
              key={key}
              type="button"
              className={styles.progressSegment}
              data-active={isActive}
              data-complete={isComplete}
              style={
                {
                  "--segment-fill": `${fillPercent}%`,
                } as React.CSSProperties
              }
              aria-label={`Go to section ${index + 1}: ${section.title}`}
              aria-current={isActive ? "true" : undefined}
              title={`${index + 1}. ${section.title}`}
              onClick={() => onSelectSection?.(section)}
            />
          );
        })}
      </div>
    </nav>
  );
}
