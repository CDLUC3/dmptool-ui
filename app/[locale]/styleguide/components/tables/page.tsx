"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { Table, TableHeader, TableBody, Column, Row, Cell, Button, SortDescriptor } from "react-aria-components";

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

export default function TablesPage() {
  // Sample data for table examples
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor | undefined>(undefined);

  const sampleData = [
    {
      id: 1,
      name: "Research Data Management",
      template: "NSF Template",
      questions: 12,
      status: "Active",
      badgeVariant: "green",
      lastModified: "2024-01-15",
    },
    {
      id: 2,
      name: "Ethics and Compliance",
      template: "NIH Template",
      questions: 8,
      status: "Draft",
      badgeVariant: "neutral",
      lastModified: "2024-01-10",
    },
    {
      id: 3,
      name: "Data Sharing Plan",
      template: "EU Template",
      questions: 15,
      status: "Completed",
      badgeVariant: "green",
      lastModified: "2024-01-05",
    },
    {
      id: 4,
      name: "Budget Justification",
      template: "Custom",
      questions: 6,
      status: "Archived",
      badgeVariant: "gray",
      lastModified: "2023-12-20",
    },
    {
      id: 5,
      name: "Security Assessment",
      template: "Security Template",
      questions: 10,
      status: "Security",
      badgeVariant: "blue-900",
      lastModified: "2024-01-12",
    },
    {
      id: 6,
      name: "Recommended Practices",
      template: "Best Practices",
      questions: 7,
      status: "Recommended",
      badgeVariant: "green",
      lastModified: "2024-01-08",
    },
    {
      id: 7,
      name: "Future Planning",
      template: "Planning Template",
      questions: 5,
      status: "Not Started",
      badgeVariant: "blue-900",
      lastModified: "2024-01-01",
    },
    {
      id: 8,
      name: "Error Handling",
      template: "Error Template",
      questions: 3,
      status: "Error",
      badgeVariant: "red",
      lastModified: "2024-01-20",
    },
    {
      id: 9,
      name: "Neutral Process",
      template: "Standard Template",
      questions: 9,
      status: "Neutral",
      badgeVariant: "neutral",
      lastModified: "2024-01-18",
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
          <Link href="/styleguide/components">Components</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Tables</span>
        </nav>

        <h1>Tables</h1>
        <p className="lead">
          Data tables built with React Aria for displaying structured information with sorting, selection, and
          responsive behavior.
        </p>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="Basic Tables">
              <ul>
                <li>
                  <a href="#basic-table">Basic Table</a>
                </li>
                <li>
                  <a href="#sortable-table">Sortable Table</a>
                </li>
                <li>
                  <a href="#interactive-table">Interactive Table</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Table Features">
              <ul>
                <li>
                  <a href="#table-styling">Styling & Layout</a>
                </li>
                <li>
                  <a href="#responsive-tables">Responsive Behavior</a>
                </li>
                <li>
                  <a href="#table-patterns">Usage Patterns</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Basic Table */}
        <section id="basic-table">
          <SGComponentExample>
            <SGComponentExampleHeader title="Basic Table" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <Table aria-label="DMP Sections">
                  <TableHeader>
                    <Column isRowHeader>Section Name</Column>
                    <Column>Template</Column>
                    <Column>Questions</Column>
                    <Column>Status</Column>
                    <Column>Last Modified</Column>
                  </TableHeader>
                  <TableBody>
                    {sampleData.map((item) => (
                      <Row key={item.id}>
                        <Cell>{item.name}</Cell>
                        <Cell>{item.template}</Cell>
                        <Cell>{item.questions}</Cell>
                        <Cell>
                          <span className={`badge badge--${item.badgeVariant}`}>{item.status}</span>
                        </Cell>
                        <Cell>{item.lastModified}</Cell>
                      </Row>
                    ))}
                  </TableBody>
                </Table>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import { Table, TableHeader, TableBody, Column, Row, Cell } from 'react-aria-components';

<Table aria-label="Data table">
  <TableHeader>
    <Column isRowHeader>Name</Column>
    <Column>Value</Column>
    <Column>Status</Column>
  </TableHeader>
  <TableBody>
    <Row>
      <Cell>Item 1</Cell>
      <Cell>Value 1</Cell>
      <Cell>Active</Cell>
    </Row>
  </TableBody>
</Table>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Sortable Table */}
        <section id="sortable-table">
          <SGComponentExample>
            <SGComponentExampleHeader title="Sortable Table" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <Table
                  aria-label="Sortable DMP Sections"
                  sortDescriptor={sortDescriptor}
                  onSortChange={setSortDescriptor}
                >
                  <TableHeader>
                    <Column
                      id="name"
                      isRowHeader
                      allowsSorting
                    >
                      Section Name
                    </Column>
                    <Column
                      id="template"
                      allowsSorting
                    >
                      Template
                    </Column>
                    <Column
                      id="questions"
                      allowsSorting
                    >
                      Questions
                    </Column>
                    <Column
                      id="status"
                      allowsSorting
                    >
                      Status
                    </Column>
                    <Column
                      id="lastModified"
                      allowsSorting
                    >
                      Last Modified
                    </Column>
                  </TableHeader>
                  <TableBody>
                    {sampleData.map((item) => (
                      <Row key={item.id}>
                        <Cell>{item.name}</Cell>
                        <Cell>{item.template}</Cell>
                        <Cell>{item.questions}</Cell>
                        <Cell>
                          <span className={`badge badge--${item.badgeVariant}`}>{item.status}</span>
                        </Cell>
                        <Cell>{item.lastModified}</Cell>
                      </Row>
                    ))}
                  </TableBody>
                </Table>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`const [sortDescriptor, setSortDescriptor] = useState({
  column: undefined,
  direction: undefined,
});

<Table 
  sortDescriptor={sortDescriptor}
  onSortChange={setSortDescriptor}
>
  <TableHeader>
    <Column id="name" allowsSorting>Name</Column>
    <Column id="value" allowsSorting>Value</Column>
  </TableHeader>
  <TableBody>
    {/* Table rows */}
  </TableBody>
</Table>`}</SGCodeBlock>

              <h4>Sorting Features</h4>
              <ul>
                <li>
                  <strong>Click column headers</strong> to sort ascending/descending
                </li>
                <li>
                  <strong>Visual indicators</strong> show current sort direction
                </li>
                <li>
                  <strong>Keyboard navigation</strong> with arrow keys and Enter
                </li>
                <li>
                  <strong>Accessible</strong> with proper ARIA attributes
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Interactive Table */}
        <section id="interactive-table">
          <SGComponentExample>
            <SGComponentExampleHeader title="Interactive Table with Actions" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <Table aria-label="DMP Sections with Actions">
                  <TableHeader>
                    <Column isRowHeader>Section Name</Column>
                    <Column>Template</Column>
                    <Column>Questions</Column>
                    <Column>Status</Column>
                    <Column>Actions</Column>
                  </TableHeader>
                  <TableBody>
                    {sampleData.map((item) => (
                      <Row key={item.id}>
                        <Cell>{item.name}</Cell>
                        <Cell>{item.template}</Cell>
                        <Cell>{item.questions}</Cell>
                        <Cell>
                          <span className={`badge badge--${item.badgeVariant}`}>{item.status}</span>
                        </Cell>
                        <Cell>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Button className="secondary small">Edit</Button>
                            <Button className="tertiary small">Delete</Button>
                          </div>
                        </Cell>
                      </Row>
                    ))}
                  </TableBody>
                </Table>
              </SGComponentExampleDemo>

              <h4>Interactive Features</h4>
              <ul>
                <li>
                  <strong>Action buttons</strong> in table cells
                </li>
                <li>
                  <strong>Status badges</strong> with semantic colors
                </li>
                <li>
                  <strong>Consistent button sizing</strong> with small variants
                </li>
                <li>
                  <strong>Proper focus management</strong> for accessibility
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Table Styling */}
        <section id="table-styling">
          <SGComponentExample>
            <SGComponentExampleHeader title="Styling & Layout" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <h4>Badge Variants</h4>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}
                >
                  <span className="badge badge--yellow">Security</span>
                  <span className="badge badge--blue-light">Recommended</span>
                  <span className="badge badge--blue-900">Not Started</span>
                  <span className="badge badge--green">Completed</span>
                  <span className="badge badge--red">Error</span>
                  <span className="badge badge--gray">Disabled</span>
                </div>

                <h4>Badge Sizes</h4>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
                  <span className="badge badge--yellow badge--small">Small</span>
                  <span className="badge badge--blue-light badge--medium">Medium</span>
                  <span className="badge badge--blue-900 badge--large">Large</span>
                </div>

                <h4>Table Utility Classes</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2rem" }}>
                  <div>
                    <h5>Bordered Table</h5>
                    <table
                      className="table-bordered"
                      style={{ width: "100%", marginBottom: "1rem" }}
                    >
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Project A</td>
                          <td>
                            <span className="badge badge--green">Completed</span>
                          </td>
                          <td>2024-01-15</td>
                        </tr>
                        <tr>
                          <td>Project B</td>
                          <td>
                            <span className="badge badge--blue-900">Not Started</span>
                          </td>
                          <td>2024-01-20</td>
                        </tr>
                      </tbody>
                    </table>
                    <SGCodeBlock>{`<table className="table-bordered">`}</SGCodeBlock>
                  </div>

                  <div>
                    <h5>Compact Table with Hover</h5>
                    <table
                      className="table-sm table-hover table-bordered"
                      style={{ width: "100%", marginBottom: "1rem" }}
                    >
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>001</td>
                          <td>Task A</td>
                          <td>Done</td>
                        </tr>
                        <tr>
                          <td>002</td>
                          <td>Task B</td>
                          <td>Pending</td>
                        </tr>
                        <tr>
                          <td>003</td>
                          <td>Task C</td>
                          <td>Done</td>
                        </tr>
                      </tbody>
                    </table>
                    <SGCodeBlock>{`<table className="table-sm table-hover table-bordered">`}</SGCodeBlock>
                  </div>

                  <div>
                    <h5>Center-Aligned Borderless Table</h5>
                    <table
                      className="table-center table-borderless"
                      style={{ width: "100%", marginBottom: "1rem" }}
                    >
                      <thead>
                        <tr>
                          <th>Metric</th>
                          <th>Value</th>
                          <th>Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Users</td>
                          <td>1,234</td>
                          <td>+12%</td>
                        </tr>
                        <tr>
                          <td>Revenue</td>
                          <td>$5,678</td>
                          <td>+8%</td>
                        </tr>
                      </tbody>
                    </table>
                    <SGCodeBlock>{`<table className="table-center table-borderless">`}</SGCodeBlock>
                  </div>

                  <div>
                    <h5>Solid Color Table (No Stripes)</h5>
                    <table
                      className="table-solid table-bordered"
                      style={{ width: "100%", marginBottom: "1rem" }}
                    >
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Count</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Active</td>
                          <td>45</td>
                          <td>75%</td>
                        </tr>
                        <tr>
                          <td>Inactive</td>
                          <td>15</td>
                          <td>25%</td>
                        </tr>
                      </tbody>
                    </table>
                    <SGCodeBlock>{`<table className="table-solid table-bordered">`}</SGCodeBlock>
                  </div>
                </div>

                <h4>Available Utility Classes</h4>
                <SGCodeBlock>{`<!-- Border Options -->
<table className="table-bordered">     <!-- Full borders -->
<table className="table-minimal">      <!-- Only horizontal lines -->
<table className="table-borderless">   <!-- No borders -->

<!-- Row Styling -->
<table className="table-striped">      <!-- Alternating row colors -->
<table className="table-solid">        <!-- Single color rows -->
<table className="table-hover">        <!-- Hover effects -->

<!-- Spacing -->
<table className="table-sm">           <!-- Compact padding -->
<table className="table-lg">           <!-- Large padding -->

<!-- Themes -->
<table className="table-light">        <!-- Light theme (default) -->

<!-- Text Alignment -->
<table className="table-center">       <!-- Center-aligned text -->
<table className="table-right">        <!-- Right-aligned text -->

<!-- Combine multiple classes -->
<table className="table-bordered table-sm table-hover">`}</SGCodeBlock>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Responsive Tables */}
        <section id="responsive-tables">
          <SGComponentExample>
            <SGComponentExampleHeader title="Responsive Behavior" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <h4>Mobile Considerations</h4>
                <ul>
                  <li>
                    <strong>Horizontal scrolling:</strong> Tables scroll horizontally on small screens
                  </li>
                  <li>
                    <strong>Essential columns:</strong> Keep most important columns visible first
                  </li>
                  <li>
                    <strong>Action consolidation:</strong> Consider dropdown menus for multiple actions
                  </li>
                  <li>
                    <strong>Touch targets:</strong> Ensure buttons and links are touch-friendly
                  </li>
                </ul>

                <h4>Best Practices</h4>
                <ul>
                  <li>
                    Use <code>isRowHeader</code> on the primary identifier column
                  </li>
                  <li>
                    Provide meaningful <code>aria-label</code> for screen readers
                  </li>
                  <li>Keep action buttons consistent in size and spacing</li>
                  <li>Use semantic colors for status indicators</li>
                  <li>Consider pagination for large datasets</li>
                </ul>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Usage Patterns */}
        <section id="table-patterns">
          <SGComponentExample>
            <SGComponentExampleHeader title="Common Usage Patterns" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <h4>When to Use Tables</h4>
                <ul>
                  <li>
                    <strong>Data comparison:</strong> When users need to compare values across rows
                  </li>
                  <li>
                    <strong>Structured data:</strong> For displaying tabular information with multiple attributes
                  </li>
                  <li>
                    <strong>Bulk actions:</strong> When users need to perform actions on multiple items
                  </li>
                  <li>
                    <strong>Sorting/filtering:</strong> When data needs to be organized or searched
                  </li>
                </ul>

                <h4>Alternatives to Consider</h4>
                <ul>
                  <li>
                    <strong>Cards:</strong> For content-rich items with fewer comparable attributes
                  </li>
                  <li>
                    <strong>Lists:</strong> For simple, single-attribute collections
                  </li>
                  <li>
                    <strong>Data visualization:</strong> For trends and patterns in large datasets
                  </li>
                </ul>

                <h4>Implementation Checklist</h4>
                <ul>
                  <li>✅ Proper semantic HTML structure with React Aria</li>
                  <li>✅ Accessible column headers and row identifiers</li>
                  <li>✅ Keyboard navigation support</li>
                  <li>✅ Responsive design for mobile devices</li>
                  <li>✅ Clear visual hierarchy and spacing</li>
                  <li>✅ Consistent action button placement</li>
                </ul>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Implementation Guidelines */}
        <section id="implementation">
          <h2>Implementation Guidelines</h2>

          <SGGuidelinesGrid>
            <SGGuidelineItem title="Accessibility First">
              <p>
                Always use React Aria Table components for proper keyboard navigation, screen reader support, and ARIA
                attributes.
              </p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Performance">
              <p>For large datasets, implement virtual scrolling or pagination to maintain good performance.</p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Consistency">
              <p>Use consistent button sizes, status colors, and spacing throughout all table implementations.</p>
            </SGGuidelineItem>
            <SGGuidelineItem title="Mobile Experience">
              <p>Test tables on mobile devices and consider alternative layouts for complex data on small screens.</p>
            </SGGuidelineItem>
          </SGGuidelinesGrid>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
