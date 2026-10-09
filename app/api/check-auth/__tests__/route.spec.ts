/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';
import { GET } from '../route';
import { getAuthTokenServer } from '@/utils/getAuthTokenServer';
import { verifyJwtToken } from '@/lib/server/auth';

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


describe('GET Function', () => {
  let redirectSpy: jest.SpyInstance;
  beforeEach(() => {
    redirectSpy = jest.spyOn(NextResponse, 'redirect');
    jest.clearAllMocks();
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

});
