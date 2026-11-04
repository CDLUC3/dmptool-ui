import { renderHook, act } from '@testing-library/react';
import { FAKE_RESEND_DELAY_MS, useResendEmailConfirmation } from '../useResendEmailConfirmation';

describe('useResendEmailConfirmation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start out not loading', () => {
    const { result } = renderHook(() => useResendEmailConfirmation());
    const [, { loading }] = result.current;

    expect(loading).toBe(false);
  });

  it('should resolve with an unconfirmed UserEmail and no errors for the given email', async () => {
    const { result } = renderHook(() => useResendEmailConfirmation());
    const [resendEmailConfirmation] = result.current;

    let promise!: ReturnType<typeof resendEmailConfirmation>;
    act(() => {
      promise = resendEmailConfirmation({ variables: { email: 'alias@test.com' } });
    });

    expect(result.current[1].loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(FAKE_RESEND_DELAY_MS);
    });

    await expect(promise).resolves.toEqual({
      data: {
        resendUserEmailConfirmation: {
          __typename: 'UserEmail',
          id: null,
          email: 'alias@test.com',
          isPrimary: false,
          isConfirmed: false,
          errors: null,
        },
      },
    });
    expect(result.current[1].loading).toBe(false);
  });
});
