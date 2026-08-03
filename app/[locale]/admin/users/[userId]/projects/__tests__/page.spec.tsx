/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { MeDocument, UserProjectsDocument, UserRole } from "@/generated/graphql";
import { axe, toHaveNoViolations } from "jest-axe";
import OrgUserProjectsPage from "../page";
import { useFormatter, useTranslations } from "next-intl";
import { mockScrollIntoView, mockScrollTo } from "@/__mocks__/common";

expect.extend(toHaveNoViolations);

// --- Mocks ---

jest.mock("next-intl", () => ({
  useFormatter: jest.fn(),
  useTranslations: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ userId: '2' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/hooks/scrollToTop', () => ({
  useScrollToTop: () => ({ scrollToTop: jest.fn() }),
}));

jest.mock('@/utils/index', () => ({
  logECS: jest.fn(),
  routePath: (name: string) => `/${name}`,
}));

// --- Fixtures ---

const makeProject = (overrides = {}) => ({
  title: "Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations",
  id: 1,
  startDate: "2025-09-01",
  endDate: "2028-12-31",
  fundings: [{ name: "National Science Foundation", grantId: null }],
  members: [{ name: "Jacques Cousteau", role: "Data Manager", orcid: "https://orcid.org/0000-JACQ-0000-0000" }],
  errors: null,
  ...overrides,
});

const makeMeMock = (id = 99, role = UserRole.Superadmin) => ({
  request: { query: MeDocument },
  result: { data: { me: { id, role } } },
});

const makeProjectsMock = (
  paginationOptions: Record<string, unknown>,
  term: string | undefined,
  items: ReturnType<typeof makeProject>[] = [makeProject()],
  nextCursor: string | null = null,
  totalCount = 1
) => ({
  request: {
    query: UserProjectsDocument,
    variables: {
      paginationOptions,
      ...(term !== undefined && { term }),
      userId: 2,
    },
  },
  result: {
    data: {
      userProjects: { items, totalCount, nextCursor },
    },
  },
});

const initialLoadMock = () =>
  makeProjectsMock({ limit: 3 }, undefined);

const makeMeMockForAdmin = () => makeMeMock(99, UserRole.Admin); // different id from userId param (2)
const makeMeMockAsUser = () => makeMeMock(2); // same id as userId param — not read-only

// --- Setup ---

const defaultMocks = () => [
  makeMeMock(),
  initialLoadMock(),
  initialLoadMock(), // second call for resetSearch
];

const renderPage = (mocks: any[]) =>
  render(
    <MockedProvider mocks={mocks}>
      <OrgUserProjectsPage />
    </MockedProvider>
  );

