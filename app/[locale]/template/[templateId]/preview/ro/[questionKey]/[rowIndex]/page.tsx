"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePlanAuthoringState } from "@/components/PlanAuthoring/usePlanAuthoringState";
import PreviewResearchOutputPage from "@/components/PlanPreview/PreviewResearchOutputPage";
import { usePreviewDataSource } from "@/components/PlanPreview/PreviewProvider";
import { routePath } from "@/utils/routes";
import TemplatePreviewBreadcrumbs from "../../../TemplatePreviewBreadcrumbs";

export default function TemplatePreviewResearchOutputPage() {
  const { templateId, questionKey, rowIndex } = useParams<{
    templateId: string;
    questionKey: string;
    rowIndex: string;
  }>();
  const t = useTranslations("TemplatePreview");
  const dataSource = usePreviewDataSource();
  const state = usePlanAuthoringState(dataSource);
  const templateName = state.status === "ready" ? state.model.templateName : "";
  const previewHref = routePath("template.preview", { templateId });

  return (
    <PreviewResearchOutputPage
      dataSource={dataSource}
      questionKey={questionKey}
      rowIndex={rowIndex}
      previewHref={previewHref}
      breadcrumbs={(currentPage) => (
        <TemplatePreviewBreadcrumbs
          templateId={templateId}
          templateName={templateName}
          trail={[{ label: t("breadcrumb"), href: previewHref }, { label: currentPage }]}
        />
      )}
    />
  );
}
