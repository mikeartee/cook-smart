/**
 * Source-content guard for issue #25 acceptance criteria.
 *
 * Reads `src/server.ts` and asserts that each scheduled boot-time job's
 * activation log is gated behind its corresponding `gates.<x>` check.
 *
 * Same negative-evidence pattern as `routes/systemGuardian.test.ts` (#22)
 * and `routes/recipeProviderRegistration.test.ts` (#24).
 */

import * as fs from 'fs';
import * as path from 'path';

const SERVER_SOURCE = fs.readFileSync(
  path.join(__dirname, 'server.ts'),
  'utf8',
);

describe('server.ts boot-time gating (issue #25)', () => {
  it('imports computeBootGates from ./config/bootGates', () => {
    expect(SERVER_SOURCE).toMatch(
      /import\s*\{[^}]*computeBootGates[^}]*\}\s*from\s*['"]\.\/config\/bootGates['"]/,
    );
  });

  it('places the "Subscription monitoring activated" log inside an if (gates.stripeBilling) block', () => {
    // Find the log line and inspect a window of source above it.
    const logIdx = SERVER_SOURCE.indexOf('Subscription monitoring activated');
    expect(logIdx).toBeGreaterThan(-1);

    const windowAbove = SERVER_SOURCE.slice(Math.max(0, logIdx - 400), logIdx);
    expect(windowAbove).toMatch(/if\s*\(\s*gates\.stripeBilling\s*\)/);
  });

  it('places the "Daily notifications activated" log inside an if (gates.dailyNotifications) block', () => {
    const logIdx = SERVER_SOURCE.indexOf('Daily notifications activated');
    expect(logIdx).toBeGreaterThan(-1);

    const windowAbove = SERVER_SOURCE.slice(Math.max(0, logIdx - 400), logIdx);
    expect(windowAbove).toMatch(/if\s*\(\s*gates\.dailyNotifications\s*\)/);
  });

  it('preserves the existing systemGuardian gate (production-only)', () => {
    const callIdx = SERVER_SOURCE.indexOf('SystemGuardian.startMonitoring');
    expect(callIdx).toBeGreaterThan(-1);

    const windowAbove = SERVER_SOURCE.slice(
      Math.max(0, callIdx - 400),
      callIdx,
    );
    // Either the new gate or the existing NODE_ENV check is fine.
    expect(windowAbove).toMatch(
      /if\s*\(\s*(?:gates\.systemGuardian|process\.env\.NODE_ENV\s*===\s*['"]production['"])\s*\)/,
    );
  });

  it('places the recipe-cache maintenance setInterval inside an if (gates.recipeCacheMaintenance) block', () => {
    const callIdx = SERVER_SOURCE.indexOf('runRecipeMaintenance, 60');
    expect(callIdx).toBeGreaterThan(-1);

    const windowAbove = SERVER_SOURCE.slice(
      Math.max(0, callIdx - 600),
      callIdx,
    );
    expect(windowAbove).toMatch(/if\s*\(\s*gates\.recipeCacheMaintenance\s*\)/);
  });

  it('places the /contact mount inside an if (gates.contactForm) block (issue #41)', () => {
    const callIdx = SERVER_SOURCE.indexOf("app.use('/contact'");
    expect(callIdx).toBeGreaterThan(-1);

    const windowAbove = SERVER_SOURCE.slice(
      Math.max(0, callIdx - 400),
      callIdx,
    );
    expect(windowAbove).toMatch(/if\s*\(\s*gates\.contactForm\s*\)/);
  });

  describe('Stripe route mounts (issue #39)', () => {
    const stripeMounts = [
      "app.use('/api/webhooks/stripe'",
      "app.use('/api/v1/payments'",
      "app.use('/api/v1/admin/subscriptions'",
      "app.use('/api/v1/subscriptions', subscriptionPricingRoutes",
      "app.use('/api/v1/subscriptions', subscriptionSyncRoutes",
    ];

    it.each(stripeMounts)(
      'wraps `%s` in an if (gates.stripeBilling) block',
      mountSnippet => {
        const callIdx = SERVER_SOURCE.indexOf(mountSnippet);
        expect(callIdx).toBeGreaterThan(-1);

        const windowAbove = SERVER_SOURCE.slice(
          Math.max(0, callIdx - 400),
          callIdx,
        );
        expect(windowAbove).toMatch(/if\s*\(\s*gates\.stripeBilling\s*\)/);
      },
    );
  });
});
