"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";

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

export default function CSSVariablesPage() {
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
          <span aria-current="page">CSS Variables</span>
        </nav>

        <h1>CSS Variables & Design Tokens</h1>
        <p className="lead">
          Our design system uses CSS custom properties (variables) to maintain consistency and enable theming across the
          application.
        </p>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="Color Variables">
              <ul>
                <li>
                  <a href="#color-tokens">Color Tokens</a>
                </li>
                <li>
                  <a href="#semantic-colors">Semantic Colors</a>
                </li>
                <li>
                  <a href="#messaging-colors">Messaging Colors</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Typography Variables">
              <ul>
                <li>
                  <a href="#font-sizes">Font Sizes</a>
                </li>
                <li>
                  <a href="#font-weights">Font Weights</a>
                </li>
                <li>
                  <a href="#line-heights">Line Heights</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Spacing & Layout">
              <ul>
                <li>
                  <a href="#spacing-scale">Spacing Scale</a>
                </li>
                <li>
                  <a href="#layout-tokens">Layout Tokens</a>
                </li>
                <li>
                  <a href="#usage-examples">Usage Examples</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Color Tokens */}
        <section id="color-tokens">
          <SGComponentExample>
            <SGComponentExampleHeader title="Color Tokens" />
            <SGComponentExampleContent>
              <p>All colors are defined as CSS custom properties and follow a systematic naming convention.</p>

              <SGComponentExampleDemo>
                <h4>Primary Color Scale</h4>
                <div
                  className="color-variable-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--blue-900)",
                        height: "60px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--blue-900</code>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>#05042E</div>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--blue-700)",
                        height: "60px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--blue-700</code>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>#004EAA</div>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--blue-50)",
                        height: "60px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                        border: "1px solid var(--gray-200)",
                      }}
                    ></div>
                    <code>--blue-50</code>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>#F0FBFF</div>
                  </div>
                </div>

                <h4>Gray Scale</h4>
                <div
                  className="color-variable-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--gray-900)",
                        height: "40px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--gray-900</code>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--gray-600)",
                        height: "40px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--gray-600</code>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--gray-400)",
                        height: "40px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--gray-400</code>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--gray-200)",
                        height: "40px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--gray-200</code>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--gray-100)",
                        height: "40px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                        border: "1px solid var(--gray-200)",
                      }}
                    ></div>
                    <code>--gray-100</code>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--gray-75)",
                        height: "40px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                        border: "1px solid var(--gray-200)",
                      }}
                    ></div>
                    <code>--gray-75</code>
                  </div>
                </div>

                <h4>Accent Colors</h4>
                <div
                  className="color-variable-grid"
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}
                >
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--yellow-400)",
                        height: "50px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--yellow-400</code>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>#FFC845</div>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--green-600)",
                        height: "50px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--green-600</code>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>#006C6C</div>
                  </div>
                  <div className="color-variable-item">
                    <div
                      className="color-swatch"
                      style={{
                        background: "var(--red-600)",
                        height: "50px",
                        borderRadius: "4px",
                        marginBottom: "0.5rem",
                      }}
                    ></div>
                    <code>--red-600</code>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>#D3273E</div>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Semantic Colors */}
        <section id="semantic-colors">
          <SGComponentExample>
            <SGComponentExampleHeader title="Semantic Colors" />
            <SGComponentExampleContent>
              <p>
                Semantic color tokens provide meaning and context, making it easier to maintain consistent color usage
                across components.
              </p>

              <SGComponentExampleDemo>
                <h4>Text Colors</h4>
                <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--text-color</code>
                    </div>
                    <div style={{ color: "var(--text-color)" }}>Primary text content</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--text-color-secondary</code>
                    </div>
                    <div style={{ color: "var(--text-color-secondary)" }}>Secondary text content</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--text-color-muted</code>
                    </div>
                    <div style={{ color: "var(--text-color-muted)" }}>Muted text content</div>
                  </div>
                </div>

                <h4>Background Colors</h4>
                <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--background-color</code>
                    </div>
                    <div
                      style={{
                        background: "var(--background-color)",
                        padding: "0.5rem",
                        border: "1px solid var(--gray-200)",
                        borderRadius: "4px",
                      }}
                    >
                      Main background
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--surface-color</code>
                    </div>
                    <div
                      style={{
                        background: "var(--surface-color)",
                        padding: "0.5rem",
                        border: "1px solid var(--gray-200)",
                        borderRadius: "4px",
                      }}
                    >
                      Surface background
                    </div>
                  </div>
                </div>

                <h4>Border Colors</h4>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--border-color</code>
                    </div>
                    <div style={{ border: "2px solid var(--border-color)", padding: "0.5rem", borderRadius: "4px" }}>
                      Default border
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--border-color-focus</code>
                    </div>
                    <div
                      style={{ border: "2px solid var(--border-color-focus)", padding: "0.5rem", borderRadius: "4px" }}
                    >
                      Focus border
                    </div>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Messaging Colors */}
        <section id="messaging-colors">
          <SGComponentExample>
            <SGComponentExampleHeader title="Messaging Colors" />
            <SGComponentExampleContent>
              <p>Specialized color tokens for user feedback, alerts, and status indicators.</p>

              <SGComponentExampleDemo>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--messaging-success</code>
                    </div>
                    <div
                      style={{
                        background: "var(--messaging-success)",
                        color: "white",
                        padding: "0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      Success message
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--messaging-error</code>
                    </div>
                    <div
                      style={{
                        background: "var(--messaging-error)",
                        color: "white",
                        padding: "0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      Error message
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--messaging-warning</code>
                    </div>
                    <div
                      style={{
                        background: "var(--messaging-warning)",
                        color: "white",
                        padding: "0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      Warning message
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "200px" }}>
                      <code>--messaging-info</code>
                    </div>
                    <div
                      style={{
                        background: "var(--messaging-info)",
                        color: "white",
                        padding: "0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      Info message
                    </div>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Font Sizes */}
        <section id="font-sizes">
          <SGComponentExample>
            <SGComponentExampleHeader title="Font Size Tokens" />
            <SGComponentExampleContent>
              <p>Typography scale using CSS custom properties for consistent text sizing across the application.</p>

              <SGComponentExampleDemo>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-4xl</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-4xl)", fontWeight: "var(--fw-bold)" }}>Heading 1</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-3xl</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-3xl)", fontWeight: "var(--fw-semibold)" }}>Heading 2</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-2xl</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-2xl)", fontWeight: "var(--fw-semibold)" }}>Heading 3</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-xl</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-xl)", fontWeight: "var(--fw-medium)" }}>Heading 4</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-lg</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-lg)" }}>Large text</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-base</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-base)" }}>Base text (16px)</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-small</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-small)" }}>Small text</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fs-xs</code>
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)" }}>Extra small text</div>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Font Weights */}
        <section id="font-weights">
          <SGComponentExample>
            <SGComponentExampleHeader title="Font Weight Tokens" />
            <SGComponentExampleContent>
              <p>Consistent font weights using semantic naming for better maintainability.</p>

              <SGComponentExampleDemo>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fw-light</code>
                    </div>
                    <div style={{ fontWeight: "var(--fw-light)" }}>Light weight (300)</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fw-regular</code>
                    </div>
                    <div style={{ fontWeight: "var(--fw-regular)" }}>Regular weight (400)</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fw-medium</code>
                    </div>
                    <div style={{ fontWeight: "var(--fw-medium)" }}>Medium weight (500)</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fw-semibold</code>
                    </div>
                    <div style={{ fontWeight: "var(--fw-semibold)" }}>Semibold weight (600)</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <div style={{ minWidth: "150px" }}>
                      <code>--fw-bold</code>
                    </div>
                    <div style={{ fontWeight: "var(--fw-bold)" }}>Bold weight (700)</div>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Line Heights */}
        <section id="line-heights">
          <SGComponentExample>
            <SGComponentExampleHeader title="Line Height Tokens" />
            <SGComponentExampleContent>
              <p>Line height values optimized for readability and visual hierarchy.</p>

              <SGComponentExampleDemo>
                <div style={{ display: "grid", gap: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "0.5rem" }}>
                      <div style={{ minWidth: "150px" }}>
                        <code>--lh-tight</code>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>1.25</div>
                    </div>
                    <div
                      style={{
                        lineHeight: "var(--lh-tight)",
                        background: "var(--gray-50)",
                        padding: "1rem",
                        borderRadius: "4px",
                      }}
                    >
                      Tight line height for headings and compact text. This creates a more condensed appearance that
                      works well for titles and short text blocks.
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "0.5rem" }}>
                      <div style={{ minWidth: "150px" }}>
                        <code>--lh-normal</code>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>1.5</div>
                    </div>
                    <div
                      style={{
                        lineHeight: "var(--lh-normal)",
                        background: "var(--gray-50)",
                        padding: "1rem",
                        borderRadius: "4px",
                      }}
                    >
                      Normal line height for body text and general content. This provides good readability for longer
                      text passages while maintaining a comfortable reading experience.
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "0.5rem" }}>
                      <div style={{ minWidth: "150px" }}>
                        <code>--lh-relaxed</code>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--gray-600)" }}>1.625</div>
                    </div>
                    <div
                      style={{
                        lineHeight: "var(--lh-relaxed)",
                        background: "var(--gray-50)",
                        padding: "1rem",
                        borderRadius: "4px",
                      }}
                    >
                      Relaxed line height for improved readability in dense content areas. This spacing helps with
                      comprehension and reduces visual fatigue when reading longer passages.
                    </div>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Spacing Scale */}
        <section id="spacing-scale">
          <SGComponentExample>
            <SGComponentExampleHeader title="Spacing Scale" />
            <SGComponentExampleContent>
              <p>Consistent spacing system using a geometric progression for visual harmony and predictable layouts.</p>

              <SGComponentExampleDemo>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-1</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>0.25rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-1)" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-2</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>0.5rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-2)" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-3</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>0.75rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-3)" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-4</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>1rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-4)" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-6</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>1.5rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-6)" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-8</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>2rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-8)" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-12</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>3rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-12)" }}></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ minWidth: "120px" }}>
                      <code>--space-16</code>
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--gray-600)", minWidth: "60px" }}>4rem</div>
                    <div style={{ background: "var(--blue-200)", height: "20px", width: "var(--space-16)" }}></div>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Usage Examples */}
        <section id="usage-examples">
          <SGComponentExample>
            <SGComponentExampleHeader title="Usage Examples" />
            <SGComponentExampleContent>
              <p>Practical examples of how to use CSS variables in your components and styles.</p>

              <SGComponentExampleDemo>
                <h4>Component Styling</h4>
                <SGCodeBlock>{`.my-component {
  /* Use semantic color tokens */
  color: var(--text-color);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  
  /* Use spacing tokens */
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  
  /* Use typography tokens */
  font-size: var(--fs-base);
  font-weight: var(--fw-medium);
  line-height: var(--lh-normal);
}

.my-component:focus {
  border-color: var(--border-color-focus);
  outline: 2px solid var(--yellow-400);
  outline-offset: 2px;
}`}</SGCodeBlock>

                <h4>Utility Classes</h4>
                <SGCodeBlock>{`/* Spacing utilities using CSS variables */
.p-4 { padding: var(--space-4); }
.px-6 { padding-left: var(--space-6); padding-right: var(--space-6); }
.mb-8 { margin-bottom: var(--space-8); }

/* Typography utilities */
.text-lg { font-size: var(--fs-lg); }
.font-semibold { font-weight: var(--fw-semibold); }
.leading-tight { line-height: var(--lh-tight); }

/* Color utilities */
.text-primary { color: var(--blue-700); }
.text-muted { color: var(--text-color-muted); }
.bg-surface { background: var(--surface-color); }`}</SGCodeBlock>

                <h4>React Inline Styles</h4>
                <SGCodeBlock>{`// Using CSS variables in React inline styles
const cardStyle = {
  padding: 'var(--space-6)',
  backgroundColor: 'var(--surface-color)',
  borderRadius: 'var(--space-2)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  fontSize: 'var(--fs-base)',
  lineHeight: 'var(--lh-normal)'
};

<div style={cardStyle}>
  <h3 style={{ 
    fontSize: 'var(--fs-xl)', 
    fontWeight: 'var(--fw-semibold)',
    marginBottom: 'var(--space-3)',
    color: 'var(--text-color)'
  }}>
    Card Title
  </h3>
  <p style={{ color: 'var(--text-color-secondary)' }}>
    Card content using design tokens
  </p>
</div>`}</SGCodeBlock>

                <h4>Best Practices</h4>
                <ul>
                  <li>
                    <strong>Use semantic tokens first:</strong> Prefer <code>--text-color</code> over{" "}
                    <code>--gray-900</code> when possible
                  </li>
                  <li>
                    <strong>Consistent spacing:</strong> Use the spacing scale rather than arbitrary values
                  </li>
                  <li>
                    <strong>Avoid hardcoded values:</strong> Use CSS variables instead of magic numbers
                  </li>
                  <li>
                    <strong>Theme compatibility:</strong> Variables make it easier to implement dark modes or themes
                  </li>
                  <li>
                    <strong>Maintainability:</strong> Changes to design tokens automatically update all components
                  </li>
                </ul>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Implementation Guidelines */}
        <section id="implementation">
          <h2>Implementation Guidelines</h2>

          <SGGuidelinesGrid>
            <SGGuidelineItem title="Naming Conventions">
              <p>
                Use consistent, semantic names that describe purpose rather than appearance. Follow the pattern:{" "}
                <code>--category-variant-state</code>
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Fallback Values">
              <p>
                Always provide fallback values when using CSS variables: <code>color: var(--text-color, #000)</code>
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Documentation">
              <p>Document the purpose and usage context for custom properties, especially semantic tokens.</p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Testing">
              <p>Test components with different themes and ensure variables work correctly across browsers.</p>
            </SGGuidelineItem>
          </SGGuidelinesGrid>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
