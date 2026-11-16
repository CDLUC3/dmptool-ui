"use client";

import React, {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import { DmpIcon } from "@/components/Icons";
import SafeHtml from "@/components/SafeHtml";
import { GuidanceSourceType } from "@/generated/graphql";
import type { PlanComment, PlanGuidanceSource } from "../model";
import PlanGuidanceTabs from "../PlanGuidanceTabs";
import PlanComments from "../PlanComments";
import { usePlanComments } from "../usePlanComments";
import styles from "./PlanQuestionSidebar.module.scss";

const DEFAULT_GUIDANCE_PRIORITY = [
  GuidanceSourceType.UserAffiliation,
  GuidanceSourceType.TemplateOwner,
];

function defaultGuidanceSource(sources: PlanGuidanceSource[]): PlanGuidanceSource | null {
  for (const type of DEFAULT_GUIDANCE_PRIORITY) {
    const match = sources.find((source) => source.type === type);
    if (match) {
      return match;
    }
  }
  return sources[0] ?? null;
}

interface PlanQuestionSidebarProps {
  /** Joined into the label so each question's sidebar is named uniquely. */
  questionTitleId: string;
  sources: PlanGuidanceSource[];
  comments: PlanComment[];
  canCustomize: boolean;
  canComment: boolean;
  onAddComment: (text: string) => Promise<unknown>;
  onUpdateComment: (commentId: string, text: string) => Promise<PlanComment>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onCustomize: () => void;
  className?: string;
}

export default function PlanQuestionSidebar({
  questionTitleId,
  sources,
  comments,
  canCustomize,
  canComment,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCustomize,
  className,
}: PlanQuestionSidebarProps) {
  const t = useTranslations("PlanAuthoring");
  const commentsPanelId = useId();
  const labelId = useId();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"guidance" | "comments">("guidance");
  const [showGuidanceScrollFade, setShowGuidanceScrollFade] = useState(false);
  const guidancePanelRef = useRef<HTMLDivElement | null>(null);

  const selectedSource = useMemo(
    () =>
      sources.find((source) => source.id === pickedId) ??
      defaultGuidanceSource(sources),
    [pickedId, sources]
  );
  const selectedId = selectedSource?.id ?? null;

  const updateGuidanceScrollFade = useCallback(() => {
    const panel = guidancePanelRef.current;
    if (!panel) {
      setShowGuidanceScrollFade(false);
      return;
    }
    const overflow = panel.scrollHeight - panel.clientHeight > 1;
    const remaining =
      panel.scrollHeight - panel.scrollTop - panel.clientHeight;
    setShowGuidanceScrollFade(overflow && remaining > 1);
  }, []);

  useLayoutEffect(() => {
    if (activeTab !== "guidance") {
      setShowGuidanceScrollFade(false);
      return;
    }

    const panel = guidancePanelRef.current;
    if (!panel) {
      return;
    }

    updateGuidanceScrollFade();
    panel.addEventListener("scroll", updateGuidanceScrollFade, {
      passive: true,
    });
    const resizeObserver = new ResizeObserver(updateGuidanceScrollFade);
    resizeObserver.observe(panel);

    return () => {
      panel.removeEventListener("scroll", updateGuidanceScrollFade);
      resizeObserver.disconnect();
    };
  }, [
    activeTab,
    selectedSource?.id,
    selectedSource?.bodyHtml,
    updateGuidanceScrollFade,
  ]);

  const commentsExpanded = activeTab === "comments";

  const {
    localComments,
    editingCommentId,
    editingCommentText,
    setEditingCommentText,
    mutationError,
    handleEditComment,
    handleUpdateComment: commitUpdateComment,
    handleCancelEdit,
    handleDeleteComment: commitDeleteComment,
  } = usePlanComments({ comments, onUpdateComment, onDeleteComment });

  return (
    <div
      className={[styles.questionSidebar, className].filter(Boolean).join(" ")}
      role="group"
      aria-labelledby={`${labelId} ${questionTitleId}`}
      data-comments-expanded={commentsExpanded}
    >
      <span id={labelId} hidden>
        {t("sidebar.ariaLabel")}
      </span>
      <div className={styles.sidebarInner}>
        <PlanGuidanceTabs
          sources={sources}
          selectedId={activeTab === "guidance" ? selectedId : null}
          onSelect={(id) => {
            setActiveTab("guidance");
            setPickedId(id);
          }}
          onCustomize={onCustomize}
          canCustomize={canCustomize}
        />

        {activeTab === "guidance" ? (
          <div className={styles.guidanceShell}>
            <div
              ref={guidancePanelRef}
              className={styles.guidancePanel}
            >
              {selectedSource ? (
                <>
                  <h4>{selectedSource.label}</h4>
                  <SafeHtml
                    html={selectedSource.bodyHtml}
                    className={styles.guidanceBody}
                  />
                </>
              ) : (
                <p>{t("sidebar.selectGuidanceSource")}</p>
              )}
            </div>
            {showGuidanceScrollFade ? (
              <div
                className={styles.guidanceScrollFade}
                aria-hidden="true"
              />
            ) : null}
          </div>
        ) : null}

        <div
          id={commentsPanelId}
          className={styles.commentsPanel}
          hidden={!commentsExpanded}
        >
          {commentsExpanded ? (
            <PlanComments
              comments={localComments}
              canAdd={canComment}
              mutationError={mutationError}
              editingCommentId={editingCommentId}
              editingCommentText={editingCommentText}
              setEditingCommentText={setEditingCommentText}
              handleEditComment={handleEditComment}
              handleUpdateComment={commitUpdateComment}
              handleCancelEdit={handleCancelEdit}
              handleDeleteComment={commitDeleteComment}
              onAdd={onAddComment}
            />
          ) : null}
        </div>
      </div>

      <Button
        className={styles.commentsTab}
        data-selected={commentsExpanded}
        aria-expanded={commentsExpanded}
        aria-controls={commentsPanelId}
        onPress={() => {
          if (commentsExpanded) {
            setActiveTab("guidance");
            return;
          }
          setActiveTab("comments");
        }}
      >
        <span className={styles.commentsTabLabel}>
          <DmpIcon
            icon="chat"
            width={16}
            height={16}
            fill="currentColor"
          />
          {commentsExpanded
            ? t("sidebar.hideComments")
            : t("sidebar.showComments")}
        </span>
        {comments.length ? (
          <span className={styles.commentsCount}>
            {t("sidebar.commentCount", { count: comments.length })}
          </span>
        ) : null}
      </Button>
    </div>
  );
}
