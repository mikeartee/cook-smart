/**
 * Route-level tests for the SystemGuardian routes.
 *
 * Pins the post-deletion contract from issue #22 (PRD #20 / slice #21):
 * the auto-rebuild capability ("Nuclear Option") that ran
 * `git pull && npm install && npm run build && pm2 restart all` from inside
 * the running Node process has been removed entirely.
 *
 * These tests describe what the surface area MUST NOT expose any more:
 * the manual-trigger route is gone, the public `manualNuke` method is gone,
 * and no `child_process.exec` calls in the source run git/npm/pm2 commands.
 *
 * Test shape adapted from `routes/trendingRecipes.test.ts`.
 */

import express from 'express';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

// Mock auth middleware to a pass-through that injects a stable test user.
jest.mock('../middleware/auth', () => ({
  authenticateToken: (
    req: {user?: {id: string}},
    _res: unknown,
    next: () => void,
  ) => {
    req.user = {id: 'test-user-id'};
    next();
  },
}));

// Stub the underlying singleton so the router module loads without real
// monitoring side-effects. Only the methods still exposed by the route
// (`getStatus`, `getRepairHistory`, `startMonitoring`, `stopMonitoring`)
// are referenced here. A test for a 404 on the deleted POST /nuke must
// not depend on `manualNuke` existing on this stub.
jest.mock('../services/SystemGuardian', () => ({
  __esModule: true,
  default: {
    getStatus: jest.fn(() => ({
      isMonitoring: false,
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
      repairCount: 0,
    })),
    getRepairHistory: jest.fn((): unknown[] => []),
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
  },
}));

// Import after mocks are registered.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const systemGuardianRouter = require('./systemGuardian').default;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/', systemGuardianRouter);
  return app;
}

describe('SystemGuardian routes — Nuclear Option removed (issue #22)', () => {
  it('does not expose POST /nuke (returns 404)', async () => {
    const res = await request(makeApp())
      .post('/nuke')
      .send({reason: 'manual test trigger'});

    // Express returns 404 with no body when no route matches.
    expect(res.status).toBe(404);
  });

  it('still exposes GET /status (regression-guard for the routes that survived)', async () => {
    const res = await request(makeApp()).get('/status');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('recentRepairs');
  });
});

describe('SystemGuardian service — Nuclear Option removed (issue #22)', () => {
  // Re-mock fresh inside this block: we need the REAL SystemGuardian
  // module to inspect its public surface and source contents.
  jest.unmock('../services/SystemGuardian');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SystemGuardian = require('../services/SystemGuardian').default;

  const sourcePath = path.join(
    __dirname,
    '..',
    'services',
    'SystemGuardian.ts',
  );
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('does not expose a public manualNuke method', () => {
    expect(typeof (SystemGuardian as {manualNuke?: unknown}).manualNuke).toBe(
      'undefined',
    );
  });

  it('source contains no exec calls running git pull / npm install / pm2 restart', () => {
    // Catches both `execAsync('...')` and `exec('...')` patterns.
    // Per issue #22 acceptance criteria: no `child_process.exec` calls that
    // run `git pull` / `npm install` / `pm2 restart` from within the application.
    const dangerousPatterns = [
      /exec(?:Async)?\s*\(\s*['"`]\s*git\s+pull\b/,
      /exec(?:Async)?\s*\(\s*['"`]\s*npm\s+install\b/,
      /exec(?:Async)?\s*\(\s*['"`]\s*pm2\s+restart\b/,
      /exec(?:Async)?\s*\(\s*['"`]\s*pm2\s+stop\b/,
    ];

    for (const pattern of dangerousPatterns) {
      expect(source).not.toMatch(pattern);
    }
  });
});
