'use client';

import { useTranslations } from 'next-intl';
import {
  ResearchOutputTableAnswerSchema,
  ResearchOutputTableColumnsEnum,
  type ResearchOutputTableAnswerType,
  type ResearchOutputTableRowAnswerType,
  type AnyResearchOutputTableColumnAnswerType,
} from '@dmptool/types';

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
import { PublicPlanVersionByDmpIdQuery } from '@/generated/graphql';

//Utils and other
import { parseResearchOutputsFromAnswers, outputTypeLabel } from './researchOutputParsing';

// Reuse the exact same section-card / list styling as the live landing page
import styles from './landing.module.scss';

type PlanSnapshot = NonNullable<PublicPlanVersionByDmpIdQuery['publicPlanVersionByDMPId']>;

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

// function outputTypeLabel(type?: string | null): string {
//   if (!type) return '';
//   const spaced = type.replace(/[-_]/g, ' ');
//   return spaced.charAt(0).toUpperCase() + spaced.slice(1);
// }

/* ---- Reuses the exact same research-output parsing as the live page,
   since the raw JSON shape is identical between live answers and
   narrative-derived snapshot answers ---- */
type ParsedOutput = {
  title?: string;
  description?: string;
  type?: string;
  issued?: string;
  byteSize?: number;
  byteSizeUnit?: string;
  hosts: { url?: string; name?: string }[];
  metadataStandards: { uri?: string; name?: string }[];
  licenses: { uri?: string; name?: string }[];
};

function getColumn<Id extends AnyResearchOutputTableColumnAnswerType['commonStandardId']>(
  columns: AnyResearchOutputTableColumnAnswerType[],
  commonStandardId: Id
): Extract<AnyResearchOutputTableColumnAnswerType, { commonStandardId: Id }> | undefined {
  return columns.find(
    (c): c is Extract<AnyResearchOutputTableColumnAnswerType, { commonStandardId: Id }> =>
      c.commonStandardId === commonStandardId
  );
}

function parseRow(row: ResearchOutputTableRowAnswerType): ParsedOutput {
  const columns = row.columns;
  const titleCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.title);
  const descriptionCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.description);
  const typeCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.type);
  const issuedCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.issued);
  const byteSizeCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.byte_size);
  const hostCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.host);
  const metadataCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.metadata);
  const licenseCol = getColumn(columns, ResearchOutputTableColumnsEnum.enum.license_ref);

  return {
    title: titleCol?.answer,
    description: descriptionCol?.answer,
    type: typeCol?.answer,
    issued: issuedCol?.answer,
    byteSize: byteSizeCol?.answer?.value,
    byteSizeUnit: byteSizeCol?.answer?.context,
    hosts: (hostCol?.answer ?? []).map((h) => ({ url: h.repositoryId, name: h.repositoryName })),
    metadataStandards: (metadataCol?.answer ?? []).map((m) => ({
      uri: m.metadataStandardId,
      name: m.metadataStandardName,
    })),
    licenses: (licenseCol?.answer ?? []).map((l) => ({ uri: l.licenseId, name: l.licenseName })),
  };
}

// function parseSnapshotOutputs(answers?: { id?: number | null; json?: string | null }[] | null): ParsedOutput[] {
//   if (!answers) return [];
//   const outputs: ParsedOutput[] = [];

//   for (const ans of answers) {
//     if (!ans?.json) continue;
//     let rawJson: unknown;
//     try {
//       rawJson = JSON.parse(ans.json);
//     } catch {
//       continue;
//     }
//     const result = ResearchOutputTableAnswerSchema.safeParse(rawJson);
//     if (!result.success) continue;
//     const tableAnswer: ResearchOutputTableAnswerType = result.data;
//     for (const row of tableAnswer.answer) {
//       outputs.push(parseRow(row));
//     }
//   }
//   return outputs;
// }

/* ---- Small archived-specific version dropdown, since the snapshot's
   {timestamp, url} shape doesn't match the live VersionsDropdown's
   {modified, dmpId} props ---- */
function ArchivedVersionsList({
  versions,
  currentTimestamp,
}: {
  versions: { timestamp?: string | null; url?: string | null }[];
  currentTimestamp?: string | null;
}) {
  const pastVersions = versions
    .filter((v) => v.timestamp && v.timestamp !== currentTimestamp)
    .sort((a, b) => (a.timestamp! > b.timestamp! ? -1 : 1));

  if (pastVersions.length === 0) return null;

  return (
    <div className={styles.subBandDoi}>
      <strong>Other versions:</strong>{' '}
      {pastVersions.map((v, i) => (
        <span key={i}>
          {i > 0 && ', '}
          {v.url ? (
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              {formatDate(v.timestamp, true)}
            </a>
          ) : (
            formatDate(v.timestamp, true)
          )}
        </span>
      ))}
    </div>
  );
}

