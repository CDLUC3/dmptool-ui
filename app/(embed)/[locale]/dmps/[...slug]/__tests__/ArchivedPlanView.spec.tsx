/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RichTranslationValues } from 'next-intl';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';
import ArchivedPlanView from '../ArchivedPlanView'; // adjust to the actual relative path

expect.extend(toHaveNoViolations);

jest.mock('next/image', () => {
  const MockImage = ({ priority: _priority, fill: _fill, ...props }: any) => {
    return <img {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// --- generated graphql (enums used directly by ArchivedPlanView) ---
jest.mock('@/generated/graphql', () => ({
  WorkType: {
    Article: 'ARTICLE',
    AudioVisual: 'AUDIO_VISUAL',
    Book: 'BOOK',
    BookChapter: 'BOOK_CHAPTER',
    Collection: 'COLLECTION',
    Dataset: 'DATASET',
    DataPaper: 'DATA_PAPER',
    Dissertation: 'DISSERTATION',
    Editorial: 'EDITORIAL',
    Erratum: 'ERRATUM',
    Event: 'EVENT',
    Grant: 'GRANT',
    Image: 'IMAGE',
    InteractiveResource: 'INTERACTIVE_RESOURCE',
    Letter: 'LETTER',
    Libguides: 'LIBGUIDES',
    Model: 'MODEL',
    Other: 'OTHER',
    Paratext: 'PARATEXT',
    PeerReview: 'PEER_REVIEW',
    PhysicalObject: 'PHYSICAL_OBJECT',
    Preprint: 'PREPRINT',
    PreRegistration: 'PRE_REGISTRATION',
    Protocol: 'PROTOCOL',
    ReferenceEntry: 'REFERENCE_ENTRY',
    Report: 'REPORT',
    Retraction: 'RETRACTION',
    Review: 'REVIEW',
    Service: 'SERVICE',
    Software: 'SOFTWARE',
    Sound: 'SOUND',
    Standard: 'STANDARD',
    SupplementaryMaterials: 'SUPPLEMENTARY_MATERIALS',
    Text: 'TEXT',
    TraditionalKnowledge: 'TRADITIONAL_KNOWLEDGE',
    Workflow: 'WORKFLOW',
  },
  ProjectFundingStatus: {
    Granted: 'GRANTED',
    Denied: 'DENIED',
    Planned: 'PLANNED',
  },
}));

type MockUseTranslations = {
  (key: string, values?: Record<string, unknown>): string;
  rich: (key: string, values?: RichTranslationValues) => React.ReactNode;
};

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t: MockUseTranslations = ((key: string, values?: Record<string, unknown>) => {
      if (values) {
        const interpolated = Object.entries(values)
          .map(([name, value]) => `${name}=${String(value)}`)
          .join(',');
        return `${key}(${interpolated})`;
      }
      return key;
    }) as MockUseTranslations;
    t.rich = (key, values = {}) => {
      const rendered = Object.entries(values).map(([name, value]) =>
        typeof value === 'function' ? (
          <React.Fragment key={name}>{value(name)}</React.Fragment>
        ) : (
          <React.Fragment key={name}>{String(value)}</React.Fragment>
        )
      );
      return (
        <>
          {key}
          {rendered}
        </>
      );
    };
    return t;
  }),
}));


jest.mock('@/hooks/useFormatDate', () => ({
  useFormatDateWithMonth: () => (date: string | null | undefined, includeTime = false) => {
    if (!date) return '';
    if (date === 'latest') return 'INVALID_LATEST_STRING';
    return includeTime ? `formatted:${date}:withTime` : `formatted:${date}`;
  },
}));


