"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PreviewResearchOutputPage from "@/components/PlanPreview/PreviewResearchOutputPage";
import { routePath } from "@/utils/routes";
import { usePreviewDataSource } from "@/components/PlanPreview/PreviewProvider";
import CustomizationPreviewBreadcrumbs from "../../../CustomizationPreviewBreadcrumbs";

export default function CustomizationPreviewResearchOutputPage() {
  const { templateCustomizationId, questionKey, rowIndex } = useParams<{
    templateCustomizationId: string;
    questionKey: string;
    rowIndex: string;
  }>();
  const t = useTranslations("TemplatePreview");
  const dataSource = usePreviewDataSource();
  const previewHref = routePath("template.customize.preview", { templateCustomizationId });

  return (
    <PreviewResearchOutputPage
      dataSource={dataSource}
      questionKey={questionKey}
      rowIndex={rowIndex}
      previewHref={previewHref}
      breadcrumbs={(currentPage) => (
        <CustomizationPreviewBreadcrumbs
          templateCustomizationId={templateCustomizationId}
          trail={[{ label: t("breadcrumb"), href: previewHref }, { label: currentPage }]}
        />
      )}
    />
  );
}
