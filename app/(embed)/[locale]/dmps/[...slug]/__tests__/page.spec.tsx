import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RichTranslationValues } from 'next-intl';
import { useQuery } from '@apollo/client/react';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';
import DmpLandingPage from '../page'; // adjust to the actual relative path

expect.extend(toHaveNoViolations);

// --- next/navigation ---
const mockUseParams = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => ({ push: mockPush }),
}));

// --- next/image ---
jest.mock('next/image', () => {
  const MockImage = ({ priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  };
  MockImage.displayName = 'MockImage';
  return MockImage;
});

// --- @apollo/client/react ---
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));
const mockUseQuery = jest.mocked(useQuery);

// --- generated graphql ---
jest.mock('@/generated/graphql', () => ({
  PublicPlanByDmpIdDocument: {},
  ProjectFundingStatus: {
    Granted: 'GRANTED',
    Denied: 'DENIED',
    Planned: 'PLANNED',
  },
}));


type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => React.ReactNode;
};

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t: MockUseTranslations = ((key: string) => key) as MockUseTranslations;
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

// --- react-aria-components ---
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

// --- misc components ---
jest.mock('@/components/SafeHtml', () => {
  const MockSafeHtml = ({ html }: { html: string }) => <div data-testid="safe-html">{html}</div>;
  MockSafeHtml.displayName = 'MockSafeHtml';
  return MockSafeHtml;
});
jest.mock('@/components/Loading', () => {
  const MockLoading = () => <div>Loading...</div>;
  MockLoading.displayName = 'MockLoading';
  return MockLoading;
});
jest.mock('@/components/Icons', () => ({
  DmpIcon: () => <span data-testid="dmp-icon" />,
}));
jest.mock('@/components/Icons/orcid/', () => ({
  OrcidIcon: () => <span data-testid="orcid-icon" />,
}));

const BASE_PLAN = {
  title: 'Butterflies of Ecuador DMP',
  dmpId: 'https://doi.org/10.48321/D1e8b71d18',
  created: '2026-08-11T16:30:48Z',
  modified: '2026-08-11T16:33:35Z',
  registered: '2026-08-11T16:33:35Z',
  versionedTemplate: {
    owner: {
      name: 'California Digital Library',
      displayName: 'California Digital Library (cdlib.org)',
      homepage: 'http://www.cdlib.org/',
    },
  },
  project: {
    title: 'Butterflies of Ecuador',
    abstractText: '<p>An abstract about butterflies.</p>',
    startDate: '2026-01-01',
    endDate: '2029-12-31',
    researchDomain: { name: 'natural-sciences', uri: 'https://dmptool.org/research_domains/natural-sciences' },
    fundings: [
      {
        id: 1,
        status: 'GRANTED',
        affiliation: { name: 'NSF', displayName: 'National Science Foundation (nsf.gov)', uri: 'https://ror.org/021nxhr62' },
        grantId: 'https://www.nsf.gov/awardsearch/showAward?AWD_ID=2529139',
        funderOpportunityNumber: '',
      },
    ],
    members: [
      {
        id: 1,
        isPrimaryContact: true,
        givenName: 'Ada',
        surName: 'Lovelace',
        orcid: '0000-0001-5727-2427',
        memberRoles: [
          { id: 1, label: 'Conceptualization', uri: 'https://credit.niso.org/contributor-roles/conceptualization/' },
        ],
      },
    ],
  },
  outputs: [
    {
      title: 'Data Paper from migration studies',
      description: '<p>A description.</p>',
      type: 'data-paper',
      issued: '2027-05-31',
      byteSize: 2,
      byteSizeUnit: 'mb',
      hosts: [{ name: 'Arias Montano', url: 'https://www.re3data.org/repository/r3d100014251' }],
      metadataStandards: [{ name: 'Terminal RI Unicamp', uri: 'https://repositorio.unicamp.br/' }],
      licenses: [{ name: 'CC0-1.0', uri: 'https://spdx.org/licenses/CC0-1.0.json' }],
    },
  ],
  versions: [
    { timestamp: '2026-08-11T16:33:35.000Z', url: 'https://dmphub.example.org/dmps/10.48321/D1e8b71d18?version=2026-08-11T16:33:35.000Z' },
    { timestamp: '2026-06-01T10:00:00.000Z', url: 'https://dmphub.example.org/dmps/10.48321/D1e8b71d18?version=2026-06-01T10:00:00.000Z' },
  ],
};

