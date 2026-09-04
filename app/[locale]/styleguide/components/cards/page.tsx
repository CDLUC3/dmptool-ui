"use client";

import React from "react";
import Link from "next/link";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { Button } from "react-aria-components";

// Import card components
import { Card, CardHeading, CardBody, CardFooter, CardEyebrow } from "@/components/Card/card";
import PlanCard, { type PlanCardPlan } from "@/components/PlanCard";

import {
  SGComponentExample,
  SGComponentExampleHeader,
  SGComponentExampleContent,
  SGComponentExampleDemo,
  SGCodeBlock,
  SGTocGrid,
  SGTocSection,
  SGGuidelinesGrid,
  SGGuidelineItem,
} from "../../shared/components";
import "../../shared/styleguide.scss";

const templatePlan: PlanCardPlan = {
  variant: "template",
  title: "V4.3: Coastal Ocean Processes of North Greenland",
  funding: "National Science Foundation",
  dmpId: "https://doi.org/10.1111/ZZb53989e9",
  modified: "29 Jul 26",
  created: "29 Jul 26",
  versionedSections: [
    {
      versionedSectionId: 1,
      title: "Types of data produced",
      href: "#research-methodology",
      answeredQuestions: 1,
      totalQuestions: 2,
    },
    {
      versionedSectionId: 2,
      title: "Data and metadata standards",
      href: "#data-collection",
      answeredQuestions: 0,
      totalQuestions: 1,
    },
    {
      versionedSectionId: 3,
      title: "Policies for re-use, redistribution",
      href: "#data-storage",
      answeredQuestions: 0,
      totalQuestions: 1,
    },
    {
      versionedSectionId: 4,
      title: "Plans for archiving and preservation",
      href: "#archiving",
      answeredQuestions: 0,
      totalQuestions: 1,
    },
  ],
  downloadHref: "#download",
  actionHref: "#update",
};

const uploadedPlan: PlanCardPlan = {
  variant: "uploaded",
  title: "V4b.1: Coastal Ocean Processes of North Greenland",
  modified: "29 Jul 26",
  created: "29 Jul 26",
  downloadHref: "#download",
  actionHref: "#update",
};

export default function CardsPage() {
  return (
    <LayoutContainer>
      <ContentContainer>
        <nav
          className="breadcrumbs"
          aria-label="Breadcrumb"
        >
          <Link href="/styleguide">Style Guide</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/styleguide/components">Components</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Cards</span>
        </nav>

        <h1>Card Components</h1>
        <p className="lead">
          Flexible container components with composable elements for displaying content in organized, visually distinct
          sections.
        </p>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="Basic Cards">
              <ul>
                <li>
                  <a href="#basic-card">Basic Card</a>
                </li>
                <li>
                  <a href="#card-with-header">Card with Header</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Advanced Cards">
              <ul>
                <li>
                  <a href="#full-featured-card">Full Featured Card</a>
                </li>
                <li>
                  <a href="#plan-card">Plan Card</a>
                </li>
                <li>
                  <a href="#uploaded-plan-card">Uploaded Plan Card</a>
                </li>
                <li>
                  <a href="#plan-object">Plan object</a>
                </li>
                <li>
                  <a href="#card-variants">Card Variants</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Basic Card */}
        <section id="basic-card">
          <h2>Basic Card</h2>
          <p>Simple container for grouping related content with consistent spacing and styling.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Simple Content Card" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <Card>
                  <CardBody>
                    <h3>Project Overview</h3>
                    <p>
                      This is a basic card containing some content. Cards provide a clean container for organizing
                      related information with consistent spacing and visual hierarchy.
                    </p>
                    <p>Cards can contain any type of content including text, images, buttons, and other components.</p>
                  </CardBody>
                </Card>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { Card, CardBody } from '@/components/Card/card';

<Card>
  <CardBody>
    <h3>Card Title</h3>
    <p>Card content goes here...</p>
  </CardBody>
</Card>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Card with Header */}
        <section id="card-with-header">
          <h2>Card with Header</h2>
          <p>Card with a dedicated header section for titles and metadata.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Real-World Card Example" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <Card>
                  <CardHeading>Research Methodology Section</CardHeading>
                  <CardBody>
                    <p>Template: Standard Research Template</p>
                    <p>Questions: 5 questions in this section</p>
                    <p>
                      This card shows how sections are displayed in your application with title, metadata, and actions.
                    </p>
                  </CardBody>
                  <CardFooter>
                    <Button className="secondary">Select Section</Button>
                  </CardFooter>
                </Card>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { Card, CardHeading, CardBody, CardFooter } from '@/components/Card/card';
import { Button } from 'react-aria-components';

<Card>
  <CardHeading>Section Name</CardHeading>
  <CardBody>
    <p>Template: Standard Research Template</p>
    <p>Questions: 5 questions in this section</p>
  </CardBody>
  <CardFooter>
    <Button className="secondary">
      Select Section
    </Button>
  </CardFooter>
