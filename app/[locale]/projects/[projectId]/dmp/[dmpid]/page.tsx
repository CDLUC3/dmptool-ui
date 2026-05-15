"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
// next/link is faster for basic links
import NextLink from "next/link";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Dialog,
  Form,
  Heading,
  Link,
  ListBoxItem,
  Modal,
  Radio,
  Text,
  DialogTrigger,
  Popover
} from "react-aria-components";

// GraphQL
import { useQuery, useMutation } from '@apollo/client/react';
import {
  CompleteFeedbackDocument,
  MeDocument,
  PlanSectionProgress,
  PlanStatus,
  PlanVisibility,
  PlanDocument,
  PlanFeedbackStatusDocument,
  RelatedWorksByPlanStatsDocument,
  UserRole,
} from "@/generated/graphql";
import {
  publishPlanAction,
  updatePlanStatusAction,
  updatePlanTitleAction
} from "./actions";

//Components
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import { DmpIcon } from "@/components/Icons";
import { FormSelect, RadioGroupComponent, TransitionLink } from "@/components/Form";
import PageHeaderWithTitleChange from "@/components/PageHeaderWithTitleChange";
import OverviewSection from "@/components/OverviewSection";
import NotificationHeader from "@/components/Notification";

// Utils and other
import { routePath } from "@/utils/routes";
import { toTitleCase } from "@/utils/general";
import { extractErrors } from "@/utils/errorHandler";
import { useToast } from "@/context/ToastContext";
import {
  PlanMember,
  PlanOverviewInterface,
} from "@/app/types";
import { DOI_REGEX } from "@/lib/constants";
import styles from "./PlanOverviewPage.module.scss";
import { logECS } from "@/utils/index";

const PUBLISHED = "Published";
const UNPUBLISHED = "Unpublished";

// Status options for dropdown
const planStatusOptions = Object.entries(PlanStatus).map(([name, id]) => ({
  id,
  name,
}));

type UpdateTitleErrors = {
  general?: string;
  title?: string;
};

type UpdateStatusErrors = {
  general?: string;
  status?: string;
};

type PublishPlanErrors = {
  general?: string;
  visibility?: string;
  status?: string;
};



// Extract the dmpId from the DOI URL - moved outside component to prevent recreation
function extractDOI(value: string): string {
  if (!value) return "";
  // decode percent-encoding if someone passed a URL-encoded DOI
  const decoded = decodeURIComponent(value.trim());
  const match = DOI_REGEX.exec(decoded);
  return match ? match[1] : "";
}

// Construct the narrative URL based on environment - moved outside component to prevent recreation
// When running narrative generator locally, it uses port 3030, so we need a separate domain for that
const getNarrativeUrl = (dmpId: string): string => {
  let narrativeUrl = "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const localBaseUrl = process.env.NEXT_PUBLIC_NARRATIVE_ENDPOINT || "http://localhost:3030";
  const isLocalhost = baseUrl?.includes("localhost");

  narrativeUrl = isLocalhost ? localBaseUrl || "" : baseUrl || "";

  return `${narrativeUrl}/dmps/${dmpId}/narrative.html?includeCoverSheet=false&includeResearchOutputs=false&includeRelatedWorks=false`;
};

