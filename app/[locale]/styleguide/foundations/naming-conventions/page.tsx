"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";

import "../../shared/styleguide.scss";

export default function NamingConventionsPage() {
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
          <span aria-current="page">Naming Conventions</span>
        </nav>

        <h1>Naming Conventions</h1>

        <section id="components">
          <h2>Components</h2>
          <div className="convention-example">
            <h3>TitleCase for component tags</h3>
            <pre>
              <code>{`<SomeElement />
<UserProfile />
<DataTable />`}</code>
            </pre>
          </div>
        </section>

        <section id="element-ids">
          <h2>Element IDs</h2>
          <div className="convention-example">
            <h3>camelCase for element IDs</h3>
            <pre>
              <code>{`<SomeElement id="myElement" />
<UserProfile id="userProfileCard" />
<DataTable id="mainDataTable" />`}</code>
            </pre>
          </div>
        </section>

        <section id="css-classes">
          <h2>CSS Classes</h2>
          <div className="convention-example">
            <h3>kebab-case for CSS classnames</h3>
            <pre>
              <code>{`<SomeElement className="some-class-name" />
<UserProfile className="user-profile-card" />
<DataTable className="data-table-container" />`}</code>
            </pre>
          </div>
        </section>

        <section id="field-names">
          <h2>Field Names</h2>
          <div className="convention-example">
            <h3>snake_case for field names</h3>
            <pre>
              <code>{`<SomeElement name="field_name" />
<Input name="user_email" />
<TextArea name="project_description" />`}</code>
            </pre>
          </div>
        </section>

        <section id="multi-line">
          <h2>Multi-line Properties</h2>
          <div className="convention-example">
            <h3>Each property on its own line</h3>
            <pre>
              <code>{`<SomeElement
  prop1="A"
  prop2="B"
  prop3="C"
  prop4="D"
/>`}</code>
            </pre>
          </div>
        </section>

        <section id="imports">
          <h2>Import Statements</h2>
          <div className="convention-example">
            <h3>Multi-line imports for clarity</h3>
            <pre>
              <code>{`import {
  Button,
  Label,
  TextField,
  Input,
  FieldError,
  Form,
} from "react-aria-components";`}</code>
            </pre>
          </div>
        </section>

        <section id="css-variables">
          <h2>CSS Variables</h2>

          <div className="convention-example">
            <h3>Public variables</h3>
            <pre>
              <code>{`--brand-primary
--text-color
--spacing-large
--border-radius`}</code>
            </pre>
          </div>

          <div className="convention-example">
            <h3>Private variables (leading underscore)</h3>
            <pre>
              <code>{`.grid-view {
  --_gap: var(--grid-list-grid-gap, 1rem);
  --_columns: var(--grid-columns, 4);

  display: grid;
  padding: var(--_gap);
  grid-gap: var(--_gap);
  grid-template-columns: repeat(var(--_columns), 1fr);
}`}</code>
            </pre>
          </div>
        </section>

        <section id="file-naming">
          <h2>File Naming</h2>

          <div className="convention-example">
            <h3>Component files</h3>
            <pre>
              <code>{`UserProfile.tsx
DataTable.tsx
PageLinkCard/index.tsx
PageLinkCard/PageLinkCard.module.scss`}</code>
            </pre>
          </div>

          <div className="convention-example">
            <h3>Page files</h3>
            <pre>
              <code>{`page.tsx
layout.tsx
loading.tsx
error.tsx`}</code>
            </pre>
          </div>

          <div className="convention-example">
            <h3>Utility files</h3>
            <pre>
              <code>{`utils/formatDate.ts
utils/api-client.ts
hooks/useLocalStorage.ts
types/user.types.ts`}</code>
            </pre>
          </div>
        </section>

        <section id="scss-structure">
          <h2>SCSS Structure</h2>

          <div className="convention-example">
            <h3>BEM-style naming</h3>
            <pre>
              <code>{`.card {
  // Block
  
  &__header {
    // Element
  }
  
  &__title {
    // Element
  }
  
  &--featured {
    // Modifier
  }
  
  &--large {
    // Modifier
  }
}`}</code>
            </pre>
          </div>

          <div className="convention-example">
            <h3>Utility classes</h3>
            <pre>
              <code>{`.mt-4 { margin-top: var(--space-4); }
.p-6 { padding: var(--space-6); }
.text-center { text-align: center; }
.sr-only { /* screen reader only */ }`}</code>
            </pre>
          </div>
        </section>

        <section id="typescript">
          <h2>TypeScript Conventions</h2>

          <div className="convention-example">
            <h3>Interface naming</h3>
            <pre>
              <code>{`interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface PageLinkCardProps {
  sections: PageLinkSection[];
  className?: string;
}`}</code>
            </pre>
          </div>

          <div className="convention-example">
            <h3>Type naming</h3>
            <pre>
              <code>{`type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type Status = 'loading' | 'success' | 'error';
type ComponentSize = 'small' | 'medium' | 'large';`}</code>
            </pre>
          </div>
        </section>

        <section id="quick-reference">
          <h2>Quick Reference</h2>
          <table>
            <thead>
              <tr>
                <th>Context</th>
                <th>Convention</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>React Components</td>
                <td>TitleCase</td>
                <td>
                  <code>UserProfile</code>
                </td>
              </tr>
              <tr>
                <td>Element IDs</td>
                <td>camelCase</td>
                <td>
                  <code>userProfileCard</code>
                </td>
              </tr>
              <tr>
                <td>CSS Classes</td>
                <td>kebab-case</td>
                <td>
                  <code>user-profile-card</code>
                </td>
              </tr>
              <tr>
                <td>Form Fields</td>
                <td>snake_case</td>
                <td>
                  <code>user_email</code>
                </td>
              </tr>
              <tr>
                <td>CSS Variables</td>
                <td>kebab-case</td>
                <td>
                  <code>--brand-primary</code>
                </td>
              </tr>
              <tr>
                <td>Private CSS Variables</td>
                <td>_kebab-case</td>
                <td>
                  <code>--_gap</code>
                </td>
              </tr>
              <tr>
                <td>Files</td>
                <td>TitleCase (components)</td>
                <td>
                  <code>UserProfile.tsx</code>
                </td>
              </tr>
              <tr>
                <td>Files</td>
                <td>kebab-case (utilities)</td>
                <td>
                  <code>api-client.ts</code>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
