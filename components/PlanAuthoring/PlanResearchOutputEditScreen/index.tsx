"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ResearchOutputTableQuestionType } from "@dmptool/types";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Button } from "react-aria-components";
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import Loading from "@/components/Loading";
import SingleResearchOutputComponent from "@/components/Form/ResearchOutputAnswerComponent/SingleResearchOutputComponent";
import { createEmptyResearchOutputRow } from "@/utils/researchOutputTransformations";
import type { ResearchOutputTable } from "@/app/types";
import type { PlanAuthoringDataSource } from "../dataSource";
import {
  collectLockedGuidanceOrgIds,
  questionAnchorId,
  questionKey,
} from "../model";
import PlanQuestionHeader from "../PlanQuestionHeader";
import PlanQuestionSidebar from "../PlanQuestionSidebar";
import PlanGuidanceCustomizeDialog from "../PlanGuidanceCustomizeDialog";
import questionStyles from "../PlanQuestion/PlanQuestion.module.scss";
import { usePlanAuthoringState } from "../usePlanAuthoringState";
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
  /** Path to the plan (e.g. from `routePath`); the screen adds the question anchor when going back. */
  planHref: string;
  /** Receives the current page title so callers can end the trail with it. */
  breadcrumbs: (currentPage: string) => React.ReactNode;
}

interface ResearchOutputRowFormProps {
  seed: ResearchOutputTable;
  columns: ResearchOutputTableQuestionType["columns"];
  questionKeyParam: string;
  canEdit: boolean;
  isSaving: boolean;
  isNew: boolean;
  hasOtherRows: boolean;
  onSave: (row: ResearchOutputTable) => Promise<boolean>;
  onCancel: () => void;
}

function ResearchOutputRowForm({
  seed,
  columns,
  questionKeyParam,
  canEdit,
  isSaving,
  isNew,
  hasOtherRows,
  onSave,
  onCancel,
}: ResearchOutputRowFormProps) {
  const registerUnsavedChange = useUnsavedChangesRegistry();
  const [rows, setRows] = useState<ResearchOutputTable[]>(() => [seed]);
  const [savedRowJson, setSavedRowJson] = useState(() => JSON.stringify(seed));
  const hasUnsavedChanges = JSON.stringify(rows[0]) !== savedRowJson;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }
    return registerUnsavedChange(questionKeyParam);
  }, [hasUnsavedChanges, registerUnsavedChange, questionKeyParam]);

  const handleSave = async () => {
    const row = rows[0];
    if (await onSave(row)) {
      setSavedRowJson(JSON.stringify(row));
    }
  };

  return (
    <SingleResearchOutputComponent
      columns={columns}
      rows={rows}
      setRows={setRows}
      showButtons={canEdit}
      isDisabled={!canEdit || isSaving}
      onSave={handleSave}
      onCancel={onCancel}
      isNewEntry={isNew}
      hasOtherRows={hasOtherRows}
    />
  );
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
  const state = usePlanAuthoringState(dataSource);

  const model = state.status === "ready" ? state.model : null;

  const question = useMemo(
    () =>
      model?.sections
        .flatMap((section) => section.questions)
        .find((item) => questionKey(item.identity) === questionKeyParam),
    [model, questionKeyParam]
  );

  const columns = question ? getResearchOutputColumns(question.parsedJson) : null;
  const rowIndex = parseRowIndexParam(rowIndexParam);
  const existingRows = question ? getResearchOutputRows(question.answerJson) : [];
  const isNew = rowIndex === "new";
  let rowSeed: ResearchOutputTable | null = null;
  if (columns && isNew) {
    rowSeed = createEmptyResearchOutputRow(columns);
  } else if (columns && typeof rowIndex === "number" && rowIndex < existingRows.length) {
    rowSeed = existingRows[rowIndex];
  }

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
  let pageTitle = tEdit("headings.editResearchOutput");
  if (isNew) {
    pageTitle = tEdit("headings.addResearchOutput");
  } else if (!canEdit) {
    pageTitle = tEdit("headings.viewResearchOutput");
  }

  const saveRow = async (row: ResearchOutputTable): Promise<boolean> => {
    if (isSaving) {
      return false;
    }
    setIsSaving(true);
    setSaveErrors([]);
    const nextRows = isNew
      ? [...existingRows, row]
      : existingRows.map((existing, index) => (index === rowIndex ? row : existing));
    const result = await dataSource.saveAnswer(
      key,
      buildResearchOutputAnswer(question.parsedJson, nextRows)
    );
    if (result.kind === "saved") {
      navigateBack();
      return true;
    }
    setIsSaving(false);
    setSaveErrors(
      result.kind === "invalid"
        ? result.messages
        : [result.message ?? t("researchOutput.saveFailed")]
    );
    return false;
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
              <ResearchOutputRowForm
                seed={rowSeed}
                columns={columns}
                questionKeyParam={questionKeyParam}
                canEdit={canEdit}
                isSaving={isSaving}
                isNew={isNew}
                hasOtherRows={existingRows.length > 0}
                onSave={saveRow}
                onCancel={navigateBack}
              />
            </div>
            <PlanQuestionSidebar
              questionTitleId={titleId}
              sources={question.guidanceSources}
              comments={question.comments}
              canCustomize={capabilities.canCustomizeGuidance}
              canComment={capabilities.canComment && question.hasAnswer}
              onAddComment={(text) => dataSource.addComment(key, text)}
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
          onSave={(orgIds) => dataSource.setSelectedGuidanceOrgs(orgIds)}
        />
      </ContentContainer>
    </LayoutContainer>
  );
}
