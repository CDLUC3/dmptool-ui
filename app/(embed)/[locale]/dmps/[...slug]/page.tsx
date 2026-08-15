'use client';

import { useRef, useState } from 'react';
import {
  useParams,
  usePathname,
  useSearchParams
} from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components';
import {
  ResearchOutputTableAnswerSchema,
  ResearchOutputTableColumnsEnum,
  type ResearchOutputTableAnswerType,
  type ResearchOutputTableRowAnswerType,
  type AnyResearchOutputTableColumnAnswerType,
} from '@dmptool/types';

// GraphQL
import { useQuery } from '@apollo/client/react';
import {
  ProjectFundingStatus,
  PublicPlanByDmpIdDocument,
  PlanVisibility,
  PublicPlanVersionByDmpIdDocument
} from '@/generated/graphql';

// Components
import SafeHtml from '@/components/SafeHtml';
import Loading from '@/components/Loading';
import { DmpIcon } from "@/components/Icons";
import { OrcidIcon } from '@/components/Icons/orcid/';
import ErrorMessages from "@/components/ErrorMessages";

// Utils and other
import {
  parseResearchOutputsFromAnswers,
  outputTypeLabel,
  type PlanAnswer,
  type ParsedOutput,
} from './researchOutputParsing';
import { logECS, routePath } from "@/utils/index";
import styles from './landing.module.scss';
import ArchivedPlanView from './ArchivedPlanView';

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

// function outputTypeLabel(type?: string | null): string {
//   if (!type) return '';
//   const spaced = type.replace(/[-_]/g, ' ');
//   return spaced.charAt(0).toUpperCase() + spaced.slice(1);
// }

// type PlanAnswer = {
//   id?: number | string | null;
//   json?: string | null;
// };

// type ParsedOutput = {
//   title?: string;
//   description?: string;
//   type?: string;
//   issued?: string;
//   byteSize?: number;
//   byteSizeUnit?: string;
//   hosts: { url?: string; name?: string }[];
//   metadataStandards: { uri?: string; name?: string }[];
//   licenses: { uri?: string; name?: string }[];
// };

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
    hosts: (hostCol?.answer ?? []).map((h) => ({
      url: h.repositoryId, // schema has no separate website field; repositoryId is the usable URL
      name: h.repositoryName,
    })),
    metadataStandards: (metadataCol?.answer ?? []).map((m) => ({
      uri: m.metadataStandardId,
      name: m.metadataStandardName,
    })),
    licenses: (licenseCol?.answer ?? []).map((l) => ({
      uri: l.licenseId,
      name: l.licenseName,
    })),
  };
}

// function parseResearchOutputsFromAnswers(answers?: PlanAnswer[] | null): ParsedOutput[] {
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
    workType: string; // non-nullable per schema (WorkType!)
    publicationVenue?: string | null;
    sourceName: string; // non-nullable per schema (String!)
    sourceUrl?: string | null;
    authors: RelatedWorkAuthor[]; // non-nullable per schema
    work: { doi: string }; // non-nullable per schema
  };
};


// Formats an author list Chicago-style: "Surname, Given, Given Surname, and Given Surname."
function formatAuthorsForCitation(authors?: RelatedWorkAuthor[] | null): string {
  if (!authors || authors.length === 0) return '';

  // Full name, given-name-first (used for authors after the first)
  const displayName = (a: RelatedWorkAuthor) =>
    [a.givenName, a.surname].filter(Boolean).join(' ') || a.full || '';

  const names = authors.map(displayName).filter(Boolean);
  if (names.length === 0) return '';

  // First author is "Surname, Given"; fall back to `full` only if surname/givenName are both missing
  const first = authors[0];
  const firstFormatted =
    [first.surname, first.givenName].filter(Boolean).join(', ') || first.full || names[0];

  if (names.length === 1) return firstFormatted;

  const rest = names.slice(1);
  if (rest.length === 1) return `${firstFormatted}, and ${rest[0]}`;

  return `${firstFormatted}, ${rest.slice(0, -1).join(', ')}, and ${rest[rest.length - 1]}`;
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

  // No metadata to cite: just the bare link (shown as its own URL) + fallback text
  if (!hasCitableMetadata) {
    return (
      <>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        )}{' '}
        No citation available.
      </>
    );
  }

  const year = wv?.publicationDate ? new Date(Date.parse(wv.publicationDate)).getFullYear() : null;
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

