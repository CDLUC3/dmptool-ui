"use client";

import React from "react";
import { useTranslations } from "next-intl";
import NotificationHeader from "@/components/Notification";
import Loading from "@/components/Loading";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { TransitionLink } from "@/components/Form";
import PlanSection from "@/components/PlanAuthoring/PlanSection";
import PlanQuestion from "@/components/PlanAuthoring/PlanQuestion";
import { questionKey } from "@/components/PlanAuthoring/model";
import type { ResearchOutputRowHref } from "@/components/PlanAuthoring/researchOutputAnswer";
import { usePlanAuthoringState } from "@/components/PlanAuthoring/usePlanAuthoringState";
import { useUnsavedChangesRegistry } from "@/components/PlanAuthoring/useUnsavedChangesRegistry";
import screenStyles from "@/components/PlanAuthoring/PlanAuthoringScreen/PlanAuthoringScreen.module.scss";
import PreviewLoadError from "../PreviewLoadError";
import PreviewResearchOutputPage from "../PreviewResearchOutputPage";
import { usePreviewCustomizeGuidance } from "../usePreviewCustomizeGuidance";
import { useQuestionPreview } from "./QuestionPreviewContext";
import previewStyles from "../preview.module.scss";
import styles from "./questionPreview.module.scss";

export { QuestionPreviewRoute, useQuestionPreview, type QuestionPreviewTarget } from "./QuestionPreviewContext";

function QuestionPreviewBody({
  researchOutputRowHref,
  notFoundMessage,
}: {
  researchOutputRowHref: ResearchOutputRowHref;
  notFoundMessage: string;
}) {
  const t = useTranslations("TemplatePreview");
  const onCustomizeGuidance = usePreviewCustomizeGuidance();
  const { status, preview, dataSource, hasDraft } = useQuestionPreview();
  const registerUnsavedChange = useUnsavedChangesRegistry();
  const state = usePlanAuthoringState(dataSource);
  const model = state.status === "ready" && preview ? state.model : null;
  const section = model?.sections[0];

  let content: React.ReactNode;
  if (status !== "ready" && status !== "loading") {
    content = <PreviewLoadError kind={status} notFoundMessage={notFoundMessage} />;
  } else if (!preview || !model || !section) {
    content = <Loading variant="inline" message={t("questionPreview.loading")} />;
  } else {
    content = (
      <div className={screenStyles.sectionsStack}>
        <PlanSection section={section} index={preview.sectionIndex} total={preview.totalSections}>
          {section.questions.map((question) => (
            <PlanQuestion
              key={questionKey(question.identity)}
              question={question}
              capabilities={model.capabilities}
              dataSource={dataSource}
              onCustomizeGuidance={onCustomizeGuidance}
              registerUnsavedChange={registerUnsavedChange}
              researchOutputRowHref={researchOutputRowHref}
            />
          ))}
        </PlanSection>
      </div>
    );
  }

  return (
    <>
      <div className={previewStyles.notice}>
        <NotificationHeader title={t("questionPreview.notice.title")}>
          <p>{hasDraft ? t("questionPreview.notice.draft") : t("questionPreview.notice.saved")}</p>
          <p>{t("questionPreview.notice.notSaved")}</p>
        </NotificationHeader>
      </div>
      <div className={`${screenStyles.planAuthoring} ${styles.questionPreview}`}>{content}</div>
    </>
  );
}

interface QuestionPreviewPageProps {
  breadcrumbs: React.ReactNode;
  editorHref: string;
  isNewQuestion: boolean;
  researchOutputHref: (rowIndex: number | "new", query: Record<string, string>) => string;
  className?: string;
}

export default function QuestionPreviewPage({
  breadcrumbs,
  editorHref,
  isNewQuestion,
  researchOutputHref,
  className,
}: QuestionPreviewPageProps) {
  const t = useTranslations("TemplatePreview");
  const { query, hasDraft } = useQuestionPreview();
  return (
    <>
      <PageHeader
        title={t("questionPreview.title")}
        description={t("questionPreview.description")}
        showBackButton={false}
        breadcrumbs={breadcrumbs}
        actions={
          <TransitionLink
            href={editorHref}
            className="button-link button--secondary"
            onClick={hasDraft ? () => window.close() : undefined}
          >
            {t("questionPreview.backToQuestion")}
            {hasDraft && <span className="hidden-accessibly"> ({t("questionPreview.closesThisTab")})</span>}
          </TransitionLink>
        }
        className={className}
      />
      <LayoutContainer className={previewStyles.layout}>
        <ContentContainer>
          <QuestionPreviewBody
            researchOutputRowHref={(_questionKey, rowIndex) => researchOutputHref(rowIndex, query)}
            notFoundMessage={isNewQuestion ? t("questionPreview.notFoundNew") : t("questionPreview.notFound")}
          />
        </ContentContainer>
      </LayoutContainer>
    </>
  );
}

export function QuestionPreviewResearchOutputPage({
  rowIndex,
  previewHref,
  breadcrumbs,
}: {
  rowIndex: string;
  previewHref: (query: Record<string, string>) => string;
  breadcrumbs: (currentPage: string, previewHref: string) => React.ReactNode;
}) {
  const { dataSource, preview, query } = useQuestionPreview();
  const href = previewHref(query);
  return (
    <PreviewResearchOutputPage
      dataSource={dataSource}
      questionKey={preview?.currentKey ?? ""}
      rowIndex={rowIndex}
      previewHref={href}
      breadcrumbs={(currentPage) => breadcrumbs(currentPage, href)}
    />
  );
}
