'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components';
// Components
import SafeHtml from '@/components/SafeHtml';
import { OrcidIcon } from '@/components/Icons/orcid/';
import {
  PublicPlanVersionByDmpIdQuery,
  WorkType,
  ProjectFundingStatus,
} from '@/generated/graphql';
import { DmpIcon } from "@/components/Icons";
//Utils and other
import { useFormatDateWithMonth } from '@/hooks/useFormatDate';
import { parseResearchOutputsFromAnswers, outputTypeLabel } from './researchOutputParsing';
import styles from './landing.module.scss';

type PlanSnapshot = NonNullable<PublicPlanVersionByDmpIdQuery['publicPlanVersionByDMPId']>;
type RelatedWorkQueryItem = NonNullable<PlanSnapshot['relatedWorks']>[number];
type RelatedWorkAuthorItem = RelatedWorkQueryItem['workVersion']['authors'][number];
type RelatedFundingItem = NonNullable<PlanSnapshot['fundings']>[number];

type ArchivedPlanViewProps = {
  snapshot: PlanSnapshot;
  jsonUrl?: string;
  canDownloadPdf: boolean;
  handleDownloadPdfAction: () => Promise<void>;
};

// This component is used to display a dropdown of all the versions available for this plan
function ArchivedVersionsDropdown({
  versions,
  currentTimestamp,
  latestTimestamp,
  dmpId,
}: {
  versions: { timestamp?: string | null; url?: string | null }[];
  currentTimestamp?: string | null;
  latestTimestamp?: string | null;
  dmpId?: string;
}) {
  const formatDate = useFormatDateWithMonth();

  const dedupedByTimestamp = new Map<string, { timestamp?: string | null; url?: string | null; isLatest?: boolean }>();

  if (latestTimestamp) {
    dedupedByTimestamp.set(latestTimestamp, { timestamp: latestTimestamp, url: null, isLatest: true });
  }

  for (const v of versions) {
    if (!v.timestamp) continue;
    if (v.timestamp === latestTimestamp) continue;
    const existing = dedupedByTimestamp.get(v.timestamp);
    if (!existing || (existing.url?.includes('?version=') && !v.url?.includes('?version='))) {
      dedupedByTimestamp.set(v.timestamp, v);
    }
  }

  const allVersions = Array.from(dedupedByTimestamp.values())
    .sort((a, b) => (a.timestamp! > b.timestamp! ? -1 : 1));

  const displayTimestamp =
    currentTimestamp === 'latest' ? latestTimestamp : currentTimestamp;

  // Only show entries that are NOT the currently-viewed version
  const otherVersions = allVersions.filter((v) => {
    const isCurrent = v.isLatest
      ? currentTimestamp === 'latest'
      : v.timestamp === currentTimestamp;
    return !isCurrent;
  });

  const hasOtherVersions = otherVersions.length > 0;
  const shortDoi = dmpId?.replace('https://doi.org/', '') || '';

  return (
    <MenuTrigger>
      <Button className={styles.versionsDropdownToggle} isDisabled={!hasOtherVersions}>
        <strong>Version:</strong> {formatDate(displayTimestamp, true)}
        {hasOtherVersions && <span className={styles.chevron} aria-hidden="true" />}
      </Button>
      {hasOtherVersions && (
        <Popover className={styles.versionsDropdownMenu} placement="bottom end">
          <Menu>
            {otherVersions.map((v, i) => {
              const versionUrl = v.isLatest
                ? `/dmps/${shortDoi}`
                : `/dmps/${shortDoi}?version=${encodeURIComponent(v.timestamp!)}`;

              return (
                <MenuItem
                  key={i}
                  href={versionUrl}
                  className={styles.versionsDropdownItem}
                >
                  {formatDate(v.timestamp, true)}
                </MenuItem>
              );
            })}
          </Menu>
        </Popover>
      )}
    </MenuTrigger>
  );
}

// If there are no versions, this will just display the current version's timestamp.
function CurrentVersionDisplay({
  currentTimestamp,
  latestTimestamp,
}: {
  currentTimestamp?: string | null;
  latestTimestamp?: string | null;
}) {
  const formatDate = useFormatDateWithMonth();

  const displayTimestamp =
    currentTimestamp === 'latest' ? latestTimestamp : currentTimestamp;

  return (
    <div className={styles.versionsDropdownToggle}>
      <strong>Version:</strong> {formatDate(displayTimestamp, true)}
    </div>
  );
}

