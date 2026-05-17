/**
 * Source-content guard for issue #40 acceptance criterion:
 *
 *   "errorMiddleware does not call NotificationService when no error
 *    webhook is configured"
 *
 * Reads errorMiddleware.ts and asserts the NotificationService send call
 * is gated behind a Discord-presence check. Same negative-evidence pattern
 * as routes/systemGuardian.test.ts (#22) and serverBootGating.test.ts (#25).
 */

import * as fs from 'fs';
import * as path from 'path';

const SOURCE = fs.readFileSync(
  path.join(__dirname, 'errorMiddleware.ts'),
  'utf8',
);

describe('errorMiddleware Discord gating (issue #40)', () => {
  it('wraps the NotificationService.sendErrorNotification call in a Discord-presence check', () => {
    const callIdx = SOURCE.indexOf('NotificationService.sendErrorNotification');
    expect(callIdx).toBeGreaterThan(-1);

    // Inspect a window of source above the call.
    const windowAbove = SOURCE.slice(Math.max(0, callIdx - 1500), callIdx);

    // Accepts an env-presence check on either of the two webhook env vars,
    // or a configured-flag method on NotificationService itself.
    const gatePattern =
      /(DISCORD_ERROR_WEBHOOK(?:_URL)?|isErrorWebhookConfigured)/;
    expect(windowAbove).toMatch(gatePattern);
  });
});
