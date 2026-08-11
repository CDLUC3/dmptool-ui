"use client";

import React, { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import type { PlanAuthoringDataSource } from "../dataSource";
import type { PlanCapabilities, PlanQuestionDefinition } from "../model";
import { questionAnchorId, questionKey } from "../model";
import { usePlanQuestionController } from "../usePlanQuestionController";
import PlanQuestionHeader from "../PlanQuestionHeader";
import PlanQuestionAnswer from "../PlanQuestionAnswer";
import PlanQuestionSaveStatus from "../PlanQuestionSaveStatus";
import PlanQuestionSidebar from "../PlanQuestionSidebar";
import styles from "./PlanQuestion.module.scss";

interface PlanQuestionProps {
  question: PlanQuestionDefinition;
  capabilities: PlanCapabilities;
  currentUserId: number;
  dataSource: PlanAuthoringDataSource;
  onCustomizeGuidance: () => void;
  className?: string;
}

export default function PlanQuestion({
  question,
  capabilities,
  currentUserId,
  dataSource,
  onCustomizeGuidance,
  className,
}: PlanQuestionProps) {
  const t = useTranslations("PlanAuthoring");
  const Global = useTranslations("Global");
  const key = questionKey(question.identity);
  const controller = usePlanQuestionController({
    questionKeyValue: key,
    initialAnswer: question.answerJson,
    dataSource,
    canEdit: capabilities.canEditAnswers,
  });
  const shellRef = useRef<HTMLElement | null>(null);
  const [heightPx, setHeightPx] = useState<number | null>(null);

  const mode = controller.mode;

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
          <PlanQuestionAnswer
            question={question}
            mode={mode}
            draftAnswer={controller.draftAnswer}
            disabled={!capabilities.canEditAnswers}
            onChange={controller.setDraftAnswer}
            onStartEditing={() => controller.setMode("editing")}
          />
          <div className={styles.questionActions}>
            <PlanQuestionSaveStatus
              state={controller.saveState}
              errorMessage={controller.errorMessage}
            />
            {/* TODO(follow-up PR): for researchOutputTable, hide this Save
                button while ResearchOutputAnswerComponent is in single-row
                edit (onEditingStateChange), matching PlanOverviewQuestionPageShared. */}
            {capabilities.canEditAnswers ? (
              <Button
                onPress={() => {
                  void controller.saveNow();
                }}
              >
                {Global("buttons.save")}
              </Button>
            ) : null}
          </div>
        </div>
        <PlanQuestionSidebar
          sources={question.guidanceSources}
          comments={question.comments}
          canCustomize={capabilities.canCustomizeGuidance}
          canComment={capabilities.canComment && question.hasAnswer}
          currentUserId={currentUserId}
          canModerateComments={capabilities.canModerateComments}
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
