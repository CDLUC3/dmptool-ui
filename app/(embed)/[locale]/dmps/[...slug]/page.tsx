'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components';
import { useQuery } from '@apollo/client/react';
import {
  ProjectFundingStatus,
  PublicPlanByDmpIdDocument
} from '@/generated/graphql';
import SafeHtml from '@/components/SafeHtml';
import Loading from '@/components/Loading';
import { DmpIcon } from "@/components/Icons";
import { OrcidIcon } from '@/components/Icons/orcid/';
import styles from './landing.module.scss';

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

function outputTypeLabel(type?: string | null): string {
  if (!type) return '';
  const spaced = type.replace(/[-_]/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function VersionsDropdown({
  versions,
  currentModified,
}: {
  versions: Array<{ timestamp?: string | null; url?: string | null }>;
  currentModified?: string | null;
}) {
  const pastVersions = versions
    .filter((v) => v.timestamp && v.timestamp !== currentModified)
    .sort((a, b) => (a.timestamp! > b.timestamp! ? -1 : 1));

  const hasPastVersions = pastVersions.length > 0;

  return (
    <MenuTrigger>
      <Button
        className={styles.versionsDropdownToggle}
        isDisabled={!hasPastVersions}
      >
        <strong>Version:</strong> {formatDate(currentModified, true)}
        {hasPastVersions && <span className={styles.chevron} aria-hidden="true" />}
      </Button>
      {hasPastVersions && (
        <Popover className={styles.versionsDropdownMenu} placement="bottom end">
          <Menu>
            {pastVersions.map((v, i) => (
              <MenuItem key={i} href={v.url ?? '#'} className={styles.versionsDropdownItem}>
                {formatDate(v.timestamp, true)}
              </MenuItem>
            ))}
          </Menu>
        </Popover>
      )}
    </MenuTrigger>
  );
}

export default function DmpLandingPage() {
  const params = useParams();

  // Localization keys
  const t = useTranslations('LandingPage');

  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug ?? ''];
  const rawDoi = slugParts.join('/');
  const dmpId = rawDoi.startsWith('https://doi.org/')
    ? rawDoi
    : `https://doi.org/${rawDoi}`;
  const shortDoi = rawDoi.replace('https://doi.org/', '');

  const { data: publicPlanData, loading: publicPlanLoading, error: publicPlanError } = useQuery(PublicPlanByDmpIdDocument, {
    variables: { dmpId },
  });

  if (publicPlanLoading) {
    return (
      <div className={styles.landingPage}>
        <div className={styles.loadingState}>
          <Loading />
        </div>
      </div>
    );
  }

  const plan = publicPlanData?.publicPlanByDMPId;

  if (!plan || publicPlanError) {
    return (
      <div className={styles.landingPage}>
        <div className={styles.notFound}>
          <h2>DMP Not Found</h2>
          <p>
            We could not find a published data management plan for{' '}
            <strong>{shortDoi}</strong>.
          </p>
          <p>This plan may be private, or the identifier may be incorrect.</p>
        </div>
      </div>
    );
  }

  const title = plan.title || plan.project?.title || 'Untitled DMP';
  const fundings = plan.project?.fundings ?? [];
  const members = plan.project?.members ?? [];
  const primaryContact = members.find((m) => m.isPrimaryContact);
  const primaryContactName = primaryContact
    ? [primaryContact.givenName, primaryContact.surName].filter(Boolean).join(' ')
    : undefined;
  const outputs = plan.outputs ?? [];
  const versions = plan.versions;

  /* Citation helpers */
  const investigators = members
    .map((m) => {
      return [m.givenName, m.surName].filter(Boolean).join(' ');
    })
    .filter(Boolean);

  const citationNames = investigators.length > 0
    ? investigators
    : (primaryContactName ? [primaryContactName] : []);
  const citationYear = plan.created
    ? new Date(Date.parse(plan.created)).getFullYear()
    : new Date().getFullYear();

  const pdfDownloadParams = new URLSearchParams({
    dmpId: shortDoi,
    includeCoverPage: 'true',
    includeSectionHeadings: 'true',
    includeQuestionText: 'true',
  });
  const pdfDownloadUrl = `/api/download-narrative?${pdfDownloadParams.toString()}`;
  const jsonUrl = plan.dmpId;

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(pdfDownloadUrl, {
        headers: { Accept: 'application/pdf' },
      });

      if (!response.ok) {
        // handle error as appropriate for this page
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // handle error as appropriate for this page
    }
  };

  const writtenForOrg = plan.versionedTemplate?.owner;

  return (
    <div className={styles.landingPage}>
      <div className={styles.topBand}>
        {/* Title block - title/subtitle on the left, actions pinned top-right */}
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
                  {plan.registered ? 'Registered Data Management Plan' : 'Data Management Plan'}
                </p>
                {plan.versionedTemplate && (
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
                <Button
                  type="button"
                  onPress={handleDownloadPdf}
                  className={styles.pdfLink}
                  aria-label="Download the data management plan (downloads a PDF, opens in a new tab)"
                >
                  <DmpIcon icon="pdf" aria-hidden="true" classes={styles.downloadIcon} />
                  {t.rich('downloadPlan', {
                    pdfLabel: (chunks) => (
                      <span className={styles.downloadText}>{chunks}</span>
                    ),
                  })}
                </Button>
                {jsonUrl && (
                  <a href={jsonUrl} className={styles.jsonLink} target="_blank" rel="noopener noreferrer">
                    {t('viewAsJson')}
                    <span className={styles.jsonLinkArrow} aria-hidden="true">↗</span>
                    <span className="hidden-accessibly"> ({t('opensInNewWindow')})</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-band - DMP ID (left) and version dropdown (right); DMP ID stacks
          above the version dropdown on narrow screens */}
      {(plan.dmpId || (versions && versions.length > 0)) && (
        <div className={styles.subBand}>
          <div className={styles.subBandInner}>
            {plan.dmpId && (
              <p className={styles.subBandDoi}>
                <strong>DMP ID:</strong>{' '}
                <a href={plan.dmpId} target="_blank" rel="noopener noreferrer">
                  {shortDoi}
                </a>
              </p>
            )}
            {versions && versions.length > 0 && (
              <VersionsDropdown versions={versions} currentModified={plan.modified} />
            )}
          </div>
        </div>
      )}

      {/* Main content */}
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
                  const fullName = [member?.givenName, member?.surName]
                    .filter(Boolean)
                    .join(' ');
                  if (!fullName) return null;
                  return (
                    <div key={member.id ?? idx} className={styles.contributorRow}>
                      <span className={styles.contributorName}>{fullName}</span>
                      {member.isPrimaryContact && (
                        <span className={styles.contributorPrimaryBadge}>Primary Contact</span>
                      )}
                      <span className={styles.contributorMeta}>
                        {member?.memberRoles && member.memberRoles.length > 0 && (
                          <span>
                            {' · '}
                            {member.memberRoles.map((role, i) => (
                              <span key={role.id ?? i}>
                                {role.uri ? (
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
                        {member?.orcid && (
                          <>
                            <span aria-hidden="true">
                              <OrcidIcon icon="orcid" classes={styles.orcidLogo} width="18px" height="18px" />
                            </span>
                            <a
                              href={`https://orcid.org/${member.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`ORCID profile for ${fullName}`}
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
          {plan.project && (
            <section className={styles.dmpSection} aria-labelledby="project-heading">
              <h2 id="project-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.projectDetails')}
              </h2>
              <ul className={styles.dataList}>
                {plan.project.researchDomain?.name && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('researchDomain')}:</span>
                    <span className={styles.dataValue}>
                      {plan.project.researchDomain.uri ? (
                        <a
                          href={plan.project.researchDomain.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {plan.project.researchDomain.name}
                        </a>
                      ) : (
                        plan.project.researchDomain.name
                      )}
                    </span>
                  </li>
                )}
                {plan.project.startDate && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('projectStart')}:</span>
                    <span className={styles.dataValue}>
                      {formatDate(plan.project.startDate)}
                    </span>
                  </li>
                )}
                {plan.project.endDate && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('projectEnd')}:</span>
                    <span className={styles.dataValue}>
                      {formatDate(plan.project.endDate)}
                    </span>
                  </li>
                )}
                {plan.created && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('dmpCreated')}:</span>
                    <span className={styles.dataValue}>
                      {formatDate(plan.created, true)}
                    </span>
                  </li>
                )}
                {plan.modified && (
                  <li className={styles.dataItem}>
                    <span className={styles.dataLabel}>{t('dmpLastModified')}:</span>
                    <span className={styles.dataValue}>
                      {formatDate(plan.modified, true)}
                    </span>
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Citation */}
          {citationNames.length > 0 && plan.dmpId && (
            <section className={styles.dmpSection} aria-labelledby="citation-heading">
              <h2 id="citation-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.citation')}
              </h2>
              <p style={{ fontSize: 'var(--fs-small)', marginBottom: 'var(--space-2)' }}>
                <strong>{t('whenCitingThisDMP')}:</strong>
              </p>
              <div className={styles.citationBlock}>
                {citationNames.join(', ')} ({citationYear}){'. '}
                &ldquo;{title}&rdquo;{'. '}
                [{t('dataManagementPlan')}]{'. '}
                DMPTool{'. '}
                <a href={plan.dmpId} target="_blank" rel="noopener noreferrer">
                  {plan.dmpId}
                </a>
              </div>
              <p
                style={{
                  fontSize: 'var(--fs-small)',
                  marginTop: 'var(--space-4)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {dmpId && (
                  <strong>
                    {t.rich('dmpIdInfo', {
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
                    })}
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
                  key={funding.id ?? idx}
                  className={idx < fundings.length - 1 ? styles.fundingItemWithBorder : undefined}
                >
                  <ul className={styles.dataList}>
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
                    {funding.affiliation && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>Funder:</span>
                        <span className={styles.dataValue}>
                          {funding.affiliation.uri ? (
                            <a
                              href={funding.affiliation.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {funding.affiliation.displayName ||
                                funding.affiliation.name}
                            </a>
                          ) : (
                            funding.affiliation.displayName || funding.affiliation.name
                          )}
                        </span>
                      </li>
                    )}
                    {funding.funderOpportunityNumber && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>
                          {t("fundingOpportunity")}:
                        </span>
                        <span className={styles.dataValue}>
                          {funding.funderOpportunityNumber.startsWith('http') ? (
                            <a
                              href={funding.funderOpportunityNumber}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {funding.funderOpportunityNumber}
                            </a>
                          ) : (
                            funding.funderOpportunityNumber
                          )}
                        </span>
                      </li>
                    )}
                    {funding.grantId && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>Grant:</span>
                        <span className={styles.dataValue}>
                          {funding.grantId.startsWith('http') ? (
                            <a
                              href={funding.grantId}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {funding.grantId}
                            </a>
                          ) : (
                            funding.grantId
                          )}
                        </span>
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
                    {output.metadataStandards && output.metadataStandards.length > 0 && (
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
                              {i < output.metadataStandards!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </li>
                    )}
                    <li className={styles.dataItem}>
                      <span className={styles.dataLabel}>{t('output.anticipatedVolume')}:</span>
                      <span className={styles.dataValue}>{output.byteSize} {output.byteSizeUnit}</span>
                    </li>
                    {output.issued && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>{t('output.releaseTimeline')}:</span>
                        <span className={styles.dataValue}>{formatDate(output.issued)}</span>
                      </li>
                    )}
                    {output.hosts && output.hosts.length > 0 && (
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
                              {i < output.hosts!.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </li>
                    )}
                    {output.licenses && output.licenses.length > 0 && (
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
                              {i < output.licenses!.length - 1 ? ', ' : ''}
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

          {/* Abstract / Project Description */}
          {plan.project?.abstractText && (
            <section className={styles.dmpSection} aria-labelledby="abstract-heading">
              <h2 id="abstract-heading" className={styles.dmpSectionTitle}>
                {t('sectionHeadings.projectDescription')}
              </h2>
              <SafeHtml html={plan.project.abstractText} />
            </section>
          )}

        </div>
      </main>
    </div>
  );
}