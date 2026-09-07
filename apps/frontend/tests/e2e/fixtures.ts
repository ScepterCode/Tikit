/**
 * Shared helpers for the walking-skeleton end-to-end tests.
 *
 * These tests run against a real staging Supabase and a real running API.
 * They assert *business outcomes in the database*, not the presence of UI
 * elements — every bug the platform audit found (organizer never credited,
 * notifications unreadable, profile row never created) would have passed a
 * UI-presence test and failed one of these.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface StagingEnv {
  supabaseUrl: string;
  serviceKey: string;
  anonKey: string;
  apiUrl: string;
  baseUrl: string;
}

/** Returns null when staging is not configured, so the suite can skip. */
export function stagingEnv(): StagingEnv | null {
  const {
    E2E_SUPABASE_URL,
    E2E_SUPABASE_SERVICE_KEY,
    E2E_SUPABASE_ANON_KEY,
    E2E_API_URL,
    BASE_URL,
  } = process.env;

  if (!E2E_SUPABASE_URL || !E2E_SUPABASE_SERVICE_KEY || !E2E_SUPABASE_ANON_KEY || !E2E_API_URL) {
    return null;
  }
  return {
    supabaseUrl: E2E_SUPABASE_URL,
    serviceKey: E2E_SUPABASE_SERVICE_KEY,
    anonKey: E2E_SUPABASE_ANON_KEY,
    apiUrl: E2E_API_URL.replace(/\/$/, ''),
    baseUrl: BASE_URL || 'http://localhost:5173',
  };
}

export function adminClient(env: StagingEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'attendee' | 'organizer';
}

/**
 * Create a confirmed account through the admin API.
 *
 * Deliberately uses the same `options.data` shape the frontend's signUp()
 * writes, so the profile trigger is exercised exactly as it is in production.
 */
export async function createUser(
  admin: SupabaseClient,
  role: TestUser['role'],
  overrides: Record<string, unknown> = {}
): Promise<TestUser> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e-${role}-${stamp}@grooovy.test`;
  const password = `E2e!${stamp}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: 'E2E',
      last_name: role === 'organizer' ? 'Organizer' : 'Attendee',
      phone_number: `+23480${Math.floor(10000000 + Math.random() * 89999999)}`,
      state: 'Lagos',
      role,
      ...overrides,
    },
  });

  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  return { id: data.user.id, email, password, role };
}

/** Sign in against Supabase and return the access token the API will see. */
export async function accessTokenFor(env: StagingEnv, user: TestUser): Promise<string> {
  const anon = createClient(env.supabaseUrl, env.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error || !data.session) throw new Error(`sign-in failed: ${error?.message}`);
  return data.session.access_token;
}

/** Call the API the way the frontend does. */
export async function api(
  env: StagingEnv,
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; body: any }> {
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    /* some endpoints return no body */
  }
  return { status: response.status, body };
}

/** Remove everything a test created, newest dependency first. */
export async function cleanup(admin: SupabaseClient, userIds: string[]): Promise<void> {
  for (const id of userIds) {
    await admin.from('tickets').delete().eq('user_id', id);
    await admin.from('transactions').delete().eq('user_id', id);
    await admin.from('notifications').delete().eq('user_id', id);
    await admin.from('user_security').delete().eq('user_id', id);
    await admin.from('events').delete().eq('organizer_id', id);
    await admin.auth.admin.deleteUser(id).catch(() => undefined);
  }
}

/** Poll until `check` returns a truthy value, or fail after `timeoutMs`. */
export async function eventually<T>(
  check: () => Promise<T | null | undefined>,
  { timeoutMs = 15000, intervalMs = 500, what = 'condition' } = {}
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: unknown;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Timed out waiting for ${what}${last ? ` (last error: ${last})` : ''}`);
}
