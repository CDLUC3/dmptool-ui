"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import { DmpIcon } from "@/components/Icons";
import SafeHtml from "@/components/SafeHtml";
import type { PlanComment, PlanGuidanceSource } from "../model";
import PlanGuidanceTabs from "../PlanGuidanceTabs";
import PlanComments from "../PlanComments";
import styles from "./PlanQuestionSidebar.module.scss";

interface PlanQuestionSidebarProps {
  sources: PlanGuidanceSource[];
  comments: PlanComment[];
  canCustomize: boolean;
  canComment: boolean;
  loadGuidance: () => Promise<PlanGuidanceSource[]>;
  loadComments: () => Promise<PlanComment[]>;
  onAddComment: (text: string) => Promise<void>;
  onCustomize: () => void;
  className?: string;
}

export default function PlanQuestionSidebar({
  sources,
  comments,
  canCustomize,
  canComment,
  loadGuidance,
  loadComments,
  onAddComment,
  onCustomize,
  className,
}: PlanQuestionSidebarProps) {
  const t = useTranslations("PlanAuthoring");
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

  const unreadCount = comments.length;

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
          <div className={styles.guidancePanel}>
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
        ) : (
          <PlanComments
            comments={loadedComments ?? comments}
            canAdd={canComment}
            loading={loadingComments}
            onAdd={async (text) => {
              await onAddComment(text);
              setLoadedComments(await loadComments());
            }}
          />
        )}
      </div>

      <Button
        className={styles.commentsTab}
        data-selected={activeTab === "comments"}
        onPress={async () => {
          if (activeTab === "comments") {
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
          {t("sidebar.comments")}
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
