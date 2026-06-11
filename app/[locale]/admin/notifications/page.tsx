"use client";

import React from "react";
import { useTranslations } from "next-intl";

import PageHeader from "@/components/PageHeader";
import NotificationCard from "@/components/Admin/NotificationCard";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import { routePath } from "@/utils/routes";

import styles from "./adminNotifications.module.scss";

const AdminNotificationsPage: React.FC = () => {
  const t = useTranslations("AdminNotifications");

  const unreadSections = [
    {
      title: t("headings.unread"),
      planTitle: "Polar Exploration Plan",
      planLink: routePath("admin.notifications"),
      date: "2024-06-01",
      contact: "Jane Doe",
      message: "I want to understand the library's guidelines for data management plans. I want to understand the library's guidelines for data management plans. I want to understand the library's guidelines for data management plans.",
    }
  ];

  const previousSections = [
    {
      title: t("headings.previous"),
      planTitle: "NSF added a new template",
      planLink: routePath("admin.notifications"),
      date: "2024-06-01",
      contact: "John Smith",
      message: "I want to understand the library's guidelines for data management plans. I want to understand the library's guidelines for data management plans. I want to understand the library's guidelines for data management plans.",
    }
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="University of California, Office of the President (UCOP)"
        showBackButton={true}
        className="page-template-list"
      />
      <div className={styles.main}>
        <div className={styles.mainContent}>
          <LayoutContainer>
            <ContentContainer className={styles.layoutContentContainer}>
              <NotificationCard sections={unreadSections} heading="Unread" />
              <NotificationCard sections={previousSections} heading="Previous Notifications" />
            </ContentContainer>
          </LayoutContainer>
        </div>
      </div>
    </>
  );
};

export default AdminNotificationsPage;
