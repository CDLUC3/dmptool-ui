'use client'

import React, { createContext, useCallback, useContext } from 'react';
import logECS from '@/utils/clientLogger';
import { fetchCsrfToken } from '@/utils/authHelper';

interface CsrfContextProps {
  getCsrfToken: () => Promise<string | null>;
}

const CsrfContext = createContext<CsrfContextProps | undefined>(undefined);

export function CsrfProvider({ children }: {
  children: React.ReactNode;
}) {
  /*
   * The Auth Service's CSRF tokens are single-use and expire, so fetch a new one
   * right before each request that needs it, instead of holding one for the page session.
   */
  const getCsrfToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetchCsrfToken();
      if (response) {
        const csrfToken = response.headers.get('X-CSRF-TOKEN');
        if (csrfToken) {
          return csrfToken;
        } else {
          throw new Error("CsrfContext: CSRF token not found in response header");
        }
      } else {
        logECS("error", "CsrfContext: No response from fetching new CSRF token", {
          source: "CsrfProvider",
        });
        return null
      }
    } catch (err) {
      logECS("error", `CsrfContext: Error getting csrf token from auth service: ${err}`, {
        source: "CsrfProvider",
      });
      return null;
    }
  }, []);

  return (
    <CsrfContext.Provider value={{ getCsrfToken }}>
      {children}
    </CsrfContext.Provider>
  )
};

// Custom hook to use the CSRF context
export const useCsrf = () => {
  const context = useContext(CsrfContext);
  if (context === undefined) {
    throw new Error('useCsrf must be used within a CsrfProvider');
  }
  return context;
}
