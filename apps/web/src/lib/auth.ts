export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
