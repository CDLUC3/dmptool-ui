"use client";

import React, { useId } from "react";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { Link as AriaLink } from "react-aria-components";
import { Card } from "@/components/Card/card";
import { TransitionLink } from "@/components/Form";
import styles from "./PlanCard.module.scss";

export type PlanCardVariant = "template" | "uploaded";

export interface PlanCardSection {
  title?: string | null;
  href?: string;
  versionedSectionId?: number | null;
  customSectionId?: number | null;
  answeredQuestions?: number;
  totalQuestions?: number;
}

export interface PlanCardPlan {
  title?: string | null;
  variant?: PlanCardVariant;
  funding?: string | null;
  dmpId?: string | null;
  created?: string | null;
  modified?: string | null;
  versionedSections?: PlanCardSection[] | null;
  downloadHref?: string;
  actionHref?: string;
  actionLabel?: string;
}

export interface PlanCardProps {
  plan: PlanCardPlan;
  className?: string;
}

function displayText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function sectionKey(section: PlanCardSection, title: string, index: number) {
  return String(section.versionedSectionId ?? section.customSectionId ?? `${title}-${index}`);
}

function MetaLine({ parts }: { parts: string[] }) {
  if (parts.length === 0) {
    return null;
  }

  return (
    <p className={styles.meta}>
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {index > 0 && <span aria-hidden="true"> · </span>}
          {part}
        </React.Fragment>
      ))}
    </p>
  );
}

function resolveVariant(variant: unknown): PlanCardVariant {
  return variant === "uploaded" ? "uploaded" : "template";
}

function PlanCard({ plan, className = "" }: PlanCardProps) {
  const t = useTranslations("ProjectOverview");
  const sectionsHeadingId = useId();
  const variant = resolveVariant(plan.variant);
  const isUploaded = variant === "uploaded";
  const sections = plan.versionedSections ?? [];
  const title = displayText(plan.title, t("untitledPlan"));
  const funding = displayText(plan.funding, t("noFunderSelected"));
  const actionLabel = plan.actionLabel || t("update");
  const dateParts = [
    plan.modified ? `${t("lastUpdated")}: ${plan.modified}` : null,
    plan.created ? `${t("created")}: ${plan.created}` : null,
  ].filter((part): part is string => Boolean(part));
  const uploadedMetaParts = [
    t("uploadedDocument"),
    ...dateParts,
  ];

  return (
    <Card
      className={classNames(styles.planCard, className)}
      data-testid="plan-card"
      data-variant={variant}
    >
      <p className={styles.funding}>{t("funding")}: {funding}</p>

      <div className={styles.titleRow}>
        <h3 className={styles.title}>
          {plan.actionHref ? (
            <TransitionLink
              href={plan.actionHref}
              className={styles.titleLink}
            >
              {title}
            </TransitionLink>
          ) : (
            title
          )}
        </h3>
        {isUploaded && (
          <span className={styles.badge}>
            {t("uploaded")}
          </span>
        )}
      </div>

      {isUploaded ? (
        <MetaLine parts={uploadedMetaParts} />
      ) : (
        <>
          {sections.length > 0 && (
            <div className={styles.sections}>
              <h4
                id={sectionsHeadingId}
                className={styles.sectionsHeading}
              >
                {t("sections")}
              </h4>
              <ul
                className={styles.sectionsList}
                aria-labelledby={sectionsHeadingId}
              >
                {sections.map((section, index) => {
                  const sectionTitle = displayText(section.title, t("untitledSection"));

                  return (
                    <li
                      key={sectionKey(section, sectionTitle, index)}
                      className={styles.sectionsItem}
                    >
                      {section.href ? (
                        <TransitionLink
                          href={section.href}
                          className="text-link"
                        >
                          {sectionTitle}
                        </TransitionLink>
                      ) : (
                        <span className={styles.sectionTitle}>{sectionTitle}</span>
                      )}
                      {section.answeredQuestions != null && section.totalQuestions != null && (
                        <span className={styles.progress}>
                          {t("progress", {
                            current: section.answeredQuestions,
                            total: section.totalQuestions,
                          })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {plan.dmpId && (
            <p className={styles.doi}>
              {t("doi")}:{" "}
              {plan.dmpId.startsWith("http") ? (
                <AriaLink
                  href={plan.dmpId}
                  className={styles.doiLink}
                >
                  {plan.dmpId}
                </AriaLink>
              ) : (
                plan.dmpId
              )}
            </p>
          )}
          <MetaLine parts={dateParts} />
        </>
      )}

      {(plan.downloadHref || plan.actionHref) && (
        <div className={styles.footer}>
          <div className={styles.links}>
            {plan.downloadHref && (
              <TransitionLink
                href={plan.downloadHref}
                className="text-link"
                aria-label={t("downloadWithTitle", { title })}
              >
                {t("download")}
              </TransitionLink>
            )}
          </div>
          {plan.actionHref && (
            <div className={styles.action}>
              <TransitionLink
                href={plan.actionHref}
                className="react-aria-Button react-aria-Button--primary"
                aria-label={t("actionWithTitle", { action: actionLabel, title })}
              >
                {actionLabel}
              </TransitionLink>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default PlanCard;