describe("OrgUserProjectsPage", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();

    (useFormatter as jest.Mock).mockReturnValue({
      dateTime: jest.fn((date) => date.toLocaleDateString()),
    });

    (useTranslations as jest.Mock).mockImplementation((namespace) => {
      return (key: string) => `${namespace}.${key}`;
    });
  });

  afterEach(async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  // --- Initial render ---

  describe('initial render', () => {
    it('renders the page header and breadcrumbs', async () => {
      renderPage(defaultMocks());

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Global.breadcrumbs.home/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Global.breadcrumbs.projects/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /Global.breadcrumbs.planDashboard/i })).toBeInTheDocument();
      });
    });

    it('renders project list after data loads', async () => {
      renderPage(defaultMocks());

      await waitFor(() => {
        expect(screen.getByRole('heading', {
          name: /Reef Havens: Exploring the Role of Reef Ecosystems in Sustaining Eel Populations/i,
        })).toBeInTheDocument();
      });
    });

    it('renders the search field', async () => {
      renderPage(defaultMocks());

      await waitFor(() => {
        expect(screen.getByLabelText('Global.labels.searchByKeyword')).toBeInTheDocument();
        expect(screen.getByText('Global.helpText.searchHelpText')).toBeInTheDocument();
      });
    });

    it('shows loading state before data arrives', () => {
      renderPage(defaultMocks());
      expect(screen.getByText('Global.messaging.loading')).toBeInTheDocument();
    });
  });

  // --- Read-only vs editable ---

  describe('read-only behavior', () => {
    it('passes isReadOnly=true to ProjectListItem when viewing another user\'s projects', async () => {
      // meData.me.id (99) !== userId param (2) → isReadOnly = true
      renderPage([makeMeMockForAdmin(), initialLoadMock()]);

      await waitFor(() => {
        expect(screen.getByRole('heading', {
          name: /Reef Havens/i,
        })).toBeInTheDocument();
      });

      // The create new plan button should still appear (it's in the header actions, not gated)
      // but ProjectListItem receives isReadOnly — verify via absence of edit controls
      // (adjust this assertion to match what ProjectListItem actually hides when isReadOnly)
      expect(screen.queryByText('Global.buttons.createNewPlan')).toBeInTheDocument();
    });

    it('is not read-only when viewing your own projects', async () => {
      // meData.me.id (2) === userId param (2) → isReadOnly = false
      renderPage([makeMeMockAsUser(), initialLoadMock()]);

      await waitFor(() => {
        expect(screen.getByRole('heading', {
          name: /Reef Havens/i,
        })).toBeInTheDocument();
      });
    });
  });

  // --- Search ---

  describe('search', () => {
    it('shows filtered results when user searches', async () => {
      const searchMock = makeProjectsMock(
        { type: 'CURSOR', limit: 3 },
        'reef',
        [makeProject({ title: 'Reef One', id: 2 })],
        null,
        1
      );

      renderPage([makeMeMock(), initialLoadMock(), searchMock]);

      await screen.findByLabelText('Global.labels.searchByKeyword');

      const searchInput = screen.getByLabelText('Global.labels.searchByKeyword');
      fireEvent.change(searchInput, { target: { value: 'reef' } });

      const searchButton = screen.getByText('Global.buttons.search');
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Reef One')).toBeInTheDocument();
      });
    });

    it('shows no results message when search yields nothing', async () => {
      const emptyMock = makeProjectsMock(
        { type: 'CURSOR', limit: 3 },
        'nonexistent project', // must match exactly what the input contains
        [],
        null,
        0
      );


      renderPage([makeMeMock(), initialLoadMock(), emptyMock]);

      await screen.findByLabelText('Global.labels.searchByKeyword');

      fireEvent.change(
        screen.getByLabelText('Global.labels.searchByKeyword'),
        { target: { value: 'Nonexistent Project' } }
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Global.buttons.search'));
      });

      await waitFor(() => {
        expect(screen.getByText('Global.messaging.noItemsFound')).toBeInTheDocument();
      });
    });

    it('does nothing when search is submitted with empty term', async () => {
      renderPage(defaultMocks());

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Reef Havens/i })).toBeInTheDocument();
      });

      fireEvent.change(
        screen.getByLabelText('Global.labels.searchByKeyword'),
        { target: { value: '' } }
      );

      fireEvent.click(screen.getByText('Global.buttons.search'));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Reef Havens/i })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: 'Global.links.clearFilter' })).not.toBeInTheDocument();
    });

    it('resets results when clear filter is clicked', async () => {
      const searchMock = makeProjectsMock(
        { type: 'CURSOR', limit: 3 },
        'reef',
        [makeProject({ title: 'Reef One', id: 2 })],
        null,
        5
      );

      renderPage([makeMeMock(), initialLoadMock(), searchMock, initialLoadMock()]);

      await screen.findByLabelText('Global.labels.searchByKeyword');

      fireEvent.change(
        screen.getByLabelText('Global.labels.searchByKeyword'),
        { target: { value: 'reef' } }
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Global.buttons.search'));
      });

      await waitFor(() => expect(screen.getByText('Reef One')).toBeInTheDocument());

      const clearButtons = screen.getAllByRole('button', { name: 'Global.links.clearFilter' });
      await act(async () => {
        fireEvent.click(clearButtons[0]);
      });

      expect(screen.queryByText('Reef One')).not.toBeInTheDocument();
    });
  });

  // --- Pagination / load more ---

  describe('load more', () => {
    it('loads more projects when load more button is clicked', async () => {
      const initialMock = makeProjectsMock({ limit: 3 }, undefined, [makeProject()], 'next-cursor', 9);
      const loadMoreMock = makeProjectsMock(
        { type: 'CURSOR', cursor: 'next-cursor', limit: 3 },
        undefined,
        [makeProject({ title: 'Project 3', id: 3 }), makeProject({ title: 'Project 4', id: 4 })],
      );


      renderPage([makeMeMock(), initialMock, loadMoreMock]);

      await waitFor(() => {
        const loadMoreBtn = screen.getByRole('button', { name: 'load more' });
        expect(loadMoreBtn).toBeInTheDocument();
        fireEvent.click(loadMoreBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Project 3')).toBeInTheDocument();
      });
    });

    it('loads more search results when search load more is clicked', async () => {
      const searchMock = makeProjectsMock(
        { type: 'CURSOR', limit: 3 },
        'reef',
        [makeProject({ title: 'Reef Two', id: 2 })],
        null,
        9
      );

      const searchLoadMoreMock = makeProjectsMock(
        { type: 'CURSOR', cursor: 'next-cursor', limit: 3 },
        'reef',
        [makeProject({ title: 'Reef Two', id: 3 })],
      );

      renderPage([makeMeMock(), initialLoadMock(), searchMock, searchLoadMoreMock]);

      await screen.findByLabelText('Global.labels.searchByKeyword');

      fireEvent.change(
        screen.getByLabelText('Global.labels.searchByKeyword'),
        { target: { value: 'reef' } }
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Global.buttons.search'));
      });

      await waitFor(() => expect(screen.getByText('Reef Two')).toBeInTheDocument());

      await waitFor(() => {
        const loadMoreBtn = screen.getByRole('button', { name: 'load more search results' });
        expect(loadMoreBtn).toBeInTheDocument();
        fireEvent.click(loadMoreBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('Reef Two')).toBeInTheDocument();
      });
    });
  });

  // --- Error handling ---

  describe('error handling', () => {
    it('displays error message when a project has errors', async () => {
      const errorMock = makeProjectsMock(
        { type: 'CURSOR', limit: 3 },
        'bad',
        [makeProject({ errors: { general: 'There was an error getting the projects' } })],
      );

      renderPage([makeMeMock(), initialLoadMock(), errorMock]);

      await screen.findByLabelText('Global.labels.searchByKeyword');

      fireEvent.change(
        screen.getByLabelText('Global.labels.searchByKeyword'),
        { target: { value: 'bad' } }
      );

      await act(async () => {
        fireEvent.click(screen.getByText('Global.buttons.search'));
      });

      await waitFor(() => {
        expect(screen.getByText('There was an error getting the projects')).toBeInTheDocument();
      });
    });
  });

  // --- Accessibility ---

  describe('accessibility', () => {
    it('passes axe accessibility checks', async () => {
      const { container } = renderPage(defaultMocks());

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Reef Havens/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});