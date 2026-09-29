import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/context/ToastContext';
import logECS from '@/utils/clientLogger';
import { isValidPassword } from '@/utils/index';
import { mockScrollIntoView, mockScrollTo } from '@/__mocks__/common';
import ResetPassword from '../page';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
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

const mockPush = jest.fn();
const mockToastAdd = jest.fn();
const passwordResetUrl = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/password-reset`;
const passwordResetVerifyUrl = `${passwordResetUrl}/verify`;
const VALID_PASSWORD = 'ValidPass123!';

function setupDefaultMocks(token: string | null = 'valid-token') {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (key: string) => (key === 'token' ? token : null),
  });
  (useTranslations as jest.Mock).mockImplementation(() => (key: string) => key);
  (useToast as jest.Mock).mockReturnValue({ add: mockToastAdd });
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
}

async function renderValidatedPage() {
  render(<ResetPassword />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    passwordResetVerifyUrl,
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token' }),
    })
  ));
  await waitFor(() => expect(screen.getByTestId('actionContinue')).toBeInTheDocument());
}

function fillPasswordFields(password: string, confirmPassword: string = password) {
  fireEvent.change(screen.getByTestId('pass'), { target: { value: password } });
  fireEvent.change(screen.getByTestId('confirmpass'), {
    target: { value: confirmPassword },
  });
}

function submitForm() {
  fireEvent.submit(screen.getByTestId('actionContinue').closest('form')!);
}

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

  it('redirects to login when no reset token is present', () => {
    setupDefaultMocks(null);

    render(<ResetPassword />);

    expect(mockPush).toHaveBeenCalledWith('app.login');
  });

  it('shows a loading indicator while validating the reset token', () => {
    global.fetch = jest.fn(() => new Promise<Response>(() => {}));

    render(<ResetPassword />);

    expect(screen.getByText('messaging.loading')).toBeInTheDocument();
  });

  it('submits a valid, matching password to the auth service', async () => {
    (isValidPassword as jest.Mock).mockReturnValue(true);
    await renderValidatedPage();

    fillPasswordFields(VALID_PASSWORD);
    submitForm();

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      passwordResetUrl,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'valid-token',
          password: VALID_PASSWORD,
          passwordConfirmation: VALID_PASSWORD,
        }),
      }
    ));
    expect(mockToastAdd).toHaveBeenCalledWith('successMessage', {
      type: 'success',
      timeout: 3000,
    });
  });

  it('shows a field error and does not submit an invalid password', async () => {
    (isValidPassword as jest.Mock).mockReturnValue(false);
    await renderValidatedPage();

    fillPasswordFields('bad');
    submitForm();

    expect(await screen.findByText('messaging.fixBelow')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('shows a field error when passwords do not match', async () => {
    (isValidPassword as jest.Mock).mockReturnValue(true);
    await renderValidatedPage();

    fillPasswordFields(VALID_PASSWORD, 'SomethingElse123!');
    submitForm();

    expect(await screen.findByText('messaging.errors.passMissMatch')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('logs an error when the password reset request fails', async () => {
    (isValidPassword as jest.Mock).mockReturnValue(true);
    const requestError = new Error('network error');
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(requestError);
    await renderValidatedPage();

    fillPasswordFields(VALID_PASSWORD);
    submitForm();

    await waitFor(() => expect(logECS).toHaveBeenCalledWith(
      'error',
      'resetPassword',
      expect.objectContaining({ error: requestError })
    ));
  });

  it('passes the accessibility test after token validation', async () => {
    const { container } = render(<ResetPassword />);
    await waitFor(() => expect(screen.getByTestId('actionContinue')).toBeInTheDocument());

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
