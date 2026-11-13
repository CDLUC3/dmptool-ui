"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
import { TransitionLink } from "@/components/Form";
import styles from "./RelatedWorksUnpublished.module.scss";

export interface RelatedWorksUnpublishedProps {
  publishHref: string;
  addHref: string;
  planTitle?: string | null;
  viewAllPlansHref?: string;
}

const RelatedWorksUnpublished = ({ publishHref, addHref, planTitle, viewAllPlansHref }: RelatedWorksUnpublishedProps) => {
  const t = useTranslations("RelatedWorksUnpublished");
  const headingId = useId();

  return (
    <section
      className={styles.explainer}
      aria-labelledby={headingId}
    >
      <h3
        id={headingId}
        className={styles.heading}
      >
        {t("title")}
      </h3>

      {(planTitle || viewAllPlansHref) && (
        <p className={styles.scope}>
          {planTitle && (
            <span>
              {t("planLabel")}: {planTitle}
            </span>
          )}
          {planTitle && viewAllPlansHref && <span aria-hidden="true"> · </span>}
          {viewAllPlansHref && <TransitionLink href={viewAllPlansHref}>{t("viewAllPlans")}</TransitionLink>}
        </p>
      )}

      <p className={styles.intro}>{t("intro")}</p>
      <ol className={styles.steps}>
        <li>{t("steps.search")}</li>
        <li>{t("steps.review")}</li>
        <li>{t("steps.linked")}</li>
      </ol>

      <div className={styles.actions}>
        <TransitionLink
          href={publishHref}
          className="button-link button--primary"
        >
          {t("buttons.publish")}
        </TransitionLink>
        <TransitionLink
          href={addHref}
          className="button-link button--secondary"
        >
          {t("buttons.add")}
        </TransitionLink>
      </div>
    </section>
  );
};

export default RelatedWorksUnpublished;
