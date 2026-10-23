"use client";

import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { QuestionPreviewRoute, type QuestionPreviewTarget } from "@/components/PlanPreview/QuestionPreview";
import type { QuestionPreviewDraft } from "@/components/QuestionPreviewLink/questionPreviewDraft";
import { loadTemplatePreview } from "../../loadTemplatePreview";
import type { TemplatePreviewData } from "../../toTemplatePreviewModel";
import { useTemplatePreviewExampleGuidance } from "../../useTemplatePreviewExampleGuidance";
import { buildTemplateQuestionPreview } from "../buildTemplateQuestionPreview";

export default function TemplateQuestionPreviewLayout({ children }: { children: React.ReactNode }) {
  const { templateId, questionId } = useParams<{ templateId: string; questionId: string }>();
  const client = useApolloClient();
  const exampleGuidance = useTemplatePreviewExampleGuidance();
  const load = useCallback(() => loadTemplatePreview(client, Number(templateId)), [client, templateId]);
  const buildSlice = useCallback(
    (data: TemplatePreviewData, { draft, sectionId }: QuestionPreviewTarget<QuestionPreviewDraft>) =>
      buildTemplateQuestionPreview(data, { questionId, sectionId, draft }, exampleGuidance),
    [questionId, exampleGuidance]
  );
  return (
    <QuestionPreviewRoute load={load} buildSlice={buildSlice}>
      {children}
    </QuestionPreviewRoute>
  );
}
