/**
 * Source-content guard for issue #24 acceptance criterion 1:
 *
 *   "All `new RecipeProviderService([...])` call sites include both
 *   `FatSecretAdapter` and `TheMealDBService` (or its singleton)."
 *
 * Reads the route source files and asserts that every construction of
 * RecipeProviderService passes BOTH providers. Same pattern as
 * routes/systemGuardian.test.ts's negative-evidence guards (issue #22).
 */

import * as fs from 'fs';
import * as path from 'path';

const FILES_TO_CHECK = [
  path.join(__dirname, 'recipes.ts'),
  path.join(__dirname, 'trendingRecipes.ts'),
];

describe('RecipeProviderService registration sites (issue #24)', () => {
  it.each(FILES_TO_CHECK)(
    '%s registers both FatSecret and TheMealDB providers in every constructor call',
    filePath => {
      const source = fs.readFileSync(filePath, 'utf8');

      // Find every `new RecipeProviderService([...])` call. The argument list
      // can span multiple lines and contain comments, so use a permissive
      // multi-line regex.
      const constructorPattern =
        /new\s+RecipeProviderService\s*\(\s*\[([\s\S]*?)\]\s*\)/g;
      const matches = [...source.matchAll(constructorPattern)];

      expect(matches.length).toBeGreaterThan(0);

      for (const match of matches) {
        const argList = match[1] ?? '';
        // Strip comments so we don't false-match a commented-out provider.
        const argsCodeOnly = argList
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '');

        // Must reference both adapters by their imported names.
        // FatSecretAdapter is the local name used in routes/recipes.ts and
        // routes/trendingRecipes.ts; TheMealDBService is the class name.
        // Either the class or an instance suffices for "or its singleton".
        expect(argsCodeOnly).toMatch(/FatSecretAdapter\b/);
        expect(argsCodeOnly).toMatch(/TheMealDB(Service|Adapter)?\b/);
      }
    },
  );
});
