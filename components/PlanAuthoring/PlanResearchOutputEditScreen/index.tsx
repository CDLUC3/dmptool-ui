"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "react-aria-components";
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import Loading from "@/components/Loading";
import SingleResearchOutputComponent from "@/components/Form/ResearchOutputAnswerComponent/SingleResearchOutputComponent";
import { createEmptyResearchOutputRow } from "@/utils/researchOutputTransformations";
import type { ResearchOutputTable } from "@/app/types";
import type { PlanAuthoringDataSource, PlanAuthoringState } from "../dataSource";
import {
  collectLockedGuidanceOrgIds,
  questionAnchorId,
  questionKey,
} from "../model";
import PlanQuestionHeader from "../PlanQuestionHeader";
import PlanQuestionSidebar from "../PlanQuestionSidebar";
import PlanGuidanceCustomizeDialog from "../PlanGuidanceCustomizeDialog";
import questionStyles from "../PlanQuestion/PlanQuestion.module.scss";
import { useUnsavedChangesRegistry } from "../useUnsavedChangesRegistry";
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
  /** Path to the plan, including the locale; the screen adds the question anchor when going back. */
  planHref: string;
  /** Receives the current page title so callers can end the trail with it. */
  breadcrumbs: (currentPage: string) => React.ReactNode;
}

export default function PlanResearchOutputEditScreen({
  dataSource,
  questionKeyParam,
  rowIndexParam,
  planHref,
  breadcrumbs,
}: PlanResearchOutputEditScreenProps) {
  const router = useRouter();
  const t = useTranslations("PlanAuthoring");
  const tEdit = useTranslations("QuestionEdit");
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const registerUnsavedChange = useUnsavedChangesRegistry();
  const [state, setState] = useState<PlanAuthoringState>(() =>
    dataSource.getState()
  );

  useEffect(() => {
    setState(dataSource.getState());
    return dataSource.subscribe(() => {
      setState(dataSource.getState());
    });
  }, [dataSource]);

  const model = state.status === "ready" ? state.model : null;

  const question = useMemo(
    () =>
      model?.sections
        .flatMap((section) => section.questions)
        .find((item) => questionKey(item.identity) === questionKeyParam),
    [model, questionKeyParam]
  );

  const columns = question ? getResearchOutputColumns(question.parsedJson) : null;
  const rowIndexOrNew = parseRowIndexParam(rowIndexParam);
  const existingRows = question ? getResearchOutputRows(question.answerJson) : [];
  const isNew = rowIndexOrNew === "new";
  const rowExists =
    isNew ||
    (typeof rowIndexOrNew === "number" && rowIndexOrNew < existingRows.length);

  const [rows, setRows] = useState<ResearchOutputTable[]>([]);
  const [savedRowJson, setSavedRowJson] = useState<string | null>(null);
  const rowSeed =
    columns && rowExists && rowIndexOrNew !== null
      ? isNew
        ? createEmptyResearchOutputRow(columns)
        : existingRows[rowIndexOrNew as number]
      : null;
  const hasSeededRow = rows.length > 0;

  useEffect(() => {
    if (!hasSeededRow && rowSeed) {
      setRows([rowSeed]);
      setSavedRowJson(JSON.stringify(rowSeed));
    }
  }, [hasSeededRow, rowSeed]);

  const hasUnsavedChanges =
    hasSeededRow && savedRowJson !== null && JSON.stringify(rows[0]) !== savedRowJson;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }
    return registerUnsavedChange(questionKeyParam);
  }, [hasUnsavedChanges, registerUnsavedChange, questionKeyParam]);

  const lockedOrgIds = useMemo(
    () => collectLockedGuidanceOrgIds(model?.sections ?? []),
    [model]
  );

  const returnHref = question
    ? `${planHref}#${questionAnchorId(question.identity)}`
    : planHref;

  const navigateBack = () => {
    router.push(returnHref);
  };

  if (state.status !== "ready" || !model) {
    return (
      <LayoutContainer className="plan-authoring-layout">
        <ContentContainer>
          {state.status === "error" ? (
            <div role="alert">
              <p>{t("screen.loadFailed")}</p>
              <p>{state.message}</p>
              <Button onPress={() => dataSource.reload()}>
                {t("common.retry")}
              </Button>
            </div>
          ) : (
            <Loading variant="inline" message={t("screen.loadingPlan")} />
          )}
        </ContentContainer>
      </LayoutContainer>
    );
  }

  if (!question || !columns || !rowSeed) {
    const title = t("researchOutput.notFoundTitle");
    return (
      <LayoutContainer className="plan-authoring-layout">
        <ContentContainer>
          <PageHeader title={title} showBackButton breadcrumbs={breadcrumbs(title)} />
          <p>{t("researchOutput.notFoundBody")}</p>
          <p>
            <Link href={planHref}>{t("researchOutput.backToPlan")}</Link>
          </p>
        </ContentContainer>
      </LayoutContainer>
    );
  }

  const { capabilities } = model;
  const canEdit = capabilities.canEditAnswers;
  const key = questionKey(question.identity);
  const titleId = `${questionAnchorId(question.identity)}-title`;
  const pageTitle = isNew
    ? tEdit("headings.addResearchOutput")
    : tEdit("headings.editResearchOutput");

  const handleSave = async () => {
    if (rows.length === 0 || savingRef.current) {
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    setSaveErrors([]);
    const nextRows = [...existingRows];
    if (isNew) {
      nextRows.push(rows[0]);
    } else {
      nextRows[rowIndexOrNew as number] = rows[0];
    }
    const result = await dataSource.saveAnswer(
      key,
      buildResearchOutputAnswer(question.parsedJson, nextRows)
    );
    if (result.kind === "saved") {
      setSavedRowJson(JSON.stringify(rows[0]));
      navigateBack();
      return;
    }
    savingRef.current = false;
    setIsSaving(false);
    setSaveErrors(
      result.kind === "invalid"
        ? result.messages
        : [result.message ?? t("researchOutput.saveFailed")]
    );
  };

  return (
    <LayoutContainer className="plan-authoring-layout">
      <ContentContainer>
        <PageHeader
          title={pageTitle}
          showBackButton
          breadcrumbs={breadcrumbs(pageTitle)}
        />
        {saveErrors.length > 0 ? <ErrorMessages errors={saveErrors} /> : null}
        <article
          id={questionAnchorId(question.identity)}
          className={[
            questionStyles.planQuestion,
            questionStyles.planQuestionAuto,
          ].join(" ")}
          aria-labelledby={titleId}
        >
          <div className={questionStyles.planQuestionBody}>
            <div className={questionStyles.planQuestionMain}>
              <PlanQuestionHeader question={question} />
              {hasSeededRow ? (
                <SingleResearchOutputComponent
                  columns={columns}
                  rows={rows}
                  setRows={setRows}
                  showButtons={canEdit}
                  isDisabled={!canEdit || isSaving}
                  onSave={handleSave}
                  onCancel={navigateBack}
                  isNewEntry={isNew}
                  hasOtherRows={existingRows.length > 0}
                />
              ) : null}
            </div>
            <PlanQuestionSidebar
              questionTitleId={titleId}
              sources={question.guidanceSources}
              comments={question.comments}
              canCustomize={capabilities.canCustomizeGuidance}
              canComment={capabilities.canComment && question.hasAnswer}
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
