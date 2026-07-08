"use client";

import React from "react";
import { useTranslations } from "next-intl";
import styles from "./skeletonListLoading.module.scss";

interface SkeletonListLoadingProps {
  /** Defaults to 5 for list layout, 6 for grid (fills 2 and 3 column rows evenly) */
  count?: number;
  /** 'list' = stacked full-width cards, 'grid' = squarish cards matching `card-grid-list` */
  layout?: "list" | "grid";
  className?: string;
  isActive?: boolean;
  /** Screen reader message. Defaults to localized Global('messaging.loadingList') */
  ariaLabel?: string;
}

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_LIST_COUNT = 5;
const DEFAULT_GRID_COUNT = 6;

function clampCount(count: number): number {
  return Math.min(Math.max(count, MIN_COUNT), MAX_COUNT);
}

function SkeletonListItem() {
  return (
    <div className={styles.skeletonItem}>
      <div className={`${styles.bar} ${styles.barTitle}`} />
      <div className={`${styles.bar} ${styles.barFull}`} />
      <div className={`${styles.bar} ${styles.barMedium}`} />
      <div className={`${styles.bar} ${styles.barShort}`} />
    </div>
  );
}

function SkeletonGridCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={`${styles.bar} ${styles.barCardHeading}`} />
      <div className={`${styles.bar} ${styles.barFull}`} />
      <div className={`${styles.bar} ${styles.barMedium}`} />
      <div className={`${styles.bar} ${styles.barButton}`} />
    </div>
  );
}

/**
 * Skeleton loader for card-style list and grid views.
 * Screen readers hear a single polite status message; the skeleton visuals are aria-hidden.
 */
const SkeletonListLoading: React.FC<SkeletonListLoadingProps> = ({
  count,
  layout = "list",
  className = "",
  isActive = true,
  ariaLabel,
}) => {
  const Global = useTranslations("Global");

  if (!isActive) {
    return null;
  }

  const message = ariaLabel ?? Global("messaging.loadingList");
  const isGrid = layout === "grid";
  const itemCount = clampCount(count ?? (isGrid ? DEFAULT_GRID_COUNT : DEFAULT_LIST_COUNT));
  const containerClassName = [styles.container, className].filter(Boolean).join(" ");

  return (
    <div
      className={containerClassName}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      data-testid="skeleton-list-loading"
    >
      <span
        className={styles.srOnly}
        data-testid="skeleton-list-loading-message"
      >
        {message}
      </span>
      <div
        className={isGrid ? styles.grid : styles.list}
        aria-hidden="true"
      >
        {Array.from({ length: itemCount }, (_, index) =>
          isGrid ? <SkeletonGridCard key={index} /> : <SkeletonListItem key={index} />
        )}
      </div>
    </div>
  );
};

export default SkeletonListLoading;
