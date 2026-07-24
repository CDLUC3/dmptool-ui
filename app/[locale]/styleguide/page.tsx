"use client";

import React from "react";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import PageLinkCard, { PageLinkSection } from "@/components/PageLinkCard";

import "./shared/styleguide.scss";

export default function StyleGuidePage() {
  const sections: PageLinkSection[] = [
    {
      title: "Foundations",
      description:
        "Core design principles including colours, typography, spacing, and conventions that form the basis of our design system",
      items: [
        {
          title: "Colours",
          description: "Brand colors, grays, messaging colors, and usage guidelines for creating accessible interfaces",
          href: "/styleguide/foundations/colours",
        },
        {
          title: "Typography",
          description: "Type scale, font weights, line heights, and text styles for clear information hierarchy",
          href: "/styleguide/foundations/typography",
        },
        {
          title: "Spacing",
          description: "Spacing scale, utility classes, and layout principles for consistent visual rhythm",
          href: "/styleguide/foundations/spacing",
        },
        {
          title: "Naming Conventions",
          description: "Code style guidelines, CSS naming patterns, and component structure conventions",
          href: "/styleguide/foundations/naming-conventions",
        },
        {
          title: "CSS Variables",
          description: "Design tokens, CSS custom properties, and theming system for consistent styling",
          href: "/styleguide/foundations/css-variables",
        },
        {
          title: "Icons",
          description: "Icon usage philosophy, implementation approaches, and accessibility guidelines",
          href: "/styleguide/foundations/icons",
        },
      ],
    },
    {
      title: "Form Elements",
      description: "Input fields, selections, and form controls built on React Aria with custom styling and validation",
      items: [
        {
          title: "Form Elements",
          description:
            "Text inputs, selects, checkboxes, radio buttons, date pickers, rich text editing, typeahead search, and validation messages",
          href: "/styleguide/components/form-elements",
        },
      ],
    },
    {
      title: "Components",
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
          title: "Layout",
          description: "Container and ExpandableContentSection components for content organization",
          href: "/styleguide/components/layout",
        },
        {
          title: "Plan Authoring",
          description:
            "Single-page plan authoring components with sticky section navigation, questions, guidance, and fixture states",
          href: "/styleguide/components/plan-authoring",
        },
        {
          title: "Headers",
          description: "Page headers, sub-headers, and navigation components for page structure",
          href: "/styleguide/components/headers",
        },
        {
          title: "Tables",
          description: "Data tables with sorting, selection, and responsive behavior",
          href: "/styleguide/components/tables",
        },
        {
          title: "Lists",
          description: "Template lists, project lists, and structured content collections with interactive features",
          href: "/styleguide/components/lists",
        },
        {
          title: "Misc. Navigation",
          description: "Pagination, PageLinkCard, and LinkFilter components for site navigation",
          href: "/styleguide/components/navigation",
        },
        {
          title: "Feedback & Loading",
          description: "Spinners, loading states, and user feedback components for async operations",
          href: "/styleguide/components/feedback",
        },
      ],
    },
  ];

  return (
    <LayoutContainer>
      <ContentContainer>
        <h1>Design System & Style Guide</h1>

        <PageLinkCard sections={sections} />

        <div className="implementation-notes">
          <h3>Implementation Notes</h3>
          <ul>
            <li>
              <strong>React Aria:</strong> We use React Aria components which provide accessibility features out of the
              box{" "}
              <a
                href="https://react-spectrum.adobe.com/react-aria/getting-started.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://react-spectrum.adobe.com/react-aria/getting-started.html
              </a>
            </li>
            <li>
              <strong>Testing:</strong> Test with keyboard navigation and screen readers during development
            </li>
          </ul>
        </div>

        {/* Accessibility Guidelines */}
        <section id="accessibility-guidelines">
          <h2>Accessibility Guidelines</h2>
          <p>
            Our design system prioritizes inclusive design and WCAG 2.1 AA compliance. Ensure your implementation meets
            these standards:
          </p>

          <div className="accessibility-guidelines">
            <h4>Focus Management</h4>
            <ul>
              <li>Verify all interactive elements are keyboard accessible</li>
              <li>Ensure focus indicators are clearly visible</li>
              <li>Check that tab order follows logical content flow</li>
              <li>Implement focus trapping in modals and drawers</li>
            </ul>

            <h4>Semantic HTML</h4>
            <ul>
              <li>Maintain proper heading hierarchy (h1, h2, h3...)</li>
              <li>Use meaningful and descriptive link text and button labels</li>
              <li>Associate form labels properly with inputs</li>
              <li>Implement landmark regions for navigation structure</li>
            </ul>

            <h4>Visual Design</h4>
            <ul>
              <li>Ensure normal text meets 4.5:1 contrast ratio requirement</li>
              <li>Verify large text meets 3:1 contrast ratio requirement</li>
              <li>Ensure color is not the only visual indicator for important information</li>
              <li>Test that text remains readable when zoomed to 200%</li>
            </ul>

            <h4>Responsive Design</h4>
            <ul>
              <li>Make touch targets minimum 44px × 44px</li>
              <li>Ensure content reflows appropriately at different screen sizes</li>
              <li>Implement mobile-friendly navigation patterns</li>
            </ul>
          </div>
        </section>

        <footer className="styleguide-footer">
          <p>
            This style guide is a living document that evolves with our design system. If you notice inconsistencies or
            have suggestions for improvements, please contribute to keeping it up to date.
          </p>
        </footer>
      </ContentContainer>
    </LayoutContainer>
  );
}
