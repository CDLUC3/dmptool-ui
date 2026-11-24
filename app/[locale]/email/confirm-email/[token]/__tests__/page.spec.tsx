import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useAuthContext } from '@/context/AuthContext';
import { postToAuthService } from '@/utils/emailConfirmation';
import logECS from '@/utils/clientLogger';
import ConfirmEmailPage from '../page';

expect.extend(toHaveNoViolations);

const mockEvict = jest.fn();
const mockGc = jest.fn();
jest.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({ cache: { evict: mockEvict, gc: mockGc } }),
}));

jest.mock('@/i18n/routing', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

const mockGetCsrfToken = jest.fn();
jest.mock('@/context/CsrfContext', () => ({
  useCsrf: () => ({ getCsrfToken: mockGetCsrfToken }),
}));

jest.mock('@/utils/emailConfirmation', () => ({
  ...jest.requireActual('@/utils/emailConfirmation'),
  postToAuthService: jest.fn(),
}));

const mockPost = jest.mocked(postToAuthService);
const response = (status: number, body: unknown = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
}) as unknown as Response;

describe('ConfirmEmailPage', () => {
  const mockPush = jest.fn();
  const mockSetIsAuthenticated = jest.fn();

  const signedIn = (isAuthenticated: boolean | null) => {
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated, setIsAuthenticated: mockSetIsAuthenticated });
  };

  // Render the page and let the automatic confirmation request finish
  const renderAndConfirm = async () => {
    await act(async () => {
      render(<ConfirmEmailPage />);
    });
  };

  beforeEach(() => {
    window.scrollTo = jest.fn(); // Called by PageHeader
    (useParams as jest.Mock).mockReturnValue({ token: 'the-token' });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockPost.mockReset();
    signedIn(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading state while it checks whether the user is signed in', () => {
    signedIn(null);
    render(<ConfirmEmailPage />);

    expect(screen.queryByRole('button', { name: 'confirm.signInButton' })).not.toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('asks signed-out users to sign in instead of confirming', async () => {
    signedIn(false);
    render(<ConfirmEmailPage />);

    expect(screen.getByRole('heading', { name: 'confirm.signInTitle' })).toBeInTheDocument();
    expect(screen.getByText('confirm.signInDescription')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'confirm.signInButton' }));
    });
    // The login page sends the user back here after they sign in
    expect(mockPush).toHaveBeenCalledWith(`/login?returnTo=${encodeURIComponent('/email/confirm-email/the-token')}`);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('shows a confirming message while the email is being confirmed', async () => {
    mockPost.mockReturnValueOnce(new Promise(() => {})); // Never finishes
    await renderAndConfirm();

    expect(screen.getByText('confirm.confirming')).toBeInTheDocument();
  });

  it('sends only one request, even when React runs effects twice', async () => {
    mockPost.mockResolvedValue(response(200, { success: true, email: 'alias@test.com' }));
    await act(async () => {
      render(<React.StrictMode><ConfirmEmailPage /></React.StrictMode>);
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('confirms the email once the user is signed in', async () => {
    mockPost.mockResolvedValue(response(200, { success: true, email: 'alias@test.com' }));
    signedIn(null);
    const { rerender } = render(<ConfirmEmailPage />);
    expect(mockPost).not.toHaveBeenCalled();

    signedIn(true);
    await act(async () => {
      rerender(<ConfirmEmailPage />);
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('confirms the email with the token from the link and shows the confirmed page', async () => {
    mockPost.mockResolvedValueOnce(response(200, { success: true, email: 'alias@test.com' }));
    await renderAndConfirm();

    expect(mockPost).toHaveBeenCalledWith('/email-confirmation/confirm', { token: 'the-token' }, mockGetCsrfToken);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/email/email-confirmed'));
  });

  it('clears the cached user so the profile page shows the email as confirmed', async () => {
    mockPost.mockResolvedValueOnce(response(200, { success: true, email: 'alias@test.com' }));
    await renderAndConfirm();

    expect(mockEvict).toHaveBeenCalledWith({ fieldName: 'me' });
    expect(mockGc).toHaveBeenCalled();
  });

  it('keeps the cached user when the email could not be confirmed', async () => {
    mockPost.mockResolvedValueOnce(response(400, { success: false, reason: 'invalid' }));
    await renderAndConfirm();

    expect(mockEvict).not.toHaveBeenCalled();
  });

  it.each(['invalid', 'wrongAccount', 'claimedByOther'])(
    'shows the verification failed page with the reason %s',
    async (reason) => {
      mockPost.mockResolvedValueOnce(response(400, { success: false, reason }));
      await renderAndConfirm();

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith(`/email/verification-failed?reason=${reason}`));
    }
  );

  it('asks the user to sign in again when their session has ended', async () => {
    mockPost.mockResolvedValueOnce(response(401, { message: 'Invalid access token' }));
    await renderAndConfirm();

    expect(mockSetIsAuthenticated).toHaveBeenCalledWith(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('confirms the email when the user signs in again after their session ended', async () => {
    mockPost
      .mockResolvedValueOnce(response(401, { message: 'Invalid access token' }))
      .mockResolvedValueOnce(response(200, { success: true, email: 'alias@test.com' }));
    const { rerender } = render(<ConfirmEmailPage />);
    await waitFor(() => expect(mockSetIsAuthenticated).toHaveBeenCalledWith(false));

    signedIn(false);
    await act(async () => {
      rerender(<ConfirmEmailPage />);
    });
    signedIn(true);
    await act(async () => {
      rerender(<ConfirmEmailPage />);
    });

    expect(mockPost).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/email/email-confirmed'));
  });

  it('logs and shows an error for unexpected responses', async () => {
    mockPost.mockResolvedValueOnce(response(500, { message: 'Internal server error' }));
    await renderAndConfirm();

    expect(await screen.findByText('confirm.error')).toBeInTheDocument();
    expect(logECS).toHaveBeenCalledWith('error', 'ConfirmEmailPage.confirmEmail', {
      status: 500,
      message: 'Internal server error',
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('logs and shows an error when the request fails', async () => {
    const error = new Error('Network error');
    mockPost.mockRejectedValueOnce(error);
    await renderAndConfirm();

    expect(await screen.findByText('confirm.error')).toBeInTheDocument();
    expect(logECS).toHaveBeenCalledWith('error', 'ConfirmEmailPage.confirmEmail', { error });
  });

  it('lets the user try again after an unexpected error', async () => {
    mockPost
      .mockResolvedValueOnce(response(500, { message: 'Internal server error' }))
      .mockResolvedValueOnce(response(200, { success: true, email: 'alias@test.com' }));
    await renderAndConfirm();

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'confirm.retryButton' }));
    });

    expect(mockPost).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/email/email-confirmed'));
  });

  it('should pass axe accessibility test while confirming', async () => {
    mockPost.mockReturnValueOnce(new Promise(() => {})); // Never finishes
    const { container } = render(<ConfirmEmailPage />);
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('should pass axe accessibility test when signed out', async () => {
    signedIn(false);
    const { container } = render(<ConfirmEmailPage />);
    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
