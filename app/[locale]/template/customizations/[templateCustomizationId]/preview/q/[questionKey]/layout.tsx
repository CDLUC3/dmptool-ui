"use client";

import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { QuestionPreviewRoute, type QuestionPreviewTarget } from "@/components/PlanPreview/QuestionPreview";
import { loadCustomizationPreview, type CustomizationPreviewData } from "../../customizationPreviewData";
import {
  buildCustomizationQuestionPreview,
  type CustomizationQuestionPreviewDraft,
} from "../buildCustomizationQuestionPreview";

export default function CustomizationQuestionPreviewLayout({ children }: { children: React.ReactNode }) {
  const { templateCustomizationId, questionKey } = useParams<{
    templateCustomizationId: string;
    questionKey: string;
  }>();
  const client = useApolloClient();
  const load = useCallback(
    () => loadCustomizationPreview(client, Number(templateCustomizationId)),
    [client, templateCustomizationId]
  );
  const buildSlice = useCallback(
    (data: CustomizationPreviewData, { draft, sectionId }: QuestionPreviewTarget<CustomizationQuestionPreviewDraft>) =>
      buildCustomizationQuestionPreview(data, { questionKey, sectionId, draft }),
    [questionKey]
  );
  return (
    <QuestionPreviewRoute load={load} buildSlice={buildSlice}>
      {children}
    </QuestionPreviewRoute>
  );
}