// Joins funder names into "A", "A and B", or "A, B, and C" for the template
// attribution line
function formatFunderNamesForTemplate(fundings: RelatedFundingItem[]): string {
  const names = fundings.map((f) => f.funderName).filter((n): n is string => !!n);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];

  const rest = names.slice(1);
  if (rest.length === 1) return `${names[0]} and ${rest[0]}`;

  return `${names[0]}, ${rest.slice(0, -1).join(', ')}, and ${rest[rest.length - 1]}`;
}

// Get authors names for citation, formatted as "Surname, Given Name" or "Full Name" if no given/surname. 
function formatAuthorsForCitation(authors?: RelatedWorkAuthorItem[] | null): string {
  if (!authors || authors.length === 0) return '';

  const displayName = (a: RelatedWorkAuthorItem) =>
    [a.givenName, a.surname].filter(Boolean).join(' ') || a.full || '';// The filter(Boolean) removes empty strings

  const names = authors.map(displayName).filter(Boolean); // Put names into an array and filter out any empty strings.
  if (names.length === 0) return '';

  const first = authors[0];
  const firstFormatted =
    [first.surname, first.givenName].filter(Boolean).join(', ') || first.full || names[0];

  if (names.length === 1) return firstFormatted;

  const rest = names.slice(1);
  if (rest.length === 1) return `${firstFormatted}, and ${rest[0]}`; // If there's only one other author, just return "First, and Second"

  return `${firstFormatted}, ${rest.slice(0, -1).join(', ')}, and ${rest[rest.length - 1]}`; // Add the rest of the authors, with a comma before the last one
}


// Get a label for the funding status, e.g., "Awarded", "Denied", or "Planned"
function fundingStatusLabel(status?: ProjectFundingStatus | null): string {
  switch (status) {
    case ProjectFundingStatus.Granted: return 'Awarded';
    case ProjectFundingStatus.Denied: return 'Denied';
    default: return 'Planned';
  }
}

// Get a CSS class for the funding status, e.g., "statusBadgeGranted", "statusBadgeDenied", or "statusBadgePlanned"
function fundingStatusClass(status?: ProjectFundingStatus | null): string {
  switch (status) {
    case ProjectFundingStatus.Granted: return styles.statusBadgeGranted;
    case ProjectFundingStatus.Denied: return styles.statusBadgeDenied;
    default: return styles.statusBadgePlanned;
  }
}

// Get a label for the related work type, e.g., "Article", "Dataset", etc. If the work type is not recognized, return "Other"
function relatedWorkTypeLabel(workType?: string | null): string {
  if (!workType) return 'Other';
  const spaced = workType.replace(/_/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Render a single related work item as a citation, e.g., "Smith, J. (2020). "Title of the Work." [Article]. 
// Journal Name. https://doi.org/10.1234/abcd"
function RelatedWorkCitation({ item, t }: { item: RelatedWorkQueryItem; t: ReturnType<typeof useTranslations> }) {
  const wv = item.workVersion;
  const authors = wv?.authors ?? [];
  const url = wv?.sourceUrl || (wv?.work?.doi ? `https://doi.org/${wv.work.doi}` : null);

  const hasCitableMetadata = !!wv?.title || authors.length > 0;

  if (!hasCitableMetadata) {
    return (
      <>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        )}{' '}
        {t('noCitationInfo')}
      </>
    );
  }

  let year: number | null = null;
  if (wv?.publicationDate) {
    try {
      // publicationDate may come through as either an epoch-ms string
      // (e.g. "1499817600000") or a standard date string (e.g. "2017-07-12").
      const isEpochMs = /^\d+$/.test(wv.publicationDate);
      const parsedDate = isEpochMs
        ? new Date(Number(wv.publicationDate))
        : new Date(wv.publicationDate);

      if (!isNaN(parsedDate.getTime())) {
        year = parsedDate.getFullYear();
      }
    } catch {
      // Silently fail, year stays null
    }
  }
  const typeLabel = relatedWorkTypeLabel(wv?.workType);
  const venue = wv?.publicationVenue || wv?.sourceName;
  const authorsStr = formatAuthorsForCitation(authors);

  return (
    <>
      {authorsStr && <>{authorsStr}. </>}
      {year && !isNaN(year) && <>{year}. </>}
      {wv?.title && <>&#8220;{wv.title}.&#8221; </>}
      [{typeLabel}].{' '}
      {venue && <><i>{venue}</i>. </>}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      )}
      {url && '.'}
    </>
  );
}

