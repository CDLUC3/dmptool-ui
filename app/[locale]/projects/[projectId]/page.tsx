"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  Popover,
  DialogTrigger,
  Link
} from "react-aria-components";

// GraphQL
import { useQuery } from '@apollo/client/react';
import {
  MeDocument,
  PlanSearchResult,
  PlanSectionProgress,
  ProjectDocument,
  RelatedWorksByProjectStatsDocument,
} from "@/generated/graphql";

// Components
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import OverviewSection from "@/components/OverviewSection";
import PlanCard from "@/components/PlanCard";
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
  // Track whether the project should be in read-only mode based on the "readOnly" field 
  // returned from the backend from ProjectDocument query
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

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

  // Run me query to get user's info to determine if they are a collaborator with edit access
  const { data: me } = useQuery(MeDocument);

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

  // Project collaborators who have 'EDIT' access level will see the "Update" section card button text since they can
  // edit the question
  const isEditCollaborator = useMemo(() => {
    const myId = me?.me?.id;
    if (!myId || !data?.project?.collaborators) return false;

    return data.project.collaborators.some(
      (collaborator) =>
        collaborator?.user?.id === myId &&
        collaborator?.accessLevel === "EDIT"
    );
  }, [me?.me?.id, data?.project?.collaborators]);

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
            answeredRequiredQuestions: section.answeredRequiredQuestions ?? 0,
            totalRequiredQuestions: section.totalRequiredQuestions ?? 0,
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
      setIsReadOnly(data.project.readOnly ?? false);
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
              linkText={isReadOnly ? Global("buttons.view") : ProjectOverview("edit")}
              linkAriaLabel={isReadOnly ? ProjectOverview("viewProject") : ProjectOverview("editProject")}
            >
              <p>
                {project.title}
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
              linkText={isReadOnly ? Global("buttons.view") : ProjectOverview("editFundingDetails")}
              includeLink={!isReadOnly || project.fundings.length > 0}
              linkAriaLabel={isReadOnly ? ProjectOverview("viewFundingDetails") : ProjectOverview("editFundingDetails")}
            >
              {project.fundings.length > 0 ? (
                <>
                  <p>
                    {ProjectOverview("fundingCount", { count: project.fundings.length })}
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
                </>
              ) : (
                <p>{ProjectOverview("noFunderSelected")}</p>
              )}
            </OverviewSection>

            <OverviewSection
              heading={ProjectOverview("projectMembers")}
              headingId="members-title"
              linkHref={routePath("projects.members.index", { projectId })}
              linkText={isReadOnly ? Global("buttons.view") : ProjectOverview("editProjectMembers")}
              linkAriaLabel={isReadOnly ? ProjectOverview("viewProjectMembers") : ProjectOverview("editProjectMembers")}
            >
              <p>
                {ProjectOverview("memberCount", { count: project.projectMembers.length })}
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

            {!isReadOnly && (
              <OverviewSection
                heading={ProjectOverview("relatedWorks.title")}
                headingId="related-works-title"
                linkHref={routePath("projects.related-works.index", { projectId })}
                linkText={isReadOnly ? Global("buttons.view") : ProjectOverview("relatedWorks.edit")}
                linkAriaLabel={isReadOnly ? ProjectOverview("relatedWorks.view") : ProjectOverview("relatedWorks.edit")}
                includeLink={!!rwProjectStats?.hasPublishedPlan}
              >
                {!rwProjectStats?.hasPublishedPlan && <p>{ProjectOverview("relatedWorks.publish")}</p>}
                {rwProjectStats?.hasPublishedPlan && rwProjectStats?.pendingCount != null && <p>{ProjectOverview("relatedWorks.pendingCount", { count: rwProjectStats?.pendingCount })}</p>}
                {rwProjectStats?.hasPublishedPlan && rwProjectStats?.acceptedCount != null && <p>{ProjectOverview("relatedWorks.acceptedCount", { count: rwProjectStats?.acceptedCount })}</p>}
              </OverviewSection>
            )}
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
                {!isReadOnly ? (
                  <Link
                    href={`/projects/${projectId}/dmp/upload`}
                    className="react-aria-Button secondary"
                    aria-label={ProjectOverview("uploadPlan")}
                  >
                    {ProjectOverview("upload")}
                  </Link>
                ) : (
                  <DialogTrigger>
                    <Button
                      className="disabled-button-look"
                      type="button"
                      aria-disabled={true}
                    >
                      {ProjectOverview("upload")}
                    </Button>
                    <Popover placement="bottom" className="popover--inverse">
                      <Dialog aria-label={ProjectOverview("messages.readOnlyLinkMessage")} className="popoverContent">
                        {ProjectOverview("messages.readOnlyLinkMessage")}
                      </Dialog>
                    </Popover>
                  </DialogTrigger>
                )}
                {!isReadOnly ? (
                  <Link
                    href={`/projects/${projectId}/dmp/create`}
                    className="react-aria-Button react-aria-Button--primary"
                    aria-label={ProjectOverview("createNewPlan")}
                  >
                    {ProjectOverview("createNew")}
                  </Link>
                ) : (
                  <DialogTrigger>
                    <Button
                      className="disabled-button-look"
                      type="button"
                      aria-disabled={true}
                    >
                      {ProjectOverview("createNew")}
                    </Button>
                    <Popover placement="bottom" className="popover--inverse">
                      <Dialog aria-label={ProjectOverview("messages.readOnlyLinkMessage")} className="popoverContent">
                        {ProjectOverview("messages.readOnlyLinkMessage")}
                      </Dialog>
                    </Popover>
                  </DialogTrigger>
                )}
              </div>
            </div>
            {project.plans.map((plan) => {
              const planId = plan.id != null ? String(plan.id) : "";
              const sortedSections = sortSections(plan.versionedSections ?? []);
              const canEditSections = !isReadOnly || isEditCollaborator;

              return (
                <PlanCard
                  key={plan.id ?? planId}
                  plan={{
                    // PlanSearchResult has no variant field yet; cast until GraphQL adds it.
                    // Prefer API value when present, otherwise default to template.
                    variant: (plan as { variant?: "template" | "uploaded" }).variant || "template",
                    title: plan.title || plan.templateTitle,
                    funding: plan.funding,
                    dmpId: plan.dmpId,
                    created: plan.created ? formatDate(plan.created) : null,
                    modified: plan.modified ? formatDate(plan.modified) : null,
                    versionedSections: sortedSections.map((section) => {
                      const sectionId = section.versionedSectionId ?? section.customSectionId;
                      return {
                        ...section,
                        href: planId && sectionId != null
                          ? routePath("projects.dmp.versionedSection", {
                            projectId: String(projectId),
                            dmpId: planId,
                            versionedSectionId: Number(sectionId),
                          }, { sectionType: section.sectionType })
                          : undefined,
                      };
                    }),
                    downloadHref: planId
                      ? routePath("projects.dmp.download", {
                        projectId: String(projectId),
                        dmpId: planId,
                      })
                      : undefined,
                    actionHref: planId
                      ? routePath("projects.dmp.show", { projectId, dmpId: planId })
                      : undefined,
                    actionLabel: canEditSections
                      ? ProjectOverview("update")
                      : ProjectOverview("view"),
                  }}
                />
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
                  {isReadOnly ? Global("buttons.view") : ProjectOverview("status.collaboration.link_text")}
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
