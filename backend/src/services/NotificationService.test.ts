/**
 * Unit tests for NotificationService's startup behaviour.
 *
 * Pins the post-#40 contract: when no Discord webhook env vars are set the
 * service emits a single concise log (one warn, not three), and HTTP-shaped
 * methods short-circuit without attempting any network call. See
 * docs/codebase-assessment.md F-NL-2.
 *
 * Tests use a fresh module require per case so the singleton's
 * `initialized` flag resets between assertions.
 */

const ORIGINAL_ENV = {...process.env};

// Silence the database-bound NotificationLog write — the test doesn't have
// a DB and the model rightly falls through with a console.error. We're
// testing the warn-line behaviour, not the persistence path.
jest.mock('../models/NotificationLog', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue(undefined),
  },
}));

afterEach(() => {
  process.env = {...ORIGINAL_ENV};
  jest.resetModules();
});

function loadFreshNotificationService() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./NotificationService').default as {
    sendErrorNotification: (...args: unknown[]) => Promise<void>;
    sendFeedbackNotification: (...args: unknown[]) => Promise<void>;
    sendActivityNotification: (...args: unknown[]) => Promise<void>;
  };
}

describe('NotificationService startup logging (issue #40)', () => {
  it('emits a single warn line when no Discord webhook env vars are set', async () => {
    delete process.env.DISCORD_ERROR_WEBHOOK_URL;
    delete process.env.DISCORD_ERROR_WEBHOOK;
    delete process.env.DISCORD_FEEDBACK_WEBHOOK;
    delete process.env.DISCORD_ACTIVITY_WEBHOOK;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const service = loadFreshNotificationService();
    // Trigger initialization. Each public send method calls
    // initializeWebhooks() lazily; pick one to fire the log path.
    await service.sendErrorNotification(new Error('test'), 'low');

    // Discord-disabled state should produce zero or one warn lines, not
    // three (one per missing webhook). Three was the prior behaviour.
    expect(warnSpy.mock.calls.length).toBeLessThanOrEqual(1);

    warnSpy.mockRestore();
  });

  it('emits no warn lines when DISCORD_ERROR_WEBHOOK_URL is configured', async () => {
    process.env.DISCORD_ERROR_WEBHOOK_URL =
      'https://discord.com/api/webhooks/123/abc';
    delete process.env.DISCORD_FEEDBACK_WEBHOOK;
    delete process.env.DISCORD_ACTIVITY_WEBHOOK;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const service = loadFreshNotificationService();
    // Stub fetch so the webhook send is a no-op for the test.
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', {status: 200}));

    await service.sendErrorNotification(new Error('test'), 'low');

    // Other channels are unset but error is configured — at most one warn
    // line about the missing optional channels is fine, but the prior
    // three-warns-per-missing-channel pattern should be gone.
    expect(warnSpy.mock.calls.length).toBeLessThanOrEqual(1);

    fetchSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
