import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../page';
import { useCsrf } from '@/context/CsrfContext';
import { useAuthContext } from '@/context/AuthContext';
import { routePath } from '@/utils/index';
import { getTranslations } from 'next-intl/server';
import { getInitialPendingSignup } from '@/lib/server/auth';

jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  TypeAheadWithOther: () => null,
  useAffiliationSearch: jest.fn(() => ({
    suggestions: [],
    handleSearch: jest.fn(),
    isSearching: false,
    searchError: '',
  })),
}));

jest.mock('@/i18n/routing', () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('@/utils/index', () => {
  const actual = jest.requireActual('@/utils/index');
  return { ...actual, routePath: jest.fn(actual.routePath) };
});

jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@/context/CsrfContext', () => ({
  useCsrf: jest.fn(),
}));

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(),
}));

jest.mock('@/lib/server/auth', () => ({
  getInitialPendingSignup: jest.fn(),
}));

const ssoCheckUrl = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sso-check`;
const signInUrl = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sign-in`;

describe('LoginPage', () => {
  const getCsrfToken = jest.fn().mockResolvedValue('mocked-csrf-token');
  const clearCache = jest.fn().mockResolvedValue(undefined);
  const setIsAuthenticated = jest.fn();

  const renderPage = async () => {
    render(await LoginPage({}));
  };

  const enterEmail = async (email = 'test@example.com') => {
    fireEvent.change(screen.getByTestId('emailInput'), { target: { value: email } });
    fireEvent.click(screen.getByTestId('actionContinue'));
  };

  beforeEach(() => {
    (getTranslations as jest.Mock).mockResolvedValue((key: string) => key);
    (getInitialPendingSignup as jest.Mock).mockResolvedValue(undefined);
    (useCsrf as jest.Mock).mockReturnValue({ getCsrfToken });
    (useAuthContext as jest.Mock).mockReturnValue({ clearCache, setIsAuthenticated });
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('starts with an email-only SSO discovery step', () => {
    return renderPage().then(() => {
      expect(screen.getByTestId('emailInput')).toBeInTheDocument();
      expect(screen.getByTestId('actionContinue')).toBeInTheDocument();
      expect(screen.queryByTestId('passInput')).not.toBeInTheDocument();
    });
  });

  it('shows the password login form when no SSO provider matches', async () => {
    await renderPage();

    await enterEmail();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(ssoCheckUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'mocked-csrf-token',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      expect(screen.getByTestId('passInput')).toBeInTheDocument();
    });
  });

  it('shows the institution SSO option when a provider matches', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        entityId: 'example-entity',
        affiliationId: 'example-affiliation',
        displayName: 'Example University',
      }),
    });
    await renderPage();

    await enterEmail('person@example.edu');

    expect(await screen.findByText('Example University')).toBeInTheDocument();
    expect(screen.getByTestId('actionSsoSubmit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nonSsoLink' })).toBeInTheDocument();
  });

  it('submits credentials after an unmatched SSO check', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    await renderPage();

    await enterEmail();
    const password = await screen.findByTestId('passInput');
    fireEvent.change(password, { target: { value: 'Secret -- 123' } });
    fireEvent.click(screen.getByTestId('actionSubmit'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(signInUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'mocked-csrf-token',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Secret -- 123',
        }),
      });
      expect(clearCache).toHaveBeenCalled();
      expect(setIsAuthenticated).toHaveBeenCalledWith(true);
      expect(routePath).toHaveBeenCalledWith('app.home');
    });
  });
});
