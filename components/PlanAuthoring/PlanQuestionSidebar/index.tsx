"use client";

import React, {
  useCallback,
  useEffect,
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
import type {
  PlanComment,
  PlanGuidanceSource,
  PlanGuidanceSourceType,
} from "../model";
import PlanGuidanceTabs from "../PlanGuidanceTabs";
import PlanComments from "../PlanComments";
import { usePlanComments } from "../usePlanComments";
import styles from "./PlanQuestionSidebar.module.scss";

const GUIDANCE_HEADING_KEYS: Record<PlanGuidanceSourceType, string> = {
  BEST_PRACTICE: "Global.bestPractice",
  TEMPLATE_OWNER: "PlanAuthoring.sidebar.guidanceHeading.templateOwner",
  USER_AFFILIATION: "PlanAuthoring.sidebar.guidanceHeading.userAffiliation",
  USER_SELECTED: "PlanAuthoring.sidebar.guidanceHeading.userSelected",
};

const DEFAULT_GUIDANCE_PRIORITY: PlanGuidanceSourceType[] = [
  "USER_AFFILIATION",
  "TEMPLATE_OWNER",
];

function defaultGuidanceSourceId(sources: PlanGuidanceSource[]): string | null {
  for (const type of DEFAULT_GUIDANCE_PRIORITY) {
    const match = sources.find((source) => source.type === type);
    if (match) {
      return match.id;
    }
  }
  return sources[0]?.id ?? null;
}

interface PlanQuestionSidebarProps {
  /** Joined into the label so each question's sidebar is named uniquely. */
  questionTitleId: string;
  sources: PlanGuidanceSource[];
  comments: PlanComment[];
  canCustomize: boolean;
  canComment: boolean;
  loadGuidance: () => Promise<PlanGuidanceSource[]>;
  loadComments: () => Promise<PlanComment[]>;
  onAddComment: (text: string) => Promise<void>;
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
  loadGuidance,
  loadComments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCustomize,
  className,
}: PlanQuestionSidebarProps) {
  const t = useTranslations("PlanAuthoring");
  const tRoot = useTranslations();
  const commentsPanelId = useId();
  const labelId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    defaultGuidanceSourceId(sources)
  );
  const [loadedSources, setLoadedSources] = useState<PlanGuidanceSource[] | null>(
    null
  );
  const [loadedComments, setLoadedComments] = useState<PlanComment[] | null>(
    null
  );
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [guidanceLoadFailed, setGuidanceLoadFailed] = useState(false);
  const [commentsLoadFailed, setCommentsLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<"guidance" | "comments">("guidance");
  const [showGuidanceScrollFade, setShowGuidanceScrollFade] = useState(false);
  const guidancePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedId(defaultGuidanceSourceId(sources));
    setLoadedSources(null);
    setLoadedComments(null);
    setGuidanceLoadFailed(false);
    setCommentsLoadFailed(false);
    setActiveTab("guidance");
  }, [sources]);

  const fetchGuidance = useCallback(async () => {
    setLoadingGuidance(true);
    setGuidanceLoadFailed(false);
    try {
      setLoadedSources(await loadGuidance());
    } catch (error) {
      console.error("Failed to load plan guidance", error);
      setGuidanceLoadFailed(true);
    } finally {
      setLoadingGuidance(false);
    }
  }, [loadGuidance]);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    setCommentsLoadFailed(false);
    try {
      setLoadedComments(await loadComments());
    } catch (error) {
      console.error("Failed to load plan comments", error);
      setCommentsLoadFailed(true);
    } finally {
      setLoadingComments(false);
    }
  }, [loadComments]);

  const visibleSources = loadedSources ?? sources;
  const selectedSource = useMemo(
    () => visibleSources.find((source) => source.id === selectedId) ?? null,
    [selectedId, visibleSources]
  );

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
    loadingGuidance,
    selectedSource?.id,
    selectedSource?.bodyHtml,
    updateGuidanceScrollFade,
  ]);

  const visibleComments = loadedComments ?? comments;
  const commentsExpanded = activeTab === "comments";

  const refreshComments = useCallback(async () => {
    setLoadedComments(await loadComments());
  }, [loadComments]);

  const handleUpdateComment = useCallback(
    async (commentId: string, text: string) => {
      const updated = await onUpdateComment(commentId, text);
      await refreshComments();
      return updated;
    },
    [onUpdateComment, refreshComments]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      await onDeleteComment(commentId);
      await refreshComments();
    },
    [onDeleteComment, refreshComments]
  );

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
  } = usePlanComments({
    comments: visibleComments,
    onUpdateComment: handleUpdateComment,
    onDeleteComment: handleDeleteComment,
  });

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
          sources={visibleSources}
          selectedId={activeTab === "guidance" ? selectedId : null}
          onSelect={(id) => {
            setActiveTab("guidance");
            setSelectedId(id);
            if (!loadedSources) {
              void fetchGuidance();
            }
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
              {loadingGuidance ? <p>{t("sidebar.loadingGuidance")}</p> : null}
              {guidanceLoadFailed ? (
                <div
                  className={styles.loadError}
                  role="alert"
                >
                  <p>{t("sidebar.guidanceLoadFailed")}</p>
                  <Button
                    className="small"
                    onPress={() => void fetchGuidance()}
                  >
                    {t("common.retry")}
                  </Button>
                </div>
              ) : null}
              {selectedSource ? (
                <>
                  <p className={styles.eyebrow}>{tRoot(GUIDANCE_HEADING_KEYS[selectedSource.type])}</p>
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
              loading={loadingComments}
              loadFailed={commentsLoadFailed}
              onRetryLoad={() => void fetchComments()}
              mutationError={mutationError}
              editingCommentId={editingCommentId}
              editingCommentText={editingCommentText}
              setEditingCommentText={setEditingCommentText}
              handleEditComment={handleEditComment}
              handleUpdateComment={commitUpdateComment}
              handleCancelEdit={handleCancelEdit}
              handleDeleteComment={commitDeleteComment}
              onAdd={async (text) => {
                await onAddComment(text);
                await refreshComments();
              }}
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
          if (!loadedComments) {
            void fetchComments();
          }
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
