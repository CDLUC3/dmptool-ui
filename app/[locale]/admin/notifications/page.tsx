"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNow, useTranslations } from "next-intl";
import { useLazyQuery } from "@apollo/client/react";
import { Button } from "react-aria-components";

// GraphQL
import {
  AdminNotificationsUnreadDocument,
  AdminNotificationsReadDocument,
  AdminNotificationType
} from "@/generated/graphql";


// Components
import PageHeader from "@/components/PageHeader";
import NotificationCard from "@/components/Admin/NotificationCard";
import { ContentContainer, LayoutContainer } from "@/components/Container";
import ErrorMessages from "@/components/ErrorMessages";
import Loading from "@/components/Loading";

// Utils and other
import { logECS, routePath } from "@/utils/index";
import { useFormatDate } from "@/hooks/useFormatDate";

interface NotificationCreatedBy {
  id?: number | null;
  givenName?: string | null;
  surName?: string | null;
}

interface NotificationPlan {
  id?: number | null;
  title?: string | null;
  project: {
    id: number;
  }
}

interface NotificationTemplate {
  id?: number | null;
  name?: string | null;
}

interface NotificationTemplateCustomization {
  id?: number | null;
  templateName?: string | null;
}

interface NotificationFeedback {
  id?: number | null;
  messageToOrg?: string | null;
}

interface AdminNotificationItem {
  id?: number | null;
  notificationType?: AdminNotificationType | null;
  isRead?: boolean | null;
  created?: string | null;
  createdBy?: NotificationCreatedBy | null;
  plan?: NotificationPlan | null;
  template?: NotificationTemplate | null;
  templateCustomization?: NotificationTemplateCustomization | null;
  feedback?: NotificationFeedback | null;
}

const LIMIT = 5;


