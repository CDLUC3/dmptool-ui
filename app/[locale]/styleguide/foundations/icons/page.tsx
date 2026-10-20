"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";

import {
  SGTocGrid,
  SGTocSection,
  SGComponentExample,
  SGComponentExampleHeader,
  SGComponentExampleContent,
  SGComponentExampleDemo,
  SGCodeBlock,
} from "../../shared/components";
import "../../shared/styleguide.scss";

export default function IconsPage() {
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
          <span aria-current="page">Icons</span>
        </nav>

        <h1>Icons</h1>
        <p className="lead">
          While our application doesn&apos;t heavily rely on icons, we maintain consistency in the few places where they
          are used.
        </p>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="Icon Usage">
              <ul>
                <li>
                  <a href="#icon-philosophy">Our Philosophy</a>
                </li>
                <li>
                  <a href="#when-to-use">When to Use Icons</a>
                </li>
                <li>
                  <a href="#implementation">Implementation</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Guidelines">
              <ul>
                <li>
                  <a href="#accessibility">Accessibility</a>
                </li>
                <li>
                  <a href="#sizing-spacing">Sizing & Spacing</a>
                </li>
                <li>
                  <a href="#alternatives">Alternatives to Icons</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Icon Philosophy */}
        <section id="icon-philosophy">
          <SGComponentExample>
            <SGComponentExampleHeader title="Our Philosophy" />
            <SGComponentExampleContent>
              <p>
                Our design system prioritizes clear, descriptive text over iconography. We believe that explicit labels
                and well-written content provide better user experience than relying on visual symbols that may be
                ambiguous or culturally specific.
              </p>

              <SGComponentExampleDemo>
                <h4>Why We Minimize Icon Usage</h4>
                <ul>
                  <li>
                    <strong>Clarity:</strong> Text is universally understood and doesn&apos;t require interpretation
                  </li>
                  <li>
                    <strong>Accessibility:</strong> Screen readers handle text better than icon descriptions
                  </li>
                  <li>
                    <strong>Internationalization:</strong> Text can be translated; icons may have cultural meanings
                  </li>
                  <li>
                    <strong>Maintenance:</strong> Fewer icons mean less visual debt and easier updates
                  </li>
                  <li>
                    <strong>Cognitive Load:</strong> Users don&apos;t need to learn icon meanings
                  </li>
                </ul>

                <h4>When Icons Add Value</h4>
                <p>We do use icons sparingly in these contexts:</p>
                <ul>
                  <li>
                    <strong>Universal symbols:</strong> Close (×), expand/collapse arrows
                  </li>
                  <li>
                    <strong>Status indicators:</strong> Success checkmarks, error alerts
                  </li>
                  <li>
                    <strong>Navigation aids:</strong> Breadcrumb separators, external link indicators
                  </li>
                  <li>
                    <strong>Space constraints:</strong> Mobile interfaces where text doesn&apos;t fit
                  </li>
                </ul>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* When to Use Icons */}
        <section id="when-to-use">
          <SGComponentExample>
            <SGComponentExampleHeader title="When to Use Icons" />
            <SGComponentExampleContent>
              <p>
                Icons should only be used when they genuinely improve the user experience, not as decoration or to save
                space.
              </p>

              <SGComponentExampleDemo>
                <h4>✅ Good Uses</h4>
                <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--green-50)",
                      border: "1px solid var(--green-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>×</span>
                      <strong>Close Button</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      Universal symbol that saves space and is instantly recognizable
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--green-50)",
                      border: "1px solid var(--green-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>✓</span>
                      <strong>Success Confirmation</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>Reinforces positive feedback alongside text</p>
                  </div>

                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--green-50)",
                      border: "1px solid var(--green-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>↗</span>
                      <strong>External Link Indicator</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>Warns users they&apos;re leaving the application</p>
                  </div>
                </div>

                <h4>❌ Avoid These Uses</h4>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--red-50)",
                      border: "1px solid var(--red-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem", opacity: 0.5 }}>📊</span>
                      <strong>Generic Action Icons</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      Ambiguous symbols that require user interpretation
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--red-50)",
                      border: "1px solid var(--red-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem", opacity: 0.5 }}>🎨</span>
                      <strong>Decorative Icons</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      Visual noise that doesn&apos;t serve a functional purpose
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--red-50)",
                      border: "1px solid var(--red-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem", opacity: 0.5 }}>⚙</span>
                      <strong>Settings/Config Icons</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      Better served by clear labels like &quot;Settings&quot; or &quot;Configure&quot;
                    </p>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Implementation */}
        <section id="implementation">
          <SGComponentExample>
            <SGComponentExampleHeader title="Implementation Approaches" />
            <SGComponentExampleContent>
              <p>
                When icons are necessary, we use simple, accessible approaches that prioritize functionality over
                aesthetics.
              </p>

              <SGComponentExampleDemo>
                <h4>Unicode Characters</h4>
                <p>For simple, universal symbols, we use Unicode characters:</p>
                <SGCodeBlock>{`// Close button
<button aria-label="Close dialog">×</button>

// Expand/collapse
<button aria-expanded={isOpen}>
  {isOpen ? '−' : '+'}
</button>

// External link
<a href="https://example.com" target="_blank">
  External Link ↗
  <span className="sr-only">(opens in new tab)</span>
</a>`}</SGCodeBlock>

                <h4>CSS-Based Icons</h4>
                <p>For simple geometric shapes, we use CSS:</p>
                <SGCodeBlock>{`.arrow-right {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 6px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

.chevron-down {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
}`}</SGCodeBlock>

                <h4>SVG Icons (Rare)</h4>
                <p>Only when Unicode or CSS won&apos;t work:</p>
                <SGCodeBlock>{`<svg 
  width="16" 
  height="16" 
  viewBox="0 0 16 16"
  aria-hidden="true"
  focusable="false"
>
  <path d="M8 2l6 6-6 6-6-6z" fill="currentColor"/>
</svg>`}</SGCodeBlock>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Accessibility */}
        <section id="accessibility">
          <SGComponentExample>
            <SGComponentExampleHeader title="Accessibility Requirements" />
            <SGComponentExampleContent>
              <p>All icons must be accessible and provide clear meaning to all users.</p>

              <SGComponentExampleDemo>
                <h4>Essential Practices</h4>
                <ul>
                  <li>
                    <strong>Always include text labels:</strong> Icons should supplement, not replace text
                  </li>
                  <li>
                    <strong>Use aria-label:</strong> When icons are used alone, provide descriptive labels
                  </li>
                  <li>
                    <strong>Hide decorative icons:</strong> Use <code>aria-hidden=&quot;true&quot;</code> for purely
                    visual elements
                  </li>
                  <li>
                    <strong>Ensure color contrast:</strong> Icons must meet WCAG contrast requirements
                  </li>
                  <li>
                    <strong>Size appropriately:</strong> Minimum 16px for legibility, 44px for touch targets
                  </li>
                </ul>

                <h4>Code Examples</h4>
                <SGCodeBlock>{`// Icon with text label (preferred)
<button>
  <span aria-hidden="true">×</span>
  Close
</button>

// Icon-only button (when necessary)
<button aria-label="Close dialog">
  <span aria-hidden="true">×</span>
</button>

// Icon in link text
<a href="/external">
  Visit external site
  <span aria-hidden="true">↗</span>
</a>`}</SGCodeBlock>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Sizing and Spacing */}
        <section id="sizing-spacing">
          <SGComponentExample>
            <SGComponentExampleHeader title="Sizing & Spacing" />
            <SGComponentExampleContent>
              <p>Consistent sizing and spacing ensure icons integrate well with text and maintain visual hierarchy.</p>

              <SGComponentExampleDemo>
                <h4>Icon Sizes</h4>
                <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "100px" }}>
                      <strong>Small (16px)</strong>
                    </div>
                    <span style={{ fontSize: "16px" }}>×</span>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>Inline with text</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "100px" }}>
                      <strong>Medium (24px)</strong>
                    </div>
                    <span style={{ fontSize: "24px" }}>×</span>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>Button icons</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "100px" }}>
                      <strong>Large (32px)</strong>
                    </div>
                    <span style={{ fontSize: "32px" }}>×</span>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>Modal close buttons</div>
                  </div>
                </div>

                <h4>Spacing Guidelines</h4>
                <ul>
                  <li>
                    <strong>Text spacing:</strong> Use <code>var(--space-2)</code> between icons and text
                  </li>
                  <li>
                    <strong>Button padding:</strong> Ensure 44px minimum touch target for mobile
                  </li>
                  <li>
                    <strong>Visual alignment:</strong> Align icons to text baseline or center
                  </li>
                  <li>
                    <strong>Consistent margins:</strong> Use spacing tokens for predictable layouts
                  </li>
                </ul>

                <h4>CSS Implementation</h4>
                <SGCodeBlock>{`.icon {
  display: inline-block;
  font-size: 16px; /* or 24px, 32px */
  color: currentColor;
  vertical-align: middle;
}

.icon-with-text {
  margin-right: var(--space-2);
}

.icon-button {
  min-width: 44px;
  min-height: 44px;
  padding: var(--space-2);
  border: none;
  background: transparent;
  cursor: pointer;
}`}</SGCodeBlock>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Alternatives to Icons */}
        <section id="alternatives">
          <SGComponentExample>
            <SGComponentExampleHeader title="Alternatives to Icons" />
            <SGComponentExampleContent>
              <p>
                Before adding an icon, consider these text-based alternatives that often provide better user experience.
              </p>

              <SGComponentExampleDemo>
                <h4>Clear Labels Instead of Icons</h4>
                <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                    <div
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--red-50)",
                        border: "1px solid var(--red-200)",
                        borderRadius: "4px",
                      }}
                    >
                      <span style={{ opacity: 0.5 }}>⚙</span>
                    </div>
                    <span>→</span>
                    <div
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--green-50)",
                        border: "1px solid var(--green-200)",
                        borderRadius: "4px",
                      }}
                    >
                      Settings
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                    <div
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--red-50)",
                        border: "1px solid var(--red-200)",
                        borderRadius: "4px",
                      }}
                    >
                      <span style={{ opacity: 0.5 }}>📁</span>
                    </div>
                    <span>→</span>
                    <div
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--green-50)",
                        border: "1px solid var(--green-200)",
                        borderRadius: "4px",
                      }}
                    >
                      View Projects
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                    <div
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--red-50)",
                        border: "1px solid var(--red-200)",
                        borderRadius: "4px",
                      }}
                    >
                      <span style={{ opacity: 0.5 }}>📊</span>
                    </div>
                    <span>→</span>
                    <div
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--green-50)",
                        border: "1px solid var(--green-200)",
                        borderRadius: "4px",
                      }}
                    >
                      Analytics Dashboard
                    </div>
                  </div>
                </div>

                <h4>Color and Typography for Status</h4>
                <p>Instead of status icons, use color and typography:</p>
                <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "var(--green-50)",
                      color: "var(--green-800)",
                      border: "1px solid var(--green-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Success:</strong> Your changes have been saved
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "var(--red-50)",
                      color: "var(--red-800)",
                      border: "1px solid var(--red-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Error:</strong> Unable to save changes
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "var(--blue-50)",
                      color: "var(--blue-900)",
                      border: "1px solid var(--blue-200)",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Info:</strong> Changes will be reviewed before publishing
                  </div>
                </div>

                <h4>Layout and Spacing for Hierarchy</h4>
                <p>Use visual hierarchy instead of icons to show relationships:</p>
                <ul>
                  <li>
                    <strong>Indentation:</strong> Show nested content structure
                  </li>
                  <li>
                    <strong>Typography scale:</strong> Use heading levels for importance
                  </li>
                  <li>
                    <strong>Spacing:</strong> Group related content with consistent spacing
                  </li>
                  <li>
                    <strong>Color:</strong> Use subtle color changes to indicate states
                  </li>
                </ul>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
