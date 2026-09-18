"use client";

import React from "react";
import Link from "next/link";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { PlanAuthoring } from "@/components/PlanAuthoring";
import {
  createPlanAuthoringDemoDataSource,
  DEMO_PLAN_DOCUMENT,
  getSharedPlanAuthoringDemoDataSource,
} from "@/components/PlanAuthoring/demo";
import { RESEARCH_OUTPUT_QUESTION_TYPE } from "@/lib/constants";
import { questionKey } from "@/components/PlanAuthoring/model";
import type { PlanQuestionDefinition } from "@/components/PlanAuthoring/model";
import "../../shared/styleguide.scss";

const documentDataSource = createPlanAuthoringDemoDataSource({
  delayMs: 0,
});

function researchOutputHrefBase(identity: PlanQuestionDefinition["identity"]) {
  return `/styleguide/components/plan-authoring/research-output/${questionKey(identity)}`;
}

function getResearchOutputRowNavigation(question: PlanQuestionDefinition) {
  if (question.questionType !== RESEARCH_OUTPUT_QUESTION_TYPE) {
    return undefined;
  }
  const base = researchOutputHrefBase(question.identity);
  return {
    editHref: (rowIndex: number) => `${base}/${rowIndex}`,
    addHref: `${base}/new`,
  };
}

export default function PlanAuthoringStyleGuidePage() {
  const questionsDataSource = getSharedPlanAuthoringDemoDataSource();

  return (
    <LayoutContainer className="plan-authoring-layout">
      <ContentContainer>
        <nav
          className="breadcrumbs"
          aria-label="Breadcrumb"
        >
          <Link href="/styleguide">Style Guide</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/styleguide/components">Components</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Plan Authoring</span>
        </nav>

        <h1>Plan Authoring</h1>
        <p className="lead">
          Demo-data showcase of the single-page plan authoring UI. Saves,
          guidance load, comments, and customize guidance are simulated — the
          first Save on any question fails once, then succeeds. Research
          outputs open on their own Add/Edit page instead of an inline form.
        </p>
      </ContentContainer>

      <PlanAuthoring
        dataSource={questionsDataSource}
        getResearchOutputRowNavigation={getResearchOutputRowNavigation}
      />

      <ContentContainer>
        <section id="uploaded-document">
          <h2>Uploaded document alternative</h2>
          <p className="lead">
            Same top section — title, funding, members, related works, and
            sidebar — with a Plan document card instead of Write your plan. Use
            Update document to open the file upload modal. The upload is a
            visual demo only.
          </p>
        </section>
      </ContentContainer>

      <PlanAuthoring
        dataSource={documentDataSource}
        variant="document"
        planDocument={DEMO_PLAN_DOCUMENT}
        idPrefix="plan-document"
      />
    </LayoutContainer>
  );
}
