"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

// Components
import NotificationHeader from "@/components/Notification";
import { TransitionLink } from "@/components/Form";
import PreviewPlanPage from "@/components/PlanPreview/PreviewPlanPage";
import { usePreviewDataSource } from "@/components/PlanPreview/PreviewProvider";
import { usePlanAuthoringState } from "@/components/PlanAuthoring/usePlanAuthoringState";

// Utils and other
import { routePath } from "@/utils/routes";
import TemplatePreviewBreadcrumbs from "./TemplatePreviewBreadcrumbs";

export default function TemplatePreviewPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const t = useTranslations("TemplatePreview");
  const dataSource = usePreviewDataSource();
  const state = usePlanAuthoringState(dataSource);
  const templateName = state.status === "ready" ? state.model.templateName : "";
  const templateHref = routePath("template.show", { templateId });

  return (
    <PreviewPlanPage
      dataSource={dataSource}
      idPrefix="template-preview"
      description={t("description")}
      className="page-template-preview"
      back={{ href: templateHref, label: t("backToTemplate") }}
      breadcrumbs={
        <TemplatePreviewBreadcrumbs
          templateId={templateId}
          templateName={templateName}
          trail={[{ label: t("breadcrumb") }]}
        />
      }
      researchOutputRowHref={(questionKey, rowIndex) =>
        routePath("template.preview.researchOutput", { templateId, questionKey, rowIndex })
      }
      notice={<p>{t("notice.body")}</p>}
      renderEmpty={(model) => {
        const hasSections = model.sections.length > 0;
        if (hasSections && model.sections.some((section) => section.questions.length > 0)) {
          return null;
        }
        return (
          <NotificationHeader title={hasSections ? t("empty.noQuestionsTitle") : t("empty.noSectionsTitle")}>
            <p>{t("empty.body")}</p>
            <p>
              {hasSections ? (
                <TransitionLink href={templateHref}>{t("empty.addQuestion")}</TransitionLink>
              ) : (
                <TransitionLink href={routePath("template.section.new", { templateId })}>
                  {t("empty.addSection")}
                </TransitionLink>
              )}
            </p>
          </NotificationHeader>
        );
      }}
    />
  );
}
