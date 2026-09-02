/**
 * Frontend error tracking.
 *
 * Entirely optional: with no VITE_SENTRY_DSN set at build time this is a
 * no-op and nothing is sent anywhere. Call `initSentry()` once, as early as
 * possible in main.tsx.
 */
import * as Sentry from '@sentry/react';

/** Keys whose values must never leave the browser. */
const SENSITIVE_KEY = /(authorization|cookie|csrf|apikey|api[-_]?key|token|secret|password|pin|anon[-_]?key)/i;

const REDACTED = '[redacted]';

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 8) return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SENSITIVE_KEY.test(k) ? REDACTED : scrub(v, depth + 1),
      ])
    );
  }
  return value;
}

/** Strip query strings and hashes so tokens in URLs are never reported. */
function stripUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

let initialised = false;

export function initSentry(): boolean {
  if (initialised) return true;

  const dsn = (import.meta.env.VITE_SENTRY_DSN ?? '').toString().trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    // Keep the default (no PII); we additionally scrub anything token-shaped.
    sendDefaultPii: false,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      if (event.request) {
        if (event.request.url) event.request.url = stripUrl(event.request.url);
        delete event.request.query_string;
        delete event.request.cookies;
        if (event.request.headers) {
          event.request.headers = scrub(event.request.headers) as Record<string, string>;
        }
      }
      if (event.extra) event.extra = scrub(event.extra) as Record<string, unknown>;
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // fetch/xhr breadcrumbs carry full URLs - drop the query string.
      if (breadcrumb.data && typeof breadcrumb.data.url === 'string') {
        breadcrumb.data.url = stripUrl(breadcrumb.data.url);
      }
      return breadcrumb;
    },
  });

  initialised = true;
  return true;
}

/** Report a caught error. No-op when Sentry is not configured. */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialised) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
