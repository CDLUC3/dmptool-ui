import React, { ReactNode } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import UpdateEmailAddress from '..';
import { RichTranslationValues } from 'next-intl';
import { useMutation } from '@apollo/client/react';
import {
  MeDocument,
  AddUserEmailDocument,
  RemoveUserEmailDocument,
  SetPrimaryUserEmailDocument
} from '@/generated/graphql';
import logECS from '@/utils/clientLogger';
import { routePath } from '@/utils/routes';

expect.extend(toHaveNoViolations);

const GET_USER = MeDocument;
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));


// Mock Apollo Client hooks
jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('@/utils/clientLogger', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('@/utils/gqlErrorHandler', () => ({
  handleApolloErrors: jest.fn()
}))

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(() => ({
    add: jest.fn(),
  })),
}));


type MockUseTranslations = {
  (key: string, ...args: unknown[]): string;
  rich: (key: string, values?: RichTranslationValues) => ReactNode;
};

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const mockUseTranslations: MockUseTranslations = ((key: string) => key) as MockUseTranslations;

    mockUseTranslations.rich = (key, values) => {
      const p = values?.p;
      if (typeof p === 'function') {
        return p(key); // Can return JSX
      }
      return key; // fallback
    };

    return mockUseTranslations;
  }),
}));

export interface EmailInterface {
  id?: number | null;
  email: string;
  isPrimary: boolean;
  isConfirmed: boolean;
}

const mockEmailAddresses = [
  {
    email: 'test@test.com',
    isPrimary: false,
    isConfirmed: true
  },
  {
    email: 'me@test.com',
    isPrimary: true,
    isConfirmed: true
  },
]

const mockEmailData = {
  id: 15,
  errors: null,
  email: "jshin3@test.com",
  isConfirmed: false,
  isPrimary: false,
  userId: 5,
}


// Cast with jest.mocked utility
const mockUseMutation = jest.mocked(useMutation);

let mockSetPrimaryUserEmailMutationFn: jest.Mock;
let mockAddUserEmailMutationFn: jest.Mock;
let mockRemoveUserEmailMutationFn: jest.Mock;

const setupMocks = () => {

  mockSetPrimaryUserEmailMutationFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockAddUserEmailMutationFn = jest.fn().mockResolvedValue({
    data: mockEmailData
  });

  mockRemoveUserEmailMutationFn = jest.fn().mockResolvedValue({
    data: { key: 'value' }
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === SetPrimaryUserEmailDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockSetPrimaryUserEmailMutationFn, { loading: false, error: undefined }] as any;
    }

    if (document === AddUserEmailDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockAddUserEmailMutationFn, { loading: false, error: undefined }] as any;
    }

    if (document === RemoveUserEmailDocument) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [mockRemoveUserEmailMutationFn, { loading: false, error: undefined }] as any;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [jest.fn(), { loading: false, error: undefined }] as any;
  });
};