function ArchivedVersionsDropdown({
  versions,
  currentTimestamp,
  liveHref,
}: {
  versions: { timestamp?: string | null; url?: string | null }[];
  currentTimestamp?: string | null;
  liveHref: string;
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
              const isCurrent = v.timestamp === currentTimestamp;
              return (
                <MenuItem
                  key={i}
                  href={isCurrent ? liveHref : (v.url ?? '#')}
                  className={styles.versionsDropdownItem}
                >
                  {formatDate(v.timestamp, true)}
                  {isCurrent ? ' (current — click to return to live page)' : ''}
                </MenuItem>
              );
            })}
          </Menu>
        </Popover>
      )}
    </MenuTrigger>
  );
}

export default function ArchivedPlanView({ snapshot }: { snapshot: PlanSnapshot }) {
  const t = useTranslations('LandingPage');

  const title = snapshot.title || snapshot.project?.title || 'Untitled DMP';
  const fundings = snapshot?.fundings ?? [];
  const members = snapshot.members ?? [];
  const outputs = parseResearchOutputsFromAnswers(snapshot.answers);
  const relatedWorkIdentifiers = snapshot.relatedWorkIdentifiers ?? [];

  const citationNames = members.map((m) => m.name).filter((n): n is string => !!n);
  const citationYear = snapshot.created
    ? new Date(Date.parse(snapshot.created)).getFullYear()
    : new Date().getFullYear();

  return (
    <div className={styles.landingPage}>
      {/* Archived-version banner */}
      <div className={styles.subBand} style={{ background: 'var(--messaging-info, #eef4fb)' }}>
        <div className={styles.subBandInner}>
          <p className={styles.subBandDoi}>
            <strong>Archived version</strong> — viewing this DMP as it existed on{' '}
            {formatDate(snapshot.versionTimestamp, true)}
          </p>
          <ArchivedVersionsList versions={snapshot.versions ?? []} currentTimestamp={snapshot.versionTimestamp} />
        </div>
      </div>

      <div className={styles.topBand}>
        <div className={styles.titleBlock}>
          <div className={styles.titleInner}>
            <div className={styles.titleTopRow}>
              <div className={styles.titleMain}>
                <h1 className={styles.titleH1}>{title}</h1>
                <p className={styles.titleSubtitle}>
                  {snapshot.registered ? t('registeredDMP') : t('dataManagementPlan')}
                </p>
                {snapshot.versionedTemplate && (
                  <p className={styles.titleTemplateInfo}>
                    Based on template: {snapshot.versionedTemplate.title}
                    {snapshot.versionedTemplate.version ? ` (${snapshot.versionedTemplate.version})` : ''}
                  </p>
                )}
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
                liveHref={`/dmps/${snapshot.dmpId?.replace('https://doi.org/', '')}`}
              />
            )}
          </div>
        </div>
      )}

      <main id="mainContent" className={styles.landingContent}>
        <div className={styles.contentInner}>
          {/* Contributors */}
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

          {/* Citation */}
          {citationNames.length > 0 && snapshot.dmpId && (
            <section className={styles.dmpSection} aria-labelledby="citation-heading">
              <h2 id="citation-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.citation')}
              </h2>
              <div className={styles.citationBlock}>
                {citationNames.join(', ')} ({citationYear}). &ldquo;{title}&rdquo;. [{t('dataManagementPlan')}].
                DMPTool.{' '}
                <a href={snapshot.dmpId} target="_blank" rel="noopener noreferrer">
                  {snapshot.dmpId}
                </a>
              </div>
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
                        <span className={styles.dataValue}>{funding.status}</span>
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
                  style={{
                    marginBottom: idx < outputs.length - 1 ? 'var(--space-5)' : 0,
                    paddingBottom: idx < outputs.length - 1 ? 'var(--space-5)' : 0,
                    borderBottom: idx < outputs.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  }}
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

          {/* Related Works — bare DOI list only; full citations unavailable in archived snapshots */}
          {relatedWorkIdentifiers.length > 0 && (
            <section className={styles.dmpSection} aria-labelledby="related-works-heading">
              <h2 id="related-works-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.relatedWorks')}
              </h2>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--gray-500)', marginBottom: 'var(--space-2)' }}>
                Full citation details aren&apos;t available for archived versions.
              </p>
              <ul className={styles.dataList}>
                {relatedWorkIdentifiers.map((doi, i) => (
                  <li key={i} className={styles.workItem}>

                    <a
                      href={doi.startsWith('http') ? doi : `https://doi.org/${doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {doi}
                    </a>
                  </li>
                ))}
              </ul>
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