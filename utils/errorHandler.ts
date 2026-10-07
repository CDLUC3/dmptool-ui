'use client'

import logECS from '@/utils/clientLogger';
import {
  fetchCsrfToken,
} from "@/utils/authHelper";

type RetryRequestType = (csrfToken: string | null) => Promise<Response>;

interface CustomRouter {
  push: (url: string) => void;
}

async function safeJsonParse(response: Response) {
  try {
    const data = await response.json();
    return data;
  } catch {
    throw new Error("Failed to parse JSON response");
  }
}

export const handleErrors = async (
  response: Response,
  retryRequest: RetryRequestType,
  setErrors: React.Dispatch<React.SetStateAction<string[]>>,
  router: CustomRouter,
  path: string

) => {

  const { message } = await safeJsonParse(response);

  switch (response.status) {
    case 400:
      if (message) {
        setErrors(prevErrors => [...prevErrors, message]);
      } else {
        setErrors(['An unexpected error occurred. Please try again.']);
      }
      break;

    case 401:
      if (message) {
        logECS('error', message, {
          url: { path }
        });
        const errorMessage = message;
        setErrors(prevErrors => [...prevErrors, errorMessage]);
        return;
      }
      break;

    case 403:
      if (message === 'Invalid CSRF token') {
        logECS('error', message, {
          url: { path }
        });

        try {
          // Attempt to get a new CSRF token
          const csfrResp = await fetchCsrfToken();
          if (csfrResp) {
            const csrfToken = csfrResp.headers.get('X-CSRF-TOKEN');
            if (csrfToken) {
              // Retry request
              const newResponse = await retryRequest(csrfToken);

              if (newResponse.ok) {
                router.push("/");
              } else {
                const errorMessage = await newResponse.json();
                setErrors(prevErrors => [...prevErrors, errorMessage]);
              }
            }
          }
        } catch (err) {
          throw new Error(`Error fetching new CSRF - ${err}`);
        }
      } else {
        setErrors(prevErrors => [...prevErrors, message]);
      }
      break;

    case 500:
      logECS('error', 'Internal server error', {
        url: { path: '/sign-in' }
      });
      router.push('/500-error');
      break;
  }
};


/**
 * Shared function to extract specified errors from an error object.
 * @param errs - The error object (can be any shape)
 * @param keys - (Optional)- The keys to extract errors from
 * @returns Array of error messages (non-empty strings)
 */
export function extractErrors<T extends Record<string, string | null | undefined>>(
  errs: T,
  keys?: (keyof T)[]
): string[] {
  const newErrors: string[] = [];

  if (keys && keys.length > 0) {
    for (const key of keys) {
      const val = errs[key];
      if (val) {
        newErrors.push(val);
      }
    }
  } else {
    for (const val of Object.values(errs)) {
      if (val) {
        newErrors.push(val);
      }
    }
  }

  return newErrors;
}


/**
 * Utility function to check if any errors exist in an error object.
 *
 * @param errs - The error object (can be any shape)
 * @param keys - The keys to extract errors from
 * @returns If any error was found, and the orginal error object
 */
export function checkErrors<T extends Record<string, string | null | undefined>>(
  errs: T,
  keys: (keyof T)[],
): [boolean, T] {
  const noErrors = Object.values(errs).every(val => !val);
  if (noErrors) return [false, errs];
  return [keys.some((k) => !!errs[k]), errs];
}
