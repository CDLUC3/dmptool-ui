"use client";

import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardBody, CardEyebrow, CardHeading } from "@/components/Card/card";
import PlanQuestionAnswer from "@/components/PlanAuthoring/PlanQuestionAnswer";
import type { PlanQuestionDefinition } from "@/components/PlanAuthoring/model";
import { parseQuestionJson } from "@/components/PlanAuthoring/toPlanAuthoringModel";

interface BaseQuestionCardProps {
  versionedQuestionId: number;
  versionedSectionId: number;
  questionText: string;
  json: string | null;
}

const noop = () => {};
const noopAsync = async () => {};

export default function BaseQuestionCard({
  versionedQuestionId,
  versionedSectionId,
  questionText,
  json,
}: BaseQuestionCardProps) {
  const t = useTranslations("QuestionCustomize");
  const titleId = useId();
  const question = useMemo((): PlanQuestionDefinition => {
    const { parsedJson, jsonError } = parseQuestionJson(json);
    return {
      identity: { kind: "base", versionedQuestionId },
      sectionIdentity: { kind: "base", versionedSectionId },
      title: questionText,
      required: false,
      questionType: typeof parsedJson.type === "string" ? parsedJson.type : "",
      parsedJson,
      jsonError,
      answerJson: null,
      hasAnswer: false,
      guidanceSources: [],
      comments: [],
    };
  }, [versionedQuestionId, versionedSectionId, questionText, json]);

  return (
    <Card data-testid="question-card">
      <CardEyebrow>{t("labels.question")}</CardEyebrow>
      <CardHeading id={titleId}>{questionText}</CardHeading>
      {!question.jsonError && (
        <CardBody data-testid="card-body">
          <PlanQuestionAnswer
            question={question}
            titleId={titleId}
            draftAnswer={null}
            disabled
            onChange={noop}
            onSaveNow={noopAsync}
          />
        </CardBody>
      )}
    </Card>
  );
}
