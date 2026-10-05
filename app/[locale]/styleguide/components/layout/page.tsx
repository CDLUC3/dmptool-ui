"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ContentContainer, LayoutContainer } from "@/components/Container";

// Import layout components
import ExpandableContentSection from "@/components/ExpandableContentSection";
import { LayoutWithPanel, SidebarPanel, DrawerPanel, ToolbarContainer } from "@/components/Container";
import { Button } from "react-aria-components";

import {
  SGComponentExample,
  SGComponentExampleHeader,
  SGComponentExampleContent,
  SGComponentExampleDemo,
  SGCodeBlock,
  SGTocGrid,
  SGTocSection,
} from "../../shared/components";
import "../../shared/styleguide.scss";

export default function LayoutPage() {
  // State for layout demos
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

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
          <span aria-current="page">Layout</span>
        </nav>

        <h1>Layout Components</h1>
        <p className="lead">
          Core layout components for organizing content structure and providing consistent spacing and containers.
        </p>

        {/* Most Common Pattern - Layout with Sidebar */}
        <section id="common-patterns">
          <h2>Most Common Layout Patterns</h2>
          <p>These are the most frequently used layout patterns in the application, showcasing real-world usage.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Standard Page with Sidebar (Most Common)" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div
                  style={{
                    border: "1px solid var(--gray-300)",
                    borderRadius: "4px",
                    overflow: "hidden",
                    minHeight: "500px",
                  }}
                >
                  <LayoutWithPanel>
                    <ContentContainer>
                      <div style={{ padding: "2rem 0" }}>
                        <h3 className="sg-preserve">Main Content Area</h3>
                        <p>
                          This is the most common layout pattern used throughout the application. It combines a main
                          content area with a sidebar for navigation, tools, or contextual information.
                        </p>

                        <div style={{ marginTop: "2rem" }}>
                          <h4 className="sg-preserve">Key Features:</h4>
                          <ul>
                            <li>
                              <strong>Responsive:</strong> Sidebar becomes drawer on mobile
                            </li>
                            <li>
                              <strong>Flexible:</strong> Content adapts to available space
                            </li>
                            <li>
                              <strong>Consistent:</strong> Used across admin, account, template pages
                            </li>
                            <li>
                              <strong>Accessible:</strong> Proper focus management and ARIA labels
                            </li>
                          </ul>
                        </div>

                        <div
                          style={{
                            marginTop: "2rem",
                            padding: "1.5rem",
                            background: "var(--gray-75)",
                            borderRadius: "4px",
                          }}
                        >
                          <h5 className="sg-preserve">Real Usage Examples:</h5>
                          <ul style={{ margin: "0.5rem 0 0 0" }}>
                            <li>Admin dashboard pages</li>
                            <li>Account settings pages</li>
                            <li>Template management</li>
                            <li>Project overview pages</li>
                          </ul>
                        </div>
                      </div>
                    </ContentContainer>

                    <SidebarPanel isOpen={true}>
                      <div style={{ padding: "2rem 0" }}>
                        <h4 className="sg-preserve">Sidebar Content</h4>
                        <p>Typical sidebar contains navigation, quick actions, or contextual information.</p>

                        <div style={{ marginTop: "1.5rem" }}>
                          <h5 className="sg-preserve">Navigation</h5>
                          <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0" }}>
                            <li style={{ padding: "0.5rem 0" }}>
                              <a
                                href="#"
                                style={{ color: "var(--blue-600)", textDecoration: "none", fontSize: "0.875rem" }}
                              >
                                Dashboard
                              </a>
                            </li>
                            <li style={{ padding: "0.5rem 0" }}>
                              <a
                                href="#"
                                style={{ color: "var(--blue-600)", textDecoration: "none", fontSize: "0.875rem" }}
                              >
                                Projects
                              </a>
                            </li>
                            <li style={{ padding: "0.5rem 0" }}>
                              <a
                                href="#"
                                style={{ color: "var(--blue-600)", textDecoration: "none", fontSize: "0.875rem" }}
                              >
                                Templates
                              </a>
                            </li>
                          </ul>
                        </div>

                        <div style={{ marginTop: "1.5rem" }}>
                          <h5 className="sg-preserve">Quick Actions</h5>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <Button className="secondary small">New Project</Button>
                            <Button className="secondary small">Import Data</Button>
                            <Button className="secondary small">Export Report</Button>
                          </div>
                        </div>
                      </div>
                    </SidebarPanel>
                  </LayoutWithPanel>
                </div>
              </SGComponentExampleDemo>

              <h4>Implementation Code</h4>
              <SGCodeBlock>{`import { LayoutWithPanel, ContentContainer, SidebarPanel } from '@/components/Container';

// This is the most common pattern used across the app
<LayoutWithPanel>
  <ContentContainer>
    {/* Main page content */}
    <h1>Page Title</h1>
    <p>Your main content goes here...</p>
    
    {/* Content components like forms, lists, etc. */}
    <PageLinkCard sections={sections} />
  </ContentContainer>

  <SidebarPanel>
    {/* Navigation, tools, contextual info */}
    <nav>
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/projects">Projects</a></li>
      </ul>
    </nav>
    
    <div className="quick-actions">
      <Button>New Project</Button>
      <Button>Settings</Button>
    </div>
  </SidebarPanel>
</LayoutWithPanel>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>

          <div className="component-example">
            <h3>Full-Width Content (No Sidebar)</h3>
            <div className="example-demo full-width">
              <div
                style={{
                  border: "1px solid var(--gray-300)",
                  borderRadius: "4px",
                  padding: "2rem",
                  background: "var(--white)",
                }}
              >
                <LayoutContainer>
                  <ContentContainer>
                    <h3>Full-Width Layout</h3>
                    <p>
                      Sometimes you need full-width content without a sidebar. This pattern is used for focused tasks,
                      forms, or content that needs maximum space.
                    </p>

                    <div
                      style={{
                        marginTop: "1.5rem",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          padding: "1rem",
                          background: "var(--blue-50)",
                          borderRadius: "4px",
                          border: "1px solid var(--blue-200)",
                        }}
                      >
                        <h5>Use Case 1</h5>
                        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>Data entry forms</p>
                      </div>
                      <div
                        style={{
                          padding: "1rem",
                          background: "var(--green-50)",
                          borderRadius: "4px",
                          border: "1px solid var(--green-200)",
                        }}
                      >
                        <h5>Use Case 2</h5>
                        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>Reports and analytics</p>
                      </div>
                      <div
                        style={{
                          padding: "1rem",
                          background: "var(--purple-50)",
                          borderRadius: "4px",
                          border: "1px solid var(--purple-200)",
                        }}
                      >
                        <h5>Use Case 3</h5>
                        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>Content editing</p>
                      </div>
                    </div>
                  </ContentContainer>
                </LayoutContainer>
              </div>
            </div>

            <h4>Implementation Code</h4>
            <pre>
              <code>{`import { LayoutContainer, ContentContainer } from '@/components/Container';

// Simple full-width layout
<LayoutContainer>
  <ContentContainer>
    <h1>Page Title</h1>
    <p>Content that needs full width...</p>
    
    {/* Forms, tables, or other content */}
  </ContentContainer>
</LayoutContainer>`}</code>
            </pre>
          </div>
        </section>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="Basic Containers">
              <ul>
                <li>
                  <a href="#layout-container">Layout Container</a>
                </li>
                <li>
                  <a href="#content-container">Content Container</a>
                </li>
                <li>
                  <a href="#toolbar-container">Toolbar Container</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Panel Layouts">
              <ul>
                <li>
                  <a href="#layout-with-panel">Layout With Panel</a>
                </li>
                <li>
                  <a href="#sidebar-panel">Sidebar Panel</a>
                </li>
                <li>
                  <a href="#drawer-panel">Drawer Panel</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Content Organization">
              <ul>
                <li>
                  <a href="#expandable-content">Expandable Content Section</a>
                </li>
                <li>
                  <a href="#layout-patterns">Complete Layout Examples</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Layout Container */}
        <section id="layout-container">
          <h2>Layout Container</h2>
          <p>Primary wrapper component that provides the main page structure and responsive behavior.</p>

          <div className="component-example">
            <h3>Layout Container Structure</h3>
            <div className="example-demo">
              <div
                style={{
                  border: "2px dashed var(--blue-300)",
                  padding: "1rem",
                  background: "var(--blue-50)",
                  borderRadius: "4px",
                }}
              >
                <strong>LayoutContainer</strong>
                <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>
                  This is the outer layout container that provides the main page structure, responsive breakpoints, and
                  consistent spacing.
                </p>
                <div
                  style={{
                    border: "2px dashed var(--green-300)",
                    padding: "1rem",
                    background: "var(--green-50)",
                    borderRadius: "4px",
                    marginTop: "1rem",
                  }}
                >
                  <strong>ContentContainer</strong>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
                    Inner content container with proper max-width and centering for optimal readability.
                  </p>
                </div>
              </div>
            </div>

            <h4>Usage</h4>
            <pre>
              <code>{`import { LayoutContainer, ContentContainer } from '@/components/Container';

<LayoutContainer>
  <ContentContainer>
    {/* Your page content */}
    <h1>Page Title</h1>
    <p>Page content goes here...</p>
  </ContentContainer>
</LayoutContainer>`}</code>
            </pre>

            <h4>Features</h4>
            <ul>
              <li>Responsive design with mobile-first approach</li>
              <li>Consistent max-width and centering</li>
              <li>Proper spacing and padding</li>
              <li>Full viewport height when needed</li>
              <li>Flexible content accommodation</li>
            </ul>
          </div>
        </section>

        {/* Content Container */}
        <section id="content-container">
          <h2>Content Container</h2>
          <p>Inner container component that provides optimal content width and spacing for readability.</p>

          <div className="component-example">
            <h3>Content Container Usage</h3>
            <div className="example-demo">
              <div
                style={{
                  border: "2px dashed var(--purple-300)",
                  padding: "2rem",
                  background: "var(--purple-50)",
                  borderRadius: "4px",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                <h4>ContentContainer Example</h4>
                <p>
                  The ContentContainer provides optimal line length for reading (typically 60-80 characters per line)
                  and consistent horizontal spacing.
                </p>
                <p>
                  It automatically centers content and adapts to different screen sizes while maintaining readability.
                </p>
                <ul>
                  <li>Optimal reading width</li>
                  <li>Responsive padding</li>
                  <li>Automatic centering</li>
                  <li>Typography-focused spacing</li>
                </ul>
              </div>
            </div>

            <h4>Standalone Usage</h4>
            <pre>
              <code>{`import { ContentContainer } from '@/components/Container';

// Can be used independently for content sections
<ContentContainer>
  <article>
    <h2>Article Title</h2>
    <p>Article content with optimal reading width...</p>
  </article>
</ContentContainer>`}</code>
            </pre>

            <h4>Typography Integration</h4>
            <p>
              ContentContainer works seamlessly with the typography system to provide optimal reading experiences across
              all content types.
            </p>
          </div>
        </section>

        {/* Toolbar Container */}
        <section id="toolbar-container">
          <h2>Toolbar Container</h2>
          <p>
            Horizontal container for organizing toolbar elements like titles, actions, and buttons with consistent
            spacing.
          </p>

          <div className="component-example">
            <h3>Toolbar Examples</h3>
            <div className="example-demo">
              <div style={{ marginBottom: "2rem" }}>
                <h4>Basic Toolbar</h4>
                <ToolbarContainer>
                  <h3 style={{ margin: 0 }}>Page Title</h3>
                  <Button>Action Button</Button>
                </ToolbarContainer>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h4>Toolbar with Multiple Actions</h4>
                <ToolbarContainer>
                  <div>
                    <h3 style={{ margin: 0 }}>Dashboard</h3>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--gray-600)" }}>
                      Manage your projects and templates
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button className="secondary">Settings</Button>
                    <Button className="primary">New Project</Button>
                  </div>
                </ToolbarContainer>
              </div>
            </div>

            <h4>Usage</h4>
            <pre>
              <code>{`import { ToolbarContainer } from '@/components/Container';

<ToolbarContainer>
  <h2>Page Title</h2>
  <Button>Action</Button>
</ToolbarContainer>`}</code>
            </pre>

            <h4>Features</h4>
            <ul>
              <li>Flexbox layout with space-between alignment</li>
              <li>Consistent gap spacing between elements</li>
              <li>Responsive behavior for mobile devices</li>
              <li>Automatic margin reset for child elements</li>
            </ul>
          </div>
        </section>

        {/* Layout With Panel */}
        <section id="layout-with-panel">
          <h2>Layout With Panel</h2>
          <p>
            Composite layout component that combines content areas with sidebars or drawers for complex page layouts.
          </p>

          <div className="component-example">
            <h3>Layout With Sidebar</h3>
            <div className="example-demo full-width">
              <div style={{ marginBottom: "1rem" }}>
                <Button onPress={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "Hide" : "Show"} Sidebar</Button>
              </div>

              <div style={{ border: "1px solid var(--gray-300)", borderRadius: "4px", overflow: "hidden" }}>
                <LayoutWithPanel>
                  <ContentContainer>
                    <h3>Main Content Area</h3>
                    <p>This is the primary content area that adapts its width based on whether the sidebar is open.</p>
                    <p>
                      On desktop, the sidebar appears alongside the content. On mobile, it can be toggled or converted
                      to a drawer overlay.
                    </p>
                    <div
                      style={{ background: "var(--gray-75)", padding: "1rem", borderRadius: "4px", marginTop: "1rem" }}
                    >
                      <strong>Content Container Features:</strong>
                      <ul style={{ marginTop: "0.5rem" }}>
                        <li>Responsive width adjustment</li>
                        <li>Optimal reading line length</li>
                        <li>Consistent vertical rhythm</li>
                        <li>Mobile-first responsive design</li>
                      </ul>
                    </div>
                  </ContentContainer>

                  <SidebarPanel isOpen={sidebarOpen}>
                    <h4>Sidebar Content</h4>
                    <p>
                      This sidebar contains supplementary information, navigation, or tools related to the main content.
                    </p>
                    <ul>
                      <li>Navigation links</li>
                      <li>Related actions</li>
                      <li>Contextual information</li>
                      <li>Secondary tools</li>
                    </ul>
                    <div
                      style={{
                        background: "var(--blue-50)",
                        padding: "0.75rem",
                        borderRadius: "4px",
                        marginTop: "1rem",
                      }}
                    >
                      <small>
                        <strong>Sidebar State:</strong> {sidebarOpen ? "Open" : "Closed"}
                      </small>
                    </div>
                  </SidebarPanel>
                </LayoutWithPanel>
              </div>
            </div>

            <h4>Usage</h4>
            <pre>
              <code>{`import { LayoutWithPanel, ContentContainer, SidebarPanel } from '@/components/Container';

<LayoutWithPanel>
  <ContentContainer>
    {/* Main content */}
    <h1>Page Content</h1>
    <p>Your main content goes here...</p>
  </ContentContainer>
  
  <SidebarPanel isOpen={sidebarOpen}>
    {/* Sidebar content */}
    <h3>Sidebar</h3>
    <nav>/* Navigation or tools */</nav>
  </SidebarPanel>
</LayoutWithPanel>`}</code>
            </pre>

            <h4>Responsive Behavior</h4>
            <ul>
              <li>
                <strong>Desktop:</strong> Side-by-side layout with 70/30 split
              </li>
              <li>
                <strong>Tablet:</strong> Maintains side-by-side with adjusted proportions
              </li>
              <li>
                <strong>Mobile:</strong> Stacked layout or drawer overlay
              </li>
              <li>
                <strong>Flexible:</strong> Sidebar can be toggled on/off
              </li>
            </ul>
          </div>
        </section>

        {/* Sidebar Panel */}
        <section id="sidebar-panel">
          <h2>Sidebar Panel</h2>
          <p>Dedicated sidebar component for secondary content, navigation, and contextual tools.</p>

          <div className="component-example">
            <h3>Sidebar Panel Features</h3>
            <div className="example-demo full-width">
              <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <h4>Open State</h4>
                  <div
                    style={{
                      border: "1px solid var(--gray-300)",
                      borderRadius: "4px",
                      padding: "1rem",
                      background: "var(--gray-50)",
                    }}
                  >
                    <SidebarPanel isOpen={true}>
                      <h5>Navigation</h5>
                      <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0" }}>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#"
                            style={{ textDecoration: "none", color: "var(--blue-600)" }}
                          >
                            Dashboard
                          </a>
                        </li>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#"
                            style={{ textDecoration: "none", color: "var(--blue-600)" }}
                          >
                            Projects
                          </a>
                        </li>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#"
                            style={{ textDecoration: "none", color: "var(--blue-600)" }}
                          >
                            Settings
                          </a>
                        </li>
                      </ul>
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "0.75rem",
                          background: "var(--blue-100)",
                          borderRadius: "4px",
                        }}
                      >
                        <small>
                          <strong>Status:</strong> Visible and interactive
                        </small>
                      </div>
                    </SidebarPanel>
                  </div>
                </div>

                <div>
                  <h4>Closed State</h4>
                  <div
                    style={{
                      border: "1px solid var(--gray-300)",
                      borderRadius: "4px",
                      padding: "1rem",
                      background: "var(--gray-50)",
                    }}
                  >
                    <SidebarPanel isOpen={false}>
                      <h5>Navigation</h5>
                      <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0" }}>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#"
                            style={{ textDecoration: "none", color: "var(--blue-600)" }}
                          >
                            Dashboard
                          </a>
                        </li>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#"
                            style={{ textDecoration: "none", color: "var(--blue-600)" }}
                          >
                            Projects
                          </a>
                        </li>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#"
                            style={{ textDecoration: "none", color: "var(--blue-600)" }}
                          >
                            Settings
                          </a>
                        </li>
                      </ul>
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "0.75rem",
                          background: "var(--red-100)",
                          borderRadius: "4px",
                        }}
                      >
                        <small>
                          <strong>Status:</strong> Hidden with transition
                        </small>
                      </div>
                    </SidebarPanel>
                  </div>
                </div>
              </div>
            </div>

            <h4>Properties</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-75)" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>Prop</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>Type</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                    Default
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    <code>isOpen</code>
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>boolean</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>true</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    Controls visibility with smooth transitions
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    <code>className</code>
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>string</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>&quot;&quot;</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>Additional CSS classes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Drawer Panel */}
        <section id="drawer-panel">
          <h2>Drawer Panel</h2>
          <p>
            Overlay panel that slides in from the side, perfect for mobile navigation and temporary content display.
          </p>

          <div className="component-example">
            <h3>Interactive Drawer Example</h3>
            <div className="example-demo full-width">
              <div style={{ marginBottom: "1rem" }}>
                <Button onPress={() => setDrawerOpen(true)}>Open Drawer</Button>
                <span style={{ marginLeft: "1rem", fontSize: "0.875rem", color: "var(--gray-600)" }}>
                  Status: {drawerOpen ? "Open" : "Closed"}
                </span>
              </div>

              <div
                style={{
                  border: "1px solid var(--gray-300)",
                  borderRadius: "4px",
                  padding: "2rem",
                  background: "var(--gray-50)",
                  position: "relative",
                  minHeight: "300px",
                }}
              >
                <div style={{ textAlign: "center", color: "var(--gray-600)" }}>
                  <h4>Main Content Area</h4>
                  <p>
                    This represents your main page content. When the drawer opens, it will overlay from the right side.
                  </p>
                  <p>The drawer automatically handles:</p>
                  <ul style={{ textAlign: "left", maxWidth: "400px", margin: "1rem auto" }}>
                    <li>Focus management and keyboard navigation</li>
                    <li>Escape key to close</li>
                    <li>Click outside to close (on mobile)</li>
                    <li>Responsive behavior (modal on mobile, panel on desktop)</li>
                    <li>Smooth animations and transitions</li>
                  </ul>
                </div>

                <DrawerPanel
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  title="Drawer Content"
                >
                  <div>
                    <h4>Drawer Panel Content</h4>
                    <p>This drawer can contain any content you need:</p>
                    <ul>
                      <li>Navigation menus</li>
                      <li>Form fields</li>
                      <li>Settings panels</li>
                      <li>Additional information</li>
                      <li>Action buttons</li>
                    </ul>

                    <div
                      style={{ marginTop: "2rem", padding: "1rem", background: "var(--blue-50)", borderRadius: "4px" }}
                    >
                      <h5>Accessibility Features</h5>
                      <ul style={{ fontSize: "0.875rem" }}>
                        <li>Focus trapping within the drawer</li>
                        <li>ARIA attributes for screen readers</li>
                        <li>Keyboard navigation support</li>
                        <li>Focus return to trigger element</li>
                      </ul>
                    </div>

                    <div style={{ marginTop: "2rem" }}>
                      <Button
                        onPress={() => setDrawerOpen(false)}
                        className="secondary"
                      >
                        Close Drawer
                      </Button>
                    </div>
                  </div>
                </DrawerPanel>
              </div>
            </div>

            <h4>Usage</h4>
            <pre>
              <code>{`import { DrawerPanel } from '@/components/Container';

const [drawerOpen, setDrawerOpen] = useState(false);

<DrawerPanel
  isOpen={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  title="Drawer Title"
>
  <div>
    {/* Drawer content */}
    <h3>Drawer Content</h3>
    <p>Content goes here...</p>
  </div>
</DrawerPanel>`}</code>
            </pre>

            <h4>Properties</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
              <thead>
                <tr style={{ background: "var(--gray-75)" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>Prop</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>Type</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                    Default
                  </th>
                  <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    <code>isOpen</code>
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>boolean</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>false</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    Controls drawer visibility
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    <code>onClose</code>
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>function</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>-</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    Callback when drawer closes
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    <code>title</code>
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>string</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>&quot;&quot;</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>Drawer header title</td>
                </tr>
                <tr>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    <code>returnFocusRef</code>
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>RefObject</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>-</td>
                  <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                    Element to focus when drawer closes
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Expandable Content Section */}
        <section id="expandable-content">
          <h2>Expandable Content Section</h2>
          <p>Interactive component for organizing content that can be expanded or collapsed to save space.</p>

          <div className="component-example">
            <h3>Interactive Expandable Sections</h3>
            <div className="example-demo">
              <ExpandableContentSection
                id="project-details"
                heading="Project Details"
              >
                <div>
                  <h4>Research Methodology</h4>
                  <p>
                    This section contains detailed information about the research methodology, data collection
                    processes, and analysis techniques used in the project.
                  </p>
                  <ul>
                    <li>Quantitative data analysis</li>
                    <li>Survey methodology</li>
                    <li>Statistical modeling</li>
                    <li>Peer review process</li>
                  </ul>
                  <p>
                    The expandable format allows users to access detailed information when needed while keeping the
                    interface clean and organized.
                  </p>
                </div>
              </ExpandableContentSection>

              <ExpandableContentSection
                id="technical-specs"
                heading="Technical Specifications"
              >
                <div>
                  <h4>System Requirements</h4>
                  <p>Technical details about system requirements, compatibility, and implementation specifications.</p>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                    <thead>
                      <tr style={{ background: "var(--gray-75)" }}>
                        <th style={{ padding: "0.5rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                          Component
                        </th>
                        <th style={{ padding: "0.5rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                          Requirement
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: "0.5rem", border: "1px solid var(--gray-200)" }}>Browser</td>
                        <td style={{ padding: "0.5rem", border: "1px solid var(--gray-200)" }}>
                          Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "0.5rem", border: "1px solid var(--gray-200)" }}>JavaScript</td>
                        <td style={{ padding: "0.5rem", border: "1px solid var(--gray-200)" }}>
                          ES2020 support required
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </ExpandableContentSection>

              <p style={{ marginTop: "1rem" }}>
                <small>
                  <em>
                    Note: These sections automatically manage their expand/collapse state and show truncated content
                    with &quot;expand&quot; links when needed.
                  </em>
                </small>
              </p>
            </div>

            <h4>Usage</h4>
            <pre>
              <code>{`import ExpandableContentSection from '@/components/ExpandableContentSection';

<ExpandableContentSection
  id="unique-section-id"
  heading="Section Title"
  summaryCharLimit={200} // Optional: truncate at 200 chars
  expandLabel="Show more" // Optional: custom expand text
  collapseLabel="Show less" // Optional: custom collapse text
>
  <div>
    {/* Content that will be automatically truncated */}
    <p>Long content that will be truncated and show expand/collapse...</p>
    <p>More content here...</p>
  </div>
</ExpandableContentSection>`}</code>
            </pre>

            <h4>Use Cases</h4>
            <ul>
              <li>
                <strong>FAQ Sections:</strong> Questions with expandable answers
              </li>
              <li>
                <strong>Documentation:</strong> Detailed technical information
              </li>
              <li>
                <strong>Form Sections:</strong> Optional or advanced form fields
              </li>
              <li>
                <strong>Content Organization:</strong> Hierarchical information display
              </li>
              <li>
                <strong>Progressive Disclosure:</strong> Revealing complexity gradually
              </li>
            </ul>

            <h4>Accessibility Features</h4>
            <ul>
              <li>ARIA expanded state management</li>
              <li>Keyboard navigation (Enter/Space to toggle)</li>
              <li>Focus management and indicators</li>
              <li>Screen reader announcements</li>
            </ul>
          </div>
        </section>

        {/* Layout Patterns */}
        <section id="layout-patterns">
          <h2>Complete Layout Examples</h2>
          <p>Real-world layout patterns combining multiple container components, based on actual application usage.</p>

          <div className="component-example">
            <h3>Admin Dashboard Layout</h3>
            <div className="example-demo full-bleed">
              <div style={{ border: "1px solid var(--gray-300)", borderRadius: "4px", overflow: "hidden" }}>
                {/* Page Header */}
                <div
                  style={{ background: "var(--blue-100)", padding: "1rem", borderBottom: "1px solid var(--gray-300)" }}
                >
                  <ToolbarContainer>
                    <div>
                      <h3 style={{ margin: 0 }}>Admin Dashboard</h3>
                      <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "var(--gray-600)" }}>
                        University of California, Office of the President (UCOP)
                      </p>
                    </div>
                    <Button className="secondary">Back</Button>
                  </ToolbarContainer>
                </div>

                {/* Main Layout */}
                <div style={{ minHeight: "400px" }}>
                  <LayoutWithPanel>
                    <ContentContainer>
                      <div style={{ padding: "1rem 0" }}>
                        <h4>Main Content Area</h4>
                        <p>
                          This layout pattern is used throughout the application for admin pages, account settings, and
                          dashboard views.
                        </p>

                        {/* Mock PageLinkCard grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "1rem",
                            marginTop: "1.5rem",
                          }}
                        >
                          <div
                            style={{
                              border: "1px solid var(--gray-200)",
                              borderRadius: "8px",
                              padding: "1rem",
                              background: "var(--white)",
                            }}
                          >
                            <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--blue-600)" }}>User Management</h5>
                            <p style={{ margin: "0", fontSize: "0.875rem", color: "var(--gray-600)" }}>
                              Manage users, roles, and permissions
                            </p>
                          </div>
                          <div
                            style={{
                              border: "1px solid var(--gray-200)",
                              borderRadius: "8px",
                              padding: "1rem",
                              background: "var(--white)",
                            }}
                          >
                            <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--blue-600)" }}>Templates</h5>
                            <p style={{ margin: "0", fontSize: "0.875rem", color: "var(--gray-600)" }}>
                              Create and manage DMP templates
                            </p>
                          </div>
                          <div
                            style={{
                              border: "1px solid var(--gray-200)",
                              borderRadius: "8px",
                              padding: "1rem",
                              background: "var(--white)",
                            }}
                          >
                            <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--blue-600)" }}>Statistics</h5>
                            <p style={{ margin: "0", fontSize: "0.875rem", color: "var(--gray-600)" }}>
                              View usage statistics and reports
                            </p>
                          </div>
                        </div>
                      </div>
                    </ContentContainer>

                    <SidebarPanel isOpen={true}>
                      <div style={{ padding: "1rem 0" }}>
                        <h5>Quick Actions</h5>
                        <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0" }}>
                          <li style={{ padding: "0.5rem 0" }}>
                            <a
                              href="#"
                              style={{ textDecoration: "none", color: "var(--blue-600)", fontSize: "0.875rem" }}
                            >
                              View All Users
                            </a>
                          </li>
                          <li style={{ padding: "0.5rem 0" }}>
                            <a
                              href="#"
                              style={{ textDecoration: "none", color: "var(--blue-600)", fontSize: "0.875rem" }}
                            >
                              System Settings
                            </a>
                          </li>
                          <li style={{ padding: "0.5rem 0" }}>
                            <a
                              href="#"
                              style={{ textDecoration: "none", color: "var(--blue-600)", fontSize: "0.875rem" }}
                            >
                              Export Data
                            </a>
                          </li>
                        </ul>

                        <div
                          style={{
                            marginTop: "2rem",
                            padding: "1rem",
                            background: "var(--yellow-100)",
                            borderRadius: "4px",
                            border: "1px solid var(--yellow-300)",
                          }}
                        >
                          <h6 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem" }}>System Status</h6>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--gray-700)" }}>
                            All systems operational
                          </p>
                        </div>
                      </div>
                    </SidebarPanel>
                  </LayoutWithPanel>
                </div>
              </div>
            </div>

            <h4>Implementation Code</h4>
            <pre>
              <code>{`// Complete admin dashboard layout
<>
  <PageHeader
    title="Admin"
    description="University of California, Office of the President (UCOP)"
    showBackButton={true}
  />
  <div className={styles.main}>
    <div className={styles.mainContent}>
      <LayoutWithPanel>
        <ContentContainer>              
          <PageLinkCard sections={adminSections} />
        </ContentContainer>
        <SidebarPanel>
          <div>
            {/* Sidebar content - navigation, tools, status */}
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </div>
  </div>
</>`}</code>
            </pre>
          </div>

          <div className="component-example">
            <h3>Complex Layout with All Components</h3>
            <div className="example-demo full-bleed">
              <div style={{ border: "1px solid var(--gray-300)", borderRadius: "4px", overflow: "hidden" }}>
                {/* Toolbar */}
                <ToolbarContainer
                  style={{
                    background: "var(--gray-75)",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--gray-300)",
                  }}
                >
                  <h4 style={{ margin: 0 }}>Template Builder</h4>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      onPress={() => setDrawerOpen(true)}
                      className="secondary"
                    >
                      Settings
                    </Button>
                    <Button className="primary">Save Template</Button>
                  </div>
                </ToolbarContainer>

                {/* Main Layout with Sidebar */}
                <LayoutWithPanel>
                  <ContentContainer>
                    <div style={{ padding: "1.5rem 0" }}>
                      <h4>Template Sections</h4>
                      <p>
                        Build your DMP template by adding sections and questions. Use the sidebar for navigation and the
                        settings drawer for advanced options.
                      </p>

                      {/* Expandable Sections */}
                      <ExpandableContentSection
                        id="research-data-mgmt"
                        heading="Research Data Management Section"
                      >
                        <div style={{ padding: "1rem", background: "var(--gray-50)", borderRadius: "4px" }}>
                          <p>
                            This section contains questions about data management practices, storage solutions, and
                            sharing policies.
                          </p>
                          <ul>
                            <li>Data collection methods</li>
                            <li>Storage and backup strategies</li>
                            <li>Data sharing and access policies</li>
                            <li>Preservation and archiving plans</li>
                          </ul>
                        </div>
                      </ExpandableContentSection>

                      <ExpandableContentSection
                        id="compliance-ethics"
                        heading="Compliance and Ethics Section"
                      >
                        <div style={{ padding: "1rem", background: "var(--gray-50)", borderRadius: "4px" }}>
                          <p>
                            Questions related to ethical considerations, legal compliance, and institutional
                            requirements.
                          </p>
                          <ul>
                            <li>IRB approval requirements</li>
                            <li>Privacy and confidentiality</li>
                            <li>Legal and regulatory compliance</li>
                            <li>Intellectual property considerations</li>
                          </ul>
                        </div>
                      </ExpandableContentSection>
                    </div>
                  </ContentContainer>

                  <SidebarPanel isOpen={sidebarOpen}>
                    <div style={{ padding: "1rem 0" }}>
                      <h5>Section Navigation</h5>
                      <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0" }}>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#research-data-mgmt"
                            style={{ fontSize: "0.875rem", color: "var(--blue-600)", textDecoration: "none" }}
                          >
                            Research Data Management
                          </a>
                        </li>
                        <li style={{ padding: "0.25rem 0" }}>
                          <a
                            href="#compliance-ethics"
                            style={{ fontSize: "0.875rem", color: "var(--blue-600)", textDecoration: "none" }}
                          >
                            Compliance and Ethics
                          </a>
                        </li>
                      </ul>

                      <div style={{ marginTop: "2rem" }}>
                        <h6>Template Tools</h6>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <Button className="secondary small">Add Section</Button>
                          <Button className="secondary small">Import Questions</Button>
                          <Button className="secondary small">Preview Template</Button>
                        </div>
                      </div>
                    </div>
                  </SidebarPanel>
                </LayoutWithPanel>

                {/* Drawer Panel for Settings */}
                <DrawerPanel
                  isOpen={drawerOpen}
                  onClose={() => setDrawerOpen(false)}
                  title="Template Settings"
                >
                  <div>
                    <h5>Advanced Settings</h5>
                    <p>Configure template behavior, validation rules, and display options.</p>

                    <div style={{ marginTop: "1.5rem" }}>
                      <h6>Validation Settings</h6>
                      <label style={{ display: "block", margin: "0.5rem 0" }}>
                        <input
                          type="checkbox"
                          style={{ marginRight: "0.5rem" }}
                        />
                        Require all questions to be answered
                      </label>
                      <label style={{ display: "block", margin: "0.5rem 0" }}>
                        <input
                          type="checkbox"
                          style={{ marginRight: "0.5rem" }}
                        />
                        Enable auto-save
                      </label>
                    </div>

                    <div style={{ marginTop: "1.5rem" }}>
                      <h6>Display Options</h6>
                      <label style={{ display: "block", margin: "0.5rem 0" }}>
                        <input
                          type="checkbox"
                          style={{ marginRight: "0.5rem" }}
                        />
                        Show progress indicator
                      </label>
                      <label style={{ display: "block", margin: "0.5rem 0" }}>
                        <input
                          type="checkbox"
                          style={{ marginRight: "0.5rem" }}
                        />
                        Enable section numbering
                      </label>
                    </div>
                  </div>
                </DrawerPanel>
              </div>
            </div>

            <h4>Complete Pattern Code</h4>
            <pre>
              <code>{`// Complex layout combining all container components
<LayoutContainer>
  <ToolbarContainer>
    <h2>Page Title</h2>
    <div>
      <Button onPress={() => setDrawerOpen(true)}>Settings</Button>
      <Button className="primary">Save</Button>
    </div>
  </ToolbarContainer>

  <LayoutWithPanel>
    <ContentContainer>
      <ExpandableContentSection
        title="Section 1"
        isExpanded={expanded1}
        onToggle={() => setExpanded1(!expanded1)}
      >
        <div>Content...</div>
      </ExpandableContentSection>
    </ContentContainer>

    <SidebarPanel isOpen={sidebarOpen}>
      <div>Sidebar navigation and tools</div>
    </SidebarPanel>
  </LayoutWithPanel>

  <DrawerPanel
    isOpen={drawerOpen}
    onClose={() => setDrawerOpen(false)}
    title="Settings"
  >
    <div>Advanced settings and options</div>
  </DrawerPanel>
</LayoutContainer>`}</code>
            </pre>
          </div>
        </section>

        {/* Example Layout Guidelines */}
        <section id="example-guidelines">
          <h2>Style Guide Example Guidelines</h2>
          <p>
            Guidelines for using different example container classes and heading classes in component documentation.
          </p>

          <div className="component-example">
            <h3 className="sg-section-heading">Styleguide CSS Class Usage</h3>
            <div className="example-demo">
              <p>
                <strong>Important:</strong> Use <code>.sg-preserve</code> on real component headings to prevent
                styleguide CSS conflicts.
              </p>

              <h4 className="sg-sub-heading">Usage Examples</h4>
              <pre>
                <code>{`// Wrong - component heading gets styleguide styling
<Card>
  <h3>Real Component Title</h3>
</Card>

// Correct - component heading keeps natural styling  
<Card>
  <h3 className="sg-preserve">Real Component Title</h3>
</Card>

// Styleguide section headings
<div className="component-example">
  <h3 className="sg-section-heading">Example Section</h3>
</div>`}</code>
              </pre>
            </div>
          </div>

          <div className="component-example">
            <h3 className="sg-section-heading">Example Container Classes</h3>
            <div className="example-demo">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--gray-75)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                      Class
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                      Usage
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid var(--gray-200)" }}>
                      Best For
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      <code>.example-demo</code>
                    </td>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      Default: 400px max-width with padding
                    </td>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      Form components, buttons, small UI elements
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      <code>.example-demo.full-width</code>
                    </td>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      No max-width constraint, keeps padding
                    </td>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      Navigation, cards grid, responsive components
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      <code>.example-demo.full-bleed</code>
                    </td>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      No max-width, no padding (edge-to-edge)
                    </td>
                    <td style={{ padding: "0.75rem", border: "1px solid var(--gray-200)" }}>
                      Layout components, dashboard examples, full-page demos
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4>Usage Examples</h4>
            <pre>
              <code>{`// Default - for form components, buttons
<div className="example-demo">
  <Button>Default Button</Button>
</div>

// Full-width - for navigation, card grids  
<div className="example-demo full-width">
  <PageLinkCard sections={sections} />
</div>

// Full-bleed - for layout components, dashboards
<div className="example-demo full-bleed">
  <LayoutWithPanel>
    <ContentContainer>...</ContentContainer>
    <SidebarPanel>...</SidebarPanel>
  </LayoutWithPanel>
</div>`}</code>
            </pre>

            <h4>When to Use Each Class</h4>
            <ul>
              <li>
                <strong>Default (.example-demo):</strong> Use for components that work well in constrained spaces like
                form inputs, buttons, and small UI elements
              </li>
              <li>
                <strong>Full-width (.full-width):</strong> Use when you need to show responsive behavior or components
                that benefit from more horizontal space, but still want some padding around the example
              </li>
              <li>
                <strong>Full-bleed (.full-bleed):</strong> Use for layout components, page-level examples, or when
                demonstrating how components look in real application contexts
              </li>
            </ul>
          </div>
        </section>

        {/* Implementation Guidelines */}
        <section id="implementation">
          <h2>Implementation Guidelines</h2>

          <div className="guidelines-grid">
            <div className="guideline-item">
              <h3>Container Hierarchy</h3>
              <p>
                Always use LayoutContainer as the outermost wrapper, with ContentContainer for content areas that need
                optimal reading width.
              </p>
            </div>
            <div className="guideline-item">
              <h3>Responsive Design</h3>
              <p>
                Containers automatically adapt to different screen sizes. Test on mobile, tablet, and desktop viewports.
              </p>
            </div>
            <div className="guideline-item">
              <h3>Content Organization</h3>
              <p>
                Use ExpandableContentSection for optional or detailed content that doesn&apos;t need to be immediately
                visible.
              </p>
            </div>
            <div className="guideline-item">
              <h3>Performance</h3>
              <p>Expandable sections help reduce initial page load by allowing progressive disclosure of content.</p>
            </div>
          </div>

          <h3>Layout Component Hierarchy</h3>
          <ol>
            <li>
              <strong>LayoutContainer:</strong> Page-level wrapper and structure
            </li>
            <li>
              <strong>ContentContainer:</strong> Content-focused width and spacing
            </li>
            <li>
              <strong>ExpandableContentSection:</strong> Interactive content organization
            </li>
          </ol>

          <h3>Best Practices</h3>
          <ul>
            <li>
              <strong>Consistent Nesting:</strong> Always nest ContentContainer inside LayoutContainer
            </li>
            <li>
              <strong>Semantic HTML:</strong> Use appropriate HTML elements (main, section, article) within containers
            </li>
            <li>
              <strong>Accessibility:</strong> Ensure proper heading hierarchy and ARIA labels
            </li>
            <li>
              <strong>Performance:</strong> Lazy load content in expandable sections when appropriate
            </li>
          </ul>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
