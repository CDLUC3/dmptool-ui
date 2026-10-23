"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { QuestionPreviewResearchOutputPage } from "@/components/PlanPreview/QuestionPreview";
import { routePath } from "@/utils/routes";
import CustomizationPreviewBreadcrumbs from "../../../../CustomizationPreviewBreadcrumbs";
import { useCustomizationQuestionEditorHref } from "../../../useCustomizationQuestionEditorHref";

export default function CustomizationQuestionPreviewResearchOutputPage() {
  const { templateCustomizationId, questionKey, rowIndex } = useParams<{
    templateCustomizationId: string;
    questionKey: string;
    rowIndex: string;
  }>();
  const t = useTranslations("TemplatePreview");
  const Global = useTranslations("Global");
  const editorHref = useCustomizationQuestionEditorHref();

  return (
    <QuestionPreviewResearchOutputPage
      rowIndex={rowIndex}
      previewHref={(query) =>
        routePath("template.customize.preview.question", { templateCustomizationId, questionKey }, query)
      }
      breadcrumbs={(currentPage, previewHref) => (
        <CustomizationPreviewBreadcrumbs
          templateCustomizationId={templateCustomizationId}
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
