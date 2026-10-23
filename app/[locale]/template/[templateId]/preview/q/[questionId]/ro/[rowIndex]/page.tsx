"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { QuestionPreviewResearchOutputPage, useQuestionPreview } from "@/components/PlanPreview/QuestionPreview";
import { routePath } from "@/utils/routes";
import TemplatePreviewBreadcrumbs from "../../../../TemplatePreviewBreadcrumbs";
import { useTemplateQuestionEditorHref } from "../../../useTemplateQuestionEditorHref";

export default function TemplateQuestionPreviewResearchOutputPage() {
  const { templateId, questionId, rowIndex } = useParams<{
    templateId: string;
    questionId: string;
    rowIndex: string;
  }>();
  const t = useTranslations("TemplatePreview");
  const Global = useTranslations("Global");
  const { slice } = useQuestionPreview();
  const editorHref = useTemplateQuestionEditorHref();

  return (
    <QuestionPreviewResearchOutputPage
      rowIndex={rowIndex}
      previewHref={(query) => routePath("template.preview.question", { templateId, questionId }, query)}
      breadcrumbs={(currentPage, previewHref) => (
        <TemplatePreviewBreadcrumbs
          templateId={templateId}
          templateName={slice?.model.templateName ?? ""}
          trail={[
            { label: Global("breadcrumbs.question"), href: editorHref },
            { label: t("questionPreview.breadcrumb"), href: previewHref },
            { label: currentPage },
          ]}
        />
      )}
    />
  );
}
