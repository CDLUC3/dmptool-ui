"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  DialogTrigger,
  OverlayArrow,
  Popover,
} from "react-aria-components";
import { DmpIcon } from "@/components/Icons";
import SafeHtml from "@/components/SafeHtml";
import { stripHtmlTags } from "@/utils/general";
import type { PlanQuestionDefinition } from "../model";
import { questionAnchorId } from "../model";
import styles from "./PlanQuestionHeader.module.scss";

interface PlanQuestionHeaderProps {
  question: PlanQuestionDefinition;
  className?: string;
}

export default function PlanQuestionHeader({
  question,
  className,
}: PlanQuestionHeaderProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const PlanOverview = useTranslations("PlanOverview");
  const anchorId = questionAnchorId(question.identity);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const requirementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = requirementRef.current;
    if (!node) {
      return;
    }

    const measure = () => {
      // Only meaningful while clamped; once expanded keep the toggle visible.
      if (!expanded) {
        setOverflowing(node.scrollHeight > node.clientHeight + 1);
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, question.requirementHtml]);

  return (
    <div
      className={[styles.planQuestionHeader, className].filter(Boolean).join(" ")}
    >
      <div className={styles.titleRow}>
        {question.hasAnswer ? (
          <span
            className={styles.answeredIcon}
            role="img"
            aria-label={t("question.answeredAria")}
          >
            <DmpIcon
              icon="check_circle"
              width={20}
              height={20}
            />
          </span>
        ) : (
          <span
            className={styles.notAnsweredIcon}
            role="img"
            aria-label={PlanOverview("question.notAnswered")}
          >
            <DmpIcon
              icon="cancel"
              width={20}
              height={20}
              fill="currentColor"
            />
          </span>
        )}
        <h3 id={`${anchorId}-title`}>
          {stripHtmlTags(question.title)}
        </h3>
      </div>
      {question.required ? (
        <div className={styles.requiredRow}>
          <DialogTrigger>
            <Button className={styles.requiredBadge}>
              {t("question.requiredByFunder")}
            </Button>
            <Popover className="dynamic-popover-width react-aria-Popover">
              <OverlayArrow>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  aria-hidden="true"
                >
                  <path d="M0 0 L6 6 L12 0" />
                </svg>
              </OverlayArrow>
              <Dialog aria-label={t("question.requiredByFunder")}>
                <div className="flex-col">
                  {PlanOverview("page.requiredByFunderInfo")}
                </div>
              </Dialog>
            </Popover>
          </DialogTrigger>
        </div>
      ) : null}
      {question.requirementHtml ? (
        <>
          {question.requirementOrgLabel ? (
            <p className={styles.requirementLabel}>
              {t("question.requirementsBy", { funder: question.requirementOrgLabel })}
            </p>
          ) : null}
          <div
            ref={requirementRef}
            className={styles.questionRequirement}
            data-expanded={expanded}
          >
            <SafeHtml html={question.requirementHtml} />
          </div>
          {overflowing || expanded ? (
            <Button
              className={`button-as-link ${styles.requirementToggle}`}
              onPress={() => setExpanded((current) => !current)}
              aria-expanded={expanded}
            >
              {expanded ? Global("links.collapse") : Global("links.expand")}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
