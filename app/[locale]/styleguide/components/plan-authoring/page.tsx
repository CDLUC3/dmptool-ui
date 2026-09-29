"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { PlanAuthoring } from "@/components/PlanAuthoring";
import {
  createScenarioDataSource,
  scenarios,
} from "@/components/PlanAuthoring/mocks";
import "../../shared/styleguide.scss";

const documentScenario = scenarios.documentVariant();

export default function PlanAuthoringStyleGuidePage() {
  const [questionsDataSource] = useState(() =>
    createScenarioDataSource("saveFails", { delayMs: 450 })
  );
  const [documentDataSource] = useState(() =>
    createScenarioDataSource("documentVariant")
  );

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
          The single-page plan authoring UI, running on its real GraphQL data
          source against a fake in-memory API. Saves, comments, and customize
          guidance send the same queries and mutations as a real plan. The
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
        {...documentScenario.props}
        idPrefix="plan-document"
      />
    </LayoutContainer>
  );
}
