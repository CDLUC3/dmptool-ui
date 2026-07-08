"use client";

import React from "react";
import styles from "./skeletonListLoading.module.scss";

interface SkeletonListLoadingProps {
  /** Number of skeleton list items to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether the loading state is active */
  isActive?: boolean;
  /**
   * Accessible loading message announced to screen readers.
   * Pass a localized string, e.g. Global('messaging.loading') or a specific label
   * such as "Loading projects".
   */
  ariaLabel?: string;
}

const MIN_COUNT = 1;
const MAX_COUNT = 20;
const DEFAULT_COUNT = 5;
const DEFAULT_ARIA_LABEL = "Loading list, please wait";

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

/**
 * Generic skeleton loader for card-style list views.
 * Renders decorative placeholder cards while list data loads.
 *
 * Screen readers hear a single polite status message; skeleton visuals are hidden.
 */
const SkeletonListLoading: React.FC<SkeletonListLoadingProps> = ({
  count = DEFAULT_COUNT,
  className = "",
  isActive = true,
  ariaLabel = DEFAULT_ARIA_LABEL,
}) => {
  if (!isActive) {
    return null;
  }

  const itemCount = clampCount(count);
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
        {ariaLabel}
      </span>
      <div
        className={styles.list}
        aria-hidden="true"
      >
        {Array.from({ length: itemCount }, (_, index) => (
          <SkeletonListItem key={index} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonListLoading;
