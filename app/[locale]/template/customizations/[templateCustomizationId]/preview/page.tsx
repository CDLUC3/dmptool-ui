"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import NotificationHeader from "@/components/Notification";
import PreviewPlanPage from "@/components/PlanPreview/PreviewPlanPage";
import { routePath } from "@/utils/routes";
import { usePreviewDataSource } from "@/components/PlanPreview/PreviewProvider";
import CustomizationPreviewBreadcrumbs from "./CustomizationPreviewBreadcrumbs";

export default function CustomizationPreviewPage() {
  const { templateCustomizationId } = useParams<{ templateCustomizationId: string }>();
  const t = useTranslations("TemplatePreview");
  const dataSource = usePreviewDataSource();

  return (
    <PreviewPlanPage
      dataSource={dataSource}
      idPrefix="customization-preview"
      description={t("customization.description")}
      className="page-template-customization-preview"
      back={{
        href: routePath("template.customize", { templateCustomizationId }),
        label: t("customization.backToCustomization"),
      }}
      breadcrumbs={
        <CustomizationPreviewBreadcrumbs
          templateCustomizationId={templateCustomizationId}
          trail={[{ label: t("breadcrumb") }]}
        />
      }
      researchOutputRowHref={(questionKey, rowIndex) =>
        routePath("template.customize.preview.researchOutput", { templateCustomizationId, questionKey, rowIndex })
      }
      notice={<p>{t("customization.notice")}</p>}
      renderEmpty={(model) =>
        model.sections.some((section) => section.questions.length > 0) ? null : (
          <NotificationHeader title={t("empty.noQuestionsTitle")}>
            <p>{t("customization.empty")}</p>
          </NotificationHeader>
        )
      }
    />
  );
}
