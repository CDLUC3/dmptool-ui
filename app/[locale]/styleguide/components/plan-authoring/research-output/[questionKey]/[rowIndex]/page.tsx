"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MockedProvider } from "@apollo/client/testing/react";
import {
  DEMO_RESEARCH_OUTPUT_APOLLO_MOCKS,
  getSharedPlanAuthoringDemoDataSource,
} from "@/components/PlanAuthoring/demo";
import PlanResearchOutputEditScreen from "@/components/PlanAuthoring/PlanResearchOutputEditScreen";
import "../../../../../shared/styleguide.scss";

/** Temporary styleguide list URL. Production will pass a real plan route. */
const STYLEGUIDE_PLAN_HREF = "/styleguide/components/plan-authoring";

export default function PlanAuthoringResearchOutputEditPage() {
  const params = useParams<{ questionKey: string; rowIndex: string }>();
  const questionKeyParam = String(params.questionKey ?? "");
  const rowIndexParam = String(params.rowIndex ?? "");
  const dataSource = getSharedPlanAuthoringDemoDataSource();

  return (
    <MockedProvider mocks={DEMO_RESEARCH_OUTPUT_APOLLO_MOCKS}>
      <PlanResearchOutputEditScreen
        dataSource={dataSource}
        questionKeyParam={questionKeyParam}
        rowIndexParam={rowIndexParam}
        planHref={STYLEGUIDE_PLAN_HREF}
      />
    </MockedProvider>
  );
}
