/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import "@testing-library/jest-dom";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockedProvider } from "@apollo/client/testing/react";
import { MeDocument, UsersDocument, UserRole } from '@/generated/graphql';
import OrgUserAccountsPage from '../page';

expect.extend(toHaveNoViolations);

// --- Mocks ---

jest.mock('@/components/Loading', () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => <div data-testid="mock-loading">{message}</div>,
}));

jest.mock('@/components/Pagination', () => ({
  __esModule: true,
  default: ({ currentPage, totalPages, handlePageClick }: any) => (
    <div data-testid="mock-pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => handlePageClick(2)}>Next</button>
    </div>
  ),
}));

jest.mock('@/components/ErrorMessages', () => ({
  __esModule: true,
  default: React.forwardRef(({ errors }: { errors: string[] }, ref: any) => (
    <div data-testid="mock-errors" ref={ref}>
      {errors.map((e, i) => <p key={i}>{e}</p>)}
    </div>
  )),
}));

jest.mock('@/components/Table', () => ({
  __esModule: true,
  DmpTable: ({ rowData, columnData }: any) => (
    <div data-testid="mock-table">
      {rowData.map((row: any, i: number) => (
        <div key={i} data-testid="table-row">
          <span>{row.email}</span>
          <span>{row.role}</span>
          <span>{row.organization}</span>
        </div>
      ))}
      {columnData.map((col: any) => (
        <span key={col.id} data-testid={`column-${col.id}`}>{col.name}</span>
      ))}
    </div>
  ),
}));

jest.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));


jest.mock('@/utils/index', () => ({
  extractErrors: jest.fn().mockReturnValue([]),
  handleApolloError: jest.fn(),
  isValidEmail: (v: string) => v.includes('@'),
  refreshAuthTokens: jest.fn(),
  routePath: (name: string) => `/${name}`,
  logECS: jest.fn(),
}));

jest.mock('@/hooks/useFormatDate', () => ({
  useFormatDate: () => (date: string) => date,
}));

// --- Fixtures ---

const makeUser = (overrides = {}) => ({
  id: 1,
  givenName: 'Alice',
  surName: 'Smith',
  email: 'alice@example.com',
  active: true,
  role: UserRole.Researcher,
  created: '2024-01-01',
  last_sign_in: '2024-06-01',
  plans: [],
  affiliation: {
    id: 'org-1',
    displayName: 'Test Org',
    uri: 'http://example.com/orgs/1',
  },
  ...overrides,
});

const makeMeMock = (role: UserRole) => ({
  request: { query: MeDocument },
  result: { data: { me: { id: 1, role } } },
});

const makeUsersMock = (items = [makeUser()], variables = {}) => ({
  request: {
    query: UsersDocument,
    variables: {
      paginationOptions: { offset: 0, limit: 5, type: 'OFFSET', sortDir: 'DESC', sortField: undefined },
      term: '',
      ...variables,
    },
  },
  result: {
    data: {
      users: {
        items,
        totalCount: items.length,
        hasNextPage: false,
        hasPreviousPage: false,
        currentOffset: 0,
        nextCursor: null,
        limit: 5,
      },
    },
  },
});

const makeExportMock = (items = [makeUser()], variables = {}) => ({
  request: {
    query: UsersDocument,
    variables: { term: '', ...variables },
  },
  result: {
    data: {
      users: {
        items,
        totalCount: items.length,
        hasNextPage: false,
        hasPreviousPage: false,
        currentOffset: 0,
        nextCursor: null,
        limit: items.length,
      },
    },
  },
});


// --- Helper ---

const renderPage = (mocks: any[]) =>
  render(
    <MockedProvider mocks={mocks}>
      <OrgUserAccountsPage />
    </MockedProvider>
  );

// --- Tests ---

