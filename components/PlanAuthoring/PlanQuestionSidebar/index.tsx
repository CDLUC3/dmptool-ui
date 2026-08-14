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
import type { PlanComment, PlanGuidanceSource } from "../model";
import PlanGuidanceTabs from "../PlanGuidanceTabs";
import PlanComments from "../PlanComments";
import { usePlanComments } from "../usePlanComments";
import styles from "./PlanQuestionSidebar.module.scss";

interface PlanQuestionSidebarProps {
  sources: PlanGuidanceSource[];
  comments: PlanComment[];
  canCustomize: boolean;
  canComment: boolean;
  currentUserId: number;
  canModerateComments: boolean;
  loadGuidance: () => Promise<PlanGuidanceSource[]>;
  loadComments: () => Promise<PlanComment[]>;
  onAddComment: (text: string) => Promise<void>;
  onUpdateComment: (commentId: number, text: string) => Promise<PlanComment>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onCustomize: () => void;
  className?: string;
}

export default function PlanQuestionSidebar({
  sources,
  comments,
  canCustomize,
  canComment,
  currentUserId,
  canModerateComments,
  loadGuidance,
  loadComments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onCustomize,
  className,
}: PlanQuestionSidebarProps) {
  const t = useTranslations("PlanAuthoring");
  const commentsPanelId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(
    sources[0]?.id ?? null
  );
  const [loadedSources, setLoadedSources] = useState<PlanGuidanceSource[] | null>(
    null
  );
  const [loadedComments, setLoadedComments] = useState<PlanComment[] | null>(
    null
  );
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [activeTab, setActiveTab] = useState<"guidance" | "comments">("guidance");
  const [showGuidanceScrollFade, setShowGuidanceScrollFade] = useState(false);
  const guidancePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedId(sources[0]?.id ?? null);
    setLoadedSources(null);
    setLoadedComments(null);
    setActiveTab("guidance");
  }, [sources]);

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
  const unreadCount = comments.length;
  const commentsExpanded = activeTab === "comments";

  const refreshComments = useCallback(async () => {
    setLoadedComments(await loadComments());
  }, [loadComments]);

  const handleUpdateComment = useCallback(
    async (commentId: number, text: string) => {
      const updated = await onUpdateComment(commentId, text);
      await refreshComments();
      return updated;
    },
    [onUpdateComment, refreshComments]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
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
    <aside
      className={[styles.questionSidebar, className].filter(Boolean).join(" ")}
      aria-label={t("sidebar.ariaLabel")}
    >
      <div className={styles.sidebarInner}>
        <PlanGuidanceTabs
          sources={visibleSources}
          selectedId={activeTab === "guidance" ? selectedId : null}
          onSelect={async (id) => {
            setActiveTab("guidance");
            setSelectedId(id);
            if (!loadedSources) {
              setLoadingGuidance(true);
              try {
                setLoadedSources(await loadGuidance());
              } finally {
                setLoadingGuidance(false);
              }
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
              {selectedSource ? (
                <>
                  <p className={styles.eyebrow}>{t("sidebar.funderGuidance")}</p>
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
          hidden={!commentsExpanded}
        >
          {commentsExpanded ? (
            <PlanComments
              comments={localComments}
              canAdd={canComment}
              currentUserId={currentUserId}
              canModerateComments={canModerateComments}
              loading={loadingComments}
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
        onPress={async () => {
          if (commentsExpanded) {
            setActiveTab("guidance");
            return;
          }
          setActiveTab("comments");
          if (!loadedComments) {
            setLoadingComments(true);
            try {
              setLoadedComments(await loadComments());
            } finally {
              setLoadingComments(false);
            }
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
        {unreadCount ? (
          <span className={styles.commentsCount}>
            {t("sidebar.newCount", { count: unreadCount })}
          </span>
        ) : null}
      </Button>
    </aside>
  );
}
