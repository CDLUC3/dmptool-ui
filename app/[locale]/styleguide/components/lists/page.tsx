"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { Button } from "react-aria-components";
import { TransitionLink } from "@/components/Form";
import TemplateList from "@/components/TemplateList";
import ProjectListItem from "@/components/ProjectListItem";
import TemplateSelectListItem from "@/components/TemplateSelectListItem";
import SectionHeaderEdit from "@/components/SectionHeaderEdit";
import QuestionEditCard from "@/components/QuestionEditCard";
import AdminSectionEditContainer from "@/components/AdminSectionEditContainer";
import { mockSections as adminMockSections } from "@/components/AdminSectionEditContainer/mockData";
import ProjectMemberListItem from "@/components/ProjectMemberListItem";

import "../../shared/styleguide.scss";
import {
  SGComponentExample,
  SGComponentExampleHeader,
  SGComponentExampleContent,
  SGComponentExampleDemo,
  SGCodeBlock,
  SGTocGrid,
  SGTocSection,
} from "../../shared/components";

export default function ListsDataCardsPage() {
  const Global = useTranslations("Global");
  const ProjectsListPage = useTranslations("ProjectsListPage");
  const OrganizationProjects = useTranslations("OrganizationProjects");

  // State for interactive examples
  const [selectedTemplate, setSelectedTemplate] = React.useState<number | null>(null);
  const [_expandedProject, _setExpandedProject] = React.useState<string | null>(null);

  // Mock data for examples
  const mockTemplates = [
    {
      id: 1,
      title: "NSF Data Management Plan Template",
      description:
        "Comprehensive template for NSF-funded research projects with detailed data management requirements.",
      funder: "National Science Foundation",
      lastRevisedBy: "Dr. Jane Smith",
      lastUpdated: "2024-01-15",
      publishStatus: "Published",
      publishDate: "2024-01-10",
      visibility: "public",
      hasAdditionalGuidance: true,
      defaultExpanded: false,
    },
    {
      id: 2,
      title: "NIH Data Sharing Plan Template",
      description: "Template for NIH-funded research focusing on data sharing and accessibility requirements.",
      funder: "National Institutes of Health",
      lastRevisedBy: "Dr. John Doe",
      lastUpdated: "2024-01-12",
      publishStatus: "Draft",
      visibility: "private",
      hasAdditionalGuidance: false,
      defaultExpanded: false,
    },
    {
      id: 3,
      title: "DOE Energy Research Template",
      description:
        "Specialized template for Department of Energy research projects with energy-specific data requirements.",
      funder: "Department of Energy",
      lastRevisedBy: "Dr. Sarah Johnson",
      lastUpdated: "2024-01-08",
      publishStatus: "Published",
      publishDate: "2024-01-05",
      visibility: "public",
      hasAdditionalGuidance: true,
      defaultExpanded: false,
    },
  ];

  const mockProjects = [
    // Perfect data example - Multiple plans and funders
    {
      title: "Coastal Ocean Processes of North Greenland",
      link: "/projects/coastal-ocean-greenland",
      startDate: "July 1st 2025",
      endDate: "June 30 2028",
      funding: "National Science Foundation (nsf.gov), European Research Council",
      grantId: "252552-255",
      defaultExpanded: false,
      modified: "04-01-2024",
      members: [
        { name: "Dr. Erik Lindström", roles: "Principal Investigator" },
        { name: "Dr. Anna Bergqvist", roles: "Co-Investigator" },
        { name: "Dr. Magnus Carlsson", roles: "Research Associate" },
        { name: "Dr. Astrid Johansson", roles: "Postdoctoral Researcher" },
      ],
      plans: [
        {
          name: "Ocean Processes of Greenland",
          dmpId: "10.4832/DIB57N",
          link: "/projects/coastal-ocean-greenland/plans/1",
        },
        {
          name: "Arctic Marine Data Collection Protocol",
          dmpId: null, // No DMP ID for second plan
          link: "/projects/coastal-ocean-greenland/plans/2",
        },
        {
          name: "Climate Change Impact Assessment",
          dmpId: "10.1038/s41597-024-03456",
          link: "/projects/coastal-ocean-greenland/plans/3",
        },
      ],
    },
    // Single plan, single funder - most common case
    {
      title: "Arctic Marine Ecosystem Dynamics",
      link: "/projects/arctic-marine-ecosystem",
      startDate: "January 15 2025",
      endDate: "December 31 2027",
      funding: "National Science Foundation (nsf.gov)",
      grantId: "NSF-2024-789",
      defaultExpanded: false,
      modified: "15-03-2024",
      members: [
        { name: "Dr. Björn Andersson", roles: "Principal Investigator" },
        { name: "Dr. Ingrid Nilsson", roles: "Co-Investigator" },
      ],
      plans: [
        {
          name: "Marine Ecosystem Data Management Plan",
          dmpId: "10.5194/essd-2024-123",
          link: "/projects/arctic-marine-ecosystem/plans/1",
        },
      ],
    },
    // Multiple funders, single plan
    {
      title: "Nordic Climate Research Initiative",
      link: "/projects/nordic-climate-research",
      startDate: "March 1st 2025",
      endDate: "February 28 2029",
      funding: "Swedish Research Council, Norwegian Research Council, Danish National Research Foundation",
      grantId: "VR-2024-001",
      defaultExpanded: false,
      modified: "22-02-2024",
      members: [
        { name: "Dr. Lars Pettersson", roles: "Principal Investigator" },
        { name: "Dr. Karin Svensson", roles: "Co-Investigator" },
        { name: "Dr. Nils Eriksson", roles: "Co-Investigator" },
        { name: "Dr. Maja Andersson", roles: "Research Associate" },
        { name: "Dr. Olof Gustafsson", roles: "Postdoctoral Researcher" },
        { name: "Dr. Astrid Blomberg", roles: "Research Assistant" },
      ],
      plans: [
        {
          name: "Climate Data Integration Framework",
          dmpId: "10.1002/climate.2024.567",
          link: "/projects/nordic-climate-research/plans/1",
        },
      ],
    },
    // Single plan, no DMP ID, minimal members
    {
      title: "Polar Bear Population Study",
      link: "/projects/polar-bear-study",
      startDate: "June 1st 2025",
      endDate: "May 31 2027",
      funding: "Arctic Council Research Program",
      grantId: null, // No grant ID
      defaultExpanded: false,
      members: [{ name: "Dr. Gunnar Holm", roles: "Principal Investigator" }],
      plans: [
        {
          name: "Wildlife Monitoring Data Plan",
          dmpId: null, // No DMP ID
          link: "/projects/polar-bear-study/plans/1",
        },
      ],
    },
    // Minimal data example - only required fields
    {
      title: "Greenland Ice Sheet Monitoring",
      link: "/projects/greenland-ice-monitoring",
      startDate: "", // No start date
      endDate: "", // No end date
      funding: "", // No funding info
      grantId: null,
      defaultExpanded: false,
      members: [
        { name: "", roles: "" }, // Empty member data
      ],
      plans: [], // No plans
    },
  ];

  const mockSections = [
    {
      title: "Data Collection and Management",
      sectionNumber: 1,
      editUrl: "/template/1/section/1/edit",
    },
    {
      title: "Data Sharing and Access",
      sectionNumber: 2,
      editUrl: "/template/1/section/2/edit",
    },
    {
      title: "Data Preservation and Archiving",
      sectionNumber: 3,
      editUrl: "/template/1/section/3/edit",
    },
  ];

  const mockQuestions = [
    {
      id: "1",
      text: "What types of data will be collected in this research project?",
      link: "/template/1/section/1/question/1/edit",
      name: "data-types",
      displayOrder: 1,
    },
    {
      id: "2",
      text: "How will the data be stored and backed up during the research period?",
      link: "/template/1/section/1/question/2/edit",
      name: "data-storage",
      displayOrder: 2,
    },
    {
      id: "3",
      text: "What file formats will be used for the data, and why were these formats chosen?",
      link: "/template/1/section/1/question/3/edit",
      name: "file-formats",
      displayOrder: 3,
    },
  ];

  const mockProjectMembers = [
    {
      id: 1,
      fullName: "Dr. Erik Lindström",
      affiliation: "University of Gothenburg, Department of Marine Sciences",
      orcid: "0000-0001-2345-6789",
      role: "Principal Investigator",
    },
    {
      id: 2,
      fullName: "Dr. Anna Bergqvist",
      affiliation: "Stockholm University, Department of Environmental Science",
      orcid: "0000-0002-3456-7890",
      role: "Co-Investigator",
    },
    {
      id: 3,
      fullName: "Dr. Magnus Carlsson",
      affiliation: "Uppsala University, Department of Earth Sciences",
      orcid: "0000-0003-4567-8901",
      role: "Research Associate",
    },
    {
      id: 4,
      fullName: "Dr. Astrid Johansson",
      affiliation: "Lund University, Department of Biology",
      orcid: "0000-0004-5678-9012",
      role: "Postdoctoral Researcher",
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
          <span aria-current="page">Lists</span>
        </nav>

        <h1>Lists</h1>
        <p className="lead">
          Specialized list and card components for displaying structured data, managing content hierarchies, and
          organizing dashboard information.
        </p>

        {/* Table of Contents */}
        <section id="table-of-contents">
          <h2>Contents</h2>
          <SGTocGrid>
            <SGTocSection title="List Components">
              <ul>
                <li>
                  <a href="#template-list">Template List</a>
                </li>
                <li>
                  <a href="#project-list-item">Project List Item</a>
                </li>
                <li>
                  <a href="#projects-empty-state">Projects Empty State</a>
                </li>
                <li>
                  <a href="#template-select-list">Template Select List</a>
                </li>
                <li>
                  <a href="#project-members-list">Project Members List</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Management Components">
              <ul>
                <li>
                  <a href="#section-header-edit">Section Header Edit</a>
                </li>
                <li>
                  <a href="#question-edit-card">Question Edit Card</a>
                </li>
                <li>
                  <a href="#admin-section-edit-container">Admin Section Edit Container</a>
                </li>
              </ul>
            </SGTocSection>
            <SGTocSection title="Use Cases">
              <ul>
                <li>
                  <a href="#dashboard-layouts">Dashboard Layouts</a>
                </li>
                <li>
                  <a href="#content-management">Content Management</a>
                </li>
              </ul>
            </SGTocSection>
          </SGTocGrid>
        </section>

        {/* Template List */}
        <section id="template-list">
          <h2>Template List</h2>
          <p>
            Container component for displaying lists of templates with pagination, filtering, and selection
            capabilities.
          </p>

          <SGComponentExample>
            <SGComponentExampleHeader
              title="Template List with Selection"
              description="Interactive template list with selection capabilities and visual feedback"
            />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Available Templates</h4>
                  <TemplateList
                    templates={mockTemplates}
                    onSelect={async (versionedTemplateId) => {
                      setSelectedTemplate(versionedTemplateId);
                      console.log("Selected template:", versionedTemplateId);
                    }}
                  />

                  {selectedTemplate && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.75rem",
                        background: "var(--green-50)",
                        borderRadius: "4px",
                        border: "1px solid var(--green-200)",
                      }}
                    >
                      <strong>Selected Template ID:</strong> {selectedTemplate}
                    </div>
                  )}
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import TemplateList from '@/components/TemplateList';

