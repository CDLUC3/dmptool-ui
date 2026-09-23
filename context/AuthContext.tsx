'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApolloClient } from '@/lib/graphql/apolloClient';
import logECS from '@/utils/clientLogger';

interface AuthContextType {
  isAuthenticated: boolean | null;
  setIsAuthenticated: (auth: boolean) => void;
  clearCache: () => Promise<void>;
  clearAuthData: () => Promise<void>;
}

// Create a context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);


/*Will wrap the content with this AuthProvider so that we can use context to check
the authentication state, and to update the state*/
export function AuthProvider({ children, initialIsAuthenticated = null }: {
  children: React.ReactNode;
  initialIsAuthenticated?: boolean | null;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(initialIsAuthenticated);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth', {
          credentials: 'include', // This ensures cookies are sent with the request
        });
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch (err) {
        logECS('error', `Error checking authentication status: ${err}`, {
          source: 'AuthProvider'
        });
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Function to clear cache
  const clearCache = async () => {
    try {
      const apolloClient = getApolloClient();
      if (!apolloClient) {
        // If client isn't ready yet, just clear local state
        // This shouldn't happen in practice for login/logout
        logECS('warn', 'Apollo Client not available during clearCache', {
          source: 'AuthProvider.clearCache'
        });
        return;
      }

      await apolloClient.clearStore(); // Clear Apollo cache
      logECS('info', 'Auth data and Apollo cache cleared', {
        source: 'AuthProvider.clearCache'
      });
    } catch (err) {
      logECS('error', `Error clearing cache: ${err}`, {
        source: 'AuthProvider.clearCache'
      });
    }
  };

  // Function to clear authentication data and cache on logout
  const clearAuthData = async () => {
    await clearCache();
    setIsAuthenticated(false);
  };


  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      clearCache,
      clearAuthData
    }}>
      {children}
    </AuthContext.Provider>
  )
};

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context;
}