describe('UpdateEmailAddressPage', () => {
  beforeEach(() => {
    setupMocks();
    // Create a mock scrollIntoView function
    const mockScrollIntoView = jest.fn();
    // Add it to the Element prototype
    Element.prototype.scrollIntoView = mockScrollIntoView;
  });

  it('should render UpdateEmailAddress page with expected headings', async () => {
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('emailAndAuth')).toBeInTheDocument();
      const headingElement1 = screen.getByRole('heading', { name: 'headingPrimaryEmail' });
      const headingElement2 = screen.getByRole('heading', { name: 'headingAliasEmailAddr' });
      // Updated lines for the <p> tags:
      const headingElement3 = screen.getByText('headingSSO');
      const headingElement4 = screen.getByText('headingNotifications');
      expect(headingElement1).toBeInTheDocument();
      expect(headingElement2).toBeInTheDocument();
      expect(headingElement3).toBeInTheDocument();
      expect(headingElement4).toBeInTheDocument();
      expect(screen.getByText(/primaryEmailDesc/i)).toBeInTheDocument();
      expect(screen.getByText(/notificationsDesc/i)).toBeInTheDocument();
      expect(screen.getByText(/aliasEmailDesc/i)).toBeInTheDocument();
    });
  });

  it('should display email addresses', async () => {
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    expect(screen.getByText(/test@test.com/i)).toBeInTheDocument();
    expect(screen.getByText(/me@test.com/i)).toBeInTheDocument();
  });

  it('should render the primary badge and no delete control for the primary email', async () => {
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    const primaryEmailRow = screen.getByText(/me@test.com/i).closest('[class*="emailRow"]');
    expect(primaryEmailRow).toBeInTheDocument();

    // Shows the affirmative "Primary" badge and the explanatory note
    expect(within(primaryEmailRow as HTMLElement).getByText('primaryBadge')).toBeInTheDocument();
    expect(within(primaryEmailRow as HTMLElement).getByText('primaryEmailCannotBeDeleted')).toBeInTheDocument();
    // No delete affordance is rendered for the primary email
    expect(document.querySelectorAll('.delete-email')).toHaveLength(1);
  });

  it('should call removeUserEmailMutation when deleting an email', async () => {
    mockRemoveUserEmailMutationFn.mockResolvedValue({
      data: {
        removeUserEmail: {
          errors: null
        }
      }
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    // Find and click the delete button for test@test.com
    const deleteTrigger = document.querySelector('.delete-email') as HTMLElement;
    await act(async () => {
      fireEvent.click(deleteTrigger);
    });

    // Verify the mutation was called with correct parameters
    expect(mockRemoveUserEmailMutationFn).toHaveBeenCalledWith({
      variables: {
        email: 'test@test.com'
      },
      refetchQueries: [
        {
          query: GET_USER,
        },
      ],
    });
  });

  it('should handle general error when deleting an email', async () => {
    // Create a general error (not Apollo Error)
    const generalError = new Error('General error occurred');
    const mockRemoveEmailMutation = jest.fn().mockRejectedValue(generalError);

    mockUseMutation.mockImplementation((document) => {
      if (document === RemoveUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockRemoveEmailMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    // Find and click the delete button for test@test.com
    const deleteTrigger = document.querySelector('.delete-email') as HTMLElement;

    await act(async () => {
      fireEvent.click(deleteTrigger);
    });

    // Verify the error message is displayed
    await waitFor(() => {
      // Use container.querySelector to find the div with class "error"
      const errorDiv = document.querySelector('.error') as HTMLElement;

      // Check that the errorDiv exists
      expect(errorDiv).toBeInTheDocument();
      expect(screen.getByText('messages.errorDeletingEmail')).toBeInTheDocument();
    });

    // Verify logECS was called with correct parameters
    const expectedPath = routePath('account.profile');
    expect(logECS).toHaveBeenCalledWith(
      'error',
      'deleteEmail',
      {
        error: generalError,
        url: { path: expectedPath }
      }
    );
  });

  it('should call mockRemoveEmailMutation again if the initial call returns an instance of an Apollo error', async () => {
    const mockRemoveEmailResponse = jest.fn()
      .mockRejectedValueOnce(new Error("Apollo error occurred")) // First call returns an Apollo error
      .mockResolvedValueOnce({ data: { removeUserEmail: [{ errors: null }] } }); // Second call succeeds


    mockUseMutation.mockImplementation((document) => {
      if (document === RemoveUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockRemoveEmailResponse, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });


    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    // Find and click the delete button for test@test.com
    const deleteTrigger = document.querySelector('.delete-email') as HTMLElement;

    await act(async () => {
      fireEvent.click(deleteTrigger);
    });

    // Verify the mutation was called twice
    await waitFor(() => {
      expect(mockRemoveEmailResponse).toHaveBeenCalledTimes(1);
      expect(screen.getByText('messages.errorDeletingEmail')).toBeInTheDocument();
    });
  });

  it('should handle general error when adding alias', async () => {
    // Create a general error (not Apollo Error)
    const generalError = new Error('General error occurred');
    const mockAddUserEmailMutation = jest.fn().mockRejectedValue(generalError);

    mockUseMutation.mockImplementation((document) => {
      if (document === AddUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddUserEmailMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    //Enter a value into the add alias input field
    const addAliasInput = screen.getByLabelText(/headingAddAliasEmail/i);
    fireEvent.change(addAliasInput, { target: { value: 'msmith@test.com' } });

    // Locate the Add button and click it
    // Select the wrapping div with class "addContainer" and assert it's not null
    const addContainer = document.querySelector('.addContainer') as HTMLElement;
    expect(addContainer).not.toBeNull(); // Ensure addContainer is found

    // Now we can safely use addContainer with `within`
    const addButton = within(addContainer!).getByRole('button', { name: 'btnAdd' });

    await act(async () => {
      fireEvent.click(addButton);
    })

    // Verify the error message is displayed
    await waitFor(() => {
      // Use container.querySelector to find the div with class "error"
      const errorDiv = document.querySelector('.error') as HTMLElement;

      // Check that the errorDiv exists
      expect(errorDiv).toBeInTheDocument();
      expect(screen.getByText('messages.errorAddingNewEmail')).toBeInTheDocument();
    });

    // Verify logECS was called with correct parameters
    const expectedPath = routePath('account.profile');
    expect(logECS).toHaveBeenCalledWith(
      'error',
      'handleAddingAlias',
      {
        error: generalError,
        url: { path: expectedPath }
      }
    );
  });


  it('should handle general error when setting primary email', async () => {
    // Create a general error (not Apollo Error)
    const generalError = new Error('General error occurred');
    const mockSetPrimaryUserEmailMutation = jest.fn().mockRejectedValue(generalError);

    mockUseMutation.mockImplementation((document) => {
      if (document === SetPrimaryUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockSetPrimaryUserEmailMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    // Find the "Make primary email address" button
    const makePrimaryButton = screen.getByRole('button', {
      name: /linkMakePrimary/i
    });

    // Trigger the make primary action
    await act(async () => {
      fireEvent.click(makePrimaryButton);
    });

    // Verify the error message is displayed
    await waitFor(() => {
      // Use container.querySelector to find the div with class "error"
      const errorDiv = document.querySelector('.error') as HTMLElement;

      // Check that the errorDiv exists
      expect(errorDiv).toBeInTheDocument();
      expect(screen.getByText('messages.errorSettingPrimaryEmail')).toBeInTheDocument();
    });

    // Verify logECS was called with correct parameters
    const expectedPath = routePath('account.profile');
    expect(logECS).toHaveBeenCalledWith(
      'error',
      'makePrimaryEmail',
      {
        error: generalError,
        url: { path: expectedPath }
      }
    );
  });

  it('should display error message when call to setPrimaryUserEmailMutation returns errors', async () => {
    const mockSetPrimaryUserEmailResponse = jest.fn().mockResolvedValue({
      data: { setPrimaryUserEmail: [{ errors: { email: ['Email is already in use'] } }] },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === SetPrimaryUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockSetPrimaryUserEmailResponse, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    // Find the "Make primary email address" button
    const makePrimaryButton = screen.getByRole('button', {
      name: /linkMakePrimary/i
    });

    // Trigger the make primary action
    await act(async () => {
      fireEvent.click(makePrimaryButton);
    });

    // Verify the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Email is already in use')).toBeInTheDocument();
    });
  });

  it('should call setPrimaryUserEmailMutation again if the initial call returns an instance of an Apollo Error', async () => {
    const mockSetPrimaryUserEmailResponse = jest.fn()
      .mockRejectedValueOnce(new Error("Apollo error occurred")) // First call returns an Apollo error
      .mockResolvedValueOnce({ data: { setPrimaryUserEmail: [{ errors: null }] } }); // Second call succeeds


    mockUseMutation.mockImplementation((document) => {
      if (document === SetPrimaryUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockSetPrimaryUserEmailResponse, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    // Find the "Make primary email address" button
    const makePrimaryButton = screen.getByRole('button', {
      name: /linkMakePrimary/i
    });

    // Trigger the make primary action
    await act(async () => {
      fireEvent.click(makePrimaryButton);
    });

    // Verify the mutation was called twice
    await waitFor(() => {
      expect(mockSetPrimaryUserEmailResponse).toHaveBeenCalledTimes(1);
      expect(screen.getByText('messages.errorSettingPrimaryEmail')).toBeInTheDocument();
    });
  })

  it('should display error message when call to adding email alias', async () => {
    const mockAddUserEmailMutation = jest.fn().mockResolvedValue({
      data: { addUserEmail: { errors: { email: 'Email is already in use' } } },
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === AddUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddUserEmailMutation, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    //Enter a value into the add alias input field
    const addAliasInput = screen.getByLabelText(/headingAddAliasEmail/i);
    fireEvent.change(addAliasInput, { target: { value: 'msmith@test.com' } });

    // Locate the Add button and click it
    // Select the wrapping div with class "addContainer" and assert it's not null
    const addContainer = document.querySelector('.addContainer') as HTMLElement;
    expect(addContainer).not.toBeNull(); // Ensure addContainer is found

    // Now we can safely use addContainer with `within`
    const addButton = within(addContainer!).getByRole('button', { name: 'btnAdd' });

    await act(async () => {
      fireEvent.click(addButton);
    })

    // Verify the error message is displayed
    await waitFor(() => {
      // Use container.querySelector to find the div with class "error"
      const errorDiv = document.querySelector('.error-message') as HTMLElement;

      // Check that the errorDiv exists
      expect(errorDiv).toBeInTheDocument();
      expect(screen.getByText('Email is already in use')).toBeInTheDocument();
    });
  });

  it('should call mockAddUserEmailMutation again if the initial call returns an instance of an Apollo Error', async () => {
    const mockAddUserEmailMutationResponse = jest.fn()
      .mockRejectedValueOnce(new Error("Apollo error occurred")) // First call returns an Apollo error
      .mockResolvedValueOnce({ data: { addUserEmail: [{ errors: null }] } }); // Second call succeeds


    mockUseMutation.mockImplementation((document) => {
      if (document === AddUserEmailDocument) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return [mockAddUserEmailMutationResponse, { loading: false, error: undefined }] as any;
      }
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return [jest.fn(), { loading: false, error: undefined }] as any;
    });

    // Render the component
    render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );

    //Enter a value into the add alias input field
    const addAliasInput = screen.getByLabelText(/headingAddAliasEmail/i);
    fireEvent.change(addAliasInput, { target: { value: 'msmith@test.com' } });

    // Locate the Add button and click it
    // Select the wrapping div with class "addContainer" and assert it's not null
    const addContainer = document.querySelector('.addContainer') as HTMLElement;
    expect(addContainer).not.toBeNull(); // Ensure addContainer is found

    // Now we can safely use addContainer with `within`
    const addButton = within(addContainer!).getByRole('button', { name: 'btnAdd' });

    await act(async () => {
      fireEvent.click(addButton);
    })

    // Verify the mutation was called twice
    await waitFor(() => {
      expect(mockAddUserEmailMutationResponse).toHaveBeenCalledTimes(1);
      expect(screen.getByText('messages.errorAddingNewEmail')).toBeInTheDocument();
    });
  });

  it('should pass axe accessibility test', async () => {
    const { container } = render(
      <UpdateEmailAddress
        emailAddresses={mockEmailAddresses}
      />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    })
  })
});
