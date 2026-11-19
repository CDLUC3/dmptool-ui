/**
 * Helpers for the `returnTo` query param, which tells the login page where to send the user after they sign in
 * (e.g. back to the email confirmation page). The Auth service applies the same checks for SSO sign-ins.
 */

import { routePath } from '@/utils/routes';

const MAX_LENGTH = 2048;
const BASE = 'http://return-to.invalid';

/**
 * Returns the given value only if it is a path on this site (e.g. `/email/confirm-email/abc`), so that `returnTo`
 * can't be used to send users to another website after they sign in.
 *
 * @param value the requested return path
 * @returns the path, or undefined if it is missing or not a path on this site
 */
export const safeReturnTo = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length > MAX_LENGTH) return undefined;
  // Must start with a single "/". "//host" and "/\host" are read by browsers as links to another site
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return undefined;
  if (/[\u0000-\u001f\u007f]/.test(value)) return undefined;
  const parsed = new URL(value, BASE);
  return parsed.origin === BASE ? `${parsed.pathname}${parsed.search}${parsed.hash}` : undefined;
};

/**
 * Reads a safe `returnTo` path from the current page's URL.
 *
 * @returns the path, or undefined if the page has no `returnTo` or it is not a path on this site
 */
export const getReturnTo = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return safeReturnTo(new URLSearchParams(window.location.search).get('returnTo'));
};

/**
 * Whether a return path is the email confirmation page, e.g. so the login page can remind the user to sign in with
 * the email they already use, because an email that hasn't been confirmed yet can't be used to sign in.
 *
 * @param path the return path, from getReturnTo()
 * @returns true if the path is the email confirmation page
 */
export const isEmailConfirmationReturn = (path: string | undefined): boolean =>
  Boolean(path?.startsWith(routePath('email.confirmEmail', { token: '' })));
