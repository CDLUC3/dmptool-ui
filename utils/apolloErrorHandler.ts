import { CombinedGraphQLErrors } from "@apollo/client";
import logECS from "@/utils/clientLogger";

/**
 * Checks if an error is an AbortError (common in Apollo Client v4 with React Strict Mode)
 */
export const isAbortError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message.includes('AbortError'))
  );
};

export interface ApolloErrorResult {
  wasRealError: boolean;
  message: string;
}

/**
 * Extracts the error message directly from an Apollo error.
 * For GraphQL errors, uses the first error's message from the server.
 * For network errors, uses the error's own message.
 */
const extractErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string => {
  if (!error) return fallback;

  // GraphQL errors returned inside a 200 response — use the server's message
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors?.[0]?.message || fallback;
  }

  // Network-level error — use its own message
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

/**
 * Handles Apollo query/mutation errors with automatic AbortError filtering.
 * Logs the error once and returns a displayable message straight from the
 * error itself (the backend's message for GraphQL errors, or the network
 * error's message otherwise).
 *
 * @param error - The error to handle
 * @param context - Context string for logging (e.g., component/function name)
 * @returns { wasRealError, message } - wasRealError is false for AbortErrors
 *          (ignore silently); message is ready to display as-is.
 */
export const handleApolloError = (
  error: unknown,
  context: string
): ApolloErrorResult => {
  if (isAbortError(error)) {
    return { wasRealError: false, message: '' };
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logECS('error', context, { error: errorMessage });

  return {
    wasRealError: true,
    message: extractErrorMessage(error),
  };
};