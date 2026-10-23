"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PlanResearchOutputEditScreen } from "@/components/PlanAuthoring";
import type { PlanAuthoringDataSource } from "@/components/PlanAuthoring";
import NotificationHeader from "@/components/Notification";
import { usePreviewCustomizeGuidance } from "../usePreviewCustomizeGuidance";

interface PreviewResearchOutputPageProps {
  dataSource: PlanAuthoringDataSource;
  questionKey: string;
  rowIndex: string;
  previewHref: string;
  breadcrumbs: (currentPage: string) => React.ReactNode;
}

export default function PreviewResearchOutputPage({
  dataSource,
  questionKey,
  rowIndex,
  previewHref,
  breadcrumbs,
}: PreviewResearchOutputPageProps) {
  const t = useTranslations("TemplatePreview");
  const onCustomizeGuidance = usePreviewCustomizeGuidance();
  return (
    <PlanResearchOutputEditScreen
      dataSource={dataSource}
      questionKeyParam={questionKey}
      rowIndexParam={rowIndex}
      planHref={previewHref}
      onCustomizeGuidance={onCustomizeGuidance}
      notice={
        <NotificationHeader title={t("researchOutputNotice.title")}>
          <p>{t("researchOutputNotice.body")}</p>
          <p>{t("researchOutputNotice.notSaved")}</p>
        </NotificationHeader>
      }
      breadcrumbs={breadcrumbs}
    />
  );
}
