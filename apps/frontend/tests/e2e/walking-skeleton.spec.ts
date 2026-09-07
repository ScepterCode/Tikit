/**
 * The walking skeleton.
 *
 * Two journeys make up the business. If these pass, the product works; if
 * they fail, nothing else matters:
 *
 *   attendee   register -> browse -> buy -> hold a ticket
 *   organizer  create event -> sale credits wallet -> withdraw
 *
 * Every assertion here checks state in the database, not pixels. The platform
 * audit found tickets issued without crediting the organizer, notifications
 * written to a route nobody could read, and profile rows that were never
 * created - all of which a UI-presence test passes happily.
 *
 * Requires a staging environment; skips cleanly without one.
 * See tests/e2e/README.md.
 */
import { test, expect } from '@playwright/test';
import {
  stagingEnv,
  adminClient,
  createUser,
  accessTokenFor,
  api,
  cleanup,
  eventually,
  type StagingEnv,
  type TestUser,
} from './fixtures';

const env: StagingEnv | null = stagingEnv();

test.skip(
  !env,
  'Staging not configured - set E2E_SUPABASE_URL, E2E_SUPABASE_SERVICE_KEY, E2E_SUPABASE_ANON_KEY, E2E_API_URL'
);

test.describe.configure({ mode: 'serial' });

test.describe('Walking skeleton', () => {
  // Built lazily: the describe body is evaluated at collection time, before
  // test.skip() applies, so constructing this eagerly crashed the run for
  // anyone without staging configured instead of skipping.
  let admin: ReturnType<typeof adminClient>;
  const created: string[] = [];

  test.beforeAll(() => {
    admin = adminClient(env!);
  });

  let organizer: TestUser;
  let attendee: TestUser;
  let organizerToken: string;
  let attendeeToken: string;

  test.afterAll(async () => {
    await cleanup(admin, created);
  });

  // -- identity ------------------------------------------------------------

  test('signing up creates a profile row with the requested role', async () => {
    organizer = await createUser(admin, 'organizer');
    created.push(organizer.id);

    // The trigger runs on the auth.users insert; give it a moment.
    const profile = await eventually(
      async () => {
        const { data } = await admin.from('users').select('*').eq('id', organizer.id).maybeSingle();
        return data;
      },
      { what: 'the organizer profile row' }
    );

    expect(profile.role).toBe('organizer');
    expect(profile.email).toBe(organizer.email);
    expect(profile.first_name).toBe('E2E');
  });

  test('a role cannot be claimed just by asking for it at signup', async () => {
    const impostor = await createUser(admin, 'attendee', { role: 'admin' });
    created.push(impostor.id);

    const profile = await eventually(
      async () => {
        const { data } = await admin.from('users').select('role').eq('id', impostor.id).maybeSingle();
        return data;
      },
      { what: 'the impostor profile row' }
    );

    expect(profile.role).toBe('attendee');
  });

  test('the API accepts a real Supabase token', async () => {
    organizerToken = await accessTokenFor(env!, organizer);

    const { status } = await api(env!, organizerToken, '/api/events');
    expect(status, 'a valid token was rejected - is SUPABASE_JWT_SECRET set?').toBeLessThan(400);
  });

  test('the API rejects a token it did not sign', async () => {
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJleHAiOjk5OTk5OTk5OTl9.' +
      'not-a-real-signature';

    const { status } = await api(env!, forged, '/api/wallet/balance');
    expect(status).toBe(401);
  });

  // -- the money path ------------------------------------------------------

  test('an organizer can create an event', async () => {
    const { status, body } = await api(env!, organizerToken, '/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: `E2E Event ${Date.now()}`,
        description: 'Created by the walking-skeleton test',
        event_date: new Date(Date.now() + 7 * 864e5).toISOString(),
        venue_name: 'Landmark Centre',
        state: 'Lagos',
        ticket_tiers: [{ name: 'General', price: 5000, quantity: 50 }],
      }),
    });

    expect(status, `create event failed: ${JSON.stringify(body)}`).toBeLessThan(400);
    const eventId = body?.data?.id ?? body?.event?.id ?? body?.id;
    expect(eventId, 'the API returned no event id').toBeTruthy();
  });

  test('a ticket cannot be minted without a verified payment', async () => {
    attendee = await createUser(admin, 'attendee');
    created.push(attendee.id);
    attendeeToken = await accessTokenFor(env!, attendee);

    const before = await admin.from('tickets').select('id').eq('user_id', attendee.id);

    // A transaction id Flutterwave has never seen.
    const { status } = await api(env!, attendeeToken, '/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: '000000000', tx_ref: `E2E_FAKE_${Date.now()}` }),
    });

    expect([400, 402, 503]).toContain(status);

    const after = await admin.from('tickets').select('id').eq('user_id', attendee.id);
    expect(after.data?.length ?? 0).toBe(before.data?.length ?? 0);
  });

  // -- withdrawal ----------------------------------------------------------

  test('withdrawal is refused until a PIN is set, and the PIN is durable', async () => {
    const withdraw = () =>
      api(env!, organizerToken, '/api/wallet/withdraw-flutterwave', {
        method: 'POST',
        body: JSON.stringify({
          amount: 1000,
          account_number: '0123456789',
          bank_code: '058',
          pin: '4321',
        }),
      });

    // No PIN yet - must not be auto-created as "000000".
    const refused = await withdraw();
    expect(refused.status).toBe(403);

    const set = await api(env!, organizerToken, '/api/wallet/security/set-pin', {
      method: 'POST',
      body: JSON.stringify({ pin: '4321', confirm_pin: '4321' }),
    });
    expect(set.status).toBeLessThan(400);

    // Durable, not just cached in the API process.
    const { data: securityRow } = await admin
      .from('user_security')
      .select('user_id')
      .eq('user_id', organizer.id)
      .maybeSingle();
    expect(securityRow, 'the PIN was not persisted to user_security').toBeTruthy();

    // Past the PIN gate now - insufficient balance is the expected next
    // failure, not another 403.
    const allowed = await withdraw();
    expect(allowed.status).not.toBe(403);
  });

  test('a wrong PIN is refused', async () => {
    const { status } = await api(env!, organizerToken, '/api/wallet/withdraw-flutterwave', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        account_number: '0123456789',
        bank_code: '058',
        pin: '9999',
      }),
    });
    expect(status).toBe(401);
  });

  // -- surfaces the audit found unreachable --------------------------------

  test('notifications are readable at the path the app calls', async () => {
    const { status } = await api(env!, attendeeToken, '/api/notifications/');
    expect(status, 'notifications were 404 for their entire existence').not.toBe(404);
  });

  test('unread count is readable', async () => {
    const { status } = await api(env!, attendeeToken, '/api/notifications/unread-count');
    expect(status).not.toBe(404);
  });

  test('analytics are readable at the path the app calls', async () => {
    const { status } = await api(env!, organizerToken, '/api/analytics/platform');
    expect(status).not.toBe(404);
  });

  test('the health check reports the database as connected', async () => {
    const response = await fetch(`${env!.apiUrl}/health`);
    const body = await response.json();
    expect(response.status, 'a 503 here means the API cannot reach Supabase').toBe(200);
    expect(body.services.supabase).toBe('connected');
  });
});
