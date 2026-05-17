/**
 * Source-content guard for issue #40 deletion criteria:
 *
 *   "services/DiscordBotService.ts deleted"
 *   "routes/bot.ts and routes/community.ts deleted"
 *
 * Verifies the three files no longer exist and no remaining file in src/
 * imports them. Same negative-evidence pattern as recipeProviderRegistration
 * test (#24) and systemGuardian.test.ts (#22).
 */

import * as fs from 'fs';
import * as path from 'path';

const BACKEND_SRC = path.join(__dirname, '..');

describe('Discord-bot file cleanup (issue #40)', () => {
  it.each([
    'services/DiscordBotService.ts',
    'routes/bot.ts',
    'routes/community.ts',
  ])('deletes backend/src/%s', relPath => {
    const fullPath = path.join(BACKEND_SRC, relPath);
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

  it('leaves no remaining imports of the deleted modules', () => {
    const importPattern =
      /from\s+['"][^'"]*(?:DiscordBotService|routes\/bot|routes\/community)['"]/;
    const offenders: string[] = [];

    for (const file of walkTsFiles(BACKEND_SRC)) {
      const source = fs.readFileSync(file, 'utf8');
      if (importPattern.test(source)) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
