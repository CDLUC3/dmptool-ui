/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@apollo/client/react';
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import { isValidPassword } from '@/utils/index';

import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';
import ResetPassword from '../page';
import {
  ValidatePasswordResetTokenDocument,
} from "@/generated/graphql";

import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);
// ---------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/utils/clientLogger', () => jest.fn());

jest.mock('@/utils/index', () => ({
  routePath: jest.fn((key: string) => key),
  isValidPassword: jest.fn(),
}));

jest.mock('@/components/PasswordRequirementsList', () => () => (
  <div data-testid="password-requirements" />
));

type QueryResult = ReturnType<typeof useQuery>;
type QueryError = QueryResult["error"];

// ---------------------------------------------------------------------
// Test setup helpers
// ---------------------------------------------------------------------
const mockPush = jest.fn();
const mockToastAdd = jest.fn();
const mockResetPasswordMutation = jest.fn<Promise<boolean>, []>();
const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;

const VALID_PASSWORD = 'ValidPass123!';

function setupDefaultMocks({
  token = 'valid-token',
  validateLoading = false,
  validateError = undefined,
  validateData = { validatePasswordResetToken: true },
  mutationLoading = false,
}: {
  token?: string | null;
  validateLoading?: boolean;
  validateError?: QueryError;
  validateData?: any;
  mutationLoading?: boolean;
} = {}) {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

  (useSearchParams as jest.Mock).mockReturnValue({
    get: (key: string) => (key === 'token' ? token : null),
  });

  (useTranslations as jest.Mock).mockImplementation(() => (key: string) => key);

  (useToast as jest.Mock).mockReturnValue({ add: mockToastAdd });

  mockUseQuery.mockImplementation((document: unknown) => {
    if (document === ValidatePasswordResetTokenDocument) {
      return {
        data: validateData,
        loading: validateLoading,
        error: validateError,
      };
    }
    return { data: null, loading: false, error: undefined };
  });

  mockUseMutation.mockImplementation(() => [
    mockResetPasswordMutation.mockResolvedValue(true),
    { loading: mutationLoading, error: undefined },
  ]);
}

function fillPasswordFields(password: string, confirmPassword: string = password) {
  fireEvent.change(screen.getByTestId('pass'), { target: { value: password } });
  fireEvent.change(screen.getByTestId('confirmpass'), {
    target: { value: confirmPassword },
  });
}

function submitForm() {
  fireEvent.click(screen.getByTestId('actionContinue'));
}


// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe('ResetPassword', () => {

  beforeEach(() => {
    window.scrollTo = jest.fn();
    setupDefaultMocks();
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView;
    mockScrollTo();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to the login page when no resetToken is present in the query params', () => {
    setupDefaultMocks({ token: null });

    render(<ResetPassword />);

    expect(mockPush).toHaveBeenCalledWith('app.login');
  });

  it('should show a Loading indicator while the reset token is being validated', () => {
    setupDefaultMocks({ validateLoading: true });

    render(<ResetPassword />);

    expect(screen.getByText('messaging.loading')).toBeInTheDocument();
  });

  it('should show a Loading indicator while the reset password mutation is loading', () => {
    setupDefaultMocks({ mutationLoading: true });

    render(<ResetPassword />);

    expect(screen.getByText('messaging.loading')).toBeInTheDocument();
  });

  it('should submit the form when a valid, matching password is entered', async () => {
    mockResetPasswordMutation.mockResolvedValueOnce(true);
    (isValidPassword as unknown as jest.Mock).mockReturnValue(true);

    render(<ResetPassword />);

    fillPasswordFields(VALID_PASSWORD);
    submitForm();

    await waitFor(() => {
      expect(mockResetPasswordMutation).toHaveBeenCalledWith({
        variables: {
          token: 'valid-token',
          newPassword: VALID_PASSWORD,
        },
      });
    });

    // Success state renders the "password updated" confirmation copy
    expect(await screen.findByText('passwordUpdatedTitle')).toBeInTheDocument();
  });

  it('should show a field error and does not submit when the password is invalid', async () => {
    (isValidPassword as unknown as jest.Mock).mockReturnValue(false);

    render(<ResetPassword />);

    fillPasswordFields('bad');
    submitForm();

    expect(await screen.findByText('messaging.fixBelow')).toBeInTheDocument();
    expect(mockResetPasswordMutation).not.toHaveBeenCalled();
  });

  it('should show a field error when password and confirmPassword do not match', async () => {
    (isValidPassword as unknown as jest.Mock).mockReturnValue(true);

    render(<ResetPassword />);

    fillPasswordFields(VALID_PASSWORD, 'SomethingElse123!');
    submitForm();

    expect(await screen.findByText('messaging.errors.passMissMatch')).toBeInTheDocument();
    expect(mockResetPasswordMutation).not.toHaveBeenCalled();
  });

  it('should log the error and displays a generic error message when the mutation fails', async () => {
    (isValidPassword as unknown as jest.Mock).mockReturnValue(true);
    const mutationError = new Error('network error');
    mockResetPasswordMutation.mockRejectedValueOnce(mutationError);

    render(<ResetPassword />);

    fillPasswordFields(VALID_PASSWORD);
    submitForm();

    await waitFor(() => {
      expect(screen.getByText('messaging.somethingWentWrong')).toBeInTheDocument();
    });

    expect(logECS).toHaveBeenCalledWith(
      'error',
      'resetPassword',
      expect.objectContaining({ error: mutationError })
    );
  });

  it('should disable the submit button and shows the sending label while isSubmitting is true', async () => {
    (isValidPassword as unknown as jest.Mock).mockReturnValue(true);

    let resolveMutation: (value: boolean) => void = () => { };
    mockResetPasswordMutation.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveMutation = resolve;
        })
    );

    render(<ResetPassword />);

    fillPasswordFields(VALID_PASSWORD);
    submitForm();

    const button = await screen.findByTestId('actionContinue');

    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('buttons.sending');
    });

    // Resolve the pending mutation and let state settle
    resolveMutation(true);
    await waitFor(() => {
      expect(screen.getByText('passwordUpdatedTitle')).toBeInTheDocument();
    });
  });

  it("should pass axe accessibility test", async () => {
    const { container } = render(
      <ResetPassword />
    );
    await act(async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  })
});