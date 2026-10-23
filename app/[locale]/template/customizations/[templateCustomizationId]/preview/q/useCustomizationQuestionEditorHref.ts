"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NEW_QUESTION_ID } from "@/components/QuestionPreviewLink/questionPreviewDraft";
import { routePath } from "@/utils/routes";
import { parseCustomizationQuestionKey } from "./buildCustomizationQuestionPreview";

export function useCustomizationQuestionEditorHref(): string {
  const { templateCustomizationId, questionKey } = useParams<{
    templateCustomizationId: string;
    questionKey: string;
  }>();
  const searchParams = useSearchParams();
  if (questionKey === NEW_QUESTION_ID) {
    return routePath(
      "template.customize.question.create",
      { templateCustomizationId },
      { section_id: searchParams.get("section_id") ?? undefined, step: 1 }
    );
  }
  const identity = parseCustomizationQuestionKey(questionKey);
  if (identity?.kind === "base") {
    return routePath("template.customize.question", {
      templateCustomizationId,
      versionedQuestionId: identity.versionedQuestionId,
    });
  }
  if (identity?.kind === "custom") {
    return routePath("template.customQuestion", { templateCustomizationId, customQuestionId: identity.customQuestionId });
  }
  return routePath("template.customize", { templateCustomizationId });
}
