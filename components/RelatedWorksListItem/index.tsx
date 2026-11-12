import React, { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import styles from "./RelatedWorksListItem.module.scss";
import { TransitionButton } from "@/components/Form";
import ExpandButton from "@/components/ExpandButton";
import ExpandableNameList from "@/components/ExpandableNameList";
import ExternalLink from "@/components/ExternalLink";
import SafeHtml from "@/components/SafeHtml";
import { doiToUrl, orcidToUrl, rorToUrl } from "@/lib/identifierUtils";
import {
  RelatedWorkSearchResult,
  RelatedWorksIdentifierType,
  RelatedWorkSourceType,
  RelatedWorkStatus
} from "@/generated/graphql";
import { formatAuthorNameFirstLast, formatAuthorNames } from "@/lib/relatedWorks";

const MAX_ITEMS = 10;
const MAX_AUTHOR_CHARS = 40;

export type RelatedWorkAction = "confirm" | "dismiss" | "restore" | "unmatch";

type ActionButton = { action: RelatedWorkAction; variant: "primary" | "link" };

const ACTION_BUTTONS: Record<RelatedWorkStatus, ActionButton[]> = {
  [RelatedWorkStatus.Pending]: [
    { action: "dismiss", variant: "link" },
    { action: "confirm", variant: "primary" },
  ],
  [RelatedWorkStatus.Rejected]: [
    { action: "restore", variant: "link" },
    { action: "confirm", variant: "primary" },
  ],
  [RelatedWorkStatus.Accepted]: [{ action: "unmatch", variant: "link" }],
};

export interface RelatedWorksListItemProps {
  identifierType: RelatedWorksIdentifierType;
  relatedWork: RelatedWorkSearchResult;
  onAction: (relatedWorkId: number, action: RelatedWorkAction) => Promise<void>;
  highlightMatches?: boolean;
  isPlanPublished?: boolean;
}

function RelatedWorksListItem({
  identifierType,
  relatedWork,
  onAction,
  highlightMatches = false,
  isPlanPublished = true,
}: RelatedWorksListItemProps) {
  const t = useTranslations("RelatedWorksListItem");
  const dataTypes = useTranslations("RelatedWorksDataTypes");
  const Global = useTranslations("Global");
  const formatter = useFormatter();

  const [expanded, setExpanded] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<RelatedWorkAction | null>(null);

  const headingId = useId();
  const detailsId = useId();

  const { workVersion, status } = relatedWork;
  const doi = workVersion.work.doi;
  const title = workVersion.title || doi;
  const isUserAdded = relatedWork.sourceType === RelatedWorkSourceType.UserAdded;
  const publicationYear = workVersion.publicationDate ? new Date(workVersion.publicationDate).getFullYear() : null;
  const subtitleParts = [
    formatAuthorNames(workVersion.authors, MAX_AUTHOR_CHARS),
    workVersion.publicationVenue,
    publicationYear,
  ].filter((part) => part != null && part !== "");

  const formatDate = (value: string | null | undefined): string => {
    if (value == null || value === "") return "";
    const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return formatter.dateTime(date, { day: "numeric", month: "short", year: "numeric" });
  };

  const actionButtons = ACTION_BUTTONS[status] ?? [];

  const runAction = async (action: RelatedWorkAction) => {
    setPendingAction(action);
    try {
      await onAction(relatedWork.id as number, action);
    } finally {
      setPendingAction(null);
    }
  };

  const likelihood =
    relatedWork.confidence != null
      ? `${t("fieldNames.likelihood")}: ${dataTypes(`confidence.${relatedWork.confidence}`)}`
      : null;
  const dateFound = `${t("fieldNames.dateFound")}: ${formatDate(relatedWork.created)}`;
  const workType = `${t("fieldNames.type")}: ${dataTypes(`workType.${workVersion.workType}`)}`;
  const source = (
    <>
      {t("fieldNames.source")}:&nbsp;
      {workVersion.sourceUrl != null ? (
        <ExternalLink
          href={workVersion.sourceUrl}
          className={styles.sourceUrl}
        >
          {workVersion.sourceName}
        </ExternalLink>
      ) : (
        workVersion.sourceName
      )}
    </>
  );

  const statusItems: React.ReactNode[] = [];
  if (identifierType === RelatedWorksIdentifierType.ProjectId && relatedWork.planTitle) {
    statusItems.push(
      <>
        {t("fieldNames.planTitle")}: {relatedWork.planTitle}
        {!isPlanPublished && <span className={styles.unpublishedTag}>{t("badges.unpublished")}</span>}
      </>,
    );
  }
  if (status === RelatedWorkStatus.Pending) {
    statusItems.push(dateFound, workType, source, likelihood);
  } else if (status === RelatedWorkStatus.Accepted) {
    statusItems.push(
      isUserAdded
        ? `${t("fieldNames.dateAdded")}: ${formatDate(relatedWork.created)}`
        : `${t("fieldNames.dateConfirmed")}: ${formatDate(relatedWork.modified)}`,
      workType,
      source,
    );
  } else if (status === RelatedWorkStatus.Rejected) {
    statusItems.push(
      `${t("fieldNames.dateDismissed")}: ${formatDate(relatedWork.modified)}`,
      dateFound,
      workType,
      source,
      likelihood,
    );
  }

  const expandAction = expanded ? Global("buttons.linkCollapse") : Global("buttons.linkExpand");
  const doiLink = <ExternalLink href={doiToUrl(doi)}>{doi}</ExternalLink>;

  return (
    <div
      className={styles.relatedWorksItem}
      role="listitem"
      data-testid={doi}
    >
      <div className={styles.body}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h3
              id={headingId}
              className={styles.title}
            >
              <ExternalLink href={doiToUrl(doi)}>
                <span className={styles.titleText}>{title}</span>
              </ExternalLink>
            </h3>
            {subtitleParts.length > 0 && (
              <p className={styles.subtitle}>
                {subtitleParts.map((part, i) => (
                  <span key={i}>{part}</span>
                ))}
              </p>
            )}
            {status === RelatedWorkStatus.Accepted && (
              <span
                className={`${styles.badge} ${isUserAdded ? "" : styles.badgeMatch}`.trim()}
                data-testid="sourceBadge"
              >
                {isUserAdded ? t("badges.addedManually") : t("badges.confirmedMatch")}
              </span>
            )}
          </div>

          {actionButtons.length > 0 && (
            <div className={styles.actions}>
              {actionButtons.map(({ action, variant }) => (
                <TransitionButton
                  key={action}
                  className={variant === "primary" ? "primary" : `link ${styles.linkButton}`}
                  aria-label={t(`actionsAria.${action}`, { title })}
                  isDisabled={pendingAction != null && pendingAction !== action}
                  showLoading={false}
                  loadingLabel={t(`buttons.loading.${action}`)}
                  onPress={() => runAction(action)}
                >
                  {t(`buttons.${action}`)}
                </TransitionButton>
              ))}
            </div>
          )}
        </div>

        <div
          id={detailsId}
          className={styles.expandedPanel}
          role="region"
          aria-labelledby={headingId}
          data-expanded={expanded}
          inert={!expanded}
          aria-hidden={!expanded}
        >
          <div className={styles.expandedClip}>
            <div
              className={`${styles.details} ${highlightMatches ? styles.showContentHighlights : styles.hideContentHighlights}`}
            >
              {status !== RelatedWorkStatus.Rejected && (
                <p className={styles.reviewInstructions}>{t("instructions.review")}</p>
              )}

              <div className={styles.detailsItem}>
                <h4>{t("fieldNames.doi")}</h4>
                <div>{relatedWork.doiMatch?.found ? <mark>{doiLink}</mark> : doiLink}</div>
              </div>

              <div className={styles.detailsItem}>
                <h4>{t("fieldNames.title")}</h4>
                {relatedWork.contentMatch?.titleHighlight != null ? (
                  <SafeHtml
                    html={relatedWork.contentMatch.titleHighlight}
                    as="div"
                    plainTextWrapper="div"
                  />
                ) : (
                  <div>{workVersion.title}</div>
                )}
              </div>

              {relatedWork.contentMatch?.abstractHighlights != null &&
                relatedWork.contentMatch.abstractHighlights.length > 0 && (
                  <div className={styles.detailsItem}>
                    <h4>{t("fieldNames.abstract")}</h4>
                    {relatedWork.contentMatch.abstractHighlights.map((abstract, i) => (
                      <SafeHtml
                        key={i}
                        html={abstract}
                        as="div"
                        plainTextWrapper="div"
                      />
                    ))}
                  </div>
                )}

              {workVersion.authors.length > 0 && (
                <div className={styles.detailsItem}>
                  <h4>{t("fieldNames.authors")}</h4>
                  <div>
                    <ExpandableNameList
                      items={workVersion.authors}
                      matches={relatedWork.authorMatches}
                      maxItems={MAX_ITEMS}
                      renderItem={(author, isMatch) => {
                        const className = isMatch && highlightMatches ? styles.match : undefined;
                        return author.orcid == null ? (
                          <span className={className}>{formatAuthorNameFirstLast(author)}</span>
                        ) : (
                          <ExternalLink
                            href={orcidToUrl(author.orcid)}
                            className={className}
                          >
                            {formatAuthorNameFirstLast(author)}
                          </ExternalLink>
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {workVersion.institutions.length > 0 && (
                <div className={styles.detailsItem}>
                  <h4>{t("fieldNames.institutions")}</h4>
                  <div>
                    <ExpandableNameList
                      items={workVersion.institutions}
                      matches={relatedWork.institutionMatches}
                      maxItems={MAX_ITEMS}
                      renderItem={(institution, isMatch) => {
                        const className = isMatch && highlightMatches ? styles.match : undefined;
                        return institution.ror == null ? (
                          <span className={className}>{institution.name}</span>
                        ) : (
                          <ExternalLink
                            href={rorToUrl(institution.ror)}
                            className={className}
                          >
                            {institution.name}
                          </ExternalLink>
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {workVersion.awards.length > 0 && (
                <div className={styles.detailsItem}>
                  <h4>{t("fieldNames.awardIds")}</h4>
                  <div>
                    <ExpandableNameList
                      items={workVersion.awards}
                      matches={relatedWork.awardMatches}
                      maxItems={MAX_ITEMS}
                      renderItem={(award, isMatch) => (
                        <span className={isMatch && highlightMatches ? styles.match : undefined}>{award.awardId}</span>
                      )}
                    />
                  </div>
                </div>
              )}

              {workVersion.funders.length > 0 && (
                <div className={styles.detailsItem}>
                  <h4>{t("fieldNames.funders")}</h4>
                  <div>
                    <ExpandableNameList
                      items={workVersion.funders}
                      matches={relatedWork.funderMatches}
                      maxItems={MAX_ITEMS}
                      renderItem={(funder, isMatch) => {
                        const className = isMatch && highlightMatches ? styles.match : undefined;
                        return funder.ror == null ? (
                          <span className={className}>{funder.name}</span>
                        ) : (
                          <ExternalLink
                            href={rorToUrl(funder.ror)}
                            className={className}
                          >
                            {funder.name}
                          </ExternalLink>
                        );
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statusBar}>
        <div
          className={styles.statusBarItems}
          role="group"
          aria-label={t("summaryLabel")}
        >
          {statusItems
            .filter((item) => item != null && item !== false && item !== "")
            .map((item, i) => (
              <span
                key={i}
                className={styles.statusItem}
              >
                {item}
              </span>
            ))}
        </div>

        <ExpandButton
          className="link"
          aria-controls={detailsId}
          collapseLabel={Global("buttons.linkCollapse")}
          expandLabel={Global("buttons.linkExpand")}
          aria-label={Global("messaging.detailsToggleAria", { action: expandAction, title })}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      </div>
    </div>
  );
}

export default RelatedWorksListItem;
