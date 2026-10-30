"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  PREVIEW_DRAFT_PARAM,
  SECTION_ID_PARAM,
  useQuestionPreviewDraft,
} from "@/components/QuestionPreviewLink/questionPreviewDraft";
import { createLocalPreviewDataSource, type LocalPreviewDataSource } from "../localPreviewDataSource";
import { withAnswersFrom, type SingleQuestionPreview } from "../singleQuestionPreview";
import { previewErrorKind, type PreviewErrorKind } from "../previewError";
import { usePreviewResource } from "../usePreviewResource";
import { useReloadWhenDraftCloses } from "../useReloadWhenDraftCloses";

type QuestionPreviewStatus = "loading" | "ready" | PreviewErrorKind;

interface QuestionPreviewValue {
  status: QuestionPreviewStatus;
  preview: SingleQuestionPreview | null;
  dataSource: LocalPreviewDataSource;
  hasDraft: boolean;
  /** Query parameters to keep on links between the question preview pages. */
  query: Record<string, string>;
}

export interface QuestionPreviewTarget<TDraft> {
  draft: TDraft | null;
  /** Where a new question is being added, from the section_id query parameter. */
  sectionId?: number;
}

const QuestionPreviewContext = createContext<QuestionPreviewValue | null>(null);

/**
 * Shared by a question preview and its research output row page, so answers carry across.
 * `load` and `buildPreview` should be stable, as each change reloads or rebuilds the preview.
 */
export function QuestionPreviewRoute<TData, TDraft extends object>({
  load,
  buildPreview,
  children,
}: {
  load: () => Promise<TData>;
  buildPreview: (data: TData, target: QuestionPreviewTarget<TDraft>) => SingleQuestionPreview | null;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const previewId = searchParams.get(PREVIEW_DRAFT_PARAM);
  const sectionIdParam = searchParams.get(SECTION_ID_PARAM);
  const { draft, isWaiting } = useQuestionPreviewDraft<TDraft>(previewId);
  const resource = usePreviewResource(load);
  useReloadWhenDraftCloses(draft, resource.reload);

  const sectionId = Number(sectionIdParam);
  const preview = useMemo(
    () =>
      resource.status === "ready" && !isWaiting
        ? buildPreview(resource.data, {
            draft,
            sectionId: Number.isFinite(sectionId) && sectionId > 0 ? sectionId : undefined,
          })
        : null,
    [resource, isWaiting, buildPreview, draft, sectionId]
  );

  const query = useMemo(() => {
    const params: Record<string, string> = {};
    if (previewId) params[PREVIEW_DRAFT_PARAM] = previewId;
    if (sectionIdParam) params[SECTION_ID_PARAM] = sectionIdParam;
    return params;
  }, [previewId, sectionIdParam]);

  const t = useTranslations("TemplatePreview");
  const [dataSource] = useState(() =>
    createLocalPreviewDataSource({ status: "loading" }, { questionNotFound: t("questionNotFound") })
  );
  useEffect(() => {
    if (preview) {
      const previous = dataSource.getState();
      dataSource.setState({
        status: "ready",
        model: withAnswersFrom(previous.status === "ready" ? previous.model : null, preview.model),
      });
    }
  }, [dataSource, preview]);

  let status: QuestionPreviewStatus;
  if (resource.status === "error") {
    status = previewErrorKind(resource.error);
  } else if (resource.status === "loading" || isWaiting) {
    status = "loading";
  } else {
    status = preview ? "ready" : "notFound";
  }
  const hasDraft = Boolean(draft);
  const value = useMemo(
    () => ({ status, preview, dataSource, hasDraft, query }),
    [status, preview, dataSource, hasDraft, query]
  );
  return <QuestionPreviewContext.Provider value={value}>{children}</QuestionPreviewContext.Provider>;
}

export function useQuestionPreview(): QuestionPreviewValue {
  const value = useContext(QuestionPreviewContext);
  if (!value) {
    throw new Error("useQuestionPreview must be used inside QuestionPreviewRoute.");
  }
  return value;
}
