"use client";

import React from "react";
import Link from "next/link";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import PageLinkCard, { PageLinkSection } from "@/components/PageLinkCard";

import "../shared/styleguide.scss";

export default function ComponentsPage() {
  const sections: PageLinkSection[] = [
    {
      title: "Form Elements",
      description: "Input fields, selections, and form controls built on React Aria with custom styling and validation",
      items: [
        {
          title: "Form Elements",
          description: "Text inputs, selects, checkboxes, radio buttons, date pickers, and specialized form controls",
          href: "/styleguide/components/form-elements",
        },
      ],
    },
    {
      title: "Core UI Components",
      description: "Essential reusable interface elements for building consistent user experiences",
      items: [
        {
          title: "Buttons",
          description: "BackButton, AddQuestionButton, AddSectionButton, ButtonWithImage, and ExpandButton variants",
          href: "/styleguide/components/buttons",
        },
        {
          title: "Cards",
          description: "Card containers with CardHeader, CardBody, and other composable card elements",
          href: "/styleguide/components/cards",
        },
        {
          title: "Modals",
          description: "Modal dialogs, confirmation modals, and overlay components for user interactions",
          href: "/styleguide/components/modals",
        },
        {
          title: "Navigation",
          description: "Pagination, PageLinkCard, and LinkFilter components for site navigation",
          href: "/styleguide/components/navigation",
        },
        {
          title: "Layout",
          description: "Container and ExpandableContentSection components for content organization",
          href: "/styleguide/components/layout",
        },
        {
          title: "Plan Authoring",
          description:
            "Single-page plan overview components with section navigation, questions, guidance, and demo-data states",
          href: "/styleguide/components/plan-authoring",
        },
      ],
    },
    {
      title: "Page Structure",
      description: "Components for organizing page layout and content hierarchy",
      items: [
        {
          title: "Headers",
          description: "PageHeaderWithTitleChange, Header, and SubHeader components for page titles and navigation",
          href: "/styleguide/components/headers",
        },
        {
          title: "Layout Components",
          description: "LeftSidebar and other structural layout components",
          href: "/styleguide/components/page-layout",
        },
        {
          title: "Content Organization",
          description: "ExpandableContentSection, SectionEditContainer, and SectionHeaderEdit for content structure",
          href: "/styleguide/components/content-organization",
        },
      ],
    },
    {
      title: "Data Display",
      description: "Components for presenting and organizing information effectively",
      items: [
        {
          title: "Lists",
          description: "Structured lists for displaying related items and content collections",
          href: "/styleguide/components/lists",
        },
        {
          title: "Tables",
          description: "Data tables with sorting, filtering, and responsive behavior",
          href: "/styleguide/components/tables",
        },
      ],
    },
  ];

  return (
    <LayoutContainer>
      <ContentContainer>
        <nav
          className="breadcrumbs"
          aria-label="Breadcrumb"
        >
          <Link href="/styleguide">Style Guide</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Components</span>
        </nav>

        <h1>Components</h1>
        <p className="lead">
          Reusable interface components built on React Aria primitives with consistent styling and behavior.
        </p>

        <section className="styleguide-overview">
          <h2>Component Architecture</h2>
          <div className="overview-grid">
            <div className="overview-item">
              <h3>React Aria Foundation</h3>
              <p>
                All components are built on React Aria primitives for robust accessibility, keyboard navigation, and
                interaction patterns.
              </p>
            </div>
            <div className="overview-item">
              <h3>Custom Abstractions</h3>
              <p>
                Our <code>components/Form</code> directory provides simplified APIs while maintaining full React Aria
                capabilities underneath.
              </p>
            </div>
            <div className="overview-item">
              <h3>Consistent Styling</h3>
              <p>
                Components use our design system tokens and follow established patterns for spacing, typography, and
                color usage.
              </p>
            </div>
          </div>
        </section>

        <PageLinkCard sections={sections} />

        <section className="component-principles">
          <h2>Design Principles</h2>
          <div className="principles-grid">
            <div className="principle-item">
              <h3>Accessible by Default</h3>
              <p>Every component supports keyboard navigation, screen readers, and follows WCAG guidelines.</p>
            </div>
            <div className="principle-item">
              <h3>Composable</h3>
              <p>
                Components can be combined and customized to create complex interfaces while maintaining consistency.
              </p>
            </div>
            <div className="principle-item">
              <h3>Responsive</h3>
              <p>Components adapt to different screen sizes and input methods automatically.</p>
            </div>
            <div className="principle-item">
              <h3>Performant</h3>
              <p>Optimized for fast loading and smooth interactions with minimal JavaScript overhead.</p>
            </div>
          </div>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
