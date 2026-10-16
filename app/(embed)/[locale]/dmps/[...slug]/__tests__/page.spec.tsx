/* eslint-disable @typescript-eslint/no-explicit-any */
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
const mockUseSearchParams = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
}));

// --- @apollo/client/react ---
jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));
const mockUseQuery = jest.mocked(useQuery);

// --- generated graphql ---
jest.mock('@/generated/graphql', () => ({
  PublicPlanVersionByDmpIdDocument: {},
  PlanVisibility: {
    Organizational: 'ORGANIZATIONAL',
    Public: 'PUBLIC',
    Private: 'PRIVATE',
  },
}));

// --- next-intl ---
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
    t.rich = (key) => key;
    return t;
  }),
}));

// --- misc components ---
jest.mock('@/components/Loading', () => {
  const MockLoading = () => <div>Loading...</div>;
  MockLoading.displayName = 'MockLoading';
  return MockLoading;
});
jest.mock('@/components/ErrorMessages', () => {
  const MockErrorMessages = ({ errors }: { errors: string[] }) => (
    <div data-testid="error-messages">{errors.filter(Boolean).join(', ')}</div>
  );
  MockErrorMessages.displayName = 'MockErrorMessages';
  return MockErrorMessages;
});

// --- utils ---
const mockLogECS = jest.fn();
jest.mock('@/utils/index', () => ({
  logECS: (...args: unknown[]) => mockLogECS(...args),
  routePath: (name: string, params: Record<string, unknown>) => `/${name}/${JSON.stringify(params)}`,
}));

// --- ArchivedPlanView ---
// page.tsx's own responsibility is fetching + routing + PDF download, not
// rendering plan content, so we mock ArchivedPlanView and just assert it
// receives the right props. Its own rendering is covered by
// ArchivedPlanView.spec.tsx.
const mockArchivedPlanView = jest.fn();
jest.mock('../ArchivedPlanView', () => {
  const MockArchivedPlanView = (props: any) => {
    mockArchivedPlanView(props);
    return (
      <div data-testid="archived-plan-view">
        <button
          type="button"
          aria-label="download the data management plan"
          onClick={() => props.handleDownloadPdfAction()}
          disabled={!props.canDownloadPdf}
        >
          download
        </button>
      </div>
    );
  };
  MockArchivedPlanView.displayName = 'MockArchivedPlanView';
  return MockArchivedPlanView;
});

const BASE_SNAPSHOT = {
  __typename: 'PlanVersionSnapshot',
  isHistoricalVersion: true,
  versionTimestamp: 'latest',
  latestVersionTimestamp: '2026-08-11T16:33:35.000Z',
  dmpId: 'https://doi.org/10.48321/D1e8b71d18',
  title: 'Butterflies of Ecuador DMP',
  created: '2026-08-11T16:30:48.000Z',
  modified: '2026-08-11T16:33:35.000Z',
  registered: '2026-08-11T16:33:35.000Z',
  visibility: 'PUBLIC',
  project: { title: 'Butterflies of Ecuador' },
  members: [],
  fundings: [],
  answers: [],
  versions: [],
  relatedWorks: [],
  relatedWorkIdentifiers: [],
  owner: {
    id: 1,
    name: 'California Digital Library',
    displayName: 'California Digital Library (cdlib.org)',
    homepage: 'http://www.cdlib.org/',
  },
};

import { PublicPlanVersionByDmpIdDocument } from '@/generated/graphql';

const setupApolloMocks = ({
  loading = false,
  error = undefined,
  snapshot = BASE_SNAPSHOT,
}: {
  loading?: boolean;
  error?: Error;
  snapshot?: typeof BASE_SNAPSHOT | null;
} = {}) => {
  const queryReturn = {
    data: loading ? undefined : { publicPlanVersionByDMPId: snapshot },
    loading,
    error,
  };

  mockUseQuery.mockImplementation((document, options) => {
    if (document === PublicPlanVersionByDmpIdDocument) {
      const result: unknown = {
        ...queryReturn,
        variables: (options as any)?.variables,
      };
      return result as ReturnType<typeof useQuery>;
    }
    const fallback: unknown = {
      data: undefined,
      loading: false,
      error: undefined,
    };
    return fallback as ReturnType<typeof useQuery>;
  });
};

const setupSearchParams = (version: string | null = null) => {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => (key === 'version' ? version : null),
  } as any);
};