import { PublicPlanByDmpIdDocument } from '@/generated/graphql';

const setupApolloMocks = ({
  loading = false,
  error = undefined,
  plan = BASE_PLAN,
}: {
  loading?: boolean;
  error?: Error;
  plan?: typeof BASE_PLAN | null;
} = {}) => {
  const planQueryReturn = {
    data: loading ? undefined : { publicPlanByDMPId: plan },
    loading,
    error,
  };

  const defaultQueryReturn = { data: undefined, loading: false, error: undefined } as any;

  mockUseQuery.mockImplementation((document) => {
    if (document === PublicPlanByDmpIdDocument) {
      return planQueryReturn as ReturnType<typeof useQuery>;
    }
    return defaultQueryReturn;
  });
};

describe('DmpLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: ['10.48321', 'D1e8b71d18'] });
    setupApolloMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  it('should render the loading state while the query is in flight', () => {
    setupApolloMocks({ loading: true });

    render(<DmpLandingPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render a not-found message when the plan is missing', () => {
    setupApolloMocks({ plan: null });

    render(<DmpLandingPage />);

    expect(screen.getByText('DMP Not Found')).toBeInTheDocument();
    expect(screen.getByText('10.48321/D1e8b71d18')).toBeInTheDocument();
  });

  it('should render a not-found message when the query errors', () => {
    setupApolloMocks({ error: new Error('boom') });

    render(<DmpLandingPage />);

    expect(screen.getByText('DMP Not Found')).toBeInTheDocument();
  });

  it('should render plan title, DMP ID, and project details once loaded', () => {
    render(<DmpLandingPage />);

    expect(screen.getByRole('heading', { level: 1, name: BASE_PLAN.title })).toBeInTheDocument();
    expect(screen.getByText('10.48321/D1e8b71d18')).toBeInTheDocument();
    expect(screen.getByText('natural-sciences')).toBeInTheDocument();
  });

  it('should render a contributor with name, primary-contact badge, role link, and ORCID', () => {
    render(<DmpLandingPage />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Primary Contact')).toBeInTheDocument();

    const roleLink = screen.getByRole('link', { name: 'Conceptualization' });
    expect(roleLink).toHaveAttribute('href', 'https://credit.niso.org/contributor-roles/conceptualization/');

    expect(screen.getByRole('link', { name: /orcid profile for ada lovelace/i })).toHaveAttribute(
      'href',
      'https://orcid.org/0000-0001-5727-2427'
    );
  });

  it('should render funding source details', () => {
    render(<DmpLandingPage />);

    expect(screen.getByText('National Science Foundation (nsf.gov)')).toBeInTheDocument();
    expect(screen.getByText('Awarded')).toBeInTheDocument();
  });

  it('should render planned outputs with byteSize and unit as provided', () => {
    render(<DmpLandingPage />);

    expect(screen.getByText('Data Paper from migration studies')).toBeInTheDocument();
    expect(screen.getByText('2 mb')).toBeInTheDocument();
  });

  it('should render the version dropdown only when past versions differ from the current one', () => {
    render(<DmpLandingPage />);

    const versionButton = screen.getByRole('button', { name: /version:/i });
    expect(versionButton).not.toBeDisabled();
  });

  it('should disable the version dropdown when there are no past versions', () => {
    setupApolloMocks({
      plan: { ...BASE_PLAN, versions: [{ timestamp: BASE_PLAN.modified, url: 'https://example.org/v1' }] },
    });

    render(<DmpLandingPage />);

    const versionButton = screen.getByRole('button', { name: /version:/i });
    expect(versionButton).toBeDisabled();
  });

  it('should fetch and download the PDF using the plan title as the filename', async () => {
    const mockBlob = new Blob(['pdf-bytes'], { type: 'application/pdf' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    }) as jest.Mock;

    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    const clickSpy = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    render(<DmpLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /download the data management plan/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/download-narrative'),
        expect.objectContaining({ headers: { Accept: 'application/pdf' } })
      );
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('dmpId=10.48321%2FD1e8b71d18');
    expect(fetchUrl).toContain('includeCoverPage=true');
    expect(fetchUrl).toContain('includeSectionHeadings=true');
    expect(fetchUrl).toContain('includeQuestionText=true');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    createElementSpy.mockRestore();
  });

  it('should not attempt to build a download link when the fetch response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    global.URL.createObjectURL = jest.fn();

    render(<DmpLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /download the data management plan/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<DmpLandingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});