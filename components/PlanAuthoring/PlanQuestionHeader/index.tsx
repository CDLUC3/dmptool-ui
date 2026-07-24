"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";
import { DmpIcon } from "@/components/Icons";
import SafeHtml from "@/components/SafeHtml";
import type { PlanQuestionDefinition } from "../model";
import { questionAnchorId } from "../model";
import styles from "../PlanAuthoring.module.scss";

interface PlanQuestionHeaderProps {
  question: PlanQuestionDefinition;
  className?: string;
}

export default function PlanQuestionHeader({
  question,
  className,
}: PlanQuestionHeaderProps) {
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
            aria-label="Answered"
          >
            <DmpIcon
              icon="check_circle"
              width={20}
              height={20}
            />
          </span>
        ) : null}
        <h3 id={`${questionAnchorId(question.identity)}-title`}>
          {question.title}
        </h3>
      </div>
      {question.required ? (
        <span className={styles.requiredBadge}>Required by funder</span>
      ) : null}
      {question.requirementHtml ? (
        <>
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
              {expanded ? "Collapse" : "Expand"}
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
