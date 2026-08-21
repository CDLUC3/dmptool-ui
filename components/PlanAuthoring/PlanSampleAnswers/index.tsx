"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import SafeHtml from "@/components/SafeHtml";
import type { PlanSampleAnswer } from "../sampleAnswers";
import styles from "./PlanSampleAnswers.module.scss";

interface PlanSampleAnswersProps {
  samples: PlanSampleAnswer[];
  disabled?: boolean;
  onUseSample: (html: string) => void;
  className?: string;
}

export default function PlanSampleAnswers({
  samples,
  disabled = false,
  onUseSample,
  className,
}: PlanSampleAnswersProps) {
  const t = useTranslations("PlanAuthoring");
  const [expanded, setExpanded] = useState(false);

  if (samples.length === 0) {
    return null;
  }

  const triggerLabel =
    samples.length === 1
      ? t("sampleAnswers.viewSampleAnswer")
      : t("sampleAnswers.viewSampleAnswersCount", { count: samples.length });

  return (
    <div
      className={[styles.sampleAnswers, className].filter(Boolean).join(" ")}
    >
      <Button
        className="tertiary small"
        onPress={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        isDisabled={disabled}
      >
        {triggerLabel}
      </Button>
      {expanded ? (
        <div className={styles.well}>
          {samples.map((sample) => (
            <div key={sample.id} className={styles.sample}>
              <h4 className={styles.orgHeading}>
                {t("sampleAnswers.organizationSampleText", {
                  org: sample.orgLabel,
                })}
              </h4>
              <div className={styles.sampleBody}>
                <SafeHtml html={sample.html} />
              </div>
              <Button
                className="secondary small"
                isDisabled={disabled}
                onPress={() => {
                  setExpanded(false);
                  onUseSample(sample.html);
                }}
              >
                {t("sampleAnswers.useAnswer")}
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
