import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ProjectItemProps } from "@/app/types";
import { TransitionLink } from "@/components/Form";
import styles from "./projectList.module.scss";
import ExpandButton from "@/components/ExpandButton";

function ProjectListItem({ item }: { item: ProjectItemProps }) {
  const [expanded, setExpanded] = useState<boolean>(item.defaultExpanded);
  const t = useTranslations("ProjectOverview");
  const Global = useTranslations("Global");

  // Create unique IDs for ARIA relationships
  const expandedContentId = `${item.title.toLowerCase().replace(/\s+/g, "-")}-content`;
  const headingId = `${item.title.toLowerCase().replace(/\s+/g, "-")}-heading`;

  // Process collaborators data
  const validMembers = item.members?.filter((member) => member.name && member.name.trim()) || [];
  const firstMember = validMembers[0];
  const othersCount = validMembers.length - 1;

  return (
    <div
      className={styles.projectItem}
      role="listitem"
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <section aria-labelledby={headingId}>
            <h2
              id={headingId}
              className={styles.projectTitle}
            >
              {item.link ? (
                <Link
                  href={item.link}
                  aria-label={`${Global("buttons.linkUpdate")} ${item.title}`}
                  className={styles.titleLink}
                >
                  {item.title}
                </Link>
              ) : (
                item.title
              )}
            </h2>

            {/* Plans section */}
            {item.plans && item.plans.length > 0 && (
              <div className={styles.plansSection}>
                <h3 className={styles.plansHeading}>{item.plans.length === 1 ? t("plan") : t("plans")}</h3>
                {item.plans.map((plan, index) => (
                  <div
                    key={index}
                    className={styles.planItem}
                  >
                    {plan.name}
                    {plan.dmpId && <span className={styles.planDoi}> ({plan.dmpId})</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Consolidated metadata row: funder, collaborators, last updated */}
            {(item.funding || validMembers.length > 0 || item.modified) && (
              <div
                className={styles.metadataRow}
                role="group"
                aria-label="Project metadata"
              >
                {/* Funder info */}
                {item.funding && item.funding.trim() && (
                  <span
                    className={styles.metadataItem}
                    aria-label="Funder"
                  >
                    <span className={styles.srOnly}>Funder: </span>
                    {(() => {
                      const funders = item.funding.split(",");
                      if (funders.length > 1) {
                        const additionalCount = funders.length - 1;
                        return `${funders[0].trim()} & ${additionalCount} more`;
                      }
                      return item.funding;
                    })()}
                  </span>
                )}

                {/* Collaborators info */}
                {validMembers.length > 0 && (
                  <span
                    className={styles.metadataItem}
                    aria-label="Collaborators"
                  >
                    <span className={styles.srOnly}>Collaborators: </span>
                    {firstMember?.name}
                    {othersCount > 0 && <span className={styles.othersCount}> and {othersCount} others</span>}
                  </span>
                )}

                {/* Last modified date */}
                {item.modified && (
                  <span
                    className={styles.metadataItem}
                    aria-label="Last updated"
                  >
                    <span className={styles.srOnly}>Last updated: </span>
                    {item.modified}
                  </span>
                )}
              </div>
            )}
          </section>
        </div>

        <div className={styles.actions}>
          {item.link && (
            <TransitionLink
              href={item.link}
              aria-label={`${Global("buttons.linkUpdate")} ${item.title}`}
              className={`react-aria-Button react-aria-Button--primary ${styles.updateButton}`}
            >
              {Global("buttons.linkUpdate")}
            </TransitionLink>
          )}

          <ExpandButton
            aria-controls={expandedContentId}
            collapseLabel={Global("buttons.linkCollapse")}
            expandLabel={Global("buttons.linkExpand")}
            aria-label={`${expanded ? Global("buttons.linkCollapse") : Global("buttons.linkExpand")} details for ${item.title}`}
            screenReaderText={t("projectDetails")}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        </div>
      </div>

      {expanded && (
        <div
          id={expandedContentId}
          className={styles.expandedContent}
          role="region"
          aria-labelledby={headingId}
        >
          <section>
            <div className={styles.detailsGrid}>
              {/* Project Details Section */}
              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>{t("project")}</h4>
                {(item.startDate || item.endDate) && (
                  <>
                    <p className={styles.contentText}>
                      <strong>{t("dates")}:</strong> {item.startDate || "Not set"} to {item.endDate || "Not set"}
                    </p>
                  </>
                )}
              </div>

              {/* Funders Section */}
              {item.funding && (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionTitle}>{t("fundings")}</h4>
                  <ul className={styles.fundersList}>
                    {item.funding.split(",").map((funder, index) => (
                      <li
                        key={index}
                        className={styles.contentText}
                      >
                        {funder.trim()} {item.grantId && index === 0 && `(${item.grantId})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Project Members Section */}
              {validMembers.length > 0 && (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionTitle}>{t("projectMembers")}</h4>
                  <p className={styles.contentText}>
                    {validMembers.map((member, index) => (
                      <span key={index}>
                        {member.name}
                        {index < validMembers.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Research Outputs Section */}
              <div className={styles.detailSection}>
                <h4 className={styles.sectionTitle}>{t("researchOutputs")}</h4>
                <p className={styles.contentText}>
                  <strong>0 outputs</strong>
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ProjectListItem;
