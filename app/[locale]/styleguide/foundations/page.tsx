"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import PageLinkCard, { PageLinkSection } from "@/components/PageLinkCard";

import "../shared/styleguide.scss";

export default function FoundationsPage() {
  const sections: PageLinkSection[] = [
    {
      title: "Design Foundations",
      description: "Core design principles that form the basis of our design system",
      items: [
        {
          title: "Colours",
          description: "Brand colors, grays, messaging colors, and usage guidelines",
          href: "/styleguide/foundations/colours",
        },
        {
          title: "Typography",
          description: "Type scale, font weights, line heights, and text styles",
          href: "/styleguide/foundations/typography",
        },
        {
          title: "Spacing",
          description: "Spacing scale, utility classes, and layout principles",
          href: "/styleguide/foundations/spacing",
        },
        {
          title: "Naming Conventions",
          description: "Code style guidelines, CSS naming patterns, and conventions",
          href: "/styleguide/foundations/naming-conventions",
        },
        {
          title: "CSS Variables",
          description: "Design tokens, CSS custom properties, and theming system",
          href: "/styleguide/foundations/css-variables",
        },
        {
          title: "Icons",
          description: "Icon usage philosophy, implementation, and accessibility guidelines",
          href: "/styleguide/foundations/icons",
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
          <span aria-current="page">Foundations</span>
        </nav>

        <h1>Foundations</h1>

        <PageLinkCard sections={sections} />
      </ContentContainer>
    </LayoutContainer>
  );
}
