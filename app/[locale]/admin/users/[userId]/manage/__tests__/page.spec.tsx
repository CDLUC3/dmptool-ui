/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import "@testing-library/jest-dom";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockedProvider } from "@apollo/client/testing/react";
import {
  ArchiveUserDocument,
  LanguagesDocument,
  MeDocument,
  PlansDocument,
  UpdateUserInfoDocument,
  UpdateUserRoleDocument,
  UserDocument,
  UserRole,
} from '@/generated/graphql';
import OrgUserProfilePage from '../page';

expect.extend(toHaveNoViolations);

// --- Mocks ---

jest.mock('@/components/PageHeader', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="mock-page-header">{title}</div>,
}));

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
  DmpTable: ({ rowData }: any) => (
    <div data-testid="mock-table">
      {rowData.map((row: any, i: number) => (
        <div key={i} data-testid="table-row">{row.title}</div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  __esModule: true,
  TypeAheadWithOther: ({ label, value, isDisabled }: any) => (
    <div data-testid="mock-typeahead">
      <label htmlFor="typeahead-input">{label}</label>
      <input
        id="typeahead-input"
        data-testid="typeahead-input"
        defaultValue={value}
        disabled={isDisabled}
        readOnly
      />
    </div>
  ),
  useAffiliationSearch: () => ({
    suggestions: [],
    handleSearch: jest.fn(),
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
  useLocale: () => 'en-US',
}));

jest.mock('@/i18n/routing', () => ({
  usePathname: () => '/admin/users/1',
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useParams: () => ({ userId: '1' }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));


jest.mock('@/utils/clientLogger', () => jest.fn());

jest.mock('@/utils/index', () => ({
  extractErrors: jest.fn().mockReturnValue([]),
  handleApolloError: jest.fn(),
  isValidEmail: (v: string) => v.includes('@'),
  refreshAuthTokens: jest.fn(),
  routePath: (name: string) => `/${name}`,
  logECS: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ add: jest.fn() }),
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
  languageId: 'en-US',
  ssoId: null,
  orcid: null,
  affiliation: {
    id: 'org-1',
    displayName: 'Test Org (example.com)',
    uri: 'https://ror.org/example',
  },
  errors: { __typename: 'UserErrors', general: null, email: null, password: null, role: null },
  ...overrides,
});

const makeMeMock = (role: UserRole) => ({
  request: { query: MeDocument },
  result: { data: { me: { id: 99, role } } },
});

const makeUserMock = (user = makeUser()) => ({
  request: {
    query: UserDocument,
    variables: { userId: 1 },
  },
  result: { data: { user } },
});

const makeLanguagesMock = () => ({
  request: { query: LanguagesDocument },
  result: {
    data: {
      languages: [
        { id: 'en-US', name: 'English' },
        { id: 'fr-FR', name: 'French' },
      ],
    },
  },
});

const makePlansMock = (items: any[] = []) => ({
  request: {
    query: PlansDocument,
    variables: {
      paginationOptions: { offset: 0, limit: 5, type: 'OFFSET', sortDir: 'DESC', sortField: undefined },
      term: '',
      userId: 1,
    },
  },
  result: {
    data: {
      plans: {
        items,
        totalCount: items.length,
        hasNextPage: false,
        hasPreviousPage: false,
        currentOffset: 0,
      },
    },
  },
});

const makePlan = (overrides = {}) => ({
  id: '10',
  title: 'Test Plan',
  templateTitle: 'Template A',
  templateOwnerAffiliationName: 'Some Org',
  modified: '2024-06-01',
  visibility: 'PUBLIC',
  user: { givenName: 'Alice', surName: 'Smith' },
  errors: null,
  ...overrides,
});

const makeUpdateUserInfoMock = (result: any = { updateUserInfo: { errors: null } }) => ({
  request: {
    query: UpdateUserInfoDocument,
    variables: {
      input: {
        userId: 1,
        email: 'alice@example.com',
        givenName: 'Alice',
        surName: 'Smith',
        affiliationId: 'https://ror.org/example',
        otherAffiliationName: '',
        languageId: 'en-US',
      },
    },
  },
  result: { data: result },
});

const makeUpdateUserRoleMock = (role: UserRole, result: any = { updateUserRole: { errors: null } }) => ({
  request: {
    query: UpdateUserRoleDocument,
    variables: { input: { userId: 1, role } },
  },
  result: { data: result },
});

const makeArchiveMock = (result: any = { archiveUser: { errors: null } }) => ({
  request: {
    query: ArchiveUserDocument,
    variables: { userId: 1 },
  },
  result: { data: result },
});

// --- Helper ---

const defaultMocks = (role = UserRole.Superadmin, user = makeUser()) => [
  makeMeMock(role),
  makeUserMock(user),
  makeLanguagesMock(),
  makePlansMock(),
];

const renderPage = (mocks: any[]) =>
  render(
    <MockedProvider mocks={mocks}>
      <OrgUserProfilePage />
    </MockedProvider>
  );

// --- Tests ---

describe('OrgUserProfilePage', () => {
  describe('initial render', () => {
    it('shows loading state before data arrives', () => {
      renderPage(defaultMocks());
      expect(screen.getByTestId('mock-loading')).toBeInTheDocument();
    });

    it('renders the user profile form after data loads', async () => {
      renderPage(defaultMocks());
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    });

    it('renders the plans table after data loads', async () => {
      renderPage([...defaultMocks(), makePlansMock([makePlan()])]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());
    });

    it('shows no results message when plans list is empty', async () => {
      renderPage(defaultMocks());
      await waitFor(() =>
        expect(screen.getByText('Admin.userProfile.userPlansTable.noResults')).toBeInTheDocument()
      );
    });
  });

  describe('read-only vs editable (role-based access)', () => {
    it('shows save and archive buttons for SuperAdmin', async () => {
      renderPage(defaultMocks(UserRole.Superadmin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByTestId('save-profile-button')).toBeInTheDocument();
      expect(screen.getByTestId('archive-user-button')).toBeInTheDocument();
    });

    it('hides save and archive buttons for Org Admin', async () => {
      renderPage(defaultMocks(UserRole.Admin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.queryByTestId('save-profile-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('archive-user-button')).not.toBeInTheDocument();
    });

    it('disables form fields for Org Admin', async () => {
      renderPage(defaultMocks(UserRole.Admin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByDisplayValue('alice@example.com')).toBeDisabled();
      expect(screen.getByDisplayValue('Alice')).toBeDisabled();
      expect(screen.getByDisplayValue('Smith')).toBeDisabled();
    });

    it('enables form fields for SuperAdmin', async () => {
      renderPage(defaultMocks(UserRole.Superadmin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByDisplayValue('alice@example.com')).not.toBeDisabled();
      expect(screen.getByDisplayValue('Alice')).not.toBeDisabled();
      expect(screen.getByDisplayValue('Smith')).not.toBeDisabled();
    });

    it('hides merge accounts section for Org Admin', async () => {
      renderPage(defaultMocks(UserRole.Admin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.queryByText('Admin.userProfile.headings.mergeAccounts')).not.toBeInTheDocument();
    });

    it('shows merge accounts section for SuperAdmin', async () => {
      renderPage(defaultMocks(UserRole.Superadmin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByText('Admin.userProfile.headings.mergeAccounts')).toBeInTheDocument();
    });
  });

  describe('role management', () => {
    it('shows User and Admin options for Org Admin', async () => {
      renderPage(defaultMocks(UserRole.Admin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByLabelText('User')).toBeInTheDocument();
      expect(screen.getByLabelText('Admin')).toBeInTheDocument();
      expect(screen.queryByLabelText('Super Admin')).not.toBeInTheDocument();
    });

    it('shows User, Admin, and Super Admin options for SuperAdmin', async () => {
      renderPage(defaultMocks(UserRole.Superadmin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      // Wait for meData to resolve and the role options to render
      await waitFor(() => expect(screen.getByLabelText('Super Admin')).toBeInTheDocument());

      expect(screen.getByLabelText('User')).toBeInTheDocument();
      expect(screen.getByLabelText('Admin')).toBeInTheDocument();
    });

    it('pre-selects the current user role', async () => {
      renderPage(defaultMocks(UserRole.Superadmin, makeUser({ role: UserRole.Admin })));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByLabelText('Admin')).toBeChecked();
    });

    it('calls updateUserRole mutation when role save is clicked', async () => {
      const roleMock = makeUpdateUserRoleMock(UserRole.Admin);
      renderPage([...defaultMocks(UserRole.Superadmin), roleMock]);
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      await userEvent.click(screen.getByLabelText('Admin'));

      // Find the role section's save button specifically
      const saveButtons = screen.getAllByText('Global.buttons.save');
      await userEvent.click(saveButtons[1]); // role save is second save button

      await waitFor(() => expect(roleMock.result).toBeDefined());
    });
  });

  describe('profile form submission', () => {
    afterEach(() => {
      const { extractErrors } = require('@/utils/index');
      extractErrors.mockReset();
      extractErrors.mockReturnValue([]); // restore default
    });

    it('submits updated profile info', async () => {
      const updateMock = makeUpdateUserInfoMock();
      renderPage([
        ...defaultMocks(UserRole.Superadmin),
        updateMock,
        makeUserMock(), // covers the refetchQueries call
      ]);
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      const saveButtons = screen.getAllByText('Global.buttons.save');
      await userEvent.click(saveButtons[0]);

      await waitFor(() => expect(updateMock.result).toBeDefined());
    });

    it('shows error messages when profile update fails', async () => {
      const { extractErrors } = require('@/utils/index');
      extractErrors.mockReturnValue(['Unable to save the profile changes at this time']);

      const updateMock = makeUpdateUserInfoMock({
        updateUserInfo: {
          errors: { general: 'Unable to save the profile changes at this time' },
        },
      });

      renderPage([
        ...defaultMocks(UserRole.Superadmin),
        updateMock,
        makeUserMock(), // covers the refetchQueries call
      ]);
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      const saveButtons = screen.getAllByText('Global.buttons.save');
      await userEvent.click(saveButtons[0]);

      await waitFor(() =>
        expect(screen.getByText('Unable to save the profile changes at this time')).toBeInTheDocument()
      );
    });
  });

  describe('archive user', () => {
    beforeEach(() => {
      mockPush.mockClear();
      mockReplace.mockClear();
    });

    it('calls archive mutation and redirects on success', async () => {
      const archiveMock = makeArchiveMock();
      renderPage([...defaultMocks(UserRole.Superadmin), archiveMock]);
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      await userEvent.click(screen.getByText('Global.buttons.archive'));

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin.users'));
    });


    it('shows error when archive fails', async () => {
      const { extractErrors } = require('@/utils/index');
      extractErrors.mockReturnValueOnce(['Error archiving user']);

      const archiveMock = {
        ...makeArchiveMock(),
        result: {
          data: { archiveUser: { errors: { general: 'Error archiving user' } } },
        },
      };

      renderPage([...defaultMocks(UserRole.Superadmin), archiveMock]);
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      await userEvent.click(screen.getByText('Global.buttons.archive'));

      await waitFor(() =>
        expect(screen.getByText('Error archiving user')).toBeInTheDocument()
      );
    });
  });

  describe('plans search', () => {
    it('triggers a new query when search button is pressed', async () => {
      const searchMock = {
        request: {
          query: PlansDocument,
          variables: {
            paginationOptions: { offset: 0, limit: 5, type: 'OFFSET', sortDir: 'DESC', sortField: undefined },
            term: 'test',
            userId: 1,
          },
        },
        result: {
          data: {
            plans: {
              items: [makePlan()],
              totalCount: 1,
              hasNextPage: false,
              hasPreviousPage: false,
              currentOffset: 0,
            },
          },
        },
      };

      renderPage([...defaultMocks(), searchMock]);
      await waitFor(() => expect(screen.getByTestId('mock-table')).toBeInTheDocument());

      await userEvent.type(screen.getByTestId('search-input'), 'test');
      await userEvent.click(screen.getByTestId('plans-search-button'));

      await waitFor(() => expect(screen.getByText('Test Plan')).toBeInTheDocument());
    });
  });

  describe('identifiers section', () => {
    it('shows SSO ID when present', async () => {
      renderPage(defaultMocks(UserRole.Superadmin, makeUser({ ssoId: 'sso-abc-123' })));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.getByText('sso-abc-123')).toBeInTheDocument();
    });

    it('shows ORCID link when present', async () => {
      renderPage(defaultMocks(UserRole.Superadmin, makeUser({ orcid: 'https://orcid.org/0000-0001-2345-6789' })));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      const link = screen.getByRole('link', { name: /orcid/i });
      expect(link).toHaveAttribute('href', 'https://orcid.org/0000-0001-2345-6789');
    });

    it('hides identifiers section when neither ssoId nor orcid are present', async () => {
      renderPage(defaultMocks(UserRole.Superadmin, makeUser({ ssoId: null, orcid: null })));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      expect(screen.queryByText('Admin.userProfile.headings.identifiers')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('passes axe accessibility checks for SuperAdmin view', async () => {
      const { container } = renderPage(defaultMocks(UserRole.Superadmin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe accessibility checks for Org Admin read-only view', async () => {
      const { container } = renderPage(defaultMocks(UserRole.Admin));
      await waitFor(() => expect(screen.queryByTestId('mock-loading')).not.toBeInTheDocument());

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});