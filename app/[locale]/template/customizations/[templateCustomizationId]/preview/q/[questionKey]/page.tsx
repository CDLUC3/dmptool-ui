"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import QuestionPreviewPage from "@/components/PlanPreview/QuestionPreview";
import { NEW_QUESTION_ID } from "@/components/QuestionPreviewLink/questionPreviewDraft";
import { routePath } from "@/utils/routes";
import CustomizationPreviewBreadcrumbs from "../../CustomizationPreviewBreadcrumbs";
import { useCustomizationQuestionEditorHref } from "../useCustomizationQuestionEditorHref";

export default function CustomizationQuestionPreviewPage() {
  const { templateCustomizationId, questionKey } = useParams<{
    templateCustomizationId: string;
    questionKey: string;
  }>();
  const t = useTranslations("TemplatePreview");
  const Global = useTranslations("Global");
  const editorHref = useCustomizationQuestionEditorHref();

  return (
    <QuestionPreviewPage
      className="page-template-customization-question-preview"
      editorHref={editorHref}
      isNewQuestion={questionKey === NEW_QUESTION_ID}
      researchOutputHref={(rowIndex, query) =>
        routePath(
          "template.customize.preview.question.researchOutput",
          { templateCustomizationId, questionKey, rowIndex },
          query
        )
      }
      breadcrumbs={
        <CustomizationPreviewBreadcrumbs
          templateCustomizationId={templateCustomizationId}
          trail={[
            { label: Global("breadcrumbs.question"), href: editorHref },
            { label: t("questionPreview.breadcrumb") },
          ]}
        />
      }
    />
  );
}
