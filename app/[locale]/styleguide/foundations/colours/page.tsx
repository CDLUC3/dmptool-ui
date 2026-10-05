"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { BrandColor, SGGuidelinesGrid, SGGuidelineItem } from "../../shared/components";

import "../../shared/styleguide.scss";

export default function ColoursPage() {
  return (
    <LayoutContainer>
      <ContentContainer>
        <nav
          className="breadcrumbs"
          aria-label="Breadcrumb"
        >
          <Link href="/styleguide">Style Guide</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/styleguide/foundations">Foundations</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Colours</span>
        </nav>

        <h1>Colour System</h1>
        <p className="lead">
          Our colour palette provides a comprehensive system for creating consistent, accessible interfaces. Each colour
          has been carefully chosen to work together harmoniously while meeting accessibility standards.
        </p>

        <div
          style={{
            padding: "1.5rem",
            background: "var(--blue-50)",
            border: "1px solid var(--blue-200)",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ marginTop: 0, color: "var(--blue-900)" }}>Important Color Usage Notes</h3>
          <ul style={{ marginBottom: 0 }}>
            <li>
              <strong>Headings and paragraph tags</strong> use <code>blue-900</code> (#05042E) as the primary text color
              for maximum contrast and readability.
            </li>
            <li>
              <strong>Blue-800</strong> (#020057) is reserved exclusively for our logo and brand mark. It should not be
              used elsewhere in the interface.
            </li>
            <li>
              <strong>Brand-primary</strong> refers to <code>blue-900</code> (#05042E), our dark navy blue used
              throughout the application for primary actions and key interface elements.
            </li>
          </ul>
        </div>

        <section id="primary-colours">
          <h2>Primary Colours</h2>
          <p>
            These are our core colors used throughout the interface. All other colors in our system are supporting
            variations of these primary colors.
          </p>
          <div className="brand-color-list">
            <BrandColor
              varname="--blue-900"
              description="Dark navy - brand primary color, headings and key elements"
            />
            <BrandColor
              varname="--blue-500"
              description="Mid blue - links and interactive elements"
            />
            <BrandColor
              varname="--blue-50"
              description="Light blue background"
            />
            <BrandColor
              varname="--gray-50"
              description="White - primary background"
            />
            <BrandColor
              varname="--yellow-400"
              description="Warning yellow - alerts"
            />
            <BrandColor
              varname="--blue-300"
              description="Cyan blue - highlights"
            />
            <BrandColor
              varname="--gray-75"
              description="Light gray background"
            />
            <BrandColor
              varname="--gray-100"
              description="Medium gray background"
            />
            <BrandColor
              varname="--green-600"
              description="Success green"
            />
            <BrandColor
              varname="--red-400"
              description="Error red"
            />
          </div>
        </section>

        <section id="color-scales">
          <h2>Complete Color Scales</h2>
          <p>
            The following sections show the complete scales and variations for each color family, including lighter and
            darker tones for different interface needs.
          </p>
        </section>

        <section id="brand-colors">
          <h2>Brand Colors</h2>
          <p>Our primary brand colors represent our identity and should be used consistently across all interfaces.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--brand-primary"
              description="Primary brand color for key actions and navigation"
            />
            <BrandColor
              varname="--brand-secondary"
              description="Secondary brand color for supporting elements"
            />
            <BrandColor
              varname="--brand-tertiary"
              description="Tertiary brand color for accents and highlights"
            />
            <BrandColor
              varname="--brand-error"
              description="Error state color for validation and alerts"
            />
          </div>
        </section>

        <section id="blue-scale">
          <h2>Blue Scale</h2>
          <p>Blue tones used for primary actions, links, and brand elements.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--blue-50"
              description="Very light blue - subtle backgrounds"
            />
            <BrandColor
              varname="--blue-100"
              description="Light blue - hover states"
            />
            <BrandColor
              varname="--blue-200"
              description="Medium light blue - active states"
            />
            <BrandColor
              varname="--blue-300"
              description="Cyan blue - highlights and accents"
            />
            <BrandColor
              varname="--blue-400"
              description="Medium blue - interactive elements"
            />
            <BrandColor
              varname="--blue-500"
              description="Primary blue - main brand color"
            />
            <BrandColor
              varname="--blue-600"
              description="Dark blue - pressed states"
            />
            <BrandColor
              varname="--blue-700"
              description="Darker blue - emphasis"
            />
            <BrandColor
              varname="--blue-900"
              description="Navy - highest contrast"
            />
          </div>
        </section>

        <section id="gray-scale">
          <h2>Gray Scale</h2>
          <p>Our gray scale palette provides a range of neutral tones for text, backgrounds, and UI elements.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--gray-50"
              description="White - pure backgrounds"
            />
            <BrandColor
              varname="--gray-75"
              description="Very light gray - subtle backgrounds"
            />
            <BrandColor
              varname="--gray-100"
              description="Light gray - disabled states"
            />
            <BrandColor
              varname="--gray-200"
              description="Medium light gray - borders, dividers"
            />
            <BrandColor
              varname="--gray-300"
              description="Medium gray - secondary borders"
            />
            <BrandColor
              varname="--gray-400"
              description="Dark gray - placeholder text"
            />
            <BrandColor
              varname="--gray-500"
              description="Darker gray - secondary text"
            />
            <BrandColor
              varname="--gray-600"
              description="Darkest gray - primary text"
            />
          </div>
        </section>

        <section id="purple-scale">
          <h2>Purple Scale</h2>
          <p>Purple tones are used for interactive elements, focus states, and to draw attention.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--purple-100"
              description="Light purple - subtle backgrounds"
            />
            <BrandColor
              varname="--purple-200"
              description="Hover states for purple elements"
            />
            <BrandColor
              varname="--purple-300"
              description="Active states for interactions"
            />
            <BrandColor
              varname="--purple-400"
              description="Focus rings and highlights"
            />
            <BrandColor
              varname="--purple-500"
              description="Primary purple for actions"
            />
            <BrandColor
              varname="--purple-600"
              description="Pressed states and emphasis"
            />
          </div>
        </section>

        <section id="red-scale">
          <h2>Red Scale</h2>
          <p>Red tones are used for errors, warnings, and destructive actions.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--red-100"
              description="Light red - error backgrounds"
            />
            <BrandColor
              varname="--red-200"
              description="Error hover states"
            />
            <BrandColor
              varname="--red-300"
              description="Error active states"
            />
            <BrandColor
              varname="--red-400"
              description="Error text and icons"
            />
            <BrandColor
              varname="--red-500"
              description="Error borders and outlines"
            />
            <BrandColor
              varname="--red-600"
              description="Pressed error states"
            />
            <BrandColor
              varname="--red-700"
              description="Bright red - notifications and alerts"
            />
          </div>
        </section>

        <section id="yellow-scale">
          <h2>Yellow Scale</h2>
          <p>Yellow tones for warnings, highlights, and positive attention.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--yellow-400"
              description="Warning yellow - alerts and highlights"
            />
          </div>
        </section>

        <section id="green-scale">
          <h2>Green Scale</h2>
          <p>Green tones for success states and positive feedback.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--green-600"
              description="Success green - positive actions and feedback"
            />
          </div>
        </section>

        <section id="slate-scale">
          <h2>Slate Scale</h2>
          <p>Slate colors provide additional neutral tones for sophisticated UI elements.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--slate-100"
              description="Light slate - subtle backgrounds"
            />
            <BrandColor
              varname="--slate-200"
              description="Light borders and dividers"
            />
            <BrandColor
              varname="--slate-300"
              description="Medium borders and inactive elements"
            />
            <BrandColor
              varname="--slate-400"
              description="Icons and secondary elements"
            />
            <BrandColor
              varname="--slate-500"
              description="Secondary text content"
            />
            <BrandColor
              varname="--slate-600"
              description="Primary text content"
            />
            <BrandColor
              varname="--slate-700"
              description="Headings and emphasis"
            />
            <BrandColor
              varname="--slate-800"
              description="Dark backgrounds"
            />
            <BrandColor
              varname="--slate-900"
              description="Highest contrast text"
            />
          </div>
        </section>

        <section id="messaging-colors">
          <h2>Messaging Colors</h2>
          <p>Specialized colors for different types of user feedback and system messages.</p>
          <div className="brand-color-list">
            <BrandColor
              varname="--messaging-info"
              description="Information messages and neutral alerts"
            />
            <BrandColor
              varname="--messaging-success"
              description="Success states and positive feedback"
            />
            <BrandColor
              varname="--messaging-error"
              description="Error messages and critical alerts"
            />
          </div>
        </section>

        <section id="usage-guidelines">
          <h2>Usage Guidelines</h2>
          <SGGuidelinesGrid>
            <SGGuidelineItem title="Accessibility">
              <p>
                All color combinations meet WCAG 2.1 AA contrast requirements. Always test color combinations for
                sufficient contrast, especially for text and interactive elements.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Brand Colors">
              <p>
                Use brand colors sparingly to maintain their impact. Reserve primary brand colors for the most important
                actions and navigation elements.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Interactive Elements">
              <p>
                Purple scale is reserved for interactive elements, focus states, and hover effects. This helps users
                understand what they can interact with.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Error Handling">
              <p>
                Red scale should only be used for errors, warnings, and destructive actions. This maintains the semantic
                meaning users expect.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Neutral Foundation">
              <p>
                Gray and slate scales form the foundation of the interface. Use these for most UI elements, with colored
                accents for emphasis.
              </p>
            </SGGuidelineItem>
          </SGGuidelinesGrid>
        </section>

        <section id="color-tokens">
          <h2>CSS Custom Properties</h2>
          <p>
            All colors are available as CSS custom properties (variables) that can be used throughout your stylesheets:
          </p>
          <pre>
            <code>{`/* Brand colors */
.primary-button {
  background-color: var(--brand-primary);
  color: var(--gray-50);
}

/* Blue scale */
.link {
  color: var(--blue-500);
}

.link:hover {
  color: var(--blue-600);
}

/* Interactive states */
.interactive-element:hover {
  background-color: var(--purple-100);
  border-color: var(--purple-400);
}

/* Error states */
.error-message {
  color: var(--red-500);
  background-color: var(--red-100);
}

/* Success states */
.success-message {
  color: var(--green-600);
  background-color: var(--messaging-success);
}

/* Warning states */
.warning-message {
  color: var(--blue-900);
  background-color: var(--yellow-400);
}`}</code>
          </pre>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
