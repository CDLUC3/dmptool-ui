/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';
import { GET } from '../route';
import { getAuthTokenServer } from '@/utils/getAuthTokenServer';
import { verifyJwtToken } from '@/lib/server/auth';
import { cookies } from 'next/headers';
import { refreshAuthTokens } from '@/utils/authHelper';

jest.mock('@/utils/server/logger', () => {
  // Define the mock before using it in the factory
  const mockError: jest.Mock = jest.fn();

  // Avoid requireActual to prevent constructing the real logger
  return {
    __esModule: true,
    // Mock the named export
    createLogger: jest.fn(() => ({
      error: mockError,
    })),
    // Also mock the default logger for modules that import default
    default: {
      error: mockError,
    },
    mockError,
    // If tests rely on these constants, you can stub them here
    REDACTION_KEYS: ['token'],
    REDACTION_MESSAGE: '[MASKED]',
  };
});

import logger from '@/utils/server/logger';

jest.mock('@/utils/getAuthTokenServer', () => ({
  getAuthTokenServer: jest.fn(),
}));

jest.mock('@/lib/server/auth', () => ({
  verifyJwtToken: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/utils/authHelper', () => ({
  REFRESH_TOKEN_NAME: 'refresh_token',
  refreshAuthTokens: jest.fn(),
}));

const mockCookieStore = (cookieList: { name: string, value: string }[]) => {
  (cookies as jest.Mock).mockResolvedValue({
    get: jest.fn((name: string) => cookieList.find(c => c.name === name)),
    getAll: jest.fn(() => cookieList),
  });
};


describe('GET Function', () => {
  let redirectSpy: jest.SpyInstance;
  beforeEach(() => {
    redirectSpy = jest.spyOn(NextResponse, 'redirect');
    jest.clearAllMocks();
    mockCookieStore([]);
  });

  afterEach(() => {
    redirectSpy.mockRestore();

  })

  it('should return true for "authenticated" and a status of 200 if auth cookie is present and passes verification', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue('valid-token');
    (verifyJwtToken as jest.Mock).mockImplementation(() => true);
    const response = await GET();
    expect(response.status).toEqual(200);
    const data = await response.json();

    expect(data).toEqual({ authenticated: true })
  })

  it('should return false for "authenticated" if it auth token does not pass verification', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue('valid-token');
    (verifyJwtToken as jest.Mock).mockImplementation(() => false);
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ authenticated: false })
    expect(logger.error).toHaveBeenCalledWith({
      error: new Error("User verification failed"),
      route: "/api/check-auth",
      token: "valid-token"
    }, "Token verification failed");
  })

  it('should return false for "authenticated" if there is no access token auth cookie/token', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue(null);
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ authenticated: false })
  })

  it('should return error with "authenticated" set to false when an error is thrown getting the token', async () => {
    (getAuthTokenServer as jest.Mock).mockRejectedValue(new Error('Test error'));
    (verifyJwtToken as jest.Mock).mockImplementation(() => false);
    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ authenticated: false, error: 'Internal Server Error' })
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error), route: '/api/check-auth' }),
      "Error getting auth token from cookie"
    );
  })

  it('should redirect to login page if verification of token fails', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue('invalid-token');
    (verifyJwtToken as jest.Mock).mockRejectedValue(new Error('Verification failed'));
    await GET();

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      "Token verification error"
    );
    expect(redirectSpy).toHaveBeenCalledWith('http://localhost:3000/login');
  })

  it('should refresh tokens and return true for "authenticated" if there is no access token but a refresh token exists', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue(null);
    mockCookieStore([{ name: 'refresh_token', value: 'refresh-value' }]);
    const backendHeaders = new Headers();
    backendHeaders.append('set-cookie', 'access_token=new-access; Path=/; HttpOnly');
    (refreshAuthTokens as jest.Mock).mockResolvedValue({ response: { headers: backendHeaders } });

    const response = await GET();
    const data = await response.json();

    expect(refreshAuthTokens).toHaveBeenCalledWith('refresh_token=refresh-value');
    expect(data).toEqual({ authenticated: true });
    expect(response.headers.get('set-cookie')).toContain('access_token=new-access');
  })

  it('should refresh tokens if the access token fails verification but a refresh token exists', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue('expired-token');
    (verifyJwtToken as jest.Mock).mockResolvedValue(null);
    mockCookieStore([{ name: 'refresh_token', value: 'refresh-value' }]);
    (refreshAuthTokens as jest.Mock).mockResolvedValue({ response: { headers: new Headers() } });

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ authenticated: true });
  })

  it('should return false for "authenticated" if the token refresh fails', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue(null);
    mockCookieStore([{ name: 'refresh_token', value: 'refresh-value' }]);
    (refreshAuthTokens as jest.Mock).mockResolvedValue({ shouldRedirect: true, redirectTo: '/login' });

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual({ authenticated: false });
  })

  it('should not try to refresh if there is no refresh token', async () => {
    (getAuthTokenServer as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(refreshAuthTokens).not.toHaveBeenCalled();
    expect(data).toEqual({ authenticated: false });
  })
});
