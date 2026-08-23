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
import { parseResearchOutputsFromAnswers, outputTypeLabel } from './researchOutputParsing';
import styles from './landing.module.scss';

type PlanSnapshot = NonNullable<PublicPlanVersionByDmpIdQuery['publicPlanVersionByDMPId']>;


/* Related Works*/
type RelatedWorkAuthor = {
  givenName?: string | null;
  surname?: string | null;
  full?: string | null;
};

type RelatedWorkItem = {
  id?: number | null;
  workVersion: {
    title?: string | null;
    publicationDate?: string | null;
    workType: string;
    publicationVenue?: string | null;
    sourceName: string;
    sourceUrl?: string | null;
    authors: RelatedWorkAuthor[];
    work: { doi: string };
  };
};

type ArchivedPlanViewProps = {
  snapshot: PlanSnapshot;
  jsonUrl?: string;
  pdfDownloadUrl?: string;
  canDownloadPdf: boolean;
  handleDownloadPdfAction: () => Promise<void>;
  writtenForOrg?: {
    name: string;
    displayName?: string | null;
    homepage?: string | null;
  };
  dmpId: string;
};

function formatDate(dateStr?: string | null, includeTime = false): string {
  if (!dateStr) return '';
  const date = new Date(Date.parse(dateStr));
  if (isNaN(date.getTime())) return dateStr;
  const parts = date.toDateString().split(' ');
  const formatted = `${parts[2]} ${parts[1]} ${parts[3]}`;
  if (!includeTime) return formatted;
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${formatted} ${time}`;
}

function ArchivedVersionsDropdown({
  versions,
  currentTimestamp,
  dmpId,
}: {
  versions: { timestamp?: string | null; url?: string | null }[];
  currentTimestamp?: string | null;
  dmpId?: string;
}) {
  const dedupedByTimestamp = new Map<string, { timestamp?: string | null; url?: string | null }>();
  for (const v of versions) {
    if (!v.timestamp) continue;
    const existing = dedupedByTimestamp.get(v.timestamp);
    if (!existing || (existing.url?.includes('?version=') && !v.url?.includes('?version='))) {
      dedupedByTimestamp.set(v.timestamp, v);
    }
  }

  const allVersions = Array.from(dedupedByTimestamp.values())
    .sort((a, b) => (a.timestamp! > b.timestamp! ? -1 : 1));

  const hasVersions = allVersions.length > 0;
  const shortDoi = dmpId?.replace('https://doi.org/', '') || '';

  return (
    <MenuTrigger>
      <Button className={styles.versionsDropdownToggle} isDisabled={!hasVersions}>
        <strong>Version:</strong> {formatDate(currentTimestamp, true)}
        {hasVersions && <span className={styles.chevron} aria-hidden="true" />}
      </Button>
      {hasVersions && (
        <Popover className={styles.versionsDropdownMenu} placement="bottom end">
          <Menu>
            {allVersions.map((v, i) => {
              const isCurrent = v.timestamp === currentTimestamp || (currentTimestamp === 'latest' && i === 0);
              const versionUrl = isCurrent
                ? `/dmps/${shortDoi}`
                : `/dmps/${shortDoi}?version=${encodeURIComponent(v.timestamp!)}`;

              return (
                <MenuItem
                  key={i}
                  href={versionUrl}
                  className={styles.versionsDropdownItem}
                >
                  {formatDate(v.timestamp, true)}
                  {isCurrent ? ' (current)' : ''}
                </MenuItem>
              );
            })}
          </Menu>
        </Popover>
      )}
    </MenuTrigger>
  );
}

function formatAuthorsForCitation(authors?: RelatedWorkAuthor[] | null): string {
  if (!authors || authors.length === 0) return '';

  const displayName = (a: RelatedWorkAuthor) =>
    [a.givenName, a.surname].filter(Boolean).join(' ') || a.full || '';

  const names = authors.map(displayName).filter(Boolean);
  if (names.length === 0) return '';

  const first = authors[0];
  const firstFormatted =
    [first.surname, first.givenName].filter(Boolean).join(', ') || first.full || names[0];

  if (names.length === 1) return firstFormatted;

  const rest = names.slice(1);
  if (rest.length === 1) return `${firstFormatted}, and ${rest[0]}`;

  return `${firstFormatted}, ${rest.slice(0, -1).join(', ')}, and ${rest[rest.length - 1]}`;
}


function fundingStatusLabel(status?: ProjectFundingStatus | null): string {
  switch (status) {
    case ProjectFundingStatus.Granted: return 'Awarded';
    case ProjectFundingStatus.Denied: return 'Denied';
    default: return 'Planned';
  }
}

function fundingStatusClass(status?: ProjectFundingStatus | null): string {
  switch (status) {
    case ProjectFundingStatus.Granted: return styles.statusBadgeGranted;
    case ProjectFundingStatus.Denied: return styles.statusBadgeDenied;
    default: return styles.statusBadgePlanned;
  }
}

function relatedWorkTypeLabel(workType?: string | null): string {
  if (!workType) return 'Other';
  const spaced = workType.replace(/_/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function RelatedWorkCitation({ item }: { item: RelatedWorkItem }) {
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
        t('noCitationInfo')
      </>
    );
  }


  let year: number | null = null;
  if (wv?.publicationDate) {
    try {
      const parsedDate = new Date(wv.publicationDate);
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

function groupRelatedWorksByType(
  items?: {
    __typename?: "RelatedWorkSearchResult";
    id?: number | null;
    workVersion: {
      __typename?: "WorkVersion";
      title?: string | null;
      publicationDate?: string | null;
      workType: WorkType;
      publicationVenue?: string | null;
      sourceName: string;
      sourceUrl?: string | null;
      authors: {
        givenName?: string | null;
        surname?: string | null;
        full?: string | null;
      }[];
      work: {
        doi: string;
      };
    };
  }[] | null,
): { type: string; items: typeof items }[] {
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

export default function ArchivedPlanView({
  snapshot,
  jsonUrl,
  pdfDownloadUrl,
  canDownloadPdf,
  handleDownloadPdfAction,
  writtenForOrg,
  dmpId
}: ArchivedPlanViewProps) {

  const t = useTranslations('LandingPage');

  const title = snapshot.title || snapshot.project?.title || 'Untitled DMP';
  const fundings = snapshot?.fundings ?? [];
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
            <div className={styles.titleTopRow}>
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
                {snapshot.versionedTemplate && (
                  <p className={styles.titleTemplateInfo}>
                    {writtenForOrg
                      ? t.rich('templateInfoWithOrg', {
                        orgName: writtenForOrg.displayName || writtenForOrg.name,
                        orgLink: (chunks) =>
                          writtenForOrg.homepage ? (
                            <a
                              href={writtenForOrg.homepage}
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
              </div>
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
                  aria-label="Download the data management plan (downloads a PDF, opens in a new tab)"
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
          </div>
        </div>
      </div>

      {(snapshot.dmpId || (snapshot.versions && snapshot.versions.length > 0)) && (
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
            {snapshot.versions && snapshot.versions.length > 0 && (
              <ArchivedVersionsDropdown
                versions={snapshot.versions}
                currentTimestamp={snapshot.versionTimestamp}
                dmpId={snapshot.dmpId || ''}
              />
            )}
          </div>
        </div>
      )}

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
                        <span className={styles.contributorPrimaryBadge}>Primary Contact</span>
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
                              aria-label={`ORCID profile for ${member.name}`}
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
              <p style={{ fontSize: 'var(--fs-small)', marginBottom: 'var(--space-2)' }}>
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
              <p
                style={{
                  fontSize: 'var(--fs-small)',
                  marginTop: 'var(--space-4)',
                  marginBottom: 'var(--space-2)',
                }}
              >
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
                        <span className={styles.dataLabel}>Status:</span>
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
                        <span className={styles.dataLabel}>Funder:</span>
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
                        <span className={styles.dataLabel}>Project Number:</span>
                        <span className={styles.dataValue}>{funding.funderProjectNumber}</span>
                      </li>
                    )}
                    {funding.grantId && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>Grant:</span>
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
                  <h3 className={styles.itemTitle}>{output.title || 'Untitled output'}</h3>
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
                          <RelatedWorkCitation item={item as RelatedWorkItem} />
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
            This product is a service of the{' '}
            <a href="https://uc3.cdlib.org/" target="_blank" rel="noopener noreferrer">
              University of California Curation Center
            </a>{' '}
            of the{' '}
            <a href="http://www.cdlib.org" target="_blank" rel="noopener noreferrer">
              California Digital Library
            </a>
            .
          </p>
          <p>Copyright 2010–{new Date().getFullYear()} The Regents of the University of California.</p>
        </div>
      </footer>
    </div >
  );
}