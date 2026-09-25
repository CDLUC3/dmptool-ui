"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import SingleResearchOutputComponent from "@/components/Form/ResearchOutputAnswerComponent/SingleResearchOutputComponent";
import { createEmptyResearchOutputRow } from "@/utils/researchOutputTransformations";
import { Link } from "@/i18n/routing";
import type { ResearchOutputTable } from "@/app/types";
import type { PlanAuthoringDataSource } from "../dataSource";
import type { PlanAuthoringModel } from "../model";
import {
  collectLockedGuidanceOrgIds,
  questionAnchorId,
  questionKey,
} from "../model";
import PlanQuestionHeader from "../PlanQuestionHeader";
import PlanQuestionSidebar from "../PlanQuestionSidebar";
import PlanGuidanceCustomizeDialog from "../PlanGuidanceCustomizeDialog";
import questionStyles from "../PlanQuestion/PlanQuestion.module.scss";
import {
  buildResearchOutputAnswer,
  getResearchOutputColumns,
  getResearchOutputRows,
  parseRowIndexParam,
} from "../researchOutputAnswer";

interface PlanResearchOutputEditScreenProps {
  dataSource: PlanAuthoringDataSource;
  questionKeyParam: string;
  rowIndexParam: string;
  /**
   * Locale-free path back to the plan list (e.g. styleguide demo, or a future
   * production plan-authoring URL). The screen appends the question hash and
   * locale when navigating back. Callers own the URL — this component does not.
   */
  planHref: string;
}

