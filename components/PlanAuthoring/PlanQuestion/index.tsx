"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import { TEXT_AREA_QUESTION_TYPE } from "@/lib/constants";
import { useToast } from "@/context/ToastContext";
import type { PlanAuthoringDataSource } from "../dataSource";
import type {
  PlanCapabilities,
  PlanQuestionDefinition,
  PlanQuestionJsonError,
} from "../model";
import { questionAnchorId, questionKey } from "../model";
import {
  buildSampleAnswerDraft,
  getPlanSampleAnswers,
  resolveInitialAnswer,
} from "../sampleAnswers";
import { usePlanQuestionController } from "../usePlanQuestionController";
import type { RegisterUnsavedChange } from "../useUnsavedChangesRegistry";
import PlanQuestionHeader from "../PlanQuestionHeader";
import PlanSampleAnswers from "../PlanSampleAnswers";
import PlanQuestionAnswer from "../PlanQuestionAnswer";
import PlanQuestionSaveStatus from "../PlanQuestionSaveStatus";
import PlanQuestionSidebar from "../PlanQuestionSidebar";
import styles from "./PlanQuestion.module.scss";

const JSON_ERROR_KEYS: Record<PlanQuestionJsonError, string> = {
  missing: "messaging.errors.invalidQuestionType",
  parseFailed: "messaging.errors.questionJSONFParseFailed",
  unexpectedFormat: "messaging.errors.questionUnexpectedFormat",
};

interface PlanQuestionProps {
  question: PlanQuestionDefinition;
  capabilities: PlanCapabilities;
  dataSource: PlanAuthoringDataSource;
  onCustomizeGuidance: () => void;
  registerUnsavedChange?: RegisterUnsavedChange;
  className?: string;
}

export default function PlanQuestion({
  question,
  capabilities,
  dataSource,
  onCustomizeGuidance,
  registerUnsavedChange,
  className,
}: PlanQuestionProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const toast = useToast();
  const key = questionKey(question.identity);
  const initialAnswer = useMemo(
    () => resolveInitialAnswer(question),
    [
      question.answerJson,
      question.questionType,
      question.sampleText,
      question.useSampleTextAsDefault,
    ]
  );
  const sampleAnswers = getPlanSampleAnswers(question);
  const canEditAnswer = capabilities.canEditAnswers && !question.jsonError;
  const controller = usePlanQuestionController({
    questionKeyValue: key,
    initialAnswer,
    dataSource,
    canEdit: canEditAnswer,
    registerUnsavedChange,
  });
  const shellRef = useRef<HTMLElement | null>(null);
  const [heightPx, setHeightPx] = useState<number | null>(null);

  const showSampleAnswers =
    question.questionType === TEXT_AREA_QUESTION_TYPE &&
    canEditAnswer &&
    sampleAnswers.length > 0;

  const onResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const shell = shellRef.current;
      if (!shell) {
        return;
      }

      event.preventDefault();
      const startY = event.clientY;
      const startHeight = shell.getBoundingClientRect().height;

      const onMove = (moveEvent: PointerEvent) => {
        const next = Math.max(280, startHeight + (moveEvent.clientY - startY));
        setHeightPx(next);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    []
  );

  return (
    <article
      ref={shellRef}
      id={questionAnchorId(question.identity)}
      className={[styles.planQuestion, className].filter(Boolean).join(" ")}
      aria-labelledby={`${questionAnchorId(question.identity)}-title`}
      data-resized={heightPx !== null}
      style={heightPx ? { height: `${heightPx}px` } : undefined}
    >
      <div className={styles.planQuestionBody}>
        <div className={styles.planQuestionMain}>
          <PlanQuestionHeader question={question} />
          {showSampleAnswers ? (
            <PlanSampleAnswers
              samples={sampleAnswers}
              onUseSample={(html) => {
                controller.setDraftAnswer(
                  buildSampleAnswerDraft(
                    question.questionType,
                    html,
                    controller.draftAnswer
                  )
                );
                toast.add(t("sampleAnswers.sampleTextAdded"), {
                  type: "success",
                  timeout: 3000,
                });
              }}
            />
          ) : null}
          {question.jsonError ? (
            <p className={styles.questionError}>
              {Global(JSON_ERROR_KEYS[question.jsonError])}
            </p>
          ) : (
            <>
              <PlanQuestionAnswer
                question={question}
                draftAnswer={controller.draftAnswer}
                disabled={!canEditAnswer}
                onChange={controller.setDraftAnswer}
              />
              <div className={styles.questionActions}>
                {canEditAnswer ? (
                  <PlanQuestionSaveStatus
                    state={controller.saveState}
                    lastSavedAt={question.lastSavedAt}
                  />
                ) : null}
                {/* TODO(follow-up PR): for researchOutputTable, hide this Save
                    button while ResearchOutputAnswerComponent is in single-row
                    edit (onEditingStateChange), matching PlanOverviewQuestionPageShared. */}
                {canEditAnswer ? (
                  <Button
                    onPress={() => {
                      void controller.saveNow();
                    }}
                  >
                    {Global("buttons.save")}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>
        <PlanQuestionSidebar
          questionTitleId={`${questionAnchorId(question.identity)}-title`}
          sources={question.guidanceSources}
          comments={question.comments}
          canCustomize={capabilities.canCustomizeGuidance}
          canComment={capabilities.canComment && question.hasAnswer}
          loadGuidance={() => dataSource.loadGuidance(key)}
          loadComments={() => dataSource.loadComments(key)}
          onAddComment={(text) =>
            dataSource.addComment(key, text).then(() => undefined)
          }
          onUpdateComment={(commentId, text) =>
            dataSource.updateComment(key, commentId, text)
          }
          onDeleteComment={(commentId) =>
            dataSource.deleteComment(key, commentId)
          }
          onCustomize={onCustomizeGuidance}
        />
      </div>
      <div
        className={styles.resizeHandle}
        role="separator"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-valuemin={280}
        aria-valuenow={heightPx ?? 320}
        aria-label={t("question.resizeAria")}
        title={t("question.resizeHint")}
        onPointerDown={onResizePointerDown}
        onDoubleClick={() => setHeightPx(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const delta = event.key === "ArrowDown" ? 24 : -24;
            const current =
              heightPx ??
              shellRef.current?.getBoundingClientRect().height ??
              320;
            setHeightPx(Math.max(280, current + delta));
          }
          if (event.key === "Home") {
            event.preventDefault();
            setHeightPx(null);
          }
        }}
      >
        <span className={styles.resizeGrip} aria-hidden="true" />
        <span className={styles.resizeLabel}>
          {t("question.resizeHint")}
        </span>
      </div>
    </article>
  );
}
