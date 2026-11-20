/**
 * Helpers for the email confirmation requests that the browser sends directly to the Auth service
 * (`POST /email-confirmation/token` and `POST /email-confirmation/confirm`).
 */

// The reasons the Auth service gives for not confirming an email. Each has its own message on the
// verification failed page.
export const EMAIL_CONFIRMATION_FAILURE_REASONS = ["invalid", "wrongAccount", "claimedByOther"] as const;
export type EmailConfirmationFailureReason = typeof EMAIL_CONFIRMATION_FAILURE_REASONS[number];

export interface AuthServiceBody {
  success?: boolean;
  message?: string;
  reason?: string;
  email?: string;
}

/**
 * Read the JSON body of an Auth service response. Returns an empty object if the body is not JSON.
 */
export const readAuthServiceBody = async (response: Response): Promise<AuthServiceBody> => {
  try {
    const body = await response.json();
    return body && typeof body === "object" ? body as AuthServiceBody : {};
  } catch {
    return {};
  }
};

export const isEmailConfirmationFailureReason = (reason: unknown): reason is EmailConfirmationFailureReason => {
  return typeof reason === "string" && (EMAIL_CONFIRMATION_FAILURE_REASONS as readonly string[]).includes(reason);
};

/**
 * POST to the Auth service with the browser's cookies and a CSRF token.
 *
 * - CSRF tokens are single-use, so if the Auth service rejects the CSRF token it retries once with a fresh one.
 *   Other 403 responses (e.g. a confirmation link sent for a different account) are returned as-is.
 * - The access token is short-lived. On a 401 it asks `/api/check-auth` to refresh the tokens and, if the user is
 *   still signed in, retries once.
 *
 * @param path the Auth service path, e.g. `/email-confirmation/confirm`
 * @param body the JSON body to send
 * @param getCsrfToken returns a CSRF token from `useCsrf()`
 * @returns the Auth service response
 */
export const postToAuthService = async (
  path: string,
  body: Record<string, unknown>,
  getCsrfToken: () => Promise<string | null>,
): Promise<Response> => {
  const send = async (): Promise<Response> => {
    const csrfToken = await getCsrfToken();
    return await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrfToken || "",
      },
      body: JSON.stringify(body),
    });
  };

  let response = await send();

  if (response.status === 403) {
    const { message } = await readAuthServiceBody(response.clone());
    if (message === "Invalid CSRF token") {
      response = await send();
    }
  }

  if (response.status === 401) {
    const check = await fetch("/api/check-auth", { credentials: "include" });
    const { authenticated } = await check.json().catch(() => ({ authenticated: false }));
    if (authenticated) {
      response = await send();
    }
  }

  return response;
};
