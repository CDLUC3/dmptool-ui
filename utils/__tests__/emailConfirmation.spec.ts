import {
  isEmailConfirmationFailureReason,
  postToAuthService,
  readAuthServiceBody,
} from '@/utils/emailConfirmation';

// A minimal stand-in for a fetch Response
const makeResponse = (status: number, body?: unknown, invalidJson = false): Response => {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn(async () => {
      if (invalidJson) throw new SyntaxError('Unexpected token');
      return body;
    }),
    clone: () => makeResponse(status, body, invalidJson),
  };
  return response as unknown as Response;
};

describe('emailConfirmation utils', () => {
  const originalFetch = global.fetch;
  const getCsrfToken = jest.fn<Promise<string | null>, []>();
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AUTH_ENDPOINT = 'http://auth.example.test';
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    getCsrfToken.mockReset();
    getCsrfToken.mockResolvedValueOnce('csrf-1').mockResolvedValueOnce('csrf-2');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('postToAuthService', () => {
    it('posts JSON with the cookies and a CSRF token', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(200, { success: true }));

      const response = await postToAuthService('/email-confirmation/confirm', { token: 'abc' }, getCsrfToken);

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('http://auth.example.test/email-confirmation/confirm', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': 'csrf-1' },
        body: JSON.stringify({ token: 'abc' }),
      });
    });

    it('sends an empty CSRF header when no CSRF token is available', async () => {
      getCsrfToken.mockReset();
      getCsrfToken.mockResolvedValue(null);
      fetchMock.mockResolvedValueOnce(makeResponse(200));

      await postToAuthService('/email-confirmation/token', { email: 'a@test.com' }, getCsrfToken);

      expect(fetchMock.mock.calls[0][1].headers['X-CSRF-TOKEN']).toBe('');
    });

    it('retries once with a fresh CSRF token when the CSRF token is rejected', async () => {
      fetchMock
        .mockResolvedValueOnce(makeResponse(403, { message: 'Invalid CSRF token' }))
        .mockResolvedValueOnce(makeResponse(201, { success: true }));

      const response = await postToAuthService('/email-confirmation/token', { email: 'a@test.com' }, getCsrfToken);

      expect(response.status).toBe(201);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][1].headers['X-CSRF-TOKEN']).toBe('csrf-2');
    });

    it('does not retry other 403 responses, such as a link sent for a different account', async () => {
      fetchMock.mockResolvedValueOnce(makeResponse(403, { reason: 'wrongAccount' }));

      const response = await postToAuthService('/email-confirmation/confirm', { token: 'abc' }, getCsrfToken);

      expect(response.status).toBe(403);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('refreshes the session and retries once when the access token has expired', async () => {
      fetchMock
        .mockResolvedValueOnce(makeResponse(401, { message: 'Invalid access token' }))
        .mockResolvedValueOnce(makeResponse(200, { authenticated: true }))
        .mockResolvedValueOnce(makeResponse(200, { success: true }));

      const response = await postToAuthService('/email-confirmation/confirm', { token: 'abc' }, getCsrfToken);

      expect(response.status).toBe(200);
      expect(fetchMock.mock.calls[1]).toEqual(['/api/check-auth', { credentials: 'include' }]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it.each([
      ['the user is signed out', makeResponse(200, { authenticated: false })],
      ['the session check fails', makeResponse(500, undefined, true)],
    ])('returns the 401 without retrying when %s', async (_label, checkResponse) => {
      fetchMock
        .mockResolvedValueOnce(makeResponse(401, { message: 'Invalid access token' }))
        .mockResolvedValueOnce(checkResponse);

      const response = await postToAuthService('/email-confirmation/confirm', { token: 'abc' }, getCsrfToken);

      expect(response.status).toBe(401);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('readAuthServiceBody', () => {
    it('returns the JSON body, or an empty object when the body is not a JSON object', async () => {
      await expect(readAuthServiceBody(makeResponse(400, { reason: 'invalid' }))).resolves.toEqual({ reason: 'invalid' });
      await expect(readAuthServiceBody(makeResponse(400, null))).resolves.toEqual({});
      await expect(readAuthServiceBody(makeResponse(502, undefined, true))).resolves.toEqual({});
    });
  });

  describe('isEmailConfirmationFailureReason', () => {
    it('only accepts the reasons the Auth service returns', () => {
      expect(isEmailConfirmationFailureReason('invalid')).toBe(true);
      expect(isEmailConfirmationFailureReason('wrongAccount')).toBe(true);
      expect(isEmailConfirmationFailureReason('claimedByOther')).toBe(true);
      expect(isEmailConfirmationFailureReason('somethingElse')).toBe(false);
      expect(isEmailConfirmationFailureReason(null)).toBe(false);
    });
  });
});
