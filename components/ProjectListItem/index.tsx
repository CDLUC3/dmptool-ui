import { useId, useState, type HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ProjectItemPlanProps, ProjectItemProps } from "@/app/types";
import { TransitionLink } from "@/components/Form";
import ExpandButton from "@/components/ExpandButton";
import { routePath } from "@/utils/index";
import styles from "./projectList.module.scss";

// Known plan statuses (see PlanStatus enum) mapped to their badge style
const PLAN_STATUS_CLASS: Record<string, string> = {
  DRAFT: styles.planStatusDraft,
  COMPLETE: styles.planStatusComplete,
  ARCHIVED: styles.planStatusArchived,
};

type ProjectListItemProps = {
  item: ProjectItemProps;
  isReadOnly?: boolean;
} & HTMLAttributes<HTMLDivElement>;

function ProjectListItem({ item, isReadOnly, ...rest }: ProjectListItemProps) {
  const [expanded, setExpanded] = useState<boolean>(item.defaultExpanded);
  const t = useTranslations("ProjectOverview");
  const Global = useTranslations("Global");
  const generatedId = useId().replace(/:/g, "");
  const instanceId = item.id != null ? `project-${item.id}` : `project-${generatedId}`;
  const expandedContentId = `${instanceId}-content`;
  const headingId = `${instanceId}-heading`;
  const plansHeadingId = `${instanceId}-plans`;

  const validMembers = item.members?.filter((member) => member.name && member.name.trim()) || [];
  const hasFunding = Boolean(item.funding?.trim());
  const funders = hasFunding ? item.funding!.split(",").map((f) => f.trim()).filter(Boolean) : [];
  const plans = item.plans ?? [];
  const relatedWorksCount = item.relatedWorksCount;

  const createPlanLink =
    item.createPlanLink ??
    (item.id != null ? routePath("projects.dmp.start", { projectId: item.id }) : undefined);

  const funderLabel = hasFunding
    ? funders.length > 1
      ? t("funderSummary", { name: funders[0], count: funders.length - 1 })
      : funders[0]
    : t("noFunderSelected");

  // Collaborator summary for the status bar
  const collaboratorLabel = (() => {
    if (typeof item.collaboratorCount === "number") {
      if (item.collaboratorCount <= 0) {
        return t("collaboratorsNone");
      }
      if (item.collaboratorCount === 1) {
        return t("collaboratorsJustYou");
      }
      return t("collaboratorsYouAndOthers", { count: item.collaboratorCount - 1 });
    }

    if (validMembers.length > 0) {
      return t("collaboratorsNamed", { name: validMembers[0].name, count: validMembers.length - 1 });
    }

    return t("collaboratorsNone");
  })();

  // Translate known statuses; fall back to the raw value for anything unexpected
  const planStatusLabel = (status: string) => {
    const key = status.toUpperCase();
    return key in PLAN_STATUS_CLASS ? t(`planStatus.${key}`) : status;
  };

  const renderPlanName = (plan: ProjectItemPlanProps) =>
    plan.link ? (
      <Link href={plan.link} className={styles.planNameLink}>
        {plan.name}
      </Link>
    ) : (
      plan.name
    );

  const expandAction = expanded ? Global("buttons.linkCollapse") : Global("buttons.linkExpand");

  return (
    <div className={styles.projectItem} role="listitem" {...rest}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <h2 id={headingId} className={styles.projectTitle}>
              {item.link ? (
                <Link href={item.link} className={styles.titleLink}>
                  <span className={styles.titleText}>{item.title}</span>
                </Link>
              ) : (
                <span className={styles.titleText}>{item.title}</span>
              )}
            </h2>

            <p className={styles.fundingLine}>
              <span>
                {t("funding")}: {funderLabel}
              </span>
              {item.grantId && (
                <span className={styles.fundingGrant}>
                  {t("grantId")}: {item.grantId}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          {item.link && (
            <TransitionLink
              href={item.link}
              aria-label={`${isReadOnly ? Global("buttons.view") : t("openProject")} ${item.title}`}
              className={styles.openProjectLink}
            >
              {isReadOnly ? Global("buttons.view") : t("openProject")}
            </TransitionLink>
          )}
        </div>
      </div>

      <div
        id={expandedContentId}
        className={styles.expandedPanel}
        role="region"
        aria-labelledby={headingId}
        data-expanded={expanded}
        inert={!expanded}
        aria-hidden={!expanded}
      >
        <div className={styles.expandedClip}>
          <div className={styles.expandedContent}>
        <section className={styles.plansBlock} aria-labelledby={plansHeadingId}>
          <div className={styles.plansHead}>
            <h3 id={plansHeadingId} className={styles.plansHeading}>
              {t("plansInProject")}
            </h3>
            {createPlanLink && !isReadOnly && (
              <>
                <span className={styles.plansHeadSep} aria-hidden="true">•</span>
                <TransitionLink href={createPlanLink} className={styles.createPlanLink}>
                  {t("createNewDmpInProject")}
                </TransitionLink>
              </>
            )}
          </div>

          {plans.length === 0 ? (
            <p className={styles.noPlans}>{t("noPlansYet")}</p>
          ) : (
            <table className={styles.plansTable}>
              <thead>
                <tr>
                  <th scope="col">{t("plan")}</th>
                  <th scope="col">{t("statusColumn")}</th>
                  <th scope="col">{t("yourRole")}</th>
                  <th scope="col">{t("updated")}</th>
                  <th scope="col">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => {
                  const statusKey = plan.status?.toUpperCase() ?? "";
                  const statusClass = PLAN_STATUS_CLASS[statusKey] ?? styles.planStatusDraft;
                  return (
                    <tr key={plan.link ?? `${plan.name}-${index}`}>
                      <td data-label={t("plan")}>{renderPlanName(plan)}</td>
                      <td data-label={t("statusColumn")}>
                        {plan.status ? (
                          <span className={`${styles.planStatus} ${statusClass}`}>
                            {planStatusLabel(plan.status)}
                          </span>
                        ) : (
                          <span className={styles.cellEmpty}>—</span>
                        )}
                      </td>
                      <td data-label={t("yourRole")}>
                        {plan.role ?? <span className={styles.cellEmpty}>—</span>}
                      </td>
                      <td data-label={t("updated")}>
                        {plan.modified ?? <span className={styles.cellEmpty}>—</span>}
                      </td>
                      <td data-label={t("actions")} className={styles.planActionsCell}>
                        {plan.link && (
                          <TransitionLink
                            href={plan.link}
                            className={styles.openPlanLink}
                            aria-label={`${t("openPlan")} ${plan.name}`}
                          >
                            {t("openPlan")}
                          </TransitionLink>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
          </div>
        </div>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusBarItems} role="group" aria-label={t("projectSummary")}>
          {item.modified && (
            <span className={styles.statusItem}>{t("lastUpdatedOn", { date: item.modified })}</span>
          )}
          <span className={styles.statusItem}>{t("planCount", { count: plans.length })}</span>
          <span className={styles.statusItem}>{collaboratorLabel}</span>
          {typeof relatedWorksCount === "number" && (
            <span className={`${styles.statusItem} ${relatedWorksCount > 0 ? styles.statusItemAlert : ""}`}>
              {t("relatedWorksFound", { count: relatedWorksCount })}
            </span>
          )}
        </div>

        <ExpandButton
          className="link"
          aria-controls={expandedContentId}
          collapseLabel={Global("buttons.linkCollapse")}
          expandLabel={Global("buttons.linkExpand")}
          aria-label={Global("messaging.detailsToggleAria", { action: expandAction, title: item.title })}
          screenReaderText={t("projectDetails")}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>
    </div>
  );
}

export default ProjectListItem;
