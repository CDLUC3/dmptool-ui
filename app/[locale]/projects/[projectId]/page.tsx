"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { Breadcrumb, Breadcrumbs, Link } from "react-aria-components";

// GraphQL
import { useQuery } from '@apollo/client/react';
import {
  PlanSearchResult,
  PlanSectionProgress,
  ProjectDocument,
  RelatedWorksByProjectStatsDocument,
} from "@/generated/graphql";

// Components
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/Card/card";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import OverviewSection from "@/components/OverviewSection";
import { TransitionLink } from "@/components/Form";
import Loading from "@/components/Loading";

// Utils and other
import { routePath } from "@/utils/routes";

interface FundingInterface {
  name: string;
  shortName: string;
  id: number;
  grantId: string;
}

interface ProjectMemberInterface {
  fullname: string;
  role: string[];
  email: string;
}

interface ProjectOverviewInterface {
  title: string;
  startDate: string | null;
  endDate: string | null;
  fundings: FundingInterface[];
  projectMembers: ProjectMemberInterface[];
  plans: PlanSearchResult[];
  dmpId?: string;
  modified?: string;
}

const ProjectOverviewPage: React.FC = () => {
  // Get projectId param
  const params = useParams();
  const projectId = String(params.projectId); // From route /projects/:projectId
  const router = useRouter();
  const formatter = useFormatter();
  const [project, setProject] = useState<ProjectOverviewInterface>({
    title: "",
    startDate: null,
    endDate: null,
    fundings: [],
    plans: [],
    projectMembers: [],
  });

  // Localization keys
  const ProjectOverview = useTranslations("ProjectOverview");
  const Global = useTranslations("Global");

  //const FEEDBACK_URL = routePath('projects.dmp.feedback', { projectId });
  const COLLABORATION_URL = routePath("projects.collaboration", { projectId });

  // Get Project using projectId
  const { data, loading, error } = useQuery(ProjectDocument, {
    variables: { projectId: Number(projectId) },
    notifyOnNetworkStatusChange: true,
  });

  // Format date using next-intl date formatter
  const formatDate = (date: string) => {
    let dateObj: Date;

    // Check if date is a timestamp (numeric string) or ISO string
    if (/^\d+$/.test(date)) {
      // It's a timestamp, convert to number
      dateObj = new Date(Number(date));
    } else {
      // It's likely an ISO string or other format
      dateObj = new Date(date);
    }

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return date; // Return original if invalid
    }

    const formattedDate = formatter.dateTime(dateObj, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // Replace slashes with hyphens
    return formattedDate.replace(/\//g, "-");
  };

  const sortSections = (sections: PlanSectionProgress[]) => {
    // Create a new array with the spread operator before sorting
    return [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
  };

  // Query data
  const {
    data: relatedWorksByProjectStats,
  } = useQuery(RelatedWorksByProjectStatsDocument, {
    variables: {
      projectId: Number(projectId),
    },
  });
  const rwProjectStats = relatedWorksByProjectStats?.relatedWorksByProjectStats;

  useEffect(() => {
    // When data from backend changes, set project data in state
    if (data && data.project) {
      setProject({
        title: data.project.title ?? "",
        startDate: data.project?.startDate ? data.project.startDate : "",
        endDate: data.project?.endDate ? data.project.endDate : "",
        plans: data.project?.plans?.map(plan => ({
          ...plan,
          versionedSections: plan.versionedSections?.map(section => ({
            ...section,
            // add sectionType if missing
            sectionType: section.sectionType ?? "BASE",
          }))
        })) ?? [],
        fundings:
          data.project.fundings
            ?.filter((funding) => funding !== null) // Filter out null
            .map((funding) => ({
              id: Number(funding.id),
              name: funding.affiliation?.displayName ?? "",
              shortName: funding.affiliation?.name ?? "",
              grantId: funding.grantId ?? "",
            })) ?? [], // Provide a default empty array
        projectMembers:
          data.project.members
            ?.filter((member) => member !== null) // Filter out null
            .map((member) => ({
              fullname: `${member.givenName} ${member.surName}`,
              email: member.email ?? "",
              role: (member.memberRoles ?? []).map((role) => role.label),
            })) ?? [], // Provide a default empty array
      });
    }
  }, [data]);

  if (loading) {
    return <Loading variant="page" message={Global("messaging.loading")} />;
  }

  if (error) {
    if (error.message.toLowerCase() === "forbidden") {
      router.push("/not-found");
    } else {
      return <div>{error.message}</div>;
    }
  }

  return (
    <>
      <PageHeader
        title={ProjectOverview("pageTitle")}
        description={ProjectOverview("pageDescription")}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs aria-label={ProjectOverview("navigation")}>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{ProjectOverview("home")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.index")}>{ProjectOverview("projects")}</Link>
            </Breadcrumb>
            <Breadcrumb>{Global("breadcrumbs.projectOverview")}</Breadcrumb>
          </Breadcrumbs>
        }
        actions={null}
        className="page-project-list"
      />
      <LayoutWithPanel>
        <ContentContainer>
          <div className="project-overview">
            <OverviewSection
              heading={ProjectOverview("project")}
              headingId="project-title"
              linkHref={routePath("projects.project.info", { projectId }, { fromOverview: 'true' })}
              linkText={ProjectOverview("edit")}
              linkAriaLabel={ProjectOverview("editProject")}
            >
              <p>
                <strong>{project.title}</strong>
              </p>
              {project.startDate && project.endDate && (
                <p>
                  {ProjectOverview("dateRange", {
                    startDate: formatDate(project.startDate),
                    endDate: formatDate(project.endDate),
                  })}
                </p>
              )}
            </OverviewSection>

            <OverviewSection
              heading={ProjectOverview("fundings")}
              headingId="fundings-title"
              linkHref={routePath("projects.fundings.index", { projectId })}
              linkText={ProjectOverview("editFundingDetails")}
              linkAriaLabel={ProjectOverview("editFundings")}
            >
              <p>
                <strong>{ProjectOverview("fundingCount", { count: project.fundings.length })}</strong>
              </p>
              <p>
                {project.fundings.map((funding, index) => (
                  <span
                    key={funding.id}
                    data-index={index}
                  >
                    {funding.grantId
                      ? ProjectOverview("fundingInfo", {
                        name: funding.name,
                        id: funding.grantId,
                      })
                      : funding.name}
                    {index < project.fundings.length - 1 && ", "}
                  </span>
                ))}
              </p>
            </OverviewSection>

            <OverviewSection
              heading={ProjectOverview("projectMembers")}
              headingId="members-title"
              linkHref={routePath("projects.members.index", { projectId })}
              linkText={ProjectOverview("editProjectMembers")}
              linkAriaLabel={ProjectOverview("editMembers")}
            >
              <p>
                <strong>{ProjectOverview("memberCount", { count: project.projectMembers.length })}</strong>
              </p>
              <p>
                {project.projectMembers.map((member, index) => (
                  <span key={index}>
                    {ProjectOverview("memberInfo", {
                      name: member.fullname,
                      role: member.role.join(", "),
                    })}
                    {index < project.projectMembers.length - 1 ? "; " : ""}
                  </span>
                ))}
              </p>
            </OverviewSection>

            <OverviewSection
              heading={ProjectOverview("relatedWorks.title")}
              headingId="related-works-title"
              linkHref={routePath("projects.related-works.index", { projectId })}
              linkText={ProjectOverview("relatedWorks.edit")}
              linkAriaLabel={ProjectOverview("relatedWorks.edit")}
              includeLink={!!rwProjectStats?.hasPublishedPlan}
            >
              {!rwProjectStats?.hasPublishedPlan && <p>{ProjectOverview("relatedWorks.publish")}</p>}
              {rwProjectStats?.hasPublishedPlan && rwProjectStats?.pendingCount != null && <p>{ProjectOverview("relatedWorks.pendingCount", { count: rwProjectStats?.pendingCount })}</p>}
              {rwProjectStats?.hasPublishedPlan && rwProjectStats?.acceptedCount != null && <p>{ProjectOverview("relatedWorks.acceptedCount", { count: rwProjectStats?.acceptedCount })}</p>}
            </OverviewSection>
          </div>

          <section
            className="plans"
            aria-labelledby="plans-title"
          >
            <div className="plans-header plans-header-with-actions">
              <div className="">
                <h2 id="plans-title">{ProjectOverview("plans")}</h2>
              </div>
              <div
                className="actions"
                role="group"
                aria-label={ProjectOverview("planActions")}
              >
                <Link
                  href={`/projects/${projectId}/dmp/upload`}
                  className="react-aria-Button react-aria-Button--secondary"
                  aria-label={ProjectOverview("uploadPlan")}
                >
                  {ProjectOverview("upload")}
                </Link>
                <Link
                  href={`/projects/${projectId}/dmp/create`}
                  className="react-aria-Button react-aria-Button--primary"
                  aria-label={ProjectOverview("createNewPlan")}
                >
                  {ProjectOverview("createNew")}
                </Link>
              </div>
            </div>
            {/** Plans */}
            {project.plans.map((plan) => {
              // Use the plan ID for routing, not the DOI extraction
              const planId = plan?.id?.toString() || "";
              const modifiedDate = formatDate(plan?.modified ?? "");
              const createdDate = formatDate(plan?.created ?? "");
              const sortedSections = sortSections(plan.versionedSections ?? []);
              return (
                <Card
                  className="plan-item"
                  key={plan.id}
                >
                  <p className="mb-1">
                    {ProjectOverview("funding")}: {plan.funding}
                  </p>
                  <h3 className="mt-0">{plan.templateTitle}</h3>
                  <div className="plan-sections mb-4">
                    <h4 className="plan-section-heading">{ProjectOverview("sections")}</h4>
                    <ul
                      className="plan-sections-list"
                      aria-label={ProjectOverview("planSections")}
                    >
                      {sortedSections.map((section, idx) => {
                        const sectionId = section.versionedSectionId ?? section.customSectionId;
                        return (
                          <li
                            key={sectionId ?? `section-${idx}`}
                            className="plan-sections-list-item"
                          >
                            {sectionId != null ? (
                              <Link
                                href={routePath("projects.dmp.versionedSection", {
                                  projectId: String(projectId),
                                  dmpId: planId,
                                  versionedSectionId: Number(sectionId),
                                }, { sectionType: section.sectionType })}
                                className="text-link"
                              >
                                {section.title}
                              </Link>
                            ) : (
                              <span>{section.title}</span>
                            )}
                            <span className="plan-sections-list-item-progress">
                              {ProjectOverview("progress", {
                                current: section.answeredQuestions,
                                total: section.totalQuestions,
                              })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="plan-meta">
                    <p>
                      {ProjectOverview("doi")}: {plan.dmpId} <br />
                      {ProjectOverview("lastUpdated")}: {modifiedDate}
                      <br />
                      {ProjectOverview("created")}: {createdDate}
                    </p>
                  </div>
                  <div className="plan-footer">
                    <div className="plan-links">
                      <Link
                        href={routePath("projects.dmp.download", {
                          projectId: String(projectId),
                          dmpId: planId,
                        })}
                        className="text-link"
                        aria-label={ProjectOverview("downloadPlan")}
                      >
                        {ProjectOverview("download")}
                      </Link>
                    </div>
                    <div className="plan-action">
                      <TransitionLink
                        href={routePath("projects.dmp.show", { projectId, dmpId: String(plan.id) })}
                        className="react-aria-Button react-aria-Button--primary"
                        aria-label={ProjectOverview("updatePlan")}
                      >
                        {ProjectOverview("update")}
                      </TransitionLink>
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        </ContentContainer>

        <SidebarPanel>
          <div className="side-panel status-panel-content">
            <div className={"side-panel-content"}>
              <div className={`panelRow mb-5`}>
                <div>
                  <h3>{ProjectOverview("status.collaboration.title")}</h3>
                  <p>
                    {ProjectOverview("status.collaboration.description", {
                      total: project.projectMembers.length ?? 0,
                    })}
                  </p>
                </div>
                <Link
                  className="side-panel-link"
                  href={COLLABORATION_URL}
                  aria-label={Global("links.request")}
                >
                  {ProjectOverview("status.collaboration.link_text")}
                </Link>
              </div>
            </div>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default ProjectOverviewPage;
