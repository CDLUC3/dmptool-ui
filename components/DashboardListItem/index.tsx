import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import styles from "./DashboardListItem.module.scss";

interface DashboardListItemProps {
  heading: string;
  url: string;
  children: React.ReactNode;
  isFullyClickable?: boolean;
}

function DashboardListItem({
  heading,
  url,
  children,
  isFullyClickable = true // Make whole card clickable by default
}: DashboardListItemProps) {
  const Global = useTranslations("Global");

  // Create unique ID for ARIA relationship
  const headingId = `${heading.toLowerCase().replace(/\s+/g, "-")}-heading`;

  if (isFullyClickable) {
    return (
      <li>
        <Link
          href={url}
          className={styles.dashboardItemLink}
          aria-label={`${Global("links.update")} ${heading}`}
          data-testid="dashboard-list-item"
        >
          <div className={styles.dashboardItem}>
            <div className={styles.dashboardItemInner}>
              <div className={styles.dashboardItemContent}>
                <h2 id={headingId}>
                  <span className={styles.titleLink}>
                    {heading}
                  </span>
                </h2>

                <div className={styles.content}>{children}</div>
              </div>

              <div className={styles.dashboardItemActions}>
                <span className={styles.updateLink}>
                  {Global("links.update")}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </li>
    );
  }

  return (
    <li
      className={styles.dashboardItem}
      data-testid="dashboard-list-item"
    >
      <div className={styles.dashboardItemInner}>
        <div className={styles.dashboardItemContent}>
          <h2 id={headingId}>
            <Link
              href={url}
              aria-label={`${Global("links.update")} ${heading}`}
              className={styles.titleLink}
            >
              {heading}
            </Link>
          </h2>

          <div className={styles.content}>{children}</div>
        </div>

        <div className={styles.dashboardItemActions}>
          <Link
            href={url}
            aria-label={`${Global("links.update")} ${heading}`}
            className={styles.updateLink}
          >
            {Global("links.update")}
          </Link>
        </div>
      </div>
    </li>
  );
}

export default DashboardListItem;
