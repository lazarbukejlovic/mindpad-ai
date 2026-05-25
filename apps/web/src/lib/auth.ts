// ---------------------------------------------------------------------------
// Key constants — single source of truth used by auth.ts and api.ts
// ---------------------------------------------------------------------------
export const TOKEN_KEY = 'mindpad_token';
export const USER_KEY  = 'mindpad_me';

// Legacy keys used before Phase 1B; kept only for one-time migration.
const LEGACY_TOKEN_KEY = 'token';
const LEGACY_USER_KEY  = 'md:me';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // Remove legacy key to stay clean.
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  // One-time migration from legacy key.
  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(TOKEN_KEY, legacy);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacy;
  }
  return null;
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ---------------------------------------------------------------------------
// Cached user helpers
// ---------------------------------------------------------------------------

export type CachedUser = {
  id?: string;
  _id?: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  authProvider?: string;
  plan?: string;
  subscriptionStatus?: string | null;
  emailVerified?: boolean;
};

export function saveUser(user: CachedUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Remove legacy key.
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {}
}

export function getUser(): CachedUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) return JSON.parse(stored) as CachedUser;
    // One-time migration from legacy key.
    const legacy = localStorage.getItem(LEGACY_USER_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as CachedUser;
      localStorage.setItem(USER_KEY, legacy);
      localStorage.removeItem(LEGACY_USER_KEY);
      return parsed;
    }
  } catch {}
  return null;
}

// ---------------------------------------------------------------------------
// clearAuth — the ONLY function that should remove auth state.
// Called on logout and on confirmed auth failures (401 with auth code).
// Does NOT clear non-auth app data (tasks, brain dumps, etc.).
// ---------------------------------------------------------------------------
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also clean legacy keys in case they were never migrated.
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}
