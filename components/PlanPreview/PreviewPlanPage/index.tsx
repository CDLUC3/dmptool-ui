"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { PlanAuthoring } from "@/components/PlanAuthoring";
import type { PlanAuthoringModel } from "@/components/PlanAuthoring/model";
import type { ResearchOutputRowHref } from "@/components/PlanAuthoring/researchOutputAnswer";
import { usePlanAuthoringState } from "@/components/PlanAuthoring/usePlanAuthoringState";
import PageHeader from "@/components/PageHeader";
import NotificationHeader from "@/components/Notification";
import { TransitionLink } from "@/components/Form";
import type { LocalPreviewDataSource } from "../localPreviewDataSource";
import PreviewLoadError from "../PreviewLoadError";
import type { PreviewErrorKind } from "../previewError";
import { usePreviewCustomizeGuidance } from "../usePreviewCustomizeGuidance";
import styles from "../preview.module.scss";

interface PreviewPlanPageProps {
  dataSource: LocalPreviewDataSource;
  idPrefix: string;
  description: string;
  breadcrumbs: React.ReactNode;
  back: { href: string; label: string };
  researchOutputRowHref: ResearchOutputRowHref;
  notice: React.ReactNode;
  renderEmpty: (model: PlanAuthoringModel) => React.ReactNode | null;
  className?: string;
}

export default function PreviewPlanPage({
  dataSource,
  idPrefix,
  description,
  breadcrumbs,
  back,
  researchOutputRowHref,
  notice,
  renderEmpty,
  className,
}: PreviewPlanPageProps) {
  const t = useTranslations("TemplatePreview");
  const onCustomizeGuidance = usePreviewCustomizeGuidance();
  const state = usePlanAuthoringState(dataSource);
  const model = state.status === "ready" ? state.model : null;
  const empty = model ? renderEmpty(model) : null;

  const backLink = (
    <TransitionLink href={back.href} className="button-link button--secondary">
      {back.label}
    </TransitionLink>
  );

  let body: React.ReactNode;
  if (state.status === "error") {
    body = (
      <ContentContainer>
        <PreviewLoadError kind={state.message as PreviewErrorKind} onRetry={() => dataSource.reload()} />
      </ContentContainer>
    );
  } else if (empty) {
    body = <ContentContainer>{empty}</ContentContainer>;
  } else {
    body = (
      <PlanAuthoring
        dataSource={dataSource}
        idPrefix={idPrefix}
        researchOutputRowHref={researchOutputRowHref}
        onCustomizeGuidance={onCustomizeGuidance}
        overview={
          <ContentContainer>
            <NotificationHeader title={t("notice.title")}>{notice}</NotificationHeader>
          </ContentContainer>
        }
        footer={backLink}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={model?.templateName ? t("title", { templateName: model.templateName }) : t("breadcrumb")}
        description={description}
        showBackButton={false}
        breadcrumbs={breadcrumbs}
        actions={backLink}
        className={className}
      />
      <LayoutContainer className={styles.layout}>{body}</LayoutContainer>
    </>
  );
}