export default function PlanResearchOutputEditScreen({
  dataSource,
  questionKeyParam,
  rowIndexParam,
  planHref,
}: PlanResearchOutputEditScreenProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("PlanAuthoring");
  const tEdit = useTranslations("QuestionEdit");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [model, setModel] = useState<PlanAuthoringModel>(() =>
    dataSource.getModel()
  );

  useEffect(() => {
    return dataSource.subscribe(() => {
      setModel(dataSource.getModel());
    });
  }, [dataSource]);

  const question = useMemo(() => {
    for (const section of model.sections) {
      const match = section.questions.find(
        (item) => questionKey(item.identity) === questionKeyParam
      );
      if (match) {
        return match;
      }
    }
    return undefined;
  }, [model, questionKeyParam]);

  const capabilities = model.capabilities;
  const key = question ? questionKey(question.identity) : "";
  const columns = question
    ? getResearchOutputColumns(question.parsedJson)
    : null;
  const rowIndexOrNew = parseRowIndexParam(rowIndexParam);
  const existingRows = question
    ? getResearchOutputRows(question.answerJson)
    : [];
  const isNew = rowIndexOrNew === "new";
  const editIndex =
    typeof rowIndexOrNew === "number" ? rowIndexOrNew : existingRows.length;
  const rowExists =
    isNew ||
    (typeof rowIndexOrNew === "number" &&
      rowIndexOrNew >= 0 &&
      rowIndexOrNew < existingRows.length);

  const [rows, setRows] = useState<ResearchOutputTable[]>(() => {
    if (!columns || !question || rowIndexOrNew === null || !rowExists) {
      return [];
    }
    if (isNew) {
      return [createEmptyResearchOutputRow(columns)];
    }
    return [existingRows[rowIndexOrNew as number]];
  });

  const lockedOrgIds = useMemo(
    () => collectLockedGuidanceOrgIds(model.sections),
    [model.sections]
  );

  const returnHref = question
    ? `/${locale}${planHref}#${questionAnchorId(question.identity)}`
    : `/${locale}${planHref}`;

  const navigateBack = () => {
    router.push(returnHref);
  };

  if (
    !question ||
    !columns ||
    rowIndexOrNew === null ||
    !rowExists ||
    rows.length === 0
  ) {
    return (
      <LayoutContainer className="plan-authoring-layout">
        <ContentContainer>
          <PageHeader
            title={t("researchOutput.notFoundTitle")}
            showBackButton
            breadcrumbs={
              <nav className="breadcrumbs" aria-label="Breadcrumb">
                <Link href="/styleguide">Style Guide</Link>
                <span aria-hidden="true"> / </span>
                <Link href="/styleguide/components">Components</Link>
                <span aria-hidden="true"> / </span>
                <Link href={planHref}>Plan Authoring</Link>
              </nav>
            }
          />
          <p>{t("researchOutput.notFoundBody")}</p>
          <p>
            <Link href={planHref}>{t("researchOutput.backToPlan")}</Link>
          </p>
        </ContentContainer>
      </LayoutContainer>
    );
  }

  const pageTitle = isNew
    ? tEdit("headings.addResearchOutput")
    : tEdit("headings.editResearchOutput");

  const handleSave = async () => {
    setSaveError(null);
    const nextRows = [...existingRows];
    if (isNew) {
      nextRows.push(rows[0]);
    } else {
      nextRows[editIndex] = rows[0];
    }
    const answerJson = buildResearchOutputAnswer(question.parsedJson, nextRows);
    const result = await dataSource.saveAnswer(
      questionKey(question.identity),
      answerJson
    );
    if (result.success) {
      navigateBack();
      return;
    }
    setSaveError(result.error ?? t("researchOutput.saveFailed"));
  };

  return (
    <LayoutContainer className="plan-authoring-layout">
      <ContentContainer>
        <PageHeader
          title={pageTitle}
          showBackButton
          breadcrumbs={
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/styleguide">Style Guide</Link>
              <span aria-hidden="true"> / </span>
              <Link href="/styleguide/components">Components</Link>
              <span aria-hidden="true"> / </span>
              <Link href={planHref}>Plan Authoring</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{pageTitle}</span>
            </nav>
          }
        />
        {saveError ? <ErrorMessages errors={[saveError]} /> : null}
        <article
          id={questionAnchorId(question.identity)}
          className={[
            questionStyles.planQuestion,
            questionStyles.planQuestionAuto,
          ].join(" ")}
          aria-labelledby={`${questionAnchorId(question.identity)}-title`}
        >
          <div className={questionStyles.planQuestionBody}>
            <div className={questionStyles.planQuestionMain}>
              <PlanQuestionHeader question={question} />
              <SingleResearchOutputComponent
                columns={columns}
                rows={rows}
                setRows={setRows}
                showButtons
                onSave={handleSave}
                onCancel={navigateBack}
                isNewEntry={isNew}
                hasOtherRows={existingRows.length > 0}
              />
            </div>
            <PlanQuestionSidebar
              sources={question.guidanceSources}
              comments={question.comments}
              canCustomize={capabilities.canCustomizeGuidance}
              canComment={capabilities.canComment && question.hasAnswer}
              currentUserId={model.currentUserId}
              canModerateComments={capabilities.canModerateComments}
              loadGuidance={() => dataSource.loadGuidance(key)}
              loadComments={() => dataSource.loadComments(key)}
              onAddComment={(text) =>
                dataSource.addComment(key, text).then(() => undefined)
              }
              onUpdateComment={(commentId, text) =>
                dataSource.updateComment(key, commentId, text)
              }
              onDeleteComment={(commentId) =>
                dataSource.deleteComment(key, commentId)
              }
              onCustomize={() => setCustomizeOpen(true)}
            />
          </div>
        </article>

        <PlanGuidanceCustomizeDialog
          isOpen={customizeOpen}
          onOpenChange={setCustomizeOpen}
          selectedOrgIds={model.selectedGuidanceOrgIds}
          lockedOrgIds={lockedOrgIds}
          availableOrgs={model.availableGuidanceOrgs}
          onSearch={(term) => dataSource.searchGuidanceOrgs(term)}
          onSave={async (orgIds) => {
            await dataSource.setSelectedGuidanceOrgs(orgIds);
          }}
        />
      </ContentContainer>
    </LayoutContainer>
  );
}
