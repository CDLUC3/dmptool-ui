"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@apollo/client/react";

import {
  AdminNotificationsDocument,
} from "@/generated/graphql";
import PageHeader from "@/components/PageHeader";
import PageLinkCard, { PageLinkSection } from "@/components/PageLinkCard";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import { routePath } from "@/utils/routes";

import styles from "./admin.module.scss";

const AdminOverviewPage: React.FC = () => {
  const t = useTranslations("Admin");
  const { data: notificationsData } = useQuery(AdminNotificationsDocument);

  const adminSections: PageLinkSection[] = [
    {
      title: t("sections.organisationTemplatesAndPlans.title"),
      items: [
        {
          title: t("sections.organisationTemplatesAndPlans.items.notifications.title"),
          description: t("sections.organisationTemplatesAndPlans.items.notifications.description"),
          href: routePath("admin.notifications"),
          hasNotification: !!(notificationsData?.adminNotifications?.totalCount && notificationsData.adminNotifications.totalCount > 0),
          notificationCount: notificationsData?.adminNotifications?.totalCount || 0,
        },
        {
          title: t("sections.organisationTemplatesAndPlans.items.organizationTemplates.title"),
          description: t("sections.organisationTemplatesAndPlans.items.organizationTemplates.description"),
          href: routePath("admin.templates"),
        },
        {
          title: t("sections.organisationTemplatesAndPlans.items.templateCustomizations.title"),
          description: t("sections.organisationTemplatesAndPlans.items.templateCustomizations.description"),
          href: routePath("template.customizations"),
        },
        {
          title: t("sections.organisationTemplatesAndPlans.items.guidance.title"),
          description: t("sections.organisationTemplatesAndPlans.items.guidance.description"),
          href: routePath("admin.guidance.index"),
        },
        {
          title: t("sections.organisationTemplatesAndPlans.items.projectAndPlans.title"),
          description: t("sections.organisationTemplatesAndPlans.items.projectAndPlans.description"),
          href: routePath("admin.projects"),
        },
      ],
    },
    {
      title: t("sections.organizationSettings.title"),
      items: [
        {
          title: t("sections.organizationSettings.items.editOrganizationDetails.title"),
          description: t("sections.organizationSettings.items.editOrganizationDetails.description"),
          href: routePath("admin.organizationDetails"),
        },
        {
          title: t("sections.organizationSettings.items.schoolsDepartments.title"),
          description: t("sections.organizationSettings.items.schoolsDepartments.description"),
          href: routePath("admin.departments"),
        },
        {
          title: t("sections.organizationSettings.items.manageUserAccounts.title"),
          description: t("sections.organizationSettings.items.manageUserAccounts.description"),
          href: routePath("admin.users"),
        },
        {
          title: t("sections.organizationSettings.items.customizeEmailText.title"),
          description: t("sections.organizationSettings.items.customizeEmailText.description"),
          href: routePath("admin.emailPreferences"),
        },
        {
          title: t("sections.organizationSettings.items.requestFeedbackOptions.title"),
          description: t("sections.organizationSettings.items.requestFeedbackOptions.description"),
          href: routePath("admin.feedbackOptions"),
        },
      ],
    },
    {
      title: t("sections.reporting.title"),
      items: [
        {
          title: t("sections.reporting.items.usageStatistics.title"),
          description: t("sections.reporting.items.usageStatistics.description"),
          href: routePath("admin.statistics"),
        },
      ],
    },
  ];

  return (
    <>
      <PageHeader
        title="Admin"
        description="University of California, Office of the President (UCOP)"
        showBackButton={true}
        className="page-template-list"
      />
      <div className={styles.main}>
        <div className={styles.mainContent}>
          <LayoutWithPanel>
            <ContentContainer className={styles.layoutContentContainer}>
              <PageLinkCard sections={adminSections} />
            </ContentContainer>
            <SidebarPanel className={styles.layoutSidebarPanel}>
              <div>{/* TODO: Add sidebar content */}</div>
            </SidebarPanel>
          </LayoutWithPanel>
        </div>
      </div>
    </>
  );
};

export default AdminOverviewPage;
