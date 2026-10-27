"use client";

import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { PreviewProvider } from "@/components/PlanPreview/PreviewProvider";
import { loadCustomizationPreview } from "./customizationPreviewData";
import { toCustomizationPreviewModel } from "./toCustomizationPreviewModel";

export default function CustomizationPreviewLayout({ children }: { children: React.ReactNode }) {
  const { templateCustomizationId } = useParams<{ templateCustomizationId: string }>();
  const client = useApolloClient();
  const load = useCallback(
    async () => {
      const data = await loadCustomizationPreview(client, Number(templateCustomizationId));
      return { model: toCustomizationPreviewModel(data), displayLogic: data.displayLogic };
    },
    [client, templateCustomizationId]
  );
  return <PreviewProvider load={load}>{children}</PreviewProvider>;
}