// Group related works by their work type, returning an array of objects with the work type and the items of that type. 
// The order of the groups is alphabetical, with "Other" always last.
function groupRelatedWorksByType(
  items?: RelatedWorkQueryItem[] | null,
): { type: string; items: RelatedWorkQueryItem[] }[] {
  if (!items || items.length === 0) return [];

  const groups = new Map<string, typeof items>();

  for (const item of items) {
    const key = item.workVersion?.workType || WorkType.Other;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const orderedKeys = [
    ...Array.from(groups.keys()).filter((k) => k !== WorkType.Other).sort(),
    ...(groups.has(WorkType.Other) ? [WorkType.Other] : []),
  ];

  return orderedKeys.map((type) => ({ type, items: groups.get(type)! }));
}

/**
 * Renders the public-facing view of a DMP (Data Management Plan) snapshot —
 * either the current/live version or a specific historical version, since
 * both share the same `PlanVersionSnapshot` shape from `PublicPlanVersionByDMPId`.
 *
 * Displays the plan's title, contributors, project details, citation info,
 * funding sources, planned research outputs, abstract, and related works,
 * along with a version picker for navigating between historical snapshots.
 *
 * @param snapshot - The plan version snapshot to render, fetched via the
 *   `publicPlanVersionByDMPId` query. May represent the "latest" version
 *   or a specific historical timestamp.
 * @param jsonUrl - Optional URL to the plan's raw narrative JSON, linked in
 *   the header as an alternate machine-readable view.
 * @param canDownloadPdf - Whether the PDF download button should be shown,
 *   based on the plan's visibility (only public plans can be downloaded).
 * @param handleDownloadPdfAction - Callback invoked when the user clicks the
 *   PDF download button; handles fetching and triggering the file download.
 * @param writtenForOrg - Optional organization the plan's template was
 *   written for, used to render attribution text near the plan's template info.
 *
 * @returns The rendered plan landing page, or its constituent sections
 *   (contributors, funding, outputs, related works, etc.) conditionally
 *   based on which data is present on the snapshot.
 */
export default function ArchivedPlanView({
  snapshot,
  jsonUrl,
  canDownloadPdf,
  handleDownloadPdfAction,
}: ArchivedPlanViewProps) {

  // Localization keys
  const t = useTranslations('LandingPage');

  // Format data hook for displaying dates with month names (e.g., "January 1, 2024")
  const formatDate = useFormatDateWithMonth();

  const title = snapshot.title || snapshot.project?.title || t('untitledPlan');
  const fundings = snapshot?.fundings ?? [];
  const templateFundings = fundings.filter((f) => f.funderName);
  const members = snapshot.members ?? [];
  const outputs = parseResearchOutputsFromAnswers(snapshot.answers);
  const relatedWorksGroups = groupRelatedWorksByType(snapshot.relatedWorks);
  const citationNames = members.map((m) => m.name).filter((n): n is string => !!n);
  const citationYear = snapshot.created
    ? new Date(Date.parse(snapshot.created)).getFullYear()
    : new Date().getFullYear();

  return (
    <div className={styles.landingPage}>
      <div className={styles.topBand}>
        <div className={styles.titleBlock}>
          <div className={styles.titleInner}>
            {/* <div className={styles.titleTopRow}> */}
            <div className={styles.titleMain}>
              <a
                href="https://dmptool.org/"
                target="_blank"
                rel="noopener noreferrer"
                title={t('dmpTool')}
                className={styles.titleLogo}
                aria-label={`${t('dmpTool')} (${t('opensInNewWindow')})`}
              >
                <Image
                  src="/images/DMP-logo-white.svg"
                  width={90}
                  height={13}
                  alt="DMP Tool"
                  loading="eager"
                  priority
                />
              </a>
              <h1 className={styles.titleH1}>{title}</h1>
              <p className={styles.titleSubtitle}>
                {snapshot.registered ? t('registeredDMP') : t('dataManagementPlan')}
              </p>

            </div>
            <div className={styles.subTitleWrapper}>
              {snapshot.versionedTemplate && (
                <p className={styles.titleTemplateInfo}>
                  {templateFundings.length > 0
                    ? t.rich('templateInfoWithOrg', {
                      orgName: formatFunderNamesForTemplate(templateFundings),
                      orgLink: (chunks) =>
                        templateFundings.length === 1 && templateFundings[0].funderUri ? (
                          < a
                            href={templateFundings[0].funderUri}
                            className={styles.templateInfoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {chunks}
                          </a>
                        ) : (
                          <>{chunks}</>
                        ),
                      dmptoolLink: (chunks) => (
                        <a
                          href="https://dmptool.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {chunks}
                        </a>
                      ),
                    })
                    : t.rich('templateInfoWithoutOrg', {
                      dmptoolLink: (chunks) => (
                        <a
                          href="https://dmptool.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                </p>
              )}
              <div className={styles.titleActionsCorner}>
                {jsonUrl && (
                  <a href={jsonUrl} className={styles.jsonLink} target="_blank" rel="noopener noreferrer">
                    {t('viewAsJson')}
                    <span className={styles.jsonLinkArrow} aria-hidden="true">↗</span>
                    <span className="hidden-accessibly"> ({t('opensInNewWindow')})</span>
                  </a>
                )}
                {canDownloadPdf && (<Button
                  type="button"
                  onPress={handleDownloadPdfAction}
                  className={`${styles.downloadButton} secondary`}
                  aria-label={t('ariaLabel.downloadPlan')}
                >
                  {t.rich('downloadPlan', {
                    pdfLabel: (chunks) => (
                      <span className={styles.downloadText}>{chunks}</span>
                    ),
                  })}
                  <DmpIcon icon="download" aria-hidden="true" classes={styles.downloadIcon} />
                </Button>)}
              </div>
            </div>
            {/* </div> */}
          </div>
        </div >
      </div >

      {
        (snapshot.dmpId || (snapshot.versions && snapshot.versions.length > 0)) && (
          <div className={styles.subBand}>
            <div className={styles.subBandInner}>
              {snapshot.dmpId && (
                <p className={styles.subBandDoi}>
                  <strong>{t('dmpId')}:</strong>{' '}
                  <a href={snapshot.dmpId} target="_blank" rel="noopener noreferrer">
                    {snapshot.dmpId.replace('https://doi.org/', '')}
                  </a>
                </p>
              )}
              {(snapshot.versions && snapshot.versions.length > 0) ? (
                <ArchivedVersionsDropdown
                  versions={snapshot.versions}
                  currentTimestamp={snapshot.versionTimestamp}
                  latestTimestamp={snapshot.latestVersionTimestamp}
                  dmpId={snapshot.dmpId || ''}
                />
              ) : (
                <CurrentVersionDisplay
                  currentTimestamp={snapshot.versionTimestamp}
                  latestTimestamp={snapshot.latestVersionTimestamp}
                />
              )}
            </div>
          </div>
        )
      }

      <main id="mainContent" className={styles.landingContent}>
        <div className={styles.contentInner}>
          {/* Contributors */}
          {members.length > 0 && (
            <section className={styles.dmpSection} aria-labelledby="contributors-heading">
              <h2 id="contributors-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.contributors')}
              </h2>
              <div className={styles.contributorsList}>
                {members.map((member, idx) => {
                  if (!member.name) return null;
                  return (
                    <div key={idx} className={styles.contributorRow}>
                      <span className={styles.contributorName}>{member.name}</span>
                      {member.isPrimaryContact && (
                        <span className={styles.contributorPrimaryBadge}>{t('primaryContact')}</span>
                      )}
                      <span className={styles.contributorMeta}>
                        {member.memberRoles && member.memberRoles.length > 0 && (
                          <span>
                            {' · '}
                            {member.memberRoles.map((role, i) => (
                              <span key={role.id ?? i}>
                                {(role.uri && role.label !== "No Role Assigned") ? (
                                  <a href={role.uri} target="_blank" rel="noopener noreferrer">
                                    {role.label}
                                  </a>
                                ) : (
                                  role.label
                                )}
                                {i < member.memberRoles!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </span>
                        )}
                        {member.orcid && (
                          <>
                            <span aria-hidden="true">
                              <OrcidIcon icon="orcid" classes={styles.orcidLogo} width="18px" height="18px" />
                            </span>
                            <a
                              href={member.orcid}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t('ariaLabel.orcidProfile', { member: member.name })}
                            >
                              {member.orcid}
                            </a>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Project Details */}
          {snapshot.project && (
            <section className={styles.dmpSection} aria-labelledby="project-heading">
              <h2 id="project-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.projectDetails')}
              </h2>
              <ul className={styles.dataList}>
                {snapshot.project.researchDomain?.name && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('researchDomain')}:</span>
                    <span className={styles.dataValue}>{snapshot.project.researchDomain.name}</span>
                  </li>
                )}
                {snapshot.project.startDate && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('projectStart')}:</span>
                    <span className={styles.dataValue}>{formatDate(snapshot.project.startDate)}</span>
                  </li>
                )}
                {snapshot.project.endDate && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('projectEnd')}:</span>
                    <span className={styles.dataValue}>{formatDate(snapshot.project.endDate)}</span>
                  </li>
                )}
                {snapshot.created && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('dmpCreated')}:</span>
                    <span className={styles.dataValue}>{formatDate(snapshot.created, true)}</span>
                  </li>
                )}
                {snapshot.modified && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('dmpLastModified')}:</span>
                    <span className={styles.dataValue}>{formatDate(snapshot.modified, true)}</span>
                  </li>
                )}
              </ul>
            </section>
          )}

          {citationNames.length > 0 && snapshot.dmpId && (
            <section className={styles.dmpSection} aria-labelledby="citation-heading">
              <h2 id="citation-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.citation')}
              </h2>
              <p className={styles.citationLabel}>
                <strong>{t('whenCitingThisDMP')}:</strong>
              </p>
              <div className={styles.citationBlock}>
                {citationNames.join(', ')} ({citationYear}). &ldquo;{title}&rdquo;. [{t('dataManagementPlan')}].
                {t('DMPTool')}.{' '}
                {snapshot.dmpId && (
                  <a href={snapshot.dmpId} target="_blank" rel="noopener noreferrer">
                    {snapshot.dmpId}
                  </a>
                )}
              </div>
              <p className={styles.citationDmpIdInfo}>

                {snapshot.dmpId && (
                  <strong>
                    {(() => {
                      const dmpId = snapshot.dmpId;
                      return t.rich('dmpIdInfo', {
                        dmpId,
                        dmpIdLink: (chunks) => (
                          <a
                            href={dmpId}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {chunks}
                          </a>
                        ),
                      });
                    })()}
                  </strong>
                )}
              </p>
            </section>
          )}

          {/* Funding */}
          {fundings.length > 0 && (
            <section className={styles.dmpSection} aria-labelledby="funding-heading">
              <h2 id="funding-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.fundingStatusAndSources')}
              </h2>
              {fundings.map((funding, idx) => (
                <div
                  key={idx}
                  className={idx < fundings.length - 1 ? styles.fundingItemWithBorder : undefined}
                >
                  <ul className={styles.dataList}>
                    {funding.status && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('funding.status')}:</span>
                        <span className={styles.dataValue}>
                          <span
                            className={`${styles.statusBadge} ${fundingStatusClass(funding.status)}`}
                          >
                            {fundingStatusLabel(funding.status)}
                          </span>
                        </span>
                      </li>
                    )}
                    {funding.funderName && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('funding.funder')}:</span>
                        <span className={styles.dataValue}>
                          {funding.funderUri ? (
                            <a href={funding.funderUri} target="_blank" rel="noopener noreferrer">
                              {funding.funderName}
                            </a>
                          ) : (
                            funding.funderName
                          )}
                        </span>
                      </li>
                    )}
                    {funding.funderOpportunityNumber && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('fundingOpportunity')}:</span>
                        <span className={styles.dataValue}>{funding.funderOpportunityNumber}</span>
                      </li>
                    )}
                    {funding.funderProjectNumber && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('funding.projectNumber')}:</span>
                        <span className={styles.dataValue}>{funding.funderProjectNumber}</span>
                      </li>
                    )}
                    {funding.grantId && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('funding.grant')}:</span>
                        <span className={styles.dataValue}>{funding.grantId}</span>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Planned Outputs */}
          {outputs.length > 0 && (
            <section className={styles.dmpSection} aria-labelledby="outputs-heading">
              <h2 id="outputs-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.plannedOutputs')}
              </h2>
              {outputs.map((output, idx) => (
                <div
                  key={idx}
                  className={idx < outputs.length - 1 ? styles.outputItemWithBorder : styles.outputItem}
                >
                  <h3 className={styles.itemTitle}>{output.title || t('output.UntitledOutput')}</h3>
                  {output.description && (
                    <div style={{ margin: 'var(--space-2) 0' }}>
                      <SafeHtml html={output.description} />
                    </div>
                  )}
                  <ul className={styles.dataList}>
                    {output.type && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('output.format')}:</span>
                        <span className={styles.dataValue}>{outputTypeLabel(output.type)}</span>
                      </li>
                    )}
                    {output.metadataStandards.length > 0 && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('output.metaDataStandards')}:</span>
                        <span className={styles.dataValue}>
                          {output.metadataStandards.map((ms, i) => (
                            <span key={i}>
                              {ms.uri ? (
                                <a href={ms.uri} target="_blank" rel="noopener noreferrer">{ms.name || ms.uri}</a>
                              ) : (
                                ms.name
                              )}
                              {i < output.metadataStandards.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </li>
                    )}
                    {(output.byteSize || output.byteSizeUnit) && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('output.anticipatedVolume')}:</span>
                        <span className={styles.dataValue}>{output.byteSize} {output.byteSizeUnit}</span>
                      </li>
                    )}
                    {output.issued && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('output.releaseTimeline')}:</span>
                        <span className={styles.dataValue}>{formatDate(output.issued)}</span>
                      </li>
                    )}
                    {output.hosts.length > 0 && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('output.intendedRepository')}:</span>
                        <span className={styles.dataValue}>
                          {output.hosts.map((h, i) => (
                            <span key={i}>
                              {h.url ? (
                                <a href={h.url} target="_blank" rel="noopener noreferrer">{h.name || h.url}</a>
                              ) : (
                                h.name
                              )}
                              {i < output.hosts.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </li>
                    )}
                    {output.licenses.length > 0 && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('output.licenseForReuse')}:</span>
                        <span className={styles.dataValue}>
                          {output.licenses.map((l, i) => (
                            <span key={i}>
                              {l.uri ? (
                                <a href={l.uri} target="_blank" rel="noopener noreferrer">{l.name || l.uri}</a>
                              ) : (
                                l.name
                              )}
                              {i < output.licenses.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Abstract */}
          {snapshot.project?.abstractText && (
            <section className={styles.dmpSection} aria-labelledby="abstract-heading">
              <h2 id="abstract-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.projectDescription')}
              </h2>
              <SafeHtml html={snapshot.project.abstractText} />
            </section>
          )}

          {/* Related Works */}
          {relatedWorksGroups.length > 0 && (
            <section className={styles.dmpSection} aria-labelledby="related-works-heading">
              <h2 id="related-works-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.relatedWorks')}
              </h2>
              {relatedWorksGroups.map((group) => (
                <div key={group.type} className={styles.worksCategory}>
                  <h3 className={styles.worksCategoryTitle}>{relatedWorkTypeLabel(group.type)}</h3>
                  <ul className={styles.dataList}>
                    {group.items?.map((item) => (
                      <li key={item?.id} className={styles.workItem}>
                        <p>
                          <RelatedWorkCitation item={item} t={t} />
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      </main >
      <footer className={styles.landingFooter}>
        <div className={styles.landingFooterInner}>
          <p>
            {t.rich('footer.serviceOf', {
              uc3Link: (chunks) => (
                <a href="https://uc3.cdlib.org/" target="_blank" rel="noopener noreferrer">
                  {chunks}
                </a>
              ),
              cdlLink: (chunks) => (
                <a href="http://www.cdlib.org" target="_blank" rel="noopener noreferrer">
                  {chunks}
                </a>
              ),
            })}
          </p>
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div >
  );
}