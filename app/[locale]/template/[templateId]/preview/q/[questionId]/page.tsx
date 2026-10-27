"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QuestionPreviewPage, { useQuestionPreview } from "@/components/PlanPreview/QuestionPreview";
import { NEW_QUESTION_ID } from "@/components/QuestionPreviewLink/questionPreviewDraft";
import { routePath } from "@/utils/routes";
import TemplatePreviewBreadcrumbs from "../../TemplatePreviewBreadcrumbs";
import { useTemplateQuestionEditorHref } from "../useTemplateQuestionEditorHref";

export default function TemplateQuestionPreviewPage() {
  const { templateId, questionId } = useParams<{ templateId: string; questionId: string }>();
  const t = useTranslations("TemplatePreview");
  const Global = useTranslations("Global");
  const { preview } = useQuestionPreview();
  const editorHref = useTemplateQuestionEditorHref();

  return (
    <QuestionPreviewPage
      className="page-template-question-preview"
      editorHref={editorHref}
      isNewQuestion={questionId === NEW_QUESTION_ID}
      researchOutputHref={(rowIndex, query) =>
        routePath("template.preview.question.researchOutput", { templateId, questionId, rowIndex }, query)
      }
      breadcrumbs={
        <TemplatePreviewBreadcrumbs
          templateId={templateId}
          templateName={preview?.model.templateName ?? ""}
          trail={[
            { label: Global("breadcrumbs.question"), href: editorHref },
            { label: t("questionPreview.breadcrumb") },
          ]}
        />
      }
    />
  );
}
