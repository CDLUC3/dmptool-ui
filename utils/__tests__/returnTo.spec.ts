import { getReturnTo, isEmailConfirmationReturn, safeReturnTo } from '@/utils/returnTo';

describe('safeReturnTo', () => {
  it('keeps paths on this site, including their query string and hash', () => {
    expect(safeReturnTo('/email/confirm-email/abc')).toBe('/email/confirm-email/abc');
    expect(safeReturnTo('/plans?page=2#top')).toBe('/plans?page=2#top');
    expect(safeReturnTo('/a/../b')).toBe('/b');
  });

  it('rejects values that are missing, too long or not a path on this site', () => {
    for (const value of [
      undefined, null, 42, ['/a'], '', 'plans', 'https://evil.example', 'javascript:alert(1)',
      '//evil.example', '/\\evil.example', '/\tfoo', '/a\nb', `/${'a'.repeat(2048)}`,
    ]) {
      expect(safeReturnTo(value)).toBeUndefined();
    }
  });
});

describe('getReturnTo', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('reads returnTo from the current URL', () => {
    window.history.replaceState({}, '', '/login?returnTo=%2Femail%2Fconfirm-email%2Fabc');
    expect(getReturnTo()).toBe('/email/confirm-email/abc');
  });

  it('ignores a missing or unsafe returnTo', () => {
    window.history.replaceState({}, '', '/login');
    expect(getReturnTo()).toBeUndefined();

    window.history.replaceState({}, '', '/login?returnTo=https%3A%2F%2Fevil.example');
    expect(getReturnTo()).toBeUndefined();
  });
});

describe('isEmailConfirmationReturn', () => {
  it('is true only for the email confirmation page', () => {
    expect(isEmailConfirmationReturn('/email/confirm-email/abc')).toBe(true);
    expect(isEmailConfirmationReturn('/email/email-confirmed')).toBe(false);
    expect(isEmailConfirmationReturn('/plans')).toBe(false);
    expect(isEmailConfirmationReturn(undefined)).toBe(false);
  });
});
