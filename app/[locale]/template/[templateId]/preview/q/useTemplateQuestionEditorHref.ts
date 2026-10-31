"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NEW_QUESTION_ID, SECTION_ID_PARAM } from "@/components/QuestionPreviewLink/questionPreviewDraft";
import { routePath } from "@/utils/routes";

export function useTemplateQuestionEditorHref(): string {
  const { templateId, questionId } = useParams<{ templateId: string; questionId: string }>();
  const searchParams = useSearchParams();
  return questionId === NEW_QUESTION_ID
    ? routePath(
        "template.q.new",
        { templateId },
        { [SECTION_ID_PARAM]: searchParams.get(SECTION_ID_PARAM) ?? undefined, step: 1 }
      )
    : routePath("template.q.slug", { templateId, q_slug: questionId });
}
