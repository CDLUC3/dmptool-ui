"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";

import "../../shared/styleguide.scss";

export default function SpacingPage() {
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
          <span aria-current="page">Spacing</span>
        </nav>

        <h1>Spacing System</h1>

        <section id="spacing-scale">
          <h2>Spacing Scale</h2>

          <div className="spacing-scale">
            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-1)",
                  height: "var(--space-1)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-1</code>
                <span>0.25rem (4px)</span>
                <span>Tight gaps, icon spacing</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-2)",
                  height: "var(--space-2)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-2</code>
                <span>0.5rem (8px)</span>
                <span>Small paddings, button spacing</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-3)",
                  height: "var(--space-3)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-3</code>
                <span>0.75rem (12px)</span>
                <span>Form elements, card padding</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-4)",
                  height: "var(--space-4)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-4</code>
                <span>1rem (16px)</span>
                <span>Base spacing unit</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-5)",
                  height: "var(--space-5)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-5</code>
                <span>1.5rem (24px)</span>
                <span>Component spacing</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-6)",
                  height: "var(--space-6)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-6</code>
                <span>2rem (32px)</span>
                <span>Large component spacing</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-8)",
                  height: "var(--space-8)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-8</code>
                <span>3rem (48px)</span>
                <span>Section spacing</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-10)",
                  height: "var(--space-10)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-10</code>
                <span>4rem (64px)</span>
                <span>Large section spacing</span>
              </div>
            </div>

            <div className="spacing-example">
              <div
                className="spacing-box"
                style={{
                  width: "var(--space-12)",
                  height: "var(--space-12)",
                }}
              ></div>
              <div className="spacing-details">
                <code>--space-12</code>
                <span>6rem (96px)</span>
                <span>Extra large section spacing</span>
              </div>
            </div>
          </div>
        </section>

        <section id="utility-classes">
          <h2>Utility Classes</h2>

          <h3>Margin Utilities</h3>
          <div className="utility-section">
            <div className="demo-container">
              <div className="example-box m-4">m-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box my-4">my-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box mx-4">mx-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box mt-4">mt-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box mb-4">mb-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box ms-4">ms-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box me-4">me-4</div>
            </div>
          </div>

          <h3>Padding Utilities</h3>
          <div className="utility-section">
            <div className="demo-container">
              <div className="example-box p-4">p-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box py-4">py-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box px-4">px-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box pt-4">pt-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box pb-4">pb-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box ps-4">ps-4</div>
            </div>
            <div className="demo-container">
              <div className="example-box pe-4">pe-4</div>
            </div>
          </div>

          <h3>Available Sizes</h3>
          <pre>
            <code>{`m-0, m-1, m-2, m-3, m-4, m-5, m-6, m-8, m-10, m-12
p-0, p-1, p-2, p-3, p-4, p-5, p-6, p-8, p-10, p-12

// Directional variants
mt-4, mb-4, ms-4, me-4  // top, bottom, start, end
mx-4, my-4              // horizontal, vertical`}</code>
          </pre>
        </section>

        <section id="responsive-spacing">
          <h2>Responsive Spacing</h2>
          <pre>
            <code>{`// Responsive breakpoints
mt-2 mt-md-4 mt-lg-6

// Breakpoints: sm, md, lg, xl`}</code>
          </pre>
        </section>

        <section id="brand-spacing">
          <h2>Brand Spacing Variables</h2>
          <dl>
            <dt>
              <code>--brand-space1</code>
            </dt>
            <dd>Button padding, form element internal spacing</dd>

            <dt>
              <code>--brand-space2</code>
            </dt>
            <dd>Component spacing, layout gaps</dd>

            <dt>
              <code>--brand-space3</code>
            </dt>
            <dd>Large section spacing</dd>
          </dl>
        </section>

        <section id="css-usage">
          <h2>CSS Usage</h2>
          <pre>
            <code>{`/* Using spacing variables */
.component {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  gap: var(--space-3);
}

/* Using utility classes */
<div className="mt-4 p-6 mb-8">
  <div className="mx-auto px-4">
    Content with responsive spacing
  </div>
</div>`}</code>
          </pre>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
