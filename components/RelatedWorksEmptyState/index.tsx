import React, { ReactNode, useId } from "react";
import { DmpIcon } from "@/components/Icons";
import styles from "./RelatedWorksEmptyState.module.scss";

export interface RelatedWorksEmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const RelatedWorksEmptyState = ({ icon, title, description, actions }: RelatedWorksEmptyStateProps) => {
  const headingId = useId();

  return (
    <section
      className={styles.emptyState}
      aria-labelledby={headingId}
      data-testid="related-works-empty-state"
    >
      <span className={styles.icon}>
        <DmpIcon
          icon={icon}
          fill="currentColor"
          width="28px"
          height="28px"
        />
      </span>
      <h3
        id={headingId}
        className={styles.title}
      >
        {title}
      </h3>
      {description && <p className={styles.description}>{description}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
};

export default RelatedWorksEmptyState;
