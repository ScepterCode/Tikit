/**
 * Central API configuration.
 *
 * Every call to the backend must resolve its base URL through here so that a
 * single environment variable controls where the app talks to in every
 * environment. Do not hard-code `http://localhost:8000` anywhere else - the
 * lint rule `no-restricted-syntax` forbids it.
 *
 * Precedence: VITE_API_URL -> VITE_API_BASE_URL -> localhost (dev only).
 */
const rawBase = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '')
)
  .toString()
  .trim()
  .replace(/\/+$/, '');

if (!rawBase && import.meta.env.PROD) {
  // Surfaces a clear reason in the console instead of opaque network errors.
  console.error(
    '[config/api] VITE_API_URL is not set for this build - all API requests will fail.'
  );
}

export const API_BASE_URL = rawBase;

/** WebSocket origin derived from the API base URL. */
export const WS_BASE_URL = API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

/**
 * Resolve an API path against the configured base URL.
 * Absolute URLs are returned unchanged.
 */
export function apiUrl(path: string): string {
  if (/^[a-z]+:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
