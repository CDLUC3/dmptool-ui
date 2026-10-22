import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SignUpPage from '../page';
import { useCsrf } from '@/context/CsrfContext';
import { useAuthContext } from '@/context/AuthContext';

jest.mock('@/components/Form/TypeAheadWithOther', () => ({
  TypeAheadWithOther: ({ updateFormData }: { updateFormData: (id: string, value: string) => void }) => (
    <input
      data-testid="institution"
      name="institution"
      onChange={(event) => updateFormData(event.target.value, event.target.value)}
    />
  ),
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

jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@/context/CsrfContext', () => ({
  useCsrf: jest.fn(),
}));

const ssoCheckUrl = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sso-check`;
const signUpUrl = `${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}/sign-up`;

describe('SignUpPage', () => {
  const getCsrfToken = jest.fn().mockResolvedValue('mocked-csrf-token');

  const enterEmail = async () => {
    fireEvent.change(screen.getByTestId('emailInput'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByTestId('actionContinue'));
  };

  const completeForm = async () => {
    await enterEmail();
    await screen.findByLabelText('firstName');
    fireEvent.change(screen.getByLabelText('firstName'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('lastName'), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByTestId('institution'), { target: { value: 'institution-id' } });
    fireEvent.change(screen.getByTestId('pass'), { target: { value: 'Secret -- 123' } });
    fireEvent.change(screen.getByTestId('confirmpass'), { target: { value: 'Secret -- 123' } });
    fireEvent.click(screen.getByLabelText('acceptTerms'));
  };

  beforeEach(() => {
    (useCsrf as jest.Mock).mockReturnValue({ getCsrfToken });
    (useAuthContext as jest.Mock).mockReturnValue({
      clearCache: jest.fn().mockResolvedValue(undefined),
      setIsAuthenticated: jest.fn(),
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows registration fields only after an unmatched SSO check', async () => {
    render(<SignUpPage />);

    await enterEmail();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(ssoCheckUrl, expect.objectContaining({
        body: JSON.stringify({ email: 'test@example.com' }),
      }));
      expect(screen.getByLabelText('firstName')).toBeInTheDocument();
      expect(screen.getByTestId('actionSubmit')).toBeDisabled();
    });
  });

  it('shows the matched institution SSO option instead of the registration form', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        entityId: 'example-entity',
        affiliationId: 'example-affiliation',
        displayName: 'Example University',
      }),
    } as Response);
    render(<SignUpPage />);

    await enterEmail();

    expect(await screen.findByText('Example University')).toBeInTheDocument();
    expect(screen.getByTestId('actionSsoSubmit')).toBeInTheDocument();
    expect(screen.queryByLabelText('firstName')).not.toBeInTheDocument();
  });

  it('submits the selected affiliation ID after completing the non-SSO form', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    render(<SignUpPage />);

    await completeForm();
    fireEvent.click(screen.getByTestId('actionSubmit'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(signUpUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': 'mocked-csrf-token',
        },
        body: JSON.stringify({
          givenName: 'John',
          surName: 'Smith',
          email: 'test@example.com',
          password: 'Secret -- 123',
          affiliationId: 'institution-id',
          otherAffiliationName: '',
          acceptedTerms: true,
        }),
      });
    });
  });
});
