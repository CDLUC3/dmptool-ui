"use client";

import React from "react";
import Link from "next/link";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { PlanAuthoring } from "@/components/PlanAuthoring";
import {
  createPlanAuthoringDemoDataSource,
  DEMO_PLAN_DOCUMENT,
} from "@/components/PlanAuthoring/demo";
import "../../shared/styleguide.scss";

const questionsDataSource = createPlanAuthoringDemoDataSource({
  failSaveOnce: true,
  delayMs: 450,
});

const documentDataSource = createPlanAuthoringDemoDataSource({
  delayMs: 0,
});

export default function PlanAuthoringStyleGuidePage() {
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
          first Save on any question fails once, then succeeds.
        </p>
      </ContentContainer>

      <PlanAuthoring dataSource={questionsDataSource} />

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
        document={DEMO_PLAN_DOCUMENT}
        idPrefix="plan-document"
      />
    </LayoutContainer>
  );
}