jest.mock('react-aria-components', () => ({
  Button: ({ children, onPress, isDisabled, ...props }: any) => (
    <button onClick={onPress} disabled={isDisabled} {...props}>
      {children}
    </button>
  ),
  MenuTrigger: ({ children }: any) => <div>{children}</div>,
  Menu: ({ children }: any) => <div>{children}</div>,
  MenuItem: ({ children, href }: any) => <a href={href}>{children}</a>,
  Popover: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/SafeHtml', () => {
  const MockSafeHtml = ({ html }: { html: string }) => <div data-testid="safe-html">{html}</div>;
  MockSafeHtml.displayName = 'MockSafeHtml';
  return MockSafeHtml;
});
jest.mock('@/components/Icons', () => ({
  DmpIcon: () => <span data-testid="dmp-icon" />,
}));
jest.mock('@/components/Icons/orcid/', () => ({
  OrcidIcon: () => <span data-testid="orcid-icon" />,
}));

// --- researchOutputParsing ---
// Keep this aligned with the real parser's output shape so ArchivedPlanView
// doesn't need a live answers-JSON fixture for every test.
const mockParsedOutputs: any[] = [];
jest.mock('../researchOutputParsing', () => ({
  parseResearchOutputsFromAnswers: jest.fn(() => mockParsedOutputs),
  outputTypeLabel: (type: string) => `label:${type}`,
}));

const RESEARCH_OUTPUT_ANSWER_JSON = JSON.stringify({
  meta: { schemaVersion: '1.0' },
  type: 'researchOutputTable',
  answer: [{ columns: [] }],
});

const BASE_SNAPSHOT = {
  __typename: 'PlanVersionSnapshot',
  isHistoricalVersion: true,
  versionTimestamp: 'latest',
  latestVersionTimestamp: '2026-08-23T05:01:25.000Z',
  dmpId: 'https://doi.org/10.48321/D149375160',
  title: 'Butterflies of Ecuador DMP',
  created: '2026-08-11T16:30:48.000Z',
  modified: '2026-08-11T16:33:35.000Z',
  registered: '2026-08-11T16:33:35.000Z',
  visibility: 'PUBLIC',
  relatedWorkIdentifiers: [],
  versionedTemplate: {
    id: 986,
    title: 'CDL Template 1',
    version: 'v1',
  },
  owner: {
    id: 1,
    name: 'California Digital Library',
    displayName: 'California Digital Library (cdlib.org)',
    uri: 'https://ror.org/03yrm5c26',
    homepage: 'http://www.cdlib.org/',
  },
  project: {
    title: 'Butterflies of Ecuador',
    abstractText: '<p>An abstract about butterflies.</p>',
    startDate: '2026-01-01',
    endDate: '2029-12-31',
    researchDomain: { name: 'natural-sciences' },
  },
  members: [
    {
      name: 'Ada Lovelace',
      orcid: 'https://orcid.org/0000-0001-5727-2427',
      affiliationName: 'California Digital Library',
      isPrimaryContact: true,
      memberRoles: [
        { id: 1, label: 'Conceptualization', uri: 'https://credit.niso.org/contributor-roles/conceptualization/' },
      ],
    },
  ],
  fundings: [
    {
      funderName: 'National Science Foundation',
      funderUri: 'https://ror.org/021nxhr62',
      status: 'GRANTED',
      grantId: 'https://www.nsf.gov/awardsearch/showAward?AWD_ID=2529139',
      funderOpportunityNumber: null,
      funderProjectNumber: null,
    },
  ],
  answers: [{ id: 1, json: RESEARCH_OUTPUT_ANSWER_JSON, questionText: 'RO Question' }],
  versions: [
    {
      timestamp: '2026-08-23T02:03:03.000Z',
      url: 'https://example.org/dmps/10.48321/D149375160?version=2026-08-23T02:03:03.000Z',
    },
    {
      timestamp: '2026-08-23T01:57:12.000Z',
      url: 'https://example.org/dmps/10.48321/D149375160?version=2026-08-23T01:57:12.000Z',
    },
  ],
  relatedWorks: [
    {
      id: 1,
      workVersion: {
        title: 'Climate Change Impacts on Insect Populations Across North America',
        publicationDate: '2017-07-12',
        workType: 'ARTICLE',
        publicationVenue: 'Ecological Monographs',
        sourceName: 'CrossRef',
        sourceUrl: 'https://doi.org/10.1038/nature24286',
        authors: [
          { givenName: 'David', surname: 'Beckham', full: 'David Beckham' },
          { givenName: 'Emily', surname: 'Thompson', full: 'Emily Thompson' },
        ],
        work: { doi: '10.1038/nature24323' },
      },
    },
    {
      id: 2,
      workVersion: {
        title: 'Pollinator Habitat Loss Dataset',
        publicationDate: null,
        workType: 'DATASET',
        publicationVenue: null,
        sourceName: 'CrossRef',
        sourceUrl: null,
        authors: [],
        work: { doi: '10.1038/nature24322' },
      },
    },
  ],
};

const defaultProps = {
  snapshot: BASE_SNAPSHOT as any,
  jsonUrl: 'https://narrative.example.org/dmps/10.48321/D149375160/narrative.json',
  canDownloadPdf: true,
  handleDownloadPdfAction: jest.fn().mockResolvedValue(undefined),
  writtenForOrg: {
    name: 'California Digital Library',
    displayName: 'California Digital Library (cdlib.org)',
    homepage: 'http://www.cdlib.org/',
  },
};

describe('ArchivedPlanView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParsedOutputs.length = 0;
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  it('should render the plan title, DOI, and project details', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 1, name: BASE_SNAPSHOT.title })).toBeInTheDocument();
    expect(screen.getByText('10.48321/D149375160')).toBeInTheDocument();
    expect(screen.getByText('natural-sciences')).toBeInTheDocument();
  });

  it('should fall back to the project title when the plan has no title of its own', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{ ...BASE_SNAPSHOT, title: null } as any}
      />
    );

    expect(
      screen.getByRole('heading', { level: 1, name: BASE_SNAPSHOT.project.title })
    ).toBeInTheDocument();
  });

  it('should fall back to the localized "untitled" key when neither the plan nor project has a title', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{ ...BASE_SNAPSHOT, title: null, project: { ...BASE_SNAPSHOT.project, title: null } } as any}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'untitledPlan' })).toBeInTheDocument();
  });

  it('should render a contributor with name, primary-contact badge, role link, and ORCID', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getAllByText(/Ada Lovelace/).length).toBeGreaterThan(0);
    expect(screen.getByText(/primaryContact/)).toBeInTheDocument();

    const roleLink = screen.getByRole('link', { name: 'Conceptualization' });
    expect(roleLink).toHaveAttribute('href', 'https://credit.niso.org/contributor-roles/conceptualization/');

    expect(
      screen.getByRole('link', { name: /ariaLabel.orcidProfile/i })
    ).toHaveAttribute('href', 'https://orcid.org/0000-0001-5727-2427');
  });

  it('should not render a contributor row for a member with no name', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{
          ...BASE_SNAPSHOT,
          members: [{ ...BASE_SNAPSHOT.members[0], name: null }],
        } as any}
      />
    );

    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('should render funding source details with the correct status label', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByText('National Science Foundation')).toBeInTheDocument();
    expect(screen.getByText('Awarded')).toBeInTheDocument();
  });

  it('should render "Planned" as the default funding status label when status is missing/unrecognized', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{
          ...BASE_SNAPSHOT,
          fundings: [{ ...BASE_SNAPSHOT.fundings[0], status: 'SOME_UNKNOWN_STATUS' }],
        } as any}
      />
    );

    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('should not render the funding section when there are no fundings', () => {
    render(<ArchivedPlanView {...defaultProps} snapshot={{ ...BASE_SNAPSHOT, fundings: [] } as any} />);

    expect(screen.queryByText('National Science Foundation')).not.toBeInTheDocument();
  });

  it('should render the citation block with contributor names and DMP ID link', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getAllByText(/Ada Lovelace/).length).toBeGreaterThan(0);
    const citationLink = screen.getByRole('link', { name: BASE_SNAPSHOT.dmpId });
    expect(citationLink).toHaveAttribute('href', BASE_SNAPSHOT.dmpId);
  });

  it('should not render the citation section when there is no dmpId', () => {
    render(<ArchivedPlanView {...defaultProps} snapshot={{ ...BASE_SNAPSHOT, dmpId: null } as any} />);

    expect(screen.queryByText('whenCitingThisDMP')).not.toBeInTheDocument();
  });

  it('should render planned outputs, falling back to the localized untitled-output label', () => {
    mockParsedOutputs.push({
      title: null,
      description: '<p>desc</p>',
      type: 'dataset',
      issued: '2027-05-31',
      byteSize: 2,
      byteSizeUnit: 'mb',
      hosts: [],
      metadataStandards: [],
      licenses: [],
    });

    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByText('output.UntitledOutput')).toBeInTheDocument();
    expect(screen.getByText('label:dataset')).toBeInTheDocument();
    expect(screen.getByText('2 mb')).toBeInTheDocument();
  });

  it('should not render the outputs section when there are no parsed outputs', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.queryByText('sectionHeadings.plannedOutputs')).not.toBeInTheDocument();
  });

  it('should render the abstract when present', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByTestId('safe-html')).toHaveTextContent('An abstract about butterflies.');
  });

  it('should not render the abstract section when there is no abstract text', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{ ...BASE_SNAPSHOT, project: { ...BASE_SNAPSHOT.project, abstractText: null } } as any}
      />
    );

    expect(screen.queryByText('sectionHeadings.projectDescription')).not.toBeInTheDocument();
  });

  it('should group related works by type and render a citation for each', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByText('Article')).toBeInTheDocument();
    expect(screen.getByText('Dataset')).toBeInTheDocument();
    expect(
      screen.getByText(/Climate Change Impacts on Insect Populations Across North America/)
    ).toBeInTheDocument();
  });

  it('should render a "no citation info" fallback for a related work with no citable metadata', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{
          ...BASE_SNAPSHOT,
          relatedWorks: [
            {
              id: 3,
              workVersion: {
                title: null,
                publicationDate: null,
                workType: 'OTHER',
                publicationVenue: null,
                sourceName: 'CrossRef',
                sourceUrl: 'https://doi.org/10.9999/xyz',
                authors: [],
                work: { doi: '10.9999/xyz' },
              },
            },
          ],
        } as any}
      />
    );

    expect(screen.getByText('noCitationInfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://doi.org/10.9999/xyz' })).toBeInTheDocument();
  });

  it('should correctly parse an epoch-millisecond publicationDate string into a year', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{
          ...BASE_SNAPSHOT,
          relatedWorks: [
            {
              id: 4,
              workVersion: {
                ...BASE_SNAPSHOT.relatedWorks[0].workVersion,
                publicationDate: '1499817600000', // 2017-07-12 in epoch ms
              },
            },
          ],
        } as any}
      />
    );

    expect(screen.getByText(/2017\./)).toBeInTheDocument();
  });

  it('should not render the related works section when there are none', () => {
    render(<ArchivedPlanView {...defaultProps} snapshot={{ ...BASE_SNAPSHOT, relatedWorks: [] } as any} />);

    expect(screen.queryByText('sectionHeadings.relatedWorks')).not.toBeInTheDocument();
  });

  it('should render the version dropdown enabled when there are historical versions other than the current one', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    const versionButton = screen.getByRole('button', { name: /version:/i });
    expect(versionButton).not.toBeDisabled();
  });

  it('should list only non-current versions inside the dropdown, with correct hrefs', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    const link1 = screen.getByRole('link', {
      name: 'formatted:2026-08-23T02:03:03.000Z:withTime',
    });
    expect(link1).toHaveAttribute('href', '/dmps/10.48321/D149375160?version=2026-08-23T02%3A03%3A03.000Z');

    const link2 = screen.getByRole('link', {
      name: 'formatted:2026-08-23T01:57:12.000Z:withTime',
    });
    expect(link2).toHaveAttribute('href', '/dmps/10.48321/D149375160?version=2026-08-23T01%3A57%3A12.000Z');
  });

  it('should render the current (latest) entry\'s link pointing back to the base URL when viewing a historical version', () => {
    render(
      <ArchivedPlanView
        {...defaultProps}
        snapshot={{ ...BASE_SNAPSHOT, versionTimestamp: '2026-08-23T02:03:03.000Z' } as any}
      />
    );

    const latestLink = screen.getByRole('link', {
      name: `formatted:${BASE_SNAPSHOT.latestVersionTimestamp}:withTime`,
    });
    expect(latestLink).toHaveAttribute('href', '/dmps/10.48321/D149375160');
  });

  it('should disable the version dropdown and render a static display when there are no other versions', () => {
    render(<ArchivedPlanView {...defaultProps} snapshot={{ ...BASE_SNAPSHOT, versions: [] } as any} />);

    // No historical versions and versionTimestamp === 'latest' → static display, not a Button
    expect(screen.queryByRole('button', { name: /version:/i })).not.toBeInTheDocument();
    expect(screen.getByText(/version:/i)).toBeInTheDocument();
  });

  it('should show the version sub-band using the latestVersionTimestamp when versionTimestamp is "latest"', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(
      screen.getByText(`formatted:${BASE_SNAPSHOT.latestVersionTimestamp}:withTime`)
    ).toBeInTheDocument();
  });

  it('should show the download button when canDownloadPdf is true', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByRole('button', { name: /downloadPlan/i })).toBeInTheDocument();
  });

  it('should hide the download button when canDownloadPdf is false', () => {
    render(<ArchivedPlanView {...defaultProps} canDownloadPdf={false} />);

    expect(screen.queryByRole('button', { name: /downloadPlan/i })).not.toBeInTheDocument();
  });

  it('should render the JSON link when jsonUrl is provided', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    const jsonLink = screen.getByRole('link', { name: /viewAsJson/i });
    expect(jsonLink).toHaveAttribute('href', defaultProps.jsonUrl);
  });

  it('should not render the JSON link when jsonUrl is omitted', () => {
    render(<ArchivedPlanView {...defaultProps} jsonUrl={undefined} />);

    expect(screen.queryByText('viewAsJson')).not.toBeInTheDocument();
  });

  it('should render the org attribution text when writtenForOrg is provided and the plan has a template', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByText(/templateInfoWithOrg/)).toBeInTheDocument();
  });

  it('should render the footer with copyright and attribution links', () => {
    render(<ArchivedPlanView {...defaultProps} />);

    expect(screen.getByRole('link', { name: /uc3Link/i })).toHaveAttribute(
      'href',
      'https://uc3.cdlib.org/'
    );
    expect(screen.getByRole('link', { name: /cdlLink/i })).toHaveAttribute(
      'href',
      'http://www.cdlib.org'
    );
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<ArchivedPlanView {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});