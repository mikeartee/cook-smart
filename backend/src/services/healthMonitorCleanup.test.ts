/**
 * Source-content guard for issue #43 (PRD #20 / slice #21).
 *
 * Two parallel health implementations existed: HealthMonitor (rolling
 * error-rate counter with a Discord cascade) and SystemHealthService
 * (CPU/memory/DB/API metrics consumed by admin endpoints). Per F-OA-4,
 * this slice deletes HealthMonitor and routes everything through
 * SystemHealthService.
 *
 * Pins the post-deletion contract: file gone, no remaining src/ imports,
 * the four call sites named in the issue acceptance criteria are clean.
 * Same negative-evidence pattern as throttleManagerCleanup.test.ts (#44),
 * autoRepairSystemCleanup.test.ts (#42), discordCleanup.test.ts (#40).
 */

import * as fs from 'fs';
import * as path from 'path';

const BACKEND_SRC = path.join(__dirname, '..');

describe('HealthMonitor removed (issue #43)', () => {
  it('deletes services/HealthMonitor.ts', () => {
    const fullPath = path.join(BACKEND_SRC, 'services', 'HealthMonitor.ts');
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

  it('leaves no remaining imports of HealthMonitor', () => {
    const importPattern = /from\s+['"][^'"]*\/HealthMonitor['"]/;
    const offenders: string[] = [];

    for (const file of walkTsFiles(BACKEND_SRC)) {
      const source = fs.readFileSync(file, 'utf8');
      if (importPattern.test(source)) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });

  it.each([
    'middleware/logger.ts',
    'middleware/errorMiddleware.ts',
    'server.ts',
  ])('%s contains no remaining HealthMonitor references', relPath => {
    const fullPath = path.join(BACKEND_SRC, relPath);
    const source = fs.readFileSync(fullPath, 'utf8');
    expect(source).not.toContain('HealthMonitor');
  });

  it('server.ts no longer calls startDailyHealthSummary', () => {
    const serverPath = path.join(BACKEND_SRC, 'server.ts');
    const source = fs.readFileSync(serverPath, 'utf8');
    expect(source).not.toContain('startDailyHealthSummary');
  });

  it('SystemHealthService remains the canonical health source', () => {
    const fullPath = path.join(
      BACKEND_SRC,
      'services',
      'SystemHealthService.ts',
    );
    expect(fs.existsSync(fullPath)).toBe(true);
  });
});
