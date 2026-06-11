import React from 'react';
import Link from "next/link";
import styles from './adminNotification.module.scss';
import { TransitionButton, TransitionLink } from "@/components/Form";
import { useTranslations } from "next-intl";
import ExpandableContentSection from '@/components/ExpandableContentSection';

interface NotificationCardProps {
  planTitle: string;
  planLink: string;
  date: string;
  contact: string;
  message: string;
}

interface NotificationCardSectionsProps {
  sections: NotificationCardProps[];
  heading?: string;
}

const NotificationCard: React.FC<NotificationCardSectionsProps> = ({ sections, heading }) => {
  const Global = useTranslations("Global");
  return (
    <div aria-label="Page link sections">
      <h2 className={styles.sectionHeading}>{heading}</h2>
      {sections.map((section, sectionIndex) => (
        <section key={sectionIndex} className={`${styles.templatesList} mb-8`} aria-labelledby="public-templates">
          <div role="list" aria-label="Public templates">
            <div
              className={styles.templateItem}
              role="listitem"
              data-testid="template-list-item"
            >
              <div className={styles.templateItemWrapper}>
                <div className={styles.templateItemInner}>
                  <div className={styles.templateItemContent}>
                    <div className={styles.funder}>Funder</div>
                    <TransitionLink
                      href={section.planLink}
                      aria-describedby={section.planTitle}
                    >
                      <div className={styles.cardHeader}>
                        <h2 className={styles.templateItemHeading}>{section.planTitle}</h2>
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
                <div className={styles.templateItemInnerExpanded}>
                  <div className={styles.templateItemContent}>
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
                </div>
                <div className={`${styles.templateItemInner} ${styles.templateItemInnerActions}`}>
                  <div className={styles.templateItemContent}>
                    <div className={styles.actions}>
                      <Link
                        href=""
                        className={styles.markAsReadLink}
                      >
                        {Global('buttons.markAsRead')}
                      </Link>
                      <TransitionLink
                        href={section.planLink}
                        aria-label="View plan"
                        className={`react-aria-Button react-aria-Button--primary ${styles.updateButton}`}
                      >
                        {Global('buttons.viewPlan')}
                      </TransitionLink>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>
      ))}
    </div>
  );
};

export default NotificationCard;
