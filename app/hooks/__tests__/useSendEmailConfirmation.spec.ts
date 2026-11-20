import { act, renderHook } from '@testing-library/react';
import { useSendEmailConfirmation } from '../useSendEmailConfirmation';
import { postToAuthService } from '@/utils/emailConfirmation';

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

describe('useSendEmailConfirmation', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('asks the Auth service to send the confirmation link', async () => {
    mockPost.mockResolvedValueOnce(response(201, { success: true }));
    const { result } = renderHook(() => useSendEmailConfirmation());

    let outcome;
    await act(async () => {
      outcome = await result.current[0]('alias@test.com');
    });

    expect(outcome).toEqual({ sent: true });
    expect(mockPost).toHaveBeenCalledWith('/email-confirmation/token', { email: 'alias@test.com' }, mockGetCsrfToken);
    expect(result.current[1].loading).toBe(false);
  });

  it.each([
    [409, { reason: 'alreadyConfirmed', message: 'Email is already confirmed' }, 'alreadyConfirmed'],
    [409, { reason: 'claimedByOther', message: 'Email has already been confirmed by another account' }, 'claimedByOther'],
    // The reason code is what counts, not the message text
    [409, { reason: 'alreadyConfirmed', message: 'Reworded message' }, 'alreadyConfirmed'],
    [409, { message: 'Email is already confirmed' }, 'failed'],
    [409, { reason: 'somethingNew' }, 'failed'],
    [404, { message: 'Email not found for this account' }, 'failed'],
    [502, { message: 'Unable to send email confirmation email' }, 'failed'],
  ])('reports why the link was not sent (%i %o)', async (status, body, reason) => {
    mockPost.mockResolvedValueOnce(response(status, body));
    const { result } = renderHook(() => useSendEmailConfirmation());

    let outcome;
    await act(async () => {
      outcome = await result.current[0]('alias@test.com');
    });

    expect(outcome).toEqual({ sent: false, reason });
  });

  it('shows loading while sending and throws network errors to the caller', async () => {
    let reject: (error: Error) => void = () => undefined;
    mockPost.mockReturnValueOnce(new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }));
    const { result } = renderHook(() => useSendEmailConfirmation());

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current[0]('alias@test.com');
    });
    expect(result.current[1].loading).toBe(true);

    await act(async () => {
      reject(new Error('Network error'));
      await expect(pending).rejects.toThrow('Network error');
    });
    expect(result.current[1].loading).toBe(false);
  });
});