// Groups related works by type, in a stable, sensible display order
function groupRelatedWorksByType(
  items?: (RelatedWorkItem | null)[] | null,
): { type: string; items: RelatedWorkItem[] }[] {
  const validItems = (items ?? []).filter((item): item is RelatedWorkItem => item != null);
  if (validItems.length === 0) return [];

  const preferredOrder = ['ARTICLE', 'REPORT', 'DATASET', 'PROTOCOL', 'PREPRINT', 'SOFTWARE'];
  const groups = new Map<string, RelatedWorkItem[]>();

  for (const item of validItems) {
    const key = item.workVersion?.workType || 'OTHER';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const orderedKeys = [
    ...preferredOrder.filter((k) => groups.has(k)),
    ...Array.from(groups.keys()).filter((k) => !preferredOrder.includes(k) && k !== 'OTHER'),
    ...(groups.has('OTHER') ? ['OTHER'] : []),
  ];

  return orderedKeys.map((type) => ({ type, items: groups.get(type)! }));
}

function VersionsDropdown({
  versions,
  currentModified,
}: {
  versions: {
    modified?: string | null;
    dmpId?: string | null;
  }[];
  currentModified?: string | null;
}) {
  const pathname = usePathname();

  const dedupedByModified = new Map<string, { modified?: string | null; dmpId?: string | null }>();
  for (const v of versions) {
    if (!v.modified) continue;
    const existing = dedupedByModified.get(v.modified);
    if (!existing || (existing.dmpId?.includes('?version=') && !v.dmpId?.includes('?version='))) {
      dedupedByModified.set(v.modified, v);
    }
  }
  const allVersions = Array.from(dedupedByModified.values())
    .sort((a, b) => (a.modified! > b.modified! ? -1 : 1));

  const hasVersions = allVersions.length > 0;

  return (
    <MenuTrigger>
      <Button className={styles.versionsDropdownToggle} isDisabled={!hasVersions}>
        <strong>Version:</strong> {formatDate(currentModified, true)}
        {hasVersions && <span className={styles.chevron} aria-hidden="true" />}
      </Button>
      {hasVersions && (
        <Popover className={styles.versionsDropdownMenu} placement="bottom end">
          <Menu>
            {allVersions.map((v, i) => {
              const isCurrent = v.modified === currentModified;
              return isCurrent ? (
                <MenuItem
                  key={i}
                  isDisabled
                  className={`${styles.versionsDropdownItem} ${styles.versionsDropdownItemCurrent}`}
                >
                  {formatDate(v.modified, true)} (current)
                </MenuItem>
              ) : (
                <MenuItem
                  key={i}
                  href={`${pathname}?version=${encodeURIComponent(v.modified!)}`}
                  className={styles.versionsDropdownItem}
                >
                  {formatDate(v.modified, true)}
                </MenuItem>
              );
            })}
          </Menu>
        </Popover>
      )}
    </MenuTrigger>
  );
}

export default function DmpLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const versionParam = searchParams.get('version');

  // Errors
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Localization keys
  const t = useTranslations('LandingPage');

  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug ?? ''];
  const rawDoi = slugParts.join('/');
  const dmpId = rawDoi.startsWith('https://doi.org/')
    ? rawDoi
    : `https://doi.org/${rawDoi}`;
  const shortDoi = rawDoi.replace('https://doi.org/', '');

  // GraphQL query to fetch the public plan by DMP ID
  const { data: publicPlanData, loading: publicPlanLoading, error: publicPlanError } = useQuery(PublicPlanByDmpIdDocument, {
    variables: { dmpId },
    skip: !!versionParam, // Skip if a specific version is requested
  });

  // Only run the "archived snapshot" query when a version param IS present
  const {
    data: versionedPlanData,
    loading: versionedPlanLoading,
    error: versionedPlanError,
  } = useQuery(PublicPlanVersionByDmpIdDocument, {
    variables: { dmpId, version: versionParam ?? '' },
    skip: !versionParam,
  });
  console.log("***Versioned plan data***", versionedPlanData);

  if (versionParam) {
    if (versionedPlanLoading) {
      return (
        <div className={styles.landingPage}>
          <div className={styles.loadingState}>
            <Loading />
          </div>
        </div>
      );
    }

    const snapshot = versionedPlanData?.publicPlanVersionByDMPId;

    if (!snapshot || versionedPlanError) {
      return (
        <div className={styles.landingPage}>
          <div className={styles.notFound}>
            <h2>Version Not Found</h2>
            <p>
              We could not find version <strong>{versionParam}</strong> of this data
              management plan.
            </p>
          </div>
        </div>
      );
    }

    return <ArchivedPlanView snapshot={snapshot} />;
  }

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

  console.log("***Plan data***", plan);

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
  const fundings = plan?.fundings ?? [];
  const members = plan.members ?? [];
  const primaryContact = members.find((m) => m.isPrimaryContact);
  const primaryContactName = primaryContact
    ? [primaryContact?.projectMember?.givenName, primaryContact?.projectMember?.surName].filter(Boolean).join(' ')
    : undefined;
  const outputs = parseResearchOutputsFromAnswers(plan.answers);
  const versions = plan.versions;
  const relatedWorksGroups = groupRelatedWorksByType(plan.relatedWorks);
  /* Citation helpers */
  const investigators = members
    .map((m) => {
      return [m.projectMember?.givenName, m.projectMember?.surName].filter(Boolean).join(' ');
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
  const jsonUrl = `${process.env.NEXT_PUBLIC_NARRATIVE_SERVICE_URL}/dmps/${shortDoi}/narrative.json`;

  // Get PDF and assign plan.title as the filename for download
  const handleDownloadPdf = async () => {
    if (!canDownloadPdf) {
      setError(t('errors.pdfNotAvailable'));
      return;
    }
    try {
      const response = await fetch(pdfDownloadUrl, {
        headers: { Accept: 'application/pdf' },
      });

      if (!response.ok) {
        setError(t('errors.failedToDownloadPDF'));
        logECS("error", "handleDownloadPdf", {
          error,
          url: { path: routePath("dmp.landing", { slug: shortDoi }) },
        });
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
      setError(t('errors.failedToDownloadPDF'));
      logECS("error", "handleDownloadPdf", {
        error,
        url: { path: routePath("dmp.landing", { slug: shortDoi }) },
      });
    }
  };

  const writtenForOrg = plan?.owner;
  const canDownloadPdf = plan.visibility === PlanVisibility.Public;

  return (
    <div className={styles.landingPage}>
      <ErrorMessages errors={[error ?? '']} ref={errorRef} />

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
                  {plan.registered ? t('registeredDMP') : t('dataManagementPlan')}
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
                {canDownloadPdf && (<Button
                  type="button"
                  onPress={handleDownloadPdf}
                  className="secondary"
                  aria-label="Download the data management plan (downloads a PDF, opens in a new tab)"
                >
                  {t.rich('downloadPlan', {
                    pdfLabel: (chunks) => (
                      <span className={styles.downloadText}>{chunks}</span>
                    ),
                  })}
                  <DmpIcon icon="download" aria-hidden="true" classes={styles.downloadIcon} />
                </Button>)}

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
                <strong>{t('dmpId')}:</strong>{' '}
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
                  const fullName = [member?.projectMember?.givenName, member?.projectMember?.surName]
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
                        {member?.projectMember?.orcid && (
                          <>
                            <span aria-hidden="true">
                              <OrcidIcon icon="orcid" classes={styles.orcidLogo} width="18px" height="18px" />
                            </span>
                            <a
                              href={`https://orcid.org/${member.projectMember?.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`ORCID profile for ${fullName}`}
                            >
                              {member.projectMember?.orcid}
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
                          className={`${styles.statusBadge} ${fundingStatusClass(funding?.projectFunding?.status)}`}
                        >
                          {fundingStatusLabel(funding?.projectFunding?.status)}
                        </span>
                      </span>
                    </li>
                    {funding.projectFunding?.affiliation && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>Funder:</span>
                        <span className={styles.dataValue}>
                          {funding.projectFunding?.affiliation.uri ? (
                            <a
                              href={funding.projectFunding?.affiliation.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {funding.projectFunding?.affiliation.displayName ||
                                funding.projectFunding?.affiliation.name}
                            </a>
                          ) : (
                            funding.projectFunding?.affiliation.displayName || funding.projectFunding?.affiliation.name
                          )}
                        </span>
                      </li>
                    )}
                    {funding.projectFunding?.funderOpportunityNumber && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>
                          {t("fundingOpportunity")}:
                        </span>
                        <span className={styles.dataValue}>
                          {funding.projectFunding?.funderOpportunityNumber.startsWith('http') ? (
                            <a
                              href={funding.projectFunding?.funderOpportunityNumber}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {funding.projectFunding?.funderOpportunityNumber}
                            </a>
                          ) : (
                            funding.projectFunding?.funderOpportunityNumber
                          )}
                        </span>
                      </li>
                    )}
                    {funding.projectFunding?.grantId && (
                      <li className={styles.dataItem}>
                        <span className={styles.dataLabel}>Grant:</span>
                        <span className={styles.dataValue}>
                          {funding.projectFunding?.grantId.startsWith('http') ? (
                            <a
                              href={funding.projectFunding?.grantId}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {funding.projectFunding?.grantId}
                            </a>
                          ) : (
                            funding.projectFunding?.grantId
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
                    {group.items.map((item) => (
                      <li key={item.id} className={styles.workItem}>
                        <p>
                          <RelatedWorkCitation item={item} />
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

        </div>
      </main>
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
    </div>
  );
}