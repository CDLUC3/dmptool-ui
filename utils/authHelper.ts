import logECS from '@/utils/clientLogger';

// Cookie names for Auth Service https://github.com/CDLUC3/dmptool-auth tokens in the browser
export const ACCESS_TOKEN_NAME = process.env.ACCESS_TOKEN_NAME || "access_token";
export const REFRESH_TOKEN_NAME = process.env.REFRESH_TOKEN_NAME || "refresh_token";
// TODO: We need to implement SSO soon, so leaving this here for now. The SSO_PENDING_TOKEN_NAME is used to store a
//       temporary token in the browser when a user successfully signs in via SSO but they do not yet have an account
//       in the DMPTool. This token is used to help create a new account for the user after they fill out the account
//       creation form. Once the account is created, the SSO_PENDING_TOKEN_NAME is deleted from the browser.
export const SSO_PENDING_TOKEN_NAME = process.env.SSO_PENDING_TOKEN_NAME || "sso_pending_token";

export class AuthError extends Error {
  status: number | null;

  constructor({
    status,
    message,
    source,
  }: {
    status: number | null;
    message: string;
    source: string;
  }) {
    let statusMsg: string;
    if (status) {
      statusMsg = `[${status}] ${message}`;
    } else {
      statusMsg = `${message}`;
    }
    super(statusMsg);

    this.status = status;
    this.message = message;

    logECS(
      'error',
      statusMsg,
      { source },
    );
  }
}

export const refreshAuthTokens = async (cookies?: string) => {
  // Use AUTH_ENDPOINT for server-side (middleware), NEXT_PUBLIC_AUTH_ENDPOINT for client-side
  const endpoint = cookies ? process.env.AUTH_ENDPOINT : process.env.NEXT_PUBLIC_AUTH_ENDPOINT;
  try {
    // Get CSRF token first using GET request (doesn't require CSRF validation)
    const csrfFetchResponse = await fetchCsrfToken(cookies, endpoint);

    if (!csrfFetchResponse || !csrfFetchResponse.ok) {
      throw new AuthError({
        status: csrfFetchResponse?.status || 500,
        message: "Failed to fetch CSRF token",
        source: "refreshAuthTokens",
      });
    }

    const csrfToken = csrfFetchResponse.headers.get('X-CSRF-TOKEN');

    if (!csrfToken) {
      throw new AuthError({
        status: 403,
        message: "Forbidden. No CSRF token returned from server",
        source: "refreshAuthTokens",
      });
    }

    // Refresh auth tokens using POST request (requires CSRF token)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
    };

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers
    };

    // Server-side request: manually pass cookies, don't use credentials: 'include'
    if (cookies) {
      headers['Cookie'] = cookies;
    } else {
      // Client-side request: use credentials: 'include'
      fetchOptions.credentials = 'include';
    }

    const response = await fetch(`${endpoint}/refresh-token`, fetchOptions);
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized access - token refresh failed, redirect to login
        return { shouldRedirect: true, redirectTo: '/login' };
      }
      throw new AuthError({
        status: response.status,
        message: `Error refreshing auth tokens: ${response.statusText}`,
        source: 'refreshAuthTokens',
      });
    }

    const message = await response.json();
    return { response, message };

  } catch (err) {
    if (err instanceof AuthError) {
      throw err;
    }
    logECS('error', `Error refreshing auth token: ${err}`, {
      source: 'refreshAuthTokens'
    });
    // Return redirect for any auth-related errors
    return { shouldRedirect: true, redirectTo: '/login' };
  }
};


//Function to fetch CSRF token from the backend (GET request - no CSRF validation needed)
export const fetchCsrfToken = async (cookies?: string, endpoint?: string) => {
  try {
    // Use AUTH_ENDPOINT for server-side (middleware), NEXT_PUBLIC_AUTH_ENDPOINT for client-side
    const serverUrl = endpoint || (cookies ? process.env.AUTH_ENDPOINT : process.env.NEXT_PUBLIC_AUTH_ENDPOINT);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const fetchOptions: RequestInit = {
      method: 'GET',
      credentials: 'include',
      headers,
    };

    // Server-side request: manually pass cookies, don't use credentials: 'include'
    if (cookies) {
      headers['Cookie'] = cookies;
      // When manually setting Cookie header, we should NOT use credentials: 'include'
    } else {
      // Client-side request: use credentials: 'include' to send cookies automatically
      fetchOptions.credentials = 'include';
    }

    const response = await fetch(`${serverUrl}/csrf`, fetchOptions);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error body');
      logECS('error', `Failed to fetch CSRF token: ${response.status} ${response.statusText} - ${errorText}`, {
        source: 'fetchCsrfToken'
      });
      return null;
    }

    return response;
  } catch (err) {
    logECS('error', `Error getting csrf token from auth service: ${err}, ${endpoint}, ${cookies}`, {
      source: 'fetchCsrfToken'
    });
    return null;
  }
};

