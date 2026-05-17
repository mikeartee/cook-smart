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

  it('places the "Subscription monitoring activated" log inside an if (gates.subscriptionMonitor) block', () => {
    // Find the log line and inspect a window of source above it.
    const logIdx = SERVER_SOURCE.indexOf('Subscription monitoring activated');
    expect(logIdx).toBeGreaterThan(-1);

    const windowAbove = SERVER_SOURCE.slice(Math.max(0, logIdx - 400), logIdx);
    expect(windowAbove).toMatch(/if\s*\(\s*gates\.subscriptionMonitor\s*\)/);
  });

  it('places the "Daily health summary" log inside an if (gates.healthMonitor) block', () => {
    // HealthMonitor doesn't print its own "activated" line — it logs
    // "Daily health summary scheduled" from inside startDailyHealthSummary.
    // The acceptance criterion is that the *call* is gated, so check the
    // call site itself.
    const callIdx = SERVER_SOURCE.indexOf(
      'HealthMonitor.startDailyHealthSummary',
    );
    expect(callIdx).toBeGreaterThan(-1);

    const windowAbove = SERVER_SOURCE.slice(
      Math.max(0, callIdx - 400),
      callIdx,
    );
    expect(windowAbove).toMatch(/if\s*\(\s*gates\.healthMonitor\s*\)/);
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
});