describe('Admin - User Accounts Dashboard', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  describe('initial render', () => {
    it('shows loading state before data arrives', () => {
      renderPage([makeMeMock(UserRole.Researcher), makeUsersMock()]);
      expect(screen.getByTestId('mock-loading')).toBeInTheDocument();
    });

    it('renders the search controls', async () => {
      renderPage([makeMeMock(UserRole.Researcher), makeUsersMock()]);

      await screen.findByLabelText(/Admin.users.tools.searchLabel/i);
      expect(screen.getByText('Admin.users.buttons.searchLabel')).toBeInTheDocument();
    });

    it('renders user rows after data loads', async () => {
      renderPage([makeMeMock(UserRole.Researcher), makeUsersMock()]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    it('shows no results message when users list is empty', async () => {
      renderPage([makeMeMock(UserRole.Researcher), makeUsersMock([])]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      expect(screen.getByText('Admin.users.userTable.noResults')).toBeInTheDocument();
    });
  });

  describe('superadmin column visibility', () => {
    it('does not show Organization column for non-superadmin', async () => {
      renderPage([makeMeMock(UserRole.Admin), makeUsersMock()]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      expect(screen.queryByTestId('column-organization')).not.toBeInTheDocument();
    });

    it('shows Organization column for superadmin', async () => {
      renderPage([makeMeMock(UserRole.Superadmin), makeUsersMock()]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      await waitFor(() => expect(screen.getByTestId('column-organization')).toBeInTheDocument());
    });
  });

  describe('search', () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      HTMLAnchorElement.prototype.click = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('triggers a new query when search button is pressed', async () => {
      const searchMock = {
        request: {
          query: UsersDocument,
          variables: {
            paginationOptions: { offset: 0, limit: 5, type: 'OFFSET', sortDir: 'DESC', sortField: undefined },
            term: 'alice',
          },
        },
        result: {
          data: {
            users: {
              items: [makeUser()],
              totalCount: 1,
              hasNextPage: false,
              hasPreviousPage: false,
              currentOffset: 0,
              nextCursor: null,
              limit: 5,
            },
          },
        },
      };

      renderPage([makeMeMock(UserRole.Admin), makeUsersMock(), searchMock]);

      const searchbox = await screen.findByRole('searchbox');
      await userEvent.type(searchbox, 'alice');
      await userEvent.click(screen.getByText('Admin.users.buttons.searchLabel'));

      await waitFor(() => expect(screen.getByText('alice@example.com')).toBeInTheDocument());
    });

    it('re-fetches with empty term when search is cleared', async () => {
      renderPage([makeMeMock(UserRole.Admin), makeUsersMock(), makeUsersMock()]);

      // Wait for MeDocument to resolve and search controls to appear
      const input = await screen.findByTestId('search-input');

      await userEvent.type(input, 'a');
      await userEvent.clear(input);

      await waitFor(() => expect(screen.getByText('alice@example.com')).toBeInTheDocument());
    });
  });

  describe('pagination', () => {
    it('renders pagination with correct page info', async () => {
      const manyUsersMock = makeUsersMock(
        Array.from({ length: 5 }, (_, i) => makeUser({ id: i + 1, email: `user${i}@example.com` }))
      );

      renderPage([makeMeMock(UserRole.Admin), { ...manyUsersMock, result: { data: { users: { ...manyUsersMock.result.data.users, totalCount: 10, hasNextPage: true } } } }]);
      await waitFor(() => expect(screen.getByTestId('mock-pagination')).toBeInTheDocument());

      await waitFor(() => expect(screen.getByText('Page 1 of 2')).toBeInTheDocument());
    });
  });

  describe('error handling', () => {
    it('displays error message when query fails', async () => {
      const { logECS, handleApolloError } = require('@/utils/index');

      handleApolloError.mockReturnValue({
        wasRealError: true,
        message: 'Network error',
      });

      const errorMock = {
        request: {
          query: UsersDocument,
          variables: {
            paginationOptions: { offset: 0, limit: 5, type: 'OFFSET', sortDir: 'DESC', sortField: undefined },
            term: '',
          },
        },
        error: new Error('Network error'),
      };

      renderPage([makeMeMock(UserRole.Admin), errorMock]);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(logECS).toHaveBeenCalledWith('error', 'OrgUserAccountsPage.fetchUsers - fetchUsers', expect.objectContaining({
        error: expect.anything(),
      }));
    });
  });

  describe('CSV download', () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      HTMLAnchorElement.prototype.click = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
    it('opens the confirmation modal when Download is clicked (org/non-superadmin)', async () => {
      renderPage([makeMeMock(UserRole.Admin), makeUsersMock()]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      await userEvent.click(screen.getByText('Admin.users.buttons.download'));

      expect(screen.getByText('Admin.users.headings.confirmDownload')).toBeInTheDocument();
      expect(screen.getByText('Admin.users.downloadWarning')).toBeInTheDocument();
    });

    it('triggers the export query and builds a CSV when confirmed', async () => {
      const exportMock = makeExportMock([makeUser({ email: 'alice@example.com' })]);
      renderPage([makeMeMock(UserRole.Admin), makeUsersMock(), exportMock]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      await userEvent.click(screen.getByText('Admin.users.buttons.download'));
      await userEvent.click(screen.getByText('Global.buttons.continue'));

      await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalled());
    });

    it('shows an error when there are no users to export', async () => {
      const exportMock = makeExportMock([]);
      renderPage([makeMeMock(UserRole.Admin), makeUsersMock(), exportMock]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      await userEvent.click(screen.getByText('Admin.users.buttons.download'));
      await userEvent.click(screen.getByText('Global.buttons.continue'));

      await waitFor(() =>
        expect(screen.getByText('No users found to export.')).toBeInTheDocument()
      );
    });

    it('shows a generic error message when the export query fails', async () => {
      const errorExportMock = {
        request: { query: UsersDocument, variables: { term: '' } },
        error: new Error('Export failed'),
      };

      renderPage([makeMeMock(UserRole.Admin), makeUsersMock(), errorExportMock]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      await userEvent.click(screen.getByText('Admin.users.buttons.download'));
      await userEvent.click(screen.getByText('Global.buttons.continue'));

      await waitFor(() =>
        expect(screen.getByText('Global.messaging.somethingWentWrong')).toBeInTheDocument()
      );
    });

    it('cancel closes the modal without exporting', async () => {
      renderPage([makeMeMock(UserRole.Admin), makeUsersMock()]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      await userEvent.click(screen.getByText('Admin.users.buttons.download'));
      expect(screen.getByText('Admin.users.headings.confirmDownload')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Global.buttons.cancel'));

      await waitFor(() =>
        expect(screen.queryByText('Admin.users.headings.confirmDownload')).not.toBeInTheDocument()
      );
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });

    describe('superadmin without organization selected', () => {
      beforeEach(() => {
        global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = jest.fn();
        HTMLAnchorElement.prototype.click = jest.fn();
      });

      afterEach(() => {
        jest.clearAllMocks();
      });
      it('disables download and shows explanatory popover instead of the confirm modal', async () => {
        renderPage([makeMeMock(UserRole.Superadmin), makeUsersMock()]);

        // Wait specifically for superadmin-gated UI (organization select) to mount,
        // not just the table, since they depend on different async queries.
        await screen.findByLabelText(/Admin.users.tools.organizationLabel/i);

        const downloadButton = screen.getByText('Admin.users.buttons.download');
        expect(downloadButton).toHaveAttribute('aria-disabled', 'true');

        await userEvent.click(downloadButton);

        expect(
          screen.getByText('Admin.users.messages.disabledDownloadMessage')
        ).toBeInTheDocument();
        expect(
          screen.queryByText('Admin.users.headings.confirmDownload')
        ).not.toBeInTheDocument();
      });
    });
  });


  describe('accessibility', () => {
    it('passes axe accessibility checks', async () => {
      const { container } = renderPage([makeMeMock(UserRole.Researcher), makeUsersMock()]);

      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});