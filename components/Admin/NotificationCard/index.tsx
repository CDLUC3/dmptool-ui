import React, { useState } from 'react';
import Link from "next/link";
import styles from './adminNotification.module.scss';
import { TransitionLink } from "@/components/Form";
import { useTranslations } from "next-intl";
import ExpandableContentSection from '@/components/ExpandableContentSection';
import {
  AdminNotificationType,
  MarkNotificationAsReadDocument,
  MarkNotificationAsUnReadDocument,
} from "@/generated/graphql";

import { useMutation } from "@apollo/client/react";

interface NotificationCardProps {
  id: number | null;
  cardTitle: string | "";
  planTitle: string;
  viewLink: string;
  date: string;
  contact: string;
  message: string;
  notificationType: AdminNotificationType;
  isRead: boolean;
}

interface NotificationCardSectionsProps {
  sections: NotificationCardProps[];
  heading?: string;
  onToggleRead?: () => void;
}


const NotificationCard: React.FC<NotificationCardSectionsProps> = ({ sections, heading, onToggleRead }) => {
  const Global = useTranslations("Global");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [markAsRead] = useMutation(MarkNotificationAsReadDocument);
  const [markAsUnread] = useMutation(MarkNotificationAsUnReadDocument);

  const handleToggleRead = async (id: number | null, isRead: boolean) => {
    if (!id) return;
    if (isRead) {
      await markAsUnread({ variables: { markNotificationAsUnReadId: id } });
    } else {
      await markAsRead({ variables: { markNotificationAsReadId: id } });
    }
    if (onToggleRead) {
      onToggleRead();
    }
  };


  return (
    <div aria-label="Page link sections">
      <h2>{heading}</h2>
      {sections.map((section, sectionIndex) => {
        const isTemplateNotification = [
          AdminNotificationType.TemplateCreated,
          AdminNotificationType.TemplateCustomizationChanged,
        ].includes(section.notificationType);

        return (
          <section key={sectionIndex} className={`${styles.notificationSection} mb-8`} aria-labelledby="public-templates">
            <div role="list" aria-label="Public templates">
              <div
                className={styles.notificationItem}
                role="listitem"
                data-testid="template-list-item"
              >
                <div className={styles.notificationItemWrapper}>
                  <div className={styles.notificationItemInner}>
                    <div className={styles.notificationItemContent}>
                      <div className={styles.funder}>{section.cardTitle}</div>
                      <TransitionLink
                        href={section.viewLink}
                        aria-describedby={section.planTitle}
                      >
                        <div className={styles.cardHeader}>
                          <h2 className={styles.notificationItemHeading}>{section.planTitle}</h2>
                        </div>

                      </TransitionLink>
                      <div
                        className={styles.metadata}
                        data-testid="template-metadata"
                      >
                        <span>
                          {section.date ? section.date : "1 day ago"}
                        </span>
                      </div>

                    </div>
                  </div>
                  <div className={styles.notificationItemInnerExpanded}>
                    {section.notificationType === "FEEDBACK_REQUESTED" && (
                      <div className={styles.notificationItemContent}>

                        <div className={styles.funder}>{section.contact}</div>

                        <ExpandableContentSection
                          id="university-support-feedback"
                          expandLabel={Global('links.expand')}
                          summaryCharLimit={80}
                          linkClass={styles.expandLink}
                        >
                          <p>{section.message}</p>
                        </ExpandableContentSection>
                      </div>
                    )}
                  </div>
                  <div className={`${styles.notificationItemInner} ${styles.notificationItemInnerActions}`}>
                    <div className={styles.notificationItemContent}>
                      <div className={styles.actions}>
                        <Link
                          href=""
                          className={styles.markAsReadLink}
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleRead(section.id, section.isRead);
                          }}
                        >
                          {section.isRead ? Global('buttons.markAsUnread') : Global('buttons.markAsRead')}
                        </Link>
                        <TransitionLink
                          href={section.viewLink}
                          aria-label={isTemplateNotification ? Global('buttons.viewTemplate') : Global('buttons.viewPlan')}
                          className={`react-aria-Button react-aria-Button--primary ${styles.updateButton}`}
                          onClick={() => setLoadingId(section.id)}
                        >
                          {loadingId === section.id
                            ? Global('buttons.loading')
                            : Global(isTemplateNotification ? 'buttons.viewTemplate' : 'buttons.viewPlan')}
                        </TransitionLink>
                      </div>
                    </div>
                  </div>
                </div>

              </div>


            </div>
          </section>
        );
      })}
    </div>
  );
};

export default NotificationCard;
