'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearAuth, saveUser, getUser, type CachedUser } from '@/lib/auth';
import { ApiClient } from '@/services/api';

export type SessionUser = CachedUser;

export type SessionState = {
  /** true while the token is being verified against /auth/me */
  checking: boolean;
  user: SessionUser | null;
};

const AUTH_ERROR_PHRASES = ['NO_TOKEN', 'INVALID_TOKEN', 'EXPIRED_TOKEN', 'Invalid or expired', 'Missing authorization'];

function isAuthFailure(msg: string): boolean {
  return AUTH_ERROR_PHRASES.some(p => msg.includes(p));
}

/**
 * Drop-in replacement for the inline `if (!getToken()) { redirect }` pattern.
 *
 * - Shows `checking: true` while /auth/me is in flight (prevents page flash).
 * - On success: restores session, returns user.
 * - On confirmed auth failure (401 + code): clears auth, redirects to /login.
 * - On network/server error: falls back to cached localStorage user so the
 *   page stays usable without logging the user out.
 */
export function useSessionRestore(): SessionState {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({ checking: true, user: null });

  useEffect(() => {
    const token = getToken();

    if (!token) {
      // No token at all — go to login immediately (no flash: we keep checking=true
      // so the page renders nothing while the navigation happens).
      router.push('/login');
      return;
    }

    // Token exists. Verify it with the server. /auth/me is excluded from the
    // global 401 redirect in api.ts so we handle the result here and can
    // distinguish auth failure from a temporary network error.
    ApiClient.fetchMe()
      .then(user => {
        saveUser(user as SessionUser);
        setState({ checking: false, user: user as SessionUser });
      })
      .catch((err: Error) => {
        if (isAuthFailure(err.message)) {
          // Real auth failure: token is bad or expired — log out cleanly.
          clearAuth();
          router.push('/login');
        } else {
          // Temporary network/server problem: stay logged in with cached data.
          const cached = getUser();
          setState({ checking: false, user: cached });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
