/**
 * Source-content guard for issue #44 (PRD #20 / slice #21).
 *
 * ThrottleManager fired two setInterval loops on import (one cleanup
 * hourly, one summary every 5 min) regardless of whether Discord was
 * actually configured. After #40 gated the entire notify pipeline behind
 * webhook presence, the throttle layer has nothing to throttle.
 *
 * Pins the post-deletion contract: the service file is gone and no other
 * file imports it. Same negative-evidence pattern as discordCleanup.test.ts
 * (issue #40) and routes/systemGuardian.test.ts (issue #22).
 */

import * as fs from 'fs';
import * as path from 'path';

const BACKEND_SRC = path.join(__dirname, '..');

describe('ThrottleManager removed (issue #44)', () => {
  it('deletes services/ThrottleManager.ts', () => {
    const fullPath = path.join(BACKEND_SRC, 'services', 'ThrottleManager.ts');
    expect(fs.existsSync(fullPath)).toBe(false);
  });

  function walkTsFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, {withFileTypes: true});
    const out: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walkTsFiles(full));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        out.push(full);
      }
    }
    return out;
  }

  it('leaves no remaining imports of ThrottleManager', () => {
    const importPattern = /from\s+['"][^'"]*ThrottleManager['"]/;
    const offenders: string[] = [];

    for (const file of walkTsFiles(BACKEND_SRC)) {
      const source = fs.readFileSync(file, 'utf8');
      if (importPattern.test(source)) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('errorMiddleware.ts contains no remaining ThrottleManager references', () => {
    const errorMwPath = path.join(
      BACKEND_SRC,
      'middleware',
      'errorMiddleware.ts',
    );
    const source = fs.readFileSync(errorMwPath, 'utf8');
    expect(source).not.toContain('ThrottleManager');
  });
});
