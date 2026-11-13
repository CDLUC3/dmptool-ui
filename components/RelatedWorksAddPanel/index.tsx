"use client";

import React, { useId } from "react";
import { useTranslations } from "next-intl";
import { TransitionLink } from "@/components/Form";
import styles from "./RelatedWorksAddPanel.module.scss";

export interface RelatedWorksAddPanelProps {
  href: string;
  hasPublishedPlan?: boolean;
}

const RelatedWorksAddPanel = ({ href, hasPublishedPlan = true }: RelatedWorksAddPanelProps) => {
  const t = useTranslations("RelatedWorksAddPanel");
  const headingId = useId();

  return (
    <section
      className={styles.panel}
      aria-labelledby={headingId}
    >
      <h2
        id={headingId}
        className={styles.heading}
      >
        {t("title")}
      </h2>
      <p className={styles.text}>{hasPublishedPlan ? t("descriptionPublished") : t("descriptionUnpublished")}</p>
      <TransitionLink
        href={href}
        className={`button-link button--primary ${styles.button}`}
      >
        {t("button")}
      </TransitionLink>
    </section>
  );
};

export default RelatedWorksAddPanel;
