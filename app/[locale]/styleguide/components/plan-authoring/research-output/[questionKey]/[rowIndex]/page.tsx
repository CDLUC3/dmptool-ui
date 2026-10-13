"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MockedProvider } from "@apollo/client/testing/react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import PlanResearchOutputEditScreen from "@/components/PlanAuthoring/PlanResearchOutputEditScreen";
import {
  getStyleguidePlanAuthoringDataSource,
  STYLEGUIDE_PLAN_HREF,
} from "../../../styleguideDataSource";
import { MOCK_RESEARCH_OUTPUT_APOLLO_MOCKS } from "../../../researchOutputApolloMocks";
import "../../../../../shared/styleguide.scss";

export default function PlanAuthoringResearchOutputEditPage() {
  const params = useParams<{ questionKey: string; rowIndex: string }>();
  const locale = useLocale();

  return (
    <MockedProvider mocks={MOCK_RESEARCH_OUTPUT_APOLLO_MOCKS}>
      <PlanResearchOutputEditScreen
        dataSource={getStyleguidePlanAuthoringDataSource()}
        questionKeyParam={String(params.questionKey ?? "")}
        rowIndexParam={String(params.rowIndex ?? "")}
        planHref={`/${locale}${STYLEGUIDE_PLAN_HREF}`}
        breadcrumbs={(currentPage) => (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/styleguide">Style Guide</Link>
            <span aria-hidden="true"> / </span>
            <Link href="/styleguide/components">Components</Link>
            <span aria-hidden="true"> / </span>
            <Link href={STYLEGUIDE_PLAN_HREF}>Plan Authoring</Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{currentPage}</span>
          </nav>
        )}
      />
    </MockedProvider>
  );
}
