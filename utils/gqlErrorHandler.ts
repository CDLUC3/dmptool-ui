'use client'

import { FetchResult } from '@apollo/client';
import { GraphQLFormattedError } from 'graphql';
import logECS from "@/utils/clientLogger";
import { fetchCsrfToken, refreshAuthTokens } from "@/utils/authHelper";

type ServerError = Error & {
  response: Response;
  result: Record<string, unknown>;
  statusCode: number;
}

type ServerParseError = Error & {
  response: Response;
  statusCode: number;
  bodyText: string;
}

type CustomRouter = {
  push: (url: string) => void;
}

type NetworkError = Error | ServerError | ServerParseError;

type RefetchFunction<TData, TVariables> =
  | ((variables?: TVariables) => Promise<TData>)
  | ((variables?: TVariables) => Promise<FetchResult<TData>>);

export async function handleGraphQLErrors<TData, TVariables>(
  graphQLErrors: readonly GraphQLFormattedError[],
  setErrors: React.Dispatch<React.SetStateAction<string[]>>,
  refetch: RefetchFunction<TData, TVariables> | ((variables?: TVariables) => Promise<TData>),
  router: CustomRouter
) {

  if (graphQLErrors) {
    for (const { message, extensions } of graphQLErrors) {
      switch (extensions?.code) {
        case 'UNAUTHENTICATED':
          // Attempt to refresh the auth tokens
          try {
            const result = await refreshAuthTokens();
            if (result && !result.shouldRedirect && 'response' in result) {
              await refetch();
            } else {
              // If refresh fails, log the error and add to the errorResponses
              logECS('error', 'Token refresh failed with no result', { errorCode: 'UNAUTHENTICATED' });
              router.push('/login');
            }
          } catch (error) {
            // If refresh throws an error, handle it
            logECS('error', 'Token refresh failed', { error });
            router.push('/login');
          }
          break;

        case 'FORBIDDEN':
          logECS('error', `[GraphQL Error]: FORBIDDEN - ${message}`, { errorCode: 'FORBIDDEN' });
          try {
            const response = await fetchCsrfToken();
            if (!response) {
              logECS('error', 'Forbidden - Error fetching CSRF token', { source: 'apollo-client' });
              router.push('/login');
            }
          } catch (error) {
            logECS('error', 'Fetching csrf token failed', { error });
            router.push('/login')
          }
          break;

        default:
          logECS('error', `[GraphQL Error]: ${message}`, { errorCode: 'GRAPHQL' });
          setErrors(prevErrors => [...prevErrors, message]);
          break;
      }
    }
  }
}

export function handleNetworkError(networkError: NetworkError | null, setErrors: React.Dispatch<React.SetStateAction<string[]>>) {

  if (networkError) {
    setErrors(prevErrors => [...prevErrors, networkError.message]);
  }

  return networkError;
}


export async function handleApolloErrors<TData, TVariables>(
  graphQLErrors: readonly GraphQLFormattedError[] | undefined,
  networkError: NetworkError | null,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>,
  refetch: RefetchFunction<TData, TVariables> | ((variables?: TVariables) => Promise<TData>),
  router: CustomRouter
): Promise<void> {
  await handleGraphQLErrors(graphQLErrors || [], setErrors, refetch, router);
  handleNetworkError(networkError, setErrors);
}
