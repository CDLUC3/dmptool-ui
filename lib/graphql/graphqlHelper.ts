import { ErrorLink } from "@apollo/client/link/error";
import { Observable, CombinedGraphQLErrors } from "@apollo/client";
import logECS from "@/utils/clientLogger";
import { RetryLink } from "@apollo/client/link/retry";
import { createAuthLink } from "@/utils/authLink";
import { navigateTo } from "@/utils/navigation";
import { fetchCsrfToken, refreshAuthTokens } from "@/utils/authHelper";

interface CustomError extends Error {
  customInfo?: { errorMessage: string }
}

export const errorLink = new ErrorLink(({ error, operation, forward }) => {
  if (CombinedGraphQLErrors.is(error)) {
    const unauthenticated = error.errors.find(
      ({ extensions }) => extensions?.code === 'UNAUTHENTICATED'
    );

    if (unauthenticated) {
      return new Observable(observer => {
        (async () => {
          try {
            const result = await refreshAuthTokens();

            // Check if we should redirect due to failed refresh
            if (result?.shouldRedirect) {
              observer.error(new Error('Authentication failed - redirecting to login'));
              navigateTo(result.redirectTo);
            } else if (result?.response) {
              // Token refresh succeeded, retry the operation
              forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
            } else {
              // Unexpected result
              logECS('error', 'Token refresh failed with unexpected result', { errorCode: 'UNAUTHENTICATED', result });
              observer.error(new Error('Token refresh failed'));
              navigateTo('/login');
            }
          } catch (error) {
            logECS('error', 'Token refresh failed', { error });
            observer.error(error);
            navigateTo('/login')
          }
        })();
      });
    }

    // FORBIDDEN
    const forbidden = error.errors.find(
      ({ extensions }) => extensions?.code === 'FORBIDDEN'
    );
    if (forbidden) {
      if (forbidden.message !== 'Invalid CSRF token') {
        // Genuine authorization failure — retrying won't help and will just
        // bypass errorLink on the second failure. Log it once, cleanly, here.
        logECS('error', `[GraphQL Error]: FORBIDDEN (authorization) - ${forbidden.message}`, {
          errorCode: 'FORBIDDEN_AUTHZ',
        });
        return; // no retry; propagates to component once, with a classifiable code
      }
      return new Observable(observer => {
        (async () => {
          try {
            const response = await fetchCsrfToken();
            if (response) {
              forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer)
              });
            } else {
              logECS('error', 'Token refresh failed with no result', { errorCode: 'FORBIDDEN' });
              navigateTo('/login');
            }
          } catch (error) {
            logECS('error', 'Fetching csrf token failed', { error });
            navigateTo('/login');
          }
        })();
      });
    }

    // INTERNAL SERVER ERROR
    error.errors.forEach(({ message, extensions }) => {
      if (extensions?.code === 'INTERNAL_SERVER_ERROR') {
        logECS('error', `[GraphQL Error]: INTERNAL_SERVER_ERROR - ${message}`, {
          errorCode: 'INTERNAL_SERVER_ERROR'
        });
        navigateTo('/500-error');
      } else {
        logECS('error', `[GraphQL Error]: ${message}`, {
          errorCode: 'GRAPHQL'
        });
      }
    });
  } else {
    // Network error or other error types
    // Filter out AbortErrors globally - these are expected when React Strict Mode unmounts/remounts
    if ('name' in error && error.name === 'AbortError') {
      return; // Ignore abort errors silently
    }

    logECS('error', `[GraphQL Network Error]: ${error.message}`, { errorCode: 'NETWORK_ERROR' });
    const customNetworkError = error as CustomError;
    customNetworkError.customInfo = { errorMessage: 'There was a problem' };
    operation.setContext({ networkError: customNetworkError });
  }
});


export const authLink = createAuthLink();

export const retryLink = new RetryLink({
  attempts: {
    max: 3, // Maximum number of retry attempts
    retryIf: (error) => {
      // Retry on network errors (not GraphQL errors)
      return !CombinedGraphQLErrors.is(error);
    }
  },
  delay: {
    initial: 1000, // Initial delay in milliseconds
    max: 5000, // Maximum delay in milliseconds
    jitter: true // Add random jitter to the delay to help spread out retry attempts and avoid potential overloading of backend system
  }
});

