"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";

import "../../shared/styleguide.scss";

export default function TypographyPage() {
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
          <span aria-current="page">Typography</span>
        </nav>

        <h1>Typography System</h1>
        <p className="lead">Clear hierarchy and consistent typography for all interface elements.</p>

        <section id="headings">
          <h2>Headings</h2>
          <p>Heading elements create clear information hierarchy and structure.</p>

          <div className="type-scale-examples">
            <div className="type-example">
              <h1 style={{ margin: 0 }}>Page Title (H1)</h1>
              <code>font-size: var(--fs-2xl) (1.5rem / 24px) • font-weight: var(--fw-bold)</code>
              <p>Main page headings and primary sections</p>
            </div>

            <div className="type-example">
              <h2 style={{ margin: 0 }}>Section Heading (H2)</h2>
              <code>font-size: var(--fs-xl) (1.25rem / 20px) • font-weight: var(--fw-bold)</code>
              <p>Major subsections and content areas</p>
            </div>

            <div className="type-example">
              <h3 style={{ margin: 0 }}>Subsection Heading (H3)</h3>
              <code>font-size: var(--fs-lg) (1.125rem / 18px) • font-weight: var(--fw-bold)</code>
              <p>Component headings and smaller sections</p>
            </div>

            <div className="type-example">
              <h4 style={{ margin: 0 }}>Minor Heading (H4)</h4>
              <code>font-size: var(--fs-base) (1rem / 16px) • font-weight: var(--fw-bold)</code>
              <p>Form sections and detailed groupings</p>
            </div>
          </div>

          <h3>Display Headings</h3>
          <p>For special emphasis and hero content:</p>
          <div className="type-scale-examples">
            <div className="type-example">
              <h1 style={{ fontSize: "var(--fs-4xl)", margin: 0 }}>Display Large</h1>
              <code>font-size: var(--fs-4xl) (2.25rem / 36px)</code>
              <p>Hero headings and landing page titles</p>
            </div>

            <div className="type-example">
              <h2 style={{ fontSize: "var(--fs-3xl)", margin: 0 }}>Display Medium</h2>
              <code>font-size: var(--fs-3xl) (1.875rem / 30px)</code>
              <p>Feature callouts and important announcements</p>
            </div>
          </div>
        </section>

        <section id="paragraphs">
          <h2>Paragraphs</h2>
          <p>Body text for readable content and interface copy.</p>

          <div className="type-scale-examples">
            <div className="type-example">
              <p style={{ margin: 0 }}>Standard paragraph text for most content areas and descriptions.</p>
              <code>font-size: var(--fs-base) (1rem / 16px) • font-weight: var(--fw-normal)</code>
              <p>Default body text, form labels, and interface copy</p>
            </div>

            <div className="type-example">
              <p style={{ fontSize: "var(--fs-small)", margin: 0 }}>
                Small text for captions and secondary information.
              </p>
              <code>font-size: var(--fs-small) (0.875rem / 14px) • font-weight: var(--fw-normal)</code>
              <p>Help text, captions, and supporting details</p>
            </div>

            <div className="type-example">
              <p style={{ fontSize: "var(--fs-xsmall)", margin: 0 }}>Micro text for labels and fine print.</p>
              <code>font-size: var(--fs-xsmall) (0.75rem / 12px) • font-weight: var(--fw-normal)</code>
              <p>Labels, badges, timestamps, and legal text</p>
            </div>
          </div>
        </section>

        <section id="lists">
          <h2>Lists</h2>
          <p>Structured content with consistent spacing and hierarchy.</p>

          <div className="text-style-example">
            <h3>Unordered Lists</h3>
            <ul>
              <li>First item with clear hierarchy</li>
              <li>Second item with consistent spacing</li>
              <li>
                Third item with <a href="#">embedded link</a>
              </li>
              <li>Fourth item completing the pattern</li>
            </ul>

            <h3>Ordered Lists</h3>
            <ol>
              <li>First step in a process</li>
              <li>Second step with clear numbering</li>
              <li>
                Third step with <a href="#">reference link</a>
              </li>
              <li>Final step to complete the sequence</li>
            </ol>
          </div>
        </section>

        <section id="links">
          <h2>Links</h2>
          <p>Interactive text elements with consistent styling and clear states.</p>

          <div className="text-style-example">
            <h3>Text Links</h3>
            <p>
              <strong>Poppins Semibold</strong>
            </p>
            <div className="link-examples">
              <div className="link-example">
                <span>Colour:</span>
                <a
                  href="#"
                  className="text-link"
                >
                  Text link
                </a>
              </div>
              <div className="link-example">
                <span>Focus:</span>
                <a
                  href="#"
                  className="text-link text-link-focus"
                >
                  Text link
                </a>
              </div>
              <div className="link-example">
                <span>Hover colour:</span>
                <a
                  href="#"
                  className="text-link text-link-hover"
                >
                  Text link
                </a>
              </div>
            </div>
            <p>
              All text links use Poppins Semibold with proper underlines and hover states. This applies to both regular{" "}
              <code>&lt;a&gt;</code> tags and React Aria <code>&lt;Link&gt;</code> components.
            </p>

            <h4>CSS Implementation</h4>
            <pre>
              <code>{`/* Text links */
.text-link {
  color: var(--blue-500);
  font-weight: var(--fw-semibold);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 1px;
}

.text-link:hover {
  color: var(--blue-900);
}

.text-link:focus {
  outline: 2px solid var(--yellow-400);
  outline-offset: 2px;
}`}</code>
            </pre>
          </div>
        </section>

        <section id="font-weights">
          <h2>Font Weights</h2>
          <p>Consistent weight scale for emphasis and hierarchy.</p>

          <div className="font-weight-examples">
            <div className="weight-example">
              <p style={{ fontWeight: "var(--fw-normal)" }}>Normal Weight (400)</p>
              <code>font-weight: var(--fw-normal)</code>
              <p>Used for body text, descriptions, and most interface copy</p>
            </div>

            <div className="weight-example">
              <p style={{ fontWeight: "var(--fw-medium)" }}>Medium Weight (500)</p>
              <code>font-weight: var(--fw-medium)</code>
              <p>Used for labels, navigation items, and subtle emphasis</p>
            </div>

            <div className="weight-example">
              <p style={{ fontWeight: "var(--fw-semibold)" }}>Semibold Weight (600)</p>
              <code>font-weight: var(--fw-semibold)</code>
              <p>Used for links, important labels, and medium emphasis</p>
            </div>

            <div className="weight-example">
              <p style={{ fontWeight: "var(--fw-bold)" }}>Bold Weight (700)</p>
              <code>font-weight: var(--fw-bold)</code>
              <p>Used for headings, important information, and strong emphasis</p>
            </div>
          </div>
        </section>

        <section id="line-heights">
          <h2>Line Heights</h2>
          <p>Spacing between lines for optimal readability.</p>

          <div className="line-height-examples">
            <div className="line-height-example">
              <h3>Tight (1.1)</h3>
              <p style={{ lineHeight: "var(--lh-tight)" }}>
                Used for headings and display text where compact spacing is needed.
              </p>
              <code>line-height: var(--lh-tight) • Headings, titles, display text</code>
            </div>

            <div className="line-height-example">
              <h3>Normal (1.5)</h3>
              <p style={{ lineHeight: "var(--lh-normal)" }}>
                Standard line height for body text and interface copy. Provides optimal readability for most content.
              </p>
              <code>line-height: var(--lh-normal) • Body text, paragraphs, interface copy</code>
            </div>

            <div className="line-height-example">
              <h3>Loose (1.8)</h3>
              <p style={{ lineHeight: "var(--lh-loose)" }}>
                Used for longer content where improved readability and reduced eye strain are important.
              </p>
              <code>line-height: var(--lh-loose) • Long-form content, help text, documentation</code>
            </div>
          </div>
        </section>

        <section id="implementation">
          <h2>CSS Implementation</h2>
          <p>Use CSS custom properties for consistent typography:</p>
          <pre>
            <code>{`/* Headings */
h1 {
  font-size: var(--fs-2xl);
  font-weight: var(--fw-bold);
  line-height: var(--lh-tight);
}

h2 {
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  line-height: var(--lh-tight);
}

/* Body text */
p {
  font-size: var(--fs-base);
  font-weight: var(--fw-normal);
  line-height: var(--lh-normal);
}

/* Links */
a {
  color: var(--blue-500);
  font-weight: var(--fw-semibold);
  text-decoration: underline;
}`}</code>
          </pre>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
