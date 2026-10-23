"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NEW_QUESTION_ID } from "@/components/QuestionPreviewLink/questionPreviewDraft";
import { routePath } from "@/utils/routes";

export function useTemplateQuestionEditorHref(): string {
  const { templateId, questionId } = useParams<{ templateId: string; questionId: string }>();
  const searchParams = useSearchParams();
  return questionId === NEW_QUESTION_ID
    ? routePath("template.q.new", { templateId }, { section_id: searchParams.get("section_id") ?? undefined, step: 1 })
    : routePath("template.q.slug", { templateId, q_slug: questionId });
}
