'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import logECS from '@/utils/clientLogger';
import { fetchCsrfToken } from '@/utils/authHelper';

interface CsrfContextProps {
  csrfToken: string | null;
}

const CsrfContext = createContext<CsrfContextProps | undefined>(undefined);

export function CsrfProvider({ children }: {
  children: React.ReactNode;
}) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const refreshCsrfToken = async () => {
    try {
      const response = await fetchCsrfToken();
      if (response) {
        const csrfToken = response.headers.get('X-CSRF-TOKEN');
        if (csrfToken) {
          setCsrfToken(csrfToken);
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
      setCsrfToken(null);
      return null;
    }

  }

  useEffect(() => {
    // Fetch CSRF token when component mounts
    refreshCsrfToken();
  }, []);

  return (
    <CsrfContext.Provider value={{ csrfToken }}>
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