// Format date utility - moved outside component to prevent recreation
const formatPublishDate = (date: string | null, formatter: ReturnType<typeof useFormatter>): string | null => {
  if (!date) return null;

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

const PlanOverviewPage: React.FC = () => {
  const formatter = useFormatter();
  // State hooks
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [planVisibility, setPlanVisibility] = useState<PlanVisibility>(PlanVisibility.Private);
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [step, setStep] = useState(1);
  const [isEditingPlanStatus, setIsEditingPlanStatus] = useState(false);
  // Track whether the question should be read-only based on plan status and user role
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isFeedbackRequested, setIsFeedbackRequested] = useState<boolean>(false);
  const [planData, setPlanData] = useState<PlanOverviewInterface>({
    id: null,
    dmpId: "",
    registered: "",
    title: "",
    status: "",
    funderName: "",
    primaryContact: "",
    members: [] as PlanMember[],
    versionedSections: [] as PlanSectionProgress[],
    affiliationName: "",
    sourceTemplate: "",
    templateVersion: "",
    templatePublished: "",
    percentageAnswered: 0,
  });

  // Get projectId and planId params
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId);
  const dmpId = String(params.dmpid);
  const planId = Number(dmpId);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const toastState = useToast();

  // Localization keys
  const t = useTranslations("PlanOverview");
  const Global = useTranslations("Global");

  // Get Plan using planId
  const {
    data,
    loading,
    error: queryError,
    refetch,
  } = useQuery(PlanDocument, {
    variables: { planId: Number(planId) },
    skip: isNaN(planId), // prevents the query from running when id is not a number
    notifyOnNetworkStatusChange: true,
  });

  // Query data
  const {
    data: relatedWorksByPlanStats,
    refetch: relatedWorksByProjectStatsRefetch,
  } = useQuery(RelatedWorksByPlanStatsDocument, {
    variables: {
      planId,
    },
  });
  const rwPlanStats = relatedWorksByPlanStats?.relatedWorksByPlanStats;

  const {
    data: feedbackData,
    loading: feedbackLoading,
    error: feedbackError,
    refetch: refetchFeedbackStatus
  } = useQuery(PlanFeedbackStatusDocument, {
    variables: { planId: Number(planId) },
    skip: isNaN(planId),
  });

  // Run me query to get user's name
  const { data: me } = useQuery(MeDocument);

  console.log("***ME Data", me);
  // Initialize completed feedbackmutation
  const [completeFeedbackMutation, { error: completeFeedbackError }] = useMutation(CompleteFeedbackDocument);

  // Check for returned GraphQL errors from feedback queries and mutations, and set error messages in state to be displayed in UI 
  useEffect(() => {
    const newErrors: string[] = [];
    if (feedbackError) newErrors.push(feedbackError.message);
    if (completeFeedbackError) newErrors.push(completeFeedbackError.message);
    if (newErrors.length > 0) {
      setErrorMessages(prev => [...prev, ...newErrors]);
    }
  }, [feedbackError, completeFeedbackError]);

  // Memoize URLs to prevent unnecessary recalculations
  const urls = useMemo(() => ({
    FUNDINGS_URL: routePath("projects.dmp.fundings", { projectId, dmpId: planId }),
    MEMBERS_URL: routePath("projects.dmp.members", { projectId, dmpId: planId }),
    DOWNLOAD_URL: routePath("projects.dmp.download", { projectId, dmpId: planId }),
    FEEDBACK_URL: routePath("projects.dmp.feedback", { projectId, dmpId: planId }),
    CHANGE_PRIMARY_CONTACT_URL: routePath("projects.dmp.members", { projectId, dmpId: planId }),
    RELATED_WORKS_URL: routePath("projects.dmp.related-works", { projectId, dmpId: planId }),
  }), [projectId, planId]);

  const isPrimaryCollaborator = useMemo(() => {
    const myId = me?.me?.id;
    if (!myId || !data?.plan?.project?.collaborators) return false;

    return data.plan.project.collaborators.some(
      (collaborator) =>
        collaborator?.user?.id === myId &&
        collaborator?.accessLevel === "PRIMARY"
    );
  }, [me?.me?.id, data?.plan?.project?.collaborators]);

  // Project collaborators who have 'EDIT' access level will see the "Update" section card button text since they can
  // edit the question
  const isEditCollaborator = useMemo(() => {
    const myId = me?.me?.id;
    if (!myId || !data?.plan?.project?.collaborators) return false;

    return data.plan.project.collaborators.some(
      (collaborator) =>
        collaborator?.user?.id === myId &&
        collaborator?.accessLevel === "EDIT"
    );
  }, [me?.me?.id, data?.plan?.project?.collaborators]);

  const { FUNDINGS_URL, MEMBERS_URL, DOWNLOAD_URL, FEEDBACK_URL, CHANGE_PRIMARY_CONTACT_URL, RELATED_WORKS_URL } = urls;

  // Format the publish date - no memoization needed since date doesn't change after load
  const formattedPublishDate = formatPublishDate(planData?.templatePublished ?? null, formatter);

  // Handle changes from RadioGroup
  const handleRadioChange = (value: string) => {
    const selection = value.toUpperCase();
    setPlanVisibility(selection as PlanVisibility);
  };

  const handlePlanStatusChange = () => {
    setIsEditingPlanStatus(true);
  };

  const handleDialogCloseBtn = () => {
    setIsModalOpen(false);
    setStep(1);
  };

  // Call Server Action updatePlanStatusAction to run the updatePlanStatusMutation
  const updateStatus = useCallback(async (status: PlanStatus) => {
    // Don't need a try-catch block here, as the error is handled in the action
    const response = await updatePlanStatusAction({
      planId: Number(planId),
      status,
    });

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data,
    };
  }, [planId, router]);

  const handlePlanStatusForm = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsEditingPlanStatus(false);

    const status = planStatus ?? (planData.status as PlanStatus);

    const result = await updateStatus(status);

    if (!result.success) {
      const errors = result.errors;

      //Check if errors is an array or an object
      if (Array.isArray(errors)) {
        //Handle errors as an array
        setErrorMessages(errors);
      }
    } else {
      if (result?.data?.errors) {
        const errs = extractErrors<UpdateStatusErrors>(result?.data?.errors, ["general", "status"]);
        if (errs.length > 0) {
          setErrorMessages(errs);
        } else {
          // Optimistically update status so UI reflects it smoothly
          setPlanStatus(status);

          // ALSO update the planData.status so the display paragraph updates
          setPlanData(prev => ({
            ...prev,
            status,
          }));
          const successMessage = t("messages.success.successfullyUpdatedStatus");
          toastState.add(successMessage, { type: "success" });
        }
      }
    }
  }, [planStatus, planData.status, updateStatus, t, toastState]);

  // Call Server Action publishPlanAction to run the publishPlanMutation
  const publishPlan = useCallback(async (visibility: PlanVisibility) => {
    const response = await publishPlanAction({
      planId: Number(planId),
      visibility,
    });

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data,
    };
  }, [planId, router]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Close modal
    setIsModalOpen(false);

    // Set step back to Step 1
    setStep(1);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Extract the selected radio button value, and make it upper case to match TemplateVisibility enum values
    const visibility = formData.get("visibility")?.toString().toUpperCase() as PlanVisibility;

    const result = await publishPlan(visibility);

    if (!result.success) {
      const errors = result.errors;

      //Check if errors is an array or an object
      if (Array.isArray(errors)) {
        //Handle errors as an array
        setErrorMessages(errors.length > 0 ? errors : [Global("messaging.somethingWentWrong")]);
      }
    } else {
      if (result?.data?.errors) {
        const errs = extractErrors<PublishPlanErrors>(result?.data?.errors, ["general", "visibility", "status"]);
        if (errs.length > 0) {
          setErrorMessages(errs);
        } else {
          const successMessage = t("messages.success.successfullyPublished");
          toastState.add(successMessage, { type: "success" });
        }
      }
      //Need to refetch plan data to refresh the info that was changed
      await refetch();

      // Need to refetch related works project stats data
      await relatedWorksByProjectStatsRefetch();
    }
  }, [publishPlan, Global, t, toastState, refetch, relatedWorksByProjectStatsRefetch]);

  // Call Server Action updatePlanTitleAction to run the updatePlanTitleMutation
  const updateTitle = useCallback(async (title: string) => {
    // Don't need a try-catch block here, as the error is handled in the action
    const response = await updatePlanTitleAction({
      planId: Number(planId),
      title,
    });

    if (response.redirect) {
      router.push(response.redirect);
    }

    return {
      success: response.success,
      errors: response.errors,
      data: response.data,
    };
  }, [planId, router]);

  const handleTitleChange = useCallback(async (newTitle: string) => {
    const result = await updateTitle(newTitle);

    if (!result.success) {
      setErrorMessages(prev => [...prev, t("messages.errors.updateTitleError")]);
    } else {
      if (result.data?.errors) {
        // Handle errors as an object with general or field-level errors
        const errs = extractErrors<UpdateTitleErrors>(result?.data?.errors, ["general", "title"]);
        if (errs.length > 0) {
          setErrorMessages(errs);
          return;
        }

        // Optimistically update state so UI reflects it smoothly
        setPlanData(prev => ({
          ...prev,
          title: newTitle,
        }));

        const successMessage = t("messages.success.successfullyUpdatedTitle");
        toastState.add(successMessage, { type: "success" });
      }
    }
  }, [updateTitle, t, toastState]);


  const markFeedbackAsDone = async () => {
    setErrorMessages([]);
    setIsSubmitting(true);

    try {
      await completeFeedbackMutation({
        variables: {
          planId: Number(planId),
          planFeedbackId: Number(feedbackData?.planFeedbackStatus?.id)
        }
      });
      // Success so try and refetch feedback status to update UI
      try {
        await refetchFeedbackStatus();
        const successMessage = t("feedbackNotification.markAsDoneSuccess");
        toastState.add(successMessage, { type: "success" });
      } catch (error) {
        setErrorMessages([Global('messaging.somethingWentWrong')]);
        logECS('error', 'markFeedbackAsDone', {
          error,
          url: { path: routePath('projects.dmp.show', { projectId, planId }) }
        });
      }
    } catch (error) {
      setErrorMessages([Global('messaging.somethingWentWrong')]);
      logECS('error', 'markFeedbackAsDone', {
        error,
        url: { path: routePath('projects.dmp.show', { projectId, planId }) }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // When data from backend changes, set project data in state
    if (data && data.plan) {
      setPlanData({
        id: Number(data?.plan.id) ?? null,
        dmpId: extractDOI(data?.plan.dmpId ?? ""),
        registered: data?.plan.registered ?? "",
        title: data?.plan?.title ?? "",
        status: data?.plan?.status ?? "",
        funderName:
          data?.plan?.fundings
            ?.map((f) => f?.projectFunding?.affiliation?.displayName)
            .filter(Boolean)
            .join(", ") ?? "",
        primaryContact:
          data.plan.members
            ?.filter((member) => member?.isPrimaryContact === true)
            ?.map((member) => member?.projectMember?.givenName + " " + member?.projectMember?.surName)
            ?.join(", ") ?? "",
        members:
          data.plan.members
            ?.filter((member) => member !== null) // Filter out null
            .map((member) => ({
              fullname: `${member?.projectMember?.givenName} ${member?.projectMember?.surName}`,
              email: member?.projectMember?.email ?? "",
              orcid: member?.projectMember?.orcid ?? "",
              isPrimaryContact: member?.isPrimaryContact ?? false,
              role: (member?.projectMember?.memberRoles ?? []).map((role) => role.label),
            })) ?? [],
        versionedSections: data?.plan?.versionedSections ?? [],
        sourceTemplate: data?.plan?.versionedTemplate?.template?.name ?? "",
        affiliationName: data?.plan?.versionedTemplate?.owner?.displayName ?? "",
        templateVersion: data?.plan?.versionedTemplate?.version ?? "",
        templatePublished: data?.plan?.versionedTemplate?.created ?? "",
        percentageAnswered: data?.plan?.progress?.percentComplete ?? 0,
        orgId: data?.plan?.versionedTemplate?.owner?.uri ?? "",
        feedbackStatus: data?.plan?.feedbackStatus?.status ?? "NONE",
      });
      setPlanVisibility(data.plan.visibility as PlanVisibility);
      setIsReadOnly(data?.plan?.readOnly || false);
    }
  }, [data]);

  useEffect(() => {
    if (queryError) {
      setErrorMessages(prev => [...prev, queryError.message]);
    }
  }, [queryError]);

  useEffect(() => {
    setIsFeedbackRequested(planData?.feedbackStatus === 'REQUESTED');
  }, [planData]);


  // Memoize checklist items to prevent unnecessary recalculations
  const checkListItems = useMemo(() => [
    {
      id: 1,
      content: (
        <>
          <strong>
            {t("publishModal.publish.checklistItem.primaryContact")}{" "}
            <Link
              href={CHANGE_PRIMARY_CONTACT_URL}
              onPress={() => setIsModalOpen(false)}
            >
              {planData.primaryContact}
            </Link>
          </strong>
        </>
      ),
      completed: planData.members.some((member) => member.isPrimaryContact),
    },
    {
      id: 2,
      content: <>{t("publishModal.publish.checklistItem.complete")}</>,
      completed: planData.status === "COMPLETE",
    },
    {
      id: 3,
      content: (
        <>
          {t("publishModal.publish.checklistItem.percentageAnswered", {
            percentage: planData.percentageAnswered,
          })}
        </>
      ),
      completed: planData.percentageAnswered >= 50,
    },
    {
      id: 4,
      content: (
        <>
          {t("publishModal.publish.checklistItem.fundingText")} (
          <Link
            href={FUNDINGS_URL}
            onPress={() => setIsModalOpen(false)}
          >
            {t("publishModal.publish.checklistItem.funding")}
          </Link>
          )
        </>
      ),
      completed: !!planData.funderName, // Check if funderName exists
    },
    {
      id: 5,
      content: <>{t("publishModal.publish.checklistItem.requiredFields")}</>,
      completed: false, // Mark as not completed
    },
    {
      id: 6,
      content: (
        <>
          {t("publishModal.publish.checklistItem.orcidText")}{" "}
          <Link
            href={MEMBERS_URL}
            onPress={() => setIsModalOpen(false)}
          >
            {t("publishModal.publish.checklistItem.projectMembers")}
          </Link>
        </>
      ),
      completed: planData.members.some((member) => member.orcid), // Check if any member has an ORCiD
    },
  ], [planData, CHANGE_PRIMARY_CONTACT_URL, FUNDINGS_URL, MEMBERS_URL, t]);

  // Memoize computed descriptions to prevent recalculation on every render
  const { pageDescription, pageDescriptionWithVersion } = useMemo(() => {
    const description = (planData?.sourceTemplate && planData?.affiliationName)
      ? t('description', { source: planData?.sourceTemplate, affiliationName: planData?.affiliationName })
      : t('page.pageDescription');
    const descriptionWithVersion = `${description} - ${Global("version")}: ${planData?.templateVersion}, ${Global("published")}: ${formattedPublishDate}`;

    return {
      pageDescription: description,
      pageDescriptionWithVersion: descriptionWithVersion,
    };
  }, [planData?.sourceTemplate, planData?.affiliationName, planData?.templateVersion, formattedPublishDate, t, Global]);

  if (loading) {
    return <div>{Global("messaging.loading")}...</div>;
  }

  return (
    <>
      <PageHeaderWithTitleChange
        title={planData.title}
        description={(planData?.templateVersion && planData?.templatePublished) ? pageDescriptionWithVersion : pageDescription}
        linkText={t("links.editTitle")}
        labelText={t("labels.planTitle")}
        placeholder={t("page.planTitlePlaceholder")}
        showBackButton={false}
        breadcrumbs={
          <Breadcrumbs aria-label={Global("breadcrumbs.navigation")}>
            <Breadcrumb>
              <Link href={routePath("app.home")}>{Global("breadcrumbs.home")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.index")}>{Global("breadcrumbs.projects")}</Link>
            </Breadcrumb>
            <Breadcrumb>
              <Link href={routePath("projects.show", { projectId })}>{Global("breadcrumbs.projectOverview")}</Link>
            </Breadcrumb>
            <Breadcrumb>{Global("breadcrumbs.planOverview")}</Breadcrumb>
          </Breadcrumbs>
        }
        onTitleChange={handleTitleChange}
      />

      <ErrorMessages
        errors={errorMessages}
        ref={errorRef}
      />

      <LayoutWithPanel>
        {isFeedbackRequested && (
          <NotificationHeader
            title={t("feedbackNotification.title")}
            actionButtonText={t("feedbackNotification.markAsDone")}
            modal={{
              title: t("feedbackNotification.confirmModal.title"),
              content: (
                <>
                  {t("feedbackNotification.confirmModal.description1")}
                  <ul>
                    <li>{t("feedbackNotification.confirmModal.description2")}</li>
                    <li>{t("feedbackNotification.confirmModal.description3")}</li>
                  </ul>

                </>
              ),
              cancelButtonText: Global("buttons.close"),
              confirmButtonText: t("feedbackNotification.markAsDone"),
              isSubmitting,
              submittingText: Global('buttons.saving')
            }}
            onMarkAsDone={markFeedbackAsDone}
          >
            <p>{t("feedbackNotification.description1")}</p>
            <p>{t("feedbackNotification.description2")}</p>
          </NotificationHeader>
        )}

        <ContentContainer>
          <div className={"container"}>
            <div className={styles.planOverview}>
              <OverviewSection
                heading={t("funding.title")}
                headingId="funding-title"
                linkHref={FUNDINGS_URL}
                linkText={t("funding.edit")}
                linkAriaLabel={t("funding.edit")}
                disabled={isReadOnly}
                hoverMessage={t('messages.readOnlyLinkMessage')}
              >
                <p>{planData.funderName}</p>
              </OverviewSection>

              <OverviewSection
                heading={t("members.title")}
                headingId="members-title"
                linkHref={MEMBERS_URL}
                linkText={t("members.edit")}
                linkAriaLabel={t("members.edit")}
                disabled={isReadOnly}
                hoverMessage={t('messages.readOnlyLinkMessage')}
              >
                <p>
                  {planData.members.map((member, index) => (
                    <span key={index}>
                      {t("members.info", {
                        name: member.fullname,
                        role: member.role.map((role) => role).join(", "),
                      })}
                      {index < planData.members.length - 1 ? "; " : ""}
                    </span>
                  ))}
                </p>
              </OverviewSection>

              <OverviewSection
                heading={t("relatedWorks.title")}
                headingId="related-works-title"
                linkHref={RELATED_WORKS_URL}
                linkText={t("relatedWorks.edit")}
                linkAriaLabel={t("relatedWorks.edit")}
                includeLink={!!rwPlanStats?.hasPublishedPlan || !isReadOnly}
                disabled={isReadOnly}
                hoverMessage={t('messages.readOnlyLinkMessage')}
              >
                {!rwPlanStats?.hasPublishedPlan && <p>{t("relatedWorks.publish")}</p>}
                {rwPlanStats?.hasPublishedPlan && rwPlanStats?.pendingCount != null && <p>{t("relatedWorks.pendingCount", { count: rwPlanStats?.pendingCount })}</p>}
                {rwPlanStats?.hasPublishedPlan && rwPlanStats?.acceptedCount != null && <p>{t("relatedWorks.acceptedCount", { count: rwPlanStats?.acceptedCount })}</p>}
              </OverviewSection>
            </div>

            {planData.versionedSections.map((versionedSection, idx) => {
              const sectionId = versionedSection.versionedSectionId ?? versionedSection.customSectionId;
              const sectionRoute = versionedSection.sectionType === "BASE"
                ? routePath("projects.dmp.versionedSection", { projectId, dmpId: planId, versionedSectionId: Number(sectionId) })
                : routePath("projects.dmp.customSection", { projectId, dmpId: planId, csid: String(sectionId) });

              const canEditSections = !isReadOnly || isEditCollaborator;

              // Determine the action label for the section button
              const sectionActionLabel = !canEditSections
                ? t("sections.view")
                : versionedSection.answeredQuestions === 0
                  ? t("sections.start")
                  : t("sections.update");

              return (
                <section
                  key={versionedSection.versionedSectionId ?? `section-${idx}`}
                  className={styles.planSectionsList}
                  aria-labelledby={`section-title-${versionedSection.versionedSectionId}`}
                >
                  <div className={styles.planSectionsHeader}>
                    <div className={styles.planSectionsTitle}>
                      <h3 id={`section-title-${versionedSection.versionedSectionId}`}>{versionedSection.title}</h3>
                      <p
                        aria-label={`${versionedSection.answeredQuestions} out of ${versionedSection.totalQuestions} questions answered for ${versionedSection.title}`}
                      >
                        <span className={styles.progressIndicator}>
                          <svg
                            className={styles.progressIcon}
                            width="18"
                            height="18"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 -960 960 960"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z" />
                          </svg>
                          {t("sections.progress", {
                            current: versionedSection.answeredQuestions,
                            total: versionedSection.totalQuestions,
                          })}{" "}
                          {t("sections.questionsAnswered")}
                        </span>
                      </p>
                    </div>
                    <TransitionLink
                      href={sectionRoute}
                      aria-label={t("sections.updateSection", {
                        title: versionedSection.title,
                      })}
                      className={"react-aria-Button react-aria-Button--secondary"}
                    >
                      {sectionActionLabel}
                    </TransitionLink>
                  </div>
                </section>
              )
            })}
          </div>
        </ContentContainer>

        <SidebarPanel>
          <div className="status-panel-content side-panel">
            <div className={`buttonContainer withBorder  mb-5`}>
              {planData.dmpId && (
                <NextLink
                  href={getNarrativeUrl(planData.dmpId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-secondary"
                >
                  {Global("buttons.preview")}
                </NextLink>
              )}
              {!isReadOnly ? (
                <Button
                  onPress={() => setIsModalOpen(true)}
                >
                  {Global("buttons.publish")}
                </Button>
              ) : (
                <DialogTrigger>
                  <Button
                    aria-disabled={isReadOnly}
                    className="link-disabled"
                  >
                    {Global("buttons.publish")}
                  </Button>
                  <Popover placement="bottom" className="popover--inverse">
                    <Dialog className="popoverContent">
                      {t('messages.readOnlyLinkMessage')}
                    </Dialog>
                  </Popover>
                </DialogTrigger>
              )}
            </div>
            <div className="side-panel-content">
              <div className={`panelRow mb-5`}>
                <div>
                  <h3>{t("status.feedback.title")}</h3>
                  <p>
                    {feedbackLoading
                      ? `${Global("messaging.loading")}...`
                      : (() => {
                        const raw = feedbackData?.planFeedbackStatus?.status ?? "NONE";
                        const key = `status.feedback.${String(raw).toLowerCase()}`;
                        return t(key);
                      })()
                    }
                  </p>
                </div>
                {isPrimaryCollaborator ? (
                  <NextLink
                    href={FEEDBACK_URL}
                    className="side-panel-link"
                    aria-label={Global("links.request")}
                  >
                    {Global("links.request")}
                  </NextLink>
                ) : (
                  <DialogTrigger>
                    <Button
                      className="link-disabled"
                      aria-disabled={true}
                    >
                      {Global("links.request")}
                    </Button>
                    <Popover placement="bottom" className="popover--inverse">
                      <Dialog className="popoverContent">
                        {t('messages.readOnlyLinkMessage')}
                      </Dialog>
                    </Popover>
                  </DialogTrigger>
                )}

              </div>
              {isEditingPlanStatus ? (
                <div>
                  <Form
                    onSubmit={handlePlanStatusForm}
                    className="statusForm"
                  >
                    <FormSelect
                      label={t("status.title")}
                      ariaLabel={t("status.select.label")}
                      isRequired
                      name="planStatus"
                      items={planStatusOptions}
                      onChange={(selected) => setPlanStatus(selected as PlanStatus)}
                      selectedKey={planStatus ?? planData.status}

                    >
                      {(item) => <ListBoxItem key={item.id}>{item.name}</ListBoxItem>}
                    </FormSelect>
                    {isEditingPlanStatus && <Button type="submit">{Global("buttons.save")}</Button>}
                  </Form>
                </div>
              ) : (
                <div className={`panelRow mb-5`}>
                  <div>
                    <h3>{t("status.title")}</h3>
                    <p>{toTitleCase(planData.status)}</p>
                  </div>
                  {!isReadOnly ? (
                    <Button
                      className="button-as-link"
                      data-testid="updateLink"
                      onPress={handlePlanStatusChange}
                      aria-label={t("status.select.changeLabel")}
                    >
                      {Global("buttons.linkUpdate")}
                    </Button>
                  ) : (
                    <DialogTrigger>
                      <Button
                        className="link-disabled"
                        aria-disabled={true}
                      >
                        {Global("buttons.linkUpdate")}
                      </Button>
                      <Popover placement="bottom" className="popover--inverse">
                        <Dialog className="popoverContent">
                          {t('messages.readOnlyLinkMessage')}
                        </Dialog>
                      </Popover>
                    </DialogTrigger>
                  )}
                </div>
              )}

              <div className={`panelRow mb-5`}>
                <div>
                  <h3>{t("status.publish.title")}</h3>
                  <p>{planData.registered ? PUBLISHED : UNPUBLISHED}</p>
                </div>
                {!isReadOnly ? (
                  <Link
                    href="#"
                    className="side-panel-link"
                    onPress={() => setIsModalOpen(true)}
                    aria-label={t("status.publish.label")}
                  >
                    {t("status.publish.label")}
                  </Link>
                ) : (
                  <DialogTrigger>
                    <Button
                      className="link-disabled"
                      aria-disabled={true}
                    >
                      {t("status.publish.label")}
                    </Button>
                    <Popover placement="bottom" className="popover--inverse">
                      <Dialog className="popoverContent">
                        {t('messages.readOnlyLinkMessage')}
                      </Dialog>
                    </Popover>
                  </DialogTrigger>
                )}
              </div>
              <div className={`panelRow mb-5`}>
                <div>
                  <h3>{t("status.download.title")}</h3>
                </div>
                {/**Any user who can access the plan can download the plan */}
                <NextLink
                  href={DOWNLOAD_URL}
                  className="side-panel-link"
                  aria-label="download"
                >
                  {t("status.download.title")}
                </NextLink>
              </div>
            </div>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>

      <Modal
        isDismissable
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        data-testid="modal"
      >
        {step === 1 && (
          <Dialog>
            <div className={`${styles.publishModal} ${styles.dialogWrapper}`}>
              <Heading slot="title">{t("publishModal.publish.title")}</Heading>

              <p>{t("publishModal.publish.description1")}</p>

              <p>{t("publishModal.publish.description2")}</p>

              <Heading level={2}>{t("publishModal.publish.checklistTitle")}</Heading>

              <ul
                className={styles.checkList}
                data-testid="checklist"
              >
                {/* Render completed items first */}
                {checkListItems
                  .filter((item) => item.completed)
                  .map((item) => (
                    <li
                      key={item.id}
                      className={styles.iconTextListItem}
                    >
                      <div className={styles.iconWrapper}>
                        <DmpIcon icon="check_circle_black" />
                      </div>
                      <div className={styles.textWrapper}>{item.content}</div>
                    </li>
                  ))}

                {/* Render incomplete items next */}
                {checkListItems
                  .filter((item) => !item.completed)
                  .map((item) => (
                    <li
                      key={item.id}
                      className={styles.iconTextListItem}
                    >
                      <div className={styles.iconWrapper}>
                        <DmpIcon icon="error_circle" />
                      </div>
                      <div className={styles.textWrapper}>{item.content}</div>
                    </li>
                  ))}
              </ul>

              <p>
                <strong>
                  {checkListItems.filter((item) => !item.completed).length}{" "}
                  {t("publishModal.publish.checklistInfo")}
                </strong>
              </p>

              <div className="modal-actions">
                <div>
                  <Button
                    type="submit"
                    onPress={() => setStep(2)}
                  >
                    {t("publishModal.publish.buttonNext")}{' '}&gt;
                  </Button>
                </div>
                <div>
                  <Button
                    data-secondary
                    className="secondary"
                    onPress={handleDialogCloseBtn}
                  >
                    {Global("buttons.close")}
                  </Button>
                </div>
              </div>
            </div>
          </Dialog>
        )}

        {/* Step 2: Visibility Settings & Publish Plan button*/}
        {step === 2 && (
          <Dialog>
            <div className={`${styles.publishModal} ${styles.dialogWrapper}`}>
              <Form
                onSubmit={(e) => handleSubmit(e)}
                data-testid="publishForm"
              >
                <Heading slot="title">{t("publishModal.publish.visibilityTitle")}</Heading>

                <p>{t("publishModal.publish.visibilityDescription")}</p>

                <Heading level={2}>{t("publishModal.publish.visibilityOptionsTitle")}</Heading>

                <RadioGroupComponent
                  name="visibility"
                  value={planVisibility.toLowerCase()}
                  radioGroupLabel={t("publishModal.publish.visibilityOptionsTitle")}
                  onChange={handleRadioChange}
                >
                  <div>
                    <Radio value="public">{t("publishModal.publish.visibilityOptions.public.label")}</Radio>
                    <Text slot="description">
                      <strong>{t("publishModal.publish.visibilityOptions.public.description")}</strong>
                    </Text>
                  </div>

                  <div>
                    <Radio value="organizational">
                      {t("publishModal.publish.visibilityOptions.organization.label")}
                    </Radio>
                    <Text slot="description">
                      {t.rich("publishModal.publish.visibilityOptions.organization.description", {
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </Text>
                  </div>

                  <div>
                    <Radio value="private">{t("publishModal.publish.visibilityOptions.private.label")}</Radio>
                    <Text slot="description">{t("publishModal.publish.visibilityOptions.private.description")}</Text>
                  </div>
                </RadioGroupComponent>

                <div className="modal-actions">
                  <div>
                    <Button type="submit">{t("publishModal.publish.title")}</Button>
                  </div>
                  <div>
                    <Button
                      data-secondary
                      className="secondary"
                      onPress={handleDialogCloseBtn}
                    >
                      {Global("buttons.close")}
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          </Dialog>
        )}
      </Modal>
    </>
  );
};

export default PlanOverviewPage;
