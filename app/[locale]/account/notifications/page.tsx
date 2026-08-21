"use client";

import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { ContentContainer, LayoutWithPanel, SidebarPanel } from "@/components/Container";
import { CheckboxGroupComponent } from "@/components/Form";
import { Button, Checkbox } from "react-aria-components";
import Link from "next/link";
import { useTranslations } from "next-intl";
import styles from "./notifications.module.scss";
import { routePath } from "@/utils/routes";
import { useToast } from "@/context/ToastContext";

interface NotificationType {
  id: string;
  key: string;
  enabled: boolean;
}

const NotificationsPage: React.FC = () => {
  const t = useTranslations("Notifications");
  const toast = useToast();

  // Dummy array simulating database data
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationType[]>([
    { id: "1", key: "commentAdded", enabled: true },
    { id: "2", key: "planShared", enabled: true },
    { id: "3", key: "adminPrivileges", enabled: false },
    { id: "4", key: "planUpdated", enabled: true },
    { id: "5", key: "feedbackRequested", enabled: true },
    { id: "6", key: "templatePublished", enabled: false },
    { id: "7", key: "accountActivity", enabled: true },
    { id: "8", key: "weeklyDigest", enabled: false },
  ]);

  // Get currently enabled notification IDs for checkbox group
  const enabledNotifications = notificationPreferences.filter((pref) => pref.enabled).map((pref) => pref.id);

  const handleNotificationChange = (selectedValues: string[]) => {
    setNotificationPreferences((prev) =>
      prev.map((pref) => ({
        ...pref,
        enabled: selectedValues.includes(pref.id),
      })),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Notification preferences updated:", notificationPreferences);
    toast.add(t("messages.preferencesUpdateSuccess"), { type: "success", timeout: 3000 });
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        showBackButton={true}
        className="page-organization-details-header"
      />

      <LayoutWithPanel className={"page-notifications"}>
        <ContentContainer>
          <form onSubmit={handleSubmit}>
            <div className={styles.sectionContainer}>
              <div className={styles.sectionContent}>
                <p className={styles.introText}>{t("introText")}</p>

                <CheckboxGroupComponent
                  name="notificationPreferences"
                  value={enabledNotifications}
                  onChange={handleNotificationChange}
                  checkboxGroupLabel=""
                  checkboxGroupDescription=""
                >
                  {notificationPreferences.map((notification) => (
                    <div key={notification.id}>
                      <Checkbox
                        value={notification.id}
                        aria-label={t(`notificationTypes.${notification.key}`)}
                      >
                        <div className="checkbox">
                          <svg
                            viewBox="0 0 18 18"
                            aria-hidden="true"
                          >
                            <polyline points="1 9 7 14 15 4" />
                          </svg>
                        </div>
                        <div className="">
                          <span>{t(`notificationTypes.${notification.key}`)}</span>
                        </div>
                      </Checkbox>
                    </div>
                  ))}
                </CheckboxGroupComponent>

                <div className={styles.formActions}>
                  <Button
                    type="submit"
                    data-primary={true}
                  >
                    {t("actions.save")}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </ContentContainer>

        <SidebarPanel>
          <div>
            <h2 className={styles.relatedItemsHeading}>{t("headingRelatedActions")}</h2>
            <ul className={styles.relatedItems}>
              <li>
                <Link href={routePath("account.profile")}>{t("linkUpdateProfile")}</Link>
              </li>
              <li>
                <Link href={routePath("account.password")}>{t("linkUpdatePassword")}</Link>
              </li>
              <li>
                <Link href={routePath("account.connections")}>{t("linkUpdateConnections")}</Link>
              </li>
            </ul>
          </div>
        </SidebarPanel>
      </LayoutWithPanel>
    </>
  );
};

export default NotificationsPage;
