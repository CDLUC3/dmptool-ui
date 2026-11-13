import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useMutation, useQuery } from '@apollo/client/react';

import { useAuthContext } from '@/context/AuthContext';
import { refreshAuthTokens } from '@/utils/authHelper';
import { handleApolloError, logECS } from '@/utils/index';
import LanguageSelector from '../index';

expect.extend(toHaveNoViolations);

const mockPush = jest.fn();
jest.mock('@/i18n/routing', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
  usePathname: jest.fn(() => '/projects'),
}));

jest.mock('next-intl', () => ({
  useLocale: jest.fn(() => 'en-US'),
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@/utils/authHelper', () => ({
  refreshAuthTokens: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/index', () => ({
  handleApolloError: jest.fn(() => ({ wasRealError: true, message: 'error' })),
  logECS: jest.fn(),
}));

const locales = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'pt-BR', name: 'Português (Brasil)' },
];

const me = {
  givenName: 'Jane',
  surName: 'Doe',
  affiliation: { uri: 'https://ror.org/00pjdza24' },
};

describe('LanguageSelector', () => {
  const mockUpdateProfile = jest.fn();

  const setUp = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
    (useAuthContext as jest.Mock).mockReturnValue({ isAuthenticated });
    (useQuery as unknown as jest.Mock).mockReturnValue({ data: isAuthenticated ? { me } : undefined });
    (useMutation as jest.Mock).mockReturnValue([mockUpdateProfile]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({ data: { updateUserProfile: { errors: { general: null } } } });
  });

  it('should show the current language as text and the other as a button', () => {
    setUp({ isAuthenticated: false });
    render(<LanguageSelector locales={locales} label="Language" />);

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();

    const current = screen.getByText('English (US)');
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveAttribute('lang', 'en-US');
    expect(screen.queryByRole('button', { name: 'English (US)' })).not.toBeInTheDocument();

    const other = screen.getByRole('button', { name: 'Português (Brasil)' });
    expect(other.querySelector('[lang="pt-BR"]')).toBeInTheDocument();
  });

  it('should switch the locale without saving a profile when logged out', async () => {
    const user = userEvent.setup();
    setUp({ isAuthenticated: false });
    render(<LanguageSelector locales={locales} label="Language" />);

    await user.click(screen.getByRole('button', { name: 'Português (Brasil)' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects', { locale: 'pt-BR' });
    });
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), { skip: true });
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(refreshAuthTokens).not.toHaveBeenCalled();
  });

  it('should save the preferred language and refresh tokens before switching when logged in', async () => {
    const user = userEvent.setup();
    setUp({ isAuthenticated: true });
    render(<LanguageSelector locales={locales} label="Language" />);

    await user.click(screen.getByRole('button', { name: 'Português (Brasil)' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects', { locale: 'pt-BR' });
    });
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      variables: {
        input: {
          givenName: 'Jane',
          surName: 'Doe',
          affiliationId: 'https://ror.org/00pjdza24',
          languageId: 'pt-BR',
        },
      },
    });
    expect(refreshAuthTokens).toHaveBeenCalled();
  });

  it('should log errors returned by the mutation and still switch the locale', async () => {
    const user = userEvent.setup();
    setUp({ isAuthenticated: true });
    mockUpdateProfile.mockResolvedValue({ data: { updateUserProfile: { errors: { general: 'Something went wrong' } } } });
    render(<LanguageSelector locales={locales} label="Language" />);

    await user.click(screen.getByRole('button', { name: 'Português (Brasil)' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects', { locale: 'pt-BR' });
    });
    expect(logECS).toHaveBeenCalledWith('error', 'LanguageSelector.savePreferredLanguage', {
      errors: 'Something went wrong',
    });
    expect(refreshAuthTokens).not.toHaveBeenCalled();
  });

  it('should handle a thrown error and still switch the locale', async () => {
    const user = userEvent.setup();
    setUp({ isAuthenticated: true });
    const error = new Error('Network error');
    mockUpdateProfile.mockRejectedValue(error);
    render(<LanguageSelector locales={locales} label="Language" />);

    await user.click(screen.getByRole('button', { name: 'Português (Brasil)' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/projects', { locale: 'pt-BR' });
    });
    expect(handleApolloError).toHaveBeenCalledWith(error, 'LanguageSelector.savePreferredLanguage');
  });

  it('should pass axe accessibility test', async () => {
    setUp({ isAuthenticated: false });
    const { container } = render(<LanguageSelector locales={locales} label="Language" />);

    await act(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