const AdminNotificationsPage: React.FC = () => {
  const t = useTranslations("AdminNotifications");
  const Global = useTranslations("Global");
  const formatDate = useFormatDate();
  const now = useNow();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Unread state
  const [unreadItems, setUnreadItems] = useState<AdminNotificationItem[]>([]);
  const [unreadNextCursor, setUnreadNextCursor] = useState<string | null>(null);
  const [unreadTotalCount, setUnreadTotalCount] = useState<number | null>(0);

  // Read state
  const [readItems, setReadItems] = useState<AdminNotificationItem[]>([]);
  const [readNextCursor, setReadNextCursor] = useState<string | null>(null);
  const [readTotalCount, setReadTotalCount] = useState<number | null>(0);

  const [errors, setErrors] = useState<string[]>([]);

  const [fetchUnread, { data: unreadData, loading: unreadLoading, error: unreadError, refetch: unreadRefetch }] = useLazyQuery(AdminNotificationsUnreadDocument, {
    notifyOnNetworkStatusChange: true,
  });

  const [fetchRead, { data: readData, loading: readLoading, error: readError, refetch: readRefetch }] = useLazyQuery(AdminNotificationsReadDocument, {
    notifyOnNetworkStatusChange: true,
  });

  // Format notification timestamp
  const formatNotificationTime = (created: string) => {
    const createdDate = new Date(Number(created));

    // Compare calendar dates only
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const createdDay = new Date(createdDate);
    createdDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (today.getTime() - createdDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 1) {
      return t("messages.today");
    }

    if (diffDays >= 1 && diffDays <= 5) {
      return t('daysAgo', { diffDays, s: diffDays === 1 ? "" : "s" });
    }

    return formatDate(created);
  };

  const refetchAll = async () => {
    setUnreadItems([]);
    setReadItems([]);
    await Promise.all([unreadRefetch(), readRefetch()]);
  };

  const mapNotificationToSection = (item: AdminNotificationItem) => {
    const title = item.notificationType &&
      notificationTitleKeys[item.notificationType as AdminNotificationType];

    const viewLink = (() => {
      switch (item.notificationType as AdminNotificationType) {
        case AdminNotificationType.FeedbackRequested:
          return item.plan
            ? routePath("projects.dmp.show", { projectId: item.plan.project.id, dmpId: Number(item.plan.id) })
            : "";
        case AdminNotificationType.TemplateCreated:
          return item.template
            ? routePath("template.show", { templateId: Number(item.template.id) })
            : "";
        case AdminNotificationType.TemplateCustomizationChanged:
          return item.templateCustomization
            ? routePath("template.customize", { templateCustomizationId: 7 })
            : "";
        default:
          return "";
      }
    })();

    return {
      id: item.id!,
      notificationType: item.notificationType as AdminNotificationType,
      cardTitle: title || "",
      planTitle: item.plan?.title ?? item.template?.name ?? item.templateCustomization?.templateName ?? "",
      viewLink,
      date: item.created ? formatNotificationTime(item.created) : "",
      contact: item.createdBy ? `${item.createdBy.givenName} ${item.createdBy.surName}` : "",
      message: item.feedback?.messageToOrg ?? "",
      isRead: item.isRead ?? false,
    };
  };

  const handleLoadMoreUnread = async () => {
    if (!unreadNextCursor) return;
    try {
      await fetchUnread({
        variables: {
          paginationOptions: { type: "CURSOR", cursor: unreadNextCursor, limit: LIMIT },
        },
      });
    } catch (err) {
      logECS("error", "handleLoadMoreUnread", { errors: err });
      setErrors((prev) => [...prev, t("messages.errors.failedToLoadNotifications")]);
    }
  };

  const handleLoadMoreRead = async () => {
    if (!readNextCursor) return;
    try {
      await fetchRead({
        variables: {
          paginationOptions: { type: "CURSOR", cursor: readNextCursor, limit: LIMIT },
        },
      });
    } catch (err) {
      logECS("error", "handleLoadMoreRead", { errors: err });
      setErrors((prev) => [...prev, t("messages.errors.failedToLoadNotifications")]);
    }
  };

  // Load both on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchUnread({ variables: { paginationOptions: { type: "CURSOR", limit: LIMIT } } }),
          fetchRead({ variables: { paginationOptions: { type: "CURSOR", limit: LIMIT } } }),
        ]);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return; // ignore navigation aborts
        logECS("error", "fetchNotifications", { errors: err });
        setErrors([t("messages.errors.failedToLoadNotifications")]);
      } finally {
        setIsInitialLoad(false);
      }
    };
    fetchData();
  }, []);


  // Handle unread data updates
  useEffect(() => {
    if (!unreadData?.adminNotificationsUnread) return;
    const { items, nextCursor, totalCount } = unreadData.adminNotificationsUnread;
    setUnreadItems((prev) => [...prev, ...(items ?? []) as AdminNotificationItem[]]);
    setUnreadNextCursor(nextCursor ?? null);
    setUnreadTotalCount(totalCount ?? null);
  }, [unreadData]);

  // Handle read data updates
  useEffect(() => {
    if (!readData?.adminNotificationsRead) return;
    const { items, nextCursor, totalCount } = readData.adminNotificationsRead;
    setReadItems((prev) => [...prev, ...(items ?? []) as AdminNotificationItem[]]);
    setReadNextCursor(nextCursor ?? null);
    setReadTotalCount(totalCount ?? null);
  }, [readData]);


  useEffect(() => {
    if (unreadError) setErrors((prev) => [...prev, t("messages.errors.failedToLoadNotifications")]);
  }, [unreadError]);

  useEffect(() => {
    if (readError) setErrors((prev) => [...prev, t("messages.errors.failedToLoadNotifications")]);
  }, [readError]);


  const notificationTitleKeys: Record<AdminNotificationType, string> = {
    FEEDBACK_REQUESTED: t("feedbackRequested"),
    TEMPLATE_CREATED: t("funderTemplateAdd"),
    TEMPLATE_CUSTOMIZATION_CHANGED: t("funderTemplateCustomizationChanged"),
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        showBackButton={true}
        className="page-notifications"
      />

      <ErrorMessages errors={errors} ref={errorRef} />

      <div>
        <div>
          <LayoutContainer>
            <ContentContainer>

              {/* Unread notifications */}
              <NotificationCard
                heading={t("headings.unread")}
                onToggleRead={refetchAll}
                sections={unreadItems.map(mapNotificationToSection)}
              />

              {unreadLoading || isInitialLoad ? (
                <Loading variant="inline" message={Global("messaging.loading")} />
              ) : unreadItems.length === 0 ? (
                <p>{t("messages.noUnreadNotifications")}</p>
              ) : null}
              {!unreadLoading && unreadTotalCount !== null && unreadTotalCount > unreadItems.length && (
                <div>
                  <Button onPress={handleLoadMoreUnread} isDisabled={!unreadNextCursor}>
                    {Global("buttons.loadMore")}
                  </Button>
                  <div>
                    {Global("messaging.numDisplaying", {
                      num: unreadItems.length,
                      total: unreadTotalCount,
                    })}
                  </div>
                </div>
              )}

              {/* Read notifications */}
              <NotificationCard
                heading={t("headings.previousNotifications")}
                onToggleRead={refetchAll}
                sections={readItems.map(mapNotificationToSection)}
              />
              {readLoading || isInitialLoad ? (
                <Loading variant="inline" message={Global("messaging.loading")} />
              ) : readItems.length === 0 ? (
                <p>{t("messages.noReadNotifications")}</p>
              ) : null}
              {!readLoading && readTotalCount !== null && readTotalCount > readItems.length && (
                <div>
                  <Button onPress={handleLoadMoreRead} isDisabled={!readNextCursor}>
                    {Global("buttons.loadMore")}
                  </Button>
                  <div>
                    {Global("messaging.numDisplaying", {
                      num: readItems.length,
                      total: readTotalCount,
                    })}
                  </div>
                </div>
              )}

            </ContentContainer>
          </LayoutContainer>
        </div>
      </div>
    </>
  );
};

export default AdminNotificationsPage;