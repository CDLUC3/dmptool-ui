"use client";

import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { PreviewProvider } from "@/components/PlanPreview/PreviewProvider";
import { loadTemplatePreviewPlan } from "./loadTemplatePreview";
import { useTemplatePreviewExampleGuidance } from "./useTemplatePreviewExampleGuidance";

export default function TemplatePreviewLayout({ children }: { children: React.ReactNode }) {
  const { templateId } = useParams<{ templateId: string }>();
  const client = useApolloClient();
  const exampleGuidance = useTemplatePreviewExampleGuidance();
  const load = useCallback(
    () => loadTemplatePreviewPlan(client, Number(templateId), exampleGuidance),
    [client, templateId, exampleGuidance]
  );
  return <PreviewProvider load={load}>{children}</PreviewProvider>;
}