</Card>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Full Featured Card */}
        <section id="full-featured-card">
          <h2>Full Featured Card</h2>
          <p>Complete card with all available sections: eyebrow, header, body, and footer.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Complete Card Example" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <Card>
                  <CardEyebrow>Research Project</CardEyebrow>
                  <CardHeading>Climate Change Impact Study</CardHeading>
                  <div style={{ padding: "0 1rem", color: "var(--text-color-base)", fontSize: "0.875rem" }}>
                    <p>A comprehensive analysis of environmental factors</p>
                  </div>
                  <CardBody>
                    <p>
                      This research project examines the long-term effects of climate change on coastal ecosystems. The
                      study includes data collection, analysis, and predictive modeling to understand future
                      environmental conditions.
                    </p>
                    <div style={{ marginTop: "1rem" }}>
                      <strong>Key Focus Areas:</strong>
                      <ul>
                        <li>Marine biodiversity changes</li>
                        <li>Sea level rise impacts</li>
                        <li>Temperature variation effects</li>
                      </ul>
                    </div>
                  </CardBody>
                  <CardFooter>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>
                        <strong>Status:</strong> In Progress
                      </span>
                      <span>
                        <strong>Due:</strong> March 2024
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { 
  Card, 
  CardEyebrow, 
  CardHeading,
  CardBody, 
  CardFooter 
} from '@/components/Card/card';

<Card>
  <CardEyebrow>
    Category or Type
  </CardEyebrow>
  <CardHeading>Card Title</CardHeading>
  <CardBody>
    <p>Main content area...</p>
  </CardBody>
  <CardFooter>
    <div>Footer content, actions, or metadata</div>
  </CardFooter>
</Card>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Plan Card */}
        <section id="plan-card">
          <h2>Plan Card</h2>
          <p>
            Card for a data management plan on the project page. <code>template</code> shows sections;{" "}
            <code>uploaded</code> is the compact file-upload layout.
          </p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Template plan card" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <PlanCard plan={templatePlan} />
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import PlanCard from '@/components/PlanCard';

<PlanCard plan={templatePlan} />`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        <section id="uploaded-plan-card">
          <h2>Uploaded Plan Card</h2>
          <p>
            Same card with <code>variant: &quot;uploaded&quot;</code>. Badge, no section list.
          </p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Uploaded plan card" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <PlanCard plan={uploadedPlan} />
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import PlanCard from '@/components/PlanCard';

<PlanCard plan={uploadedPlan} />`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        <section id="plan-object">
          <h2>Plan object</h2>
          <p>
            Format dates and build hrefs on the page, then pass the result as <code>plan</code>.
          </p>
          <SGCodeBlock>{`<PlanCard
  plan={{
    variant: "template",
    title: plan.title || plan.templateTitle,
    funding: plan.funding,
    dmpId: plan.dmpId,
    created: formatDate(plan.created),
    modified: formatDate(plan.modified),
    versionedSections: plan.versionedSections?.map((section) => ({
      ...section,
      href: routePath("projects.dmp.versionedSection", { ... }),
    })),
    downloadHref: routePath("projects.dmp.download", { ... }),
    actionHref: routePath("projects.dmp.show", { ... }),
  }}
/>`}</SGCodeBlock>
        </section>

        {/* Card Variants */}
        <section id="card-variants">
          <h2>Card Variants</h2>
          <p>Different card styles and configurations for various use cases.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Card Layout Examples" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  {/* Compact Card */}
                  <Card>
                    <CardBody>
                      <h4>Compact Card</h4>
                      <p>Minimal content for simple information display.</p>
                    </CardBody>
                  </Card>

                  {/* Action Card */}
                  <Card>
                    <CardHeading>Action Card</CardHeading>
                    <CardBody>
                      <p>Card with action buttons or links.</p>
                    </CardBody>
                    <CardFooter>
                      <Button className="primary">Take Action</Button>
                    </CardFooter>
                  </Card>

                  {/* Status Card */}
                  <Card>
                    <CardEyebrow>Active</CardEyebrow>
                    <CardBody>
                      <h4>Status Card</h4>
                      <p>Card showing current status or state information.</p>
                    </CardBody>
                  </Card>
                </div>
              </SGComponentExampleDemo>

              <h4>Layout Tips</h4>
              <ul>
                <li>
                  <strong>Grid Layout:</strong> Use CSS Grid for responsive card layouts
                </li>
                <li>
                  <strong>Consistent Heights:</strong> Consider using equal heights for cards in the same row
                </li>
                <li>
                  <strong>Spacing:</strong> Maintain consistent gaps between cards
                </li>
                <li>
                  <strong>Content Hierarchy:</strong> Use card sections to create clear information hierarchy
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Implementation Guidelines */}
        <section id="implementation">
          <h2>Implementation Guidelines</h2>

          <SGGuidelinesGrid>
            <SGGuidelineItem title="Composable Design">
              <p>
                Cards are built from smaller components (Header, Body, Footer, Eyebrow) that can be combined as needed
                for different use cases.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Content Organization">
              <p>Use card sections to create clear information hierarchy and group related content logically.</p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Consistent Spacing">
              <p>
                Cards maintain consistent internal spacing and work well in grid layouts with proper external margins.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Responsive Behavior">
              <p>
                Cards adapt to different screen sizes and can be arranged in flexible grid layouts for optimal display.
              </p>
            </SGGuidelineItem>
          </SGGuidelinesGrid>

          <h3>Available Card Components</h3>
          <ul>
            <li>
              <code>Card</code> - Main container component
            </li>
            <li>
              <code>CardEyebrow</code> - Small label or category indicator
            </li>
            <li>
              <code>CardHeading</code> - Title component (renders as h2)
            </li>
            <li>
              <code>CardBody</code> - Main content area
            </li>
            <li>
              <code>CardFooter</code> - Actions, metadata, or supplementary information
            </li>
            <li>
              <code>PlanCard</code> - Project plan card with <code>template</code> and <code>uploaded</code> variants
            </li>
          </ul>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
