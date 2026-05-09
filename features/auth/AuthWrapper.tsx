'use client';

import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useMemo } from 'react';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
    },
  },
});

/**
 * Returns an async function that fetches the current Cognito access token.
 * No longer depends on the Authenticator wrapper context — works standalone.
 */
export function useAuthToken() {
  return useMemo(() => {
    return async (): Promise<string | null> => {
      try {
        const { tokens } = await fetchAuthSession();
        return tokens?.accessToken?.toString() || null;
      } catch {
        return null;
      }
    };
  }, []);
}
