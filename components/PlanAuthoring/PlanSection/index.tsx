"use client";

import React from "react";
import { useTranslations } from "next-intl";
import SafeHtml from "@/components/SafeHtml";
import type { PlanSectionDefinition } from "../model";
import { sectionAnchorId } from "../model";
import styles from "./PlanSection.module.scss";

interface PlanSectionProps {
  section: PlanSectionDefinition;
  index: number;
  total: number;
  children: React.ReactNode;
  className?: string;
}

export default function PlanSection({
  section,
  index,
  total,
  children,
  className,
}: PlanSectionProps) {
  const t = useTranslations("PlanAuthoring");

  return (
    <section
      id={sectionAnchorId(section.identity)}
      className={[styles.planSection, className].filter(Boolean).join(" ")}
      aria-labelledby={`${sectionAnchorId(section.identity)}-title`}
    >
      <div className={styles.planSectionHeader}>
        <div className={styles.planSectionTitleBar}>
          <span className={styles.sectionBadge}>
            {t("section.badge", { index: index + 1 })}
          </span>
          <h2 id={`${sectionAnchorId(section.identity)}-title`}>
            {section.title}
          </h2>
        </div>
        {section.introductionHtml ? (
          <div className={styles.planSectionIntro}>
            <SafeHtml html={section.introductionHtml} />
          </div>
        ) : null}
        {section.requirementsHtml ? (
          <div className={styles.planSectionRequirements}>
            <SafeHtml html={section.requirementsHtml} />
          </div>
        ) : null}
        <p className="hidden-accessibly">
          {t("section.ofTotal", { index: index + 1, total })}
        </p>
      </div>
      <div className={styles.planSectionQuestions}>{children}</div>
      <p className={styles.backToTop}>
        <a href={`#${sectionAnchorId(section.identity)}`}>
          <span aria-hidden="true">↑</span>{" "}
          {t("section.backToTop", { title: section.title })}
        </a>
      </p>
    </section>
  );
}
