/**
 * Source-content guard for issue #42 (PRD #20 / slice #21).
 *
 * AutoRepairSystem was a 288-line strategy-pattern wrapper over what is
 * effectively a `try { pool.query('SELECT 1') } catch` health probe. Three
 * of the four strategies were advisory-only stubs that returned
 * `{success: true}` without doing any actual repair. Per F-OA-3 in the
 * codebase assessment, deleted in this slice.
 *
 * Pins the post-deletion contract: the service file is gone and no other
 * file imports it. Same negative-evidence pattern as
 * throttleManagerCleanup.test.ts (#44) and discordCleanup.test.ts (#40).
 */

import * as fs from 'fs';
import * as path from 'path';

const BACKEND_SRC = path.join(__dirname, '..');

describe('AutoRepairSystem removed (issue #42)', () => {
  it('deletes services/AutoRepairSystem.ts', () => {
    const fullPath = path.join(BACKEND_SRC, 'services', 'AutoRepairSystem.ts');
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

  it('leaves no remaining imports of AutoRepairSystem', () => {
    const importPattern = /from\s+['"][^'"]*AutoRepairSystem['"]/;
    const offenders: string[] = [];

    for (const file of walkTsFiles(BACKEND_SRC)) {
      const source = fs.readFileSync(file, 'utf8');
      if (importPattern.test(source)) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('errorMiddleware.ts contains no remaining AutoRepairSystem references', () => {
    const errorMwPath = path.join(
      BACKEND_SRC,
      'middleware',
      'errorMiddleware.ts',
    );
    const source = fs.readFileSync(errorMwPath, 'utf8');
    expect(source).not.toContain('AutoRepairSystem');
  });

  it('server.ts no longer wires the database pool to AutoRepairSystem', () => {
    const serverPath = path.join(BACKEND_SRC, 'server.ts');
    const source = fs.readFileSync(serverPath, 'utf8');
    expect(source).not.toContain('AutoRepairSystem.setDatabasePool');
  });
});