const templates = [
  {
    id: 1,
    title: "Template Title",
    description: "Template description",
    funder: "Funder Name",
    // ... other properties
  }
];

<TemplateList
  templates={templates}
  onSelect={async (versionedTemplateId) => {
    // Handle template selection
    console.log("Selected:", versionedTemplateId);
  }}
  visibleCountKey="templates"
  visibleCount={{ templates: 3 }}
  handleLoadMore={(key) => {
    // Handle load more functionality
  }}
/>`}</SGCodeBlock>
              <h4>Features</h4>
              <ul>
                <li>
                  <strong>Pagination support:</strong> Built-in load more functionality
                </li>
                <li>
                  <strong>Search integration:</strong> Works with search and filtering
                </li>
                <li>
                  <strong>Selection handling:</strong> Async selection with proper error handling
                </li>
                <li>
                  <strong>Responsive design:</strong> Adapts to different screen sizes
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Project List Item */}
        <section id="project-list-item">
          <h2>Project List Item</h2>
          <p>Expandable list item component for displaying project information with collapsible details.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Project List with Expandable Details" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Active Projects</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {mockProjects.map((project, index) => (
                      <ProjectListItem
                        key={index}
                        item={project}
                      />
                    ))}
                  </div>
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import ProjectListItem from '@/components/ProjectListItem';

// Perfect data example
const perfectProject = {
  title: "Coastal Ocean Processes of North Greenland",
  link: "/projects/coastal-ocean-greenland",
  startDate: "July 1st 2025",
  endDate: "June 30 2028",
  funding: "National Science Foundation (nsf.gov), PD 98-1610 - Physical Oceanography",
  grantId: "252552-255",
  defaultExpanded: false,
  members: [
    { name: "Dr. Erik Lindström", roles: "Principal Investigator" },
    { name: "Dr. Anna Bergqvist", roles: "Co-Investigator" },
    { name: "Dr. Magnus Carlsson", roles: "Research Associate" },
    { name: "Dr. Astrid Johansson", roles: "Postdoctoral Researcher" }
  ]
};

// Partial data example
const partialProject = {
  title: "Arctic Marine Ecosystem Dynamics",
  link: "/projects/arctic-marine-ecosystem",
  startDate: "January 15 2025",
  endDate: "December 31 2027",
  funding: "National Science Foundation (nsf.gov)",
  grantId: null, // Missing grant ID
  defaultExpanded: false,
  members: [
    { name: "Dr. Björn Andersson", roles: "Principal Investigator" },
    { name: "Dr. Ingrid Nilsson", roles: "Co-Investigator" }
  ]
};

<ProjectListItem item={perfectProject} />
<ProjectListItem item={partialProject} />`}</SGCodeBlock>

              <h4>Features</h4>
              <ul>
                <li>
                  <strong>Expandable content:</strong> Click to show/hide project details
                </li>
                <li>
                  <strong>Rich metadata:</strong> Dates, funding, collaborators, and grant information
                </li>
                <li>
                  <strong>Navigation links:</strong> Direct links to project pages
                </li>
                <li>
                  <strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Projects empty state */}
        <section id="projects-empty-state">
          <h2>Projects Empty State</h2>
          <p>
            Shown on the Plan Dashboard and Organization Projects list when the user has no projects. Uses global{" "}
            <code>.empty-state</code> styles from <code>styles/_elements.scss</code>. Search with no matches uses a
            separate plain message instead.
          </p>

          <SGComponentExample>
            <SGComponentExampleHeader
              title="Plan Dashboard (no projects)"
              description="Used on /projects when totalCount is zero. Demo button uses a page anchor; production links to projects.create."
            />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div className="template-list">
                  <div className="empty-state" role="status">
                    <h2 className="empty-state-heading">
                      {ProjectsListPage("messages.info.noProjectsHeading")}
                    </h2>
                    <p className="empty-state-description">
                      {ProjectsListPage("messages.info.noProjectsDescription")}
                    </p>
                    <TransitionLink
                      href="#projects-empty-state"
                      className="button-link button--primary"
                    >
                      {Global("buttons.createNewPlan")}
                    </TransitionLink>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>

          <SGComponentExample>
            <SGComponentExampleHeader
              title="Organization Projects (no projects)"
              description="Used on /admin/projects when totalCount is zero"
            />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div className="template-list">
                  <div className="empty-state" role="status">
                    <h2 className="empty-state-heading">
                      {OrganizationProjects("messages.info.noProjectsHeading")}
                    </h2>
                    <p className="empty-state-description">
                      {OrganizationProjects("messages.info.noProjectsDescription")}
                    </p>
                    <TransitionLink
                      href="#projects-empty-state"
                      className="button-link button--primary"
                    >
                      {Global("buttons.createNewPlan")}
                    </TransitionLink>
                  </div>
                </div>
              </SGComponentExampleDemo>
            </SGComponentExampleContent>
          </SGComponentExample>

          <SGComponentExample>
            <SGComponentExampleHeader
              title="Search with no results"
              description="Plain message when a search returns nothing (not the empty-state block)"
            />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div className="template-list" role="list">
                  <p>{Global("messaging.noItemsFound")}</p>
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`// Empty dashboard — app/[locale]/projects/page.tsx
<div className="empty-state" role="status">
  <h2 className="empty-state-heading">
    {Project('messages.info.noProjectsHeading')}
  </h2>
  <p className="empty-state-description">
    {Project('messages.info.noProjectsDescription')}
  </p>
  <TransitionLink
    href={routePath('projects.create')}
    className="button-link button--primary"
  >
    {Global('buttons.createNewPlan')}
  </TransitionLink>
</div>

// Search miss — same page, different branch
<p>{Global('messaging.noItemsFound')}</p>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Template Select List */}
        <section id="template-select-list">
          <h2>Template Select List Item</h2>
          <p>Individual template item component with selection capabilities and rich metadata display.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Template Selection Items" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Template Selection</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {mockTemplates.map((template, index) => (
                      <TemplateSelectListItem
                        key={index}
                        item={template}
                        onSelect={async (versionedTemplateId) => {
                          setSelectedTemplate(versionedTemplateId);
                          console.log("Selected template:", versionedTemplateId);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import TemplateSelectListItem from '@/components/TemplateSelectListItem';

const template = {
  id: 1,
  title: "Template Title",
  description: "Template description",
  funder: "Funder Name",
  lastRevisedBy: "Dr. Jane Smith",
  lastUpdated: "2024-01-15",
  publishStatus: "Published",
  visibility: "public",
  hasAdditionalGuidance: true
};

<TemplateSelectListItem
  item={template}
  onSelect={async (versionedTemplateId) => {
    // Handle selection
  }}
/>`}</SGCodeBlock>

              <h4>Features</h4>
              <ul>
                <li>
                  <strong>Rich metadata:</strong> Funder, revision info, publish status, visibility
                </li>
                <li>
                  <strong>Guidance indicators:</strong> Visual indicators for additional guidance
                </li>
                <li>
                  <strong>Selection states:</strong> Clear selection and action buttons
                </li>
                <li>
                  <strong>Status display:</strong> Publication status and visibility information
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Project Members List */}
        <section id="project-members-list">
          <h2>Project Members List</h2>
          <p>List component for displaying project team members with their roles, affiliations, and ORCID profiles.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Project Members List" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Project Team Members</h4>
                  <section
                    aria-label="Project members list"
                    role="region"
                  >
                    <div
                      role="list"
                      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                    >
                      {mockProjectMembers.map((member) => (
                        <ProjectMemberListItem
                          key={member.id}
                          member={member}
                          onEdit={(memberId) => console.log(`Edit member ${memberId}`)}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import ProjectMemberListItem from '@/components/ProjectMemberListItem';

// Project members data structure
const projectMembers = [
  {
    id: 1,
    fullName: "Dr. Erik Lindström",
    affiliation: "University of Gothenburg, Department of Marine Sciences",
    orcid: "0000-0001-2345-6789",
    role: "Principal Investigator",
  },
  // ... more members
];

// Component usage
<section aria-label="Project members list" role="region">
  <div role="list" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
    {projectMembers.map((member) => (
      <ProjectMemberListItem
        key={member.id}
        member={member}
        onEdit={(memberId) => handleEdit(memberId)}
      />
    ))}
  </div>
</section>`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Section Header Edit */}
        <section id="section-header-edit">
          <h2>Section Header Edit</h2>
          <p>Editable section header component with reordering capabilities for template management.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Section Management Interface" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Template Sections</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {mockSections.map((section, index) => (
                      <SectionHeaderEdit
                        key={index}
                        title={section.title}
                        sectionNumber={section.sectionNumber}
                        editUrl={section.editUrl}
                        onMoveUp={index > 0 ? () => console.log("Move up") : undefined}
                        onMoveDown={index < mockSections.length - 1 ? () => console.log("Move down") : undefined}
                      />
                    ))}
                  </div>
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import SectionHeaderEdit from '@/components/SectionHeaderEdit';

<SectionHeaderEdit
  title="Data Collection and Management"
  sectionNumber={1}
  editUrl="/template/1/section/1/edit"
  onMoveUp={() => {
    // Handle move up
  }}
  onMoveDown={() => {
    // Handle move down
  }}
/>`}</SGCodeBlock>

              <h4>Features</h4>
              <ul>
                <li>
                  <strong>Section numbering:</strong> Automatic section numbering display
                </li>
                <li>
                  <strong>Edit links:</strong> Direct links to section editing pages
                </li>
                <li>
                  <strong>Reordering controls:</strong> Move up/down buttons with proper state management
                </li>
                <li>
                  <strong>Accessibility:</strong> Proper ARIA labels for reordering actions
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Question Edit Card */}
        <section id="question-edit-card">
          <h2>Question Edit Card</h2>
          <p>Editable question card component with reordering capabilities for template question management.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Question Management Interface" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Section Questions</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {mockQuestions.map((question, _index) => (
                      <QuestionEditCard
                        key={question.id}
                        id={question.id}
                        text={question.text}
                        link={question.link}
                        name={question.name}
                        displayOrder={question.displayOrder}
                        handleDisplayOrderChange={(questionId, newOrder) => {
                          console.log("Change order:", questionId, newOrder);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import QuestionEditCard from '@/components/QuestionEditCard';

<QuestionEditCard
  id="1"
  text="What types of data will be collected?"
  link="/template/1/section/1/question/1/edit"
  name="data-types"
  displayOrder={1}
  handleDisplayOrderChange={(questionId, newOrder) => {
    // Handle order change
  }}
/>`}</SGCodeBlock>

              <h4>Features</h4>
              <ul>
                <li>
                  <strong>Question display:</strong> Clean display of question text with HTML stripping
                </li>
                <li>
                  <strong>Edit links:</strong> Direct links to question editing pages
                </li>
                <li>
                  <strong>Reordering controls:</strong> Move up/down buttons for question ordering
                </li>
                <li>
                  <strong>Accessibility:</strong> Proper ARIA labels and keyboard navigation
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Admin Section Edit Container */}
        <section id="admin-section-edit-container">
          <h2>Admin Section Edit Container</h2>
          <p>
            Complete section management component with nested questions for admin template customization interfaces.
          </p>

          <SGComponentExample>
            <SGComponentExampleHeader
              title="Admin Template Customization Interface"
              description="Full section and question management with reordering capabilities and mock data"
            />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <h4 style={{ margin: "0 0 1rem 0" }}>Template Customization</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {adminMockSections.map((section) => (
                      <AdminSectionEditContainer
                        key={section.id}
                        section={section}
                        templateId="1"
                        setErrorMessages={() => {}}
                        onMoveUp={
                          section.sectionNumber > 1 ? () => console.log(`Move section ${section.id} up`) : undefined
                        }
                        onMoveDown={
                          section.sectionNumber < adminMockSections.length
                            ? () => console.log(`Move section ${section.id} down`)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              </SGComponentExampleDemo>

              <h4>Usage</h4>
              <SGCodeBlock>{`import AdminSectionEditContainer from '@/components/AdminSectionEditContainer';
import { mockSections } from '@/components/AdminSectionEditContainer/mockData';

const [errorMessages, setErrorMessages] = useState<string[]>([]);

// Mock section move handlers
const handleSectionMove = (sectionId: number, newDisplayOrder: number) => {
  console.log(\`Moving section \${sectionId} to position \${newDisplayOrder}\`);
};

{mockSections.map((section) => (
  <AdminSectionEditContainer
    key={section.id}
    section={section}
    templateId="1"
    setErrorMessages={setErrorMessages}
    onMoveUp={
      section.sectionNumber > 1
        ? () => handleSectionMove(section.id, section.sectionNumber - 1)
        : undefined
    }
    onMoveDown={
      section.sectionNumber < mockSections.length
        ? () => handleSectionMove(section.id, section.sectionNumber + 1)
        : undefined
    }
  />
))}`}</SGCodeBlock>

              <h4>Features</h4>
              <ul>
                <li>
                  <strong>Complete section management:</strong> Section headers with nested questions
                </li>
                <li>
                  <strong>Mock data support:</strong> Uses static mock data instead of GraphQL
                </li>
                <li>
                  <strong>Question reordering:</strong> Move questions up/down within sections
                </li>
                <li>
                  <strong>Section reordering:</strong> Move entire sections up/down
                </li>
                <li>
                  <strong>Optimistic updates:</strong> Immediate UI feedback with error handling
                </li>
                <li>
                  <strong>Accessibility:</strong> Full ARIA support and screen reader announcements
                </li>
                <li>
                  <strong>Error handling:</strong> Toast notifications and error state management
                </li>
              </ul>

              <h4>Mock Data Structure</h4>
              <SGCodeBlock>{`interface MockSection {
  id: number;
  title: string;
  sectionNumber: number;
  editUrl: string;
  questions: MockQuestion[];
}

interface MockQuestion {
  id: string;
  text: string;
  link: string;
  name: string;
  displayOrder: number;
}

const mockSections: MockSection[] = [
  {
    id: 1,
    title: "Data Collection and Management",
    sectionNumber: 1,
    editUrl: "/template/1/section/1/edit",
    questions: [
      {
        id: "1",
        text: "What types of data will be collected?",
        link: "/template/1/section/1/question/1/edit",
        name: "data-types",
        displayOrder: 1,
      },
      // ... more questions
    ],
  },
  // ... more sections
];`}</SGCodeBlock>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Dashboard Layouts */}
        <section id="dashboard-layouts">
          <h2>Dashboard Layouts</h2>
          <p>Common patterns for organizing lists and data cards in dashboard interfaces.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Template Dashboard Layout" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <h4 style={{ margin: 0 }}>Template Management</h4>
                    <Button className="primary">Create New Template</Button>
                  </div>

                  <TemplateList
                    templates={mockTemplates}
                    onSelect={async (versionedTemplateId) => {
                      setSelectedTemplate(versionedTemplateId);
                    }}
                  />
                </div>
              </SGComponentExampleDemo>

              <h4>Dashboard Layout Patterns</h4>
              <ul>
                <li>
                  <strong>Header with actions:</strong> Page title with primary action buttons
                </li>
                <li>
                  <strong>Filtered lists:</strong> Search and filter capabilities for large datasets
                </li>
                <li>
                  <strong>Pagination:</strong> Load more functionality for performance
                </li>
                <li>
                  <strong>Status indicators:</strong> Visual status and metadata display
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>

        {/* Content Management */}
        <section id="content-management">
          <h2>Content Management</h2>
          <p>Specialized interfaces for managing template content, sections, and questions.</p>

          <SGComponentExample>
            <SGComponentExampleHeader title="Template Content Management" />
            <SGComponentExampleContent>
              <SGComponentExampleDemo>
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <h4 style={{ margin: 0 }}>Template Structure</h4>
                    <Button className="primary">Add Section</Button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {mockSections.map((section, sectionIndex) => (
                      <div
                        key={sectionIndex}
                        style={{ border: "1px solid var(--gray-200)", borderRadius: "4px", padding: "1rem" }}
                      >
                        <SectionHeaderEdit
                          title={section.title}
                          sectionNumber={section.sectionNumber}
                          editUrl={section.editUrl}
                          onMoveUp={sectionIndex > 0 ? () => console.log("Move up") : undefined}
                          onMoveDown={
                            sectionIndex < mockSections.length - 1 ? () => console.log("Move down") : undefined
                          }
                        />

                        <div style={{ marginTop: "1rem", paddingLeft: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <h5 style={{ margin: 0, fontSize: "0.875rem", color: "var(--gray-600)" }}>Questions</h5>
                            <Button className="secondary small">Add Question</Button>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {mockQuestions.slice(0, 2).map((question, _questionIndex) => (
                              <QuestionEditCard
                                key={question.id}
                                id={question.id}
                                text={question.text}
                                link={question.link}
                                name={question.name}
                                displayOrder={question.displayOrder}
                                handleDisplayOrderChange={(questionId, newOrder) => {
                                  console.log("Change order:", questionId, newOrder);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SGComponentExampleDemo>

              <h4>Content Management Features</h4>
              <ul>
                <li>
                  <strong>Hierarchical organization:</strong> Sections containing questions with proper nesting
                </li>
                <li>
                  <strong>Drag and drop:</strong> Visual reordering of sections and questions
                </li>
                <li>
                  <strong>Bulk operations:</strong> Select multiple items for batch operations
                </li>
                <li>
                  <strong>Preview modes:</strong> Switch between edit and preview modes
                </li>
              </ul>
            </SGComponentExampleContent>
          </SGComponentExample>
        </section>
      </ContentContainer>
    </LayoutContainer>
  );
}