describe('DmpLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: ['10.48321', 'D1e8b71d18'] });
    setupSearchParams();
    setupApolloMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  it('should render the loading state while the query is in flight', () => {
    setupApolloMocks({ loading: true });

    render(<DmpLandingPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('archived-plan-view')).not.toBeInTheDocument();
  });

  it('should call the query with dmpId built from the slug and version "latest" when no version param is present', () => {
    render(<DmpLandingPage />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      PublicPlanVersionByDmpIdDocument,
      expect.objectContaining({
        variables: {
          dmpId: 'https://doi.org/10.48321/D1e8b71d18',
          version: 'latest',
        },
      })
    );
  });

  it('should call the query with the version from the URL when a version param is present', () => {
    setupSearchParams('2026-06-01T10:00:00.000Z');

    render(<DmpLandingPage />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      PublicPlanVersionByDmpIdDocument,
      expect.objectContaining({
        variables: {
          dmpId: 'https://doi.org/10.48321/D1e8b71d18',
          version: '2026-06-01T10:00:00.000Z',
        },
      })
    );
  });

  it('should render a "plan not found" message when the snapshot is missing and there is no version param', () => {
    setupApolloMocks({ snapshot: null });

    render(<DmpLandingPage />);

    expect(screen.getByText('messages.dmpNotFound')).toBeInTheDocument();
    expect(screen.getByText('messages.planNotFound(shortDoi=10.48321/D1e8b71d18)')).toBeInTheDocument();
  });

  it('should render a "version not found" message when the snapshot is missing and a version param is present', () => {
    setupSearchParams('2026-01-01T00:00:00.000Z');
    setupApolloMocks({ snapshot: null });

    render(<DmpLandingPage />);

    expect(screen.getByText('messages.versionNotFound')).toBeInTheDocument();
    expect(
      screen.getByText('messages.cannotFindVersion(version=2026-01-01T00:00:00.000Z)')
    ).toBeInTheDocument();
  });

  it('should render a not-found message when the query errors', () => {
    setupApolloMocks({ error: new Error('boom') });

    render(<DmpLandingPage />);

    expect(screen.getByText('messages.dmpNotFound')).toBeInTheDocument();
  });

  it('should render ArchivedPlanView once the snapshot loads, passing the expected props', () => {
    render(<DmpLandingPage />);

    expect(screen.getByTestId('archived-plan-view')).toBeInTheDocument();
    expect(mockArchivedPlanView).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshot: BASE_SNAPSHOT,
        jsonUrl: expect.stringContaining('/api/download-narrative?dmpId=10.48321%2FD1e8b71d18&format=json'),
        canDownloadPdf: true,
      })
    );
  });

  it('should pass canDownloadPdf=false when the snapshot visibility is not PUBLIC', () => {
    setupApolloMocks({ snapshot: { ...BASE_SNAPSHOT, visibility: 'PRIVATE' } });

    render(<DmpLandingPage />);

    expect(mockArchivedPlanView).toHaveBeenCalledWith(
      expect.objectContaining({ canDownloadPdf: false })
    );
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

  it('should include the version param in the PDF download URL when viewing a historical version', async () => {
    setupSearchParams('2026-06-01T10:00:00.000Z');
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;

    render(<DmpLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /download the data management plan/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('version=2026-06-01T10%3A00%3A00.000Z');
  });

  it('should show an error message and log via logECS when the fetch response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as jest.Mock;
    global.URL.createObjectURL = jest.fn();

    render(<DmpLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /download the data management plan/i }));

    await waitFor(() => {
      expect(screen.getByTestId('error-messages')).toHaveTextContent('errors.failedToDownloadPDF');
    });

    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    expect(mockLogECS).toHaveBeenCalledWith(
      'error',
      'handleDownloadPdf',
      expect.objectContaining({
        error: expect.stringContaining('500'),
      })
    );
  });

  it('should show an error message and log via logECS when fetch throws', async () => {
    const thrown = new Error('network down');
    global.fetch = jest.fn().mockRejectedValue(thrown) as jest.Mock;
    global.URL.createObjectURL = jest.fn();

    render(<DmpLandingPage />);

    fireEvent.click(screen.getByRole('button', { name: /download the data management plan/i }));

    await waitFor(() => {
      expect(screen.getByTestId('error-messages')).toHaveTextContent('errors.failedToDownloadPDF');
    });

    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    expect(mockLogECS).toHaveBeenCalledWith(
      'error',
      'handleDownloadPdf',
      expect.objectContaining({ err: thrown })
    );
  });

  it('should not attempt to download when canDownloadPdf is false', async () => {
    setupApolloMocks({ snapshot: { ...BASE_SNAPSHOT, visibility: 'PRIVATE' } });
    global.fetch = jest.fn();

    render(<DmpLandingPage />);

    const downloadButton = screen.getByRole('button', { name: /download the data management plan/i });
    expect(downloadButton).toBeDisabled();
  });

  it('should pass accessibility tests', async () => {
    const { container } = render(<DmpLandingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